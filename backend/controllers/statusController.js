const Status = require("../models/Status");
const Contact = require("../models/Contact");
const cloudinary = require("../config/cloudinary");
const { getIO } = require("../Socket/socket"); // <- adjust path

exports.createStatus = async (req, res) => {
    try {
        const text = (req.body.text || "").trim().slice(0, 250);
        let type = "text";
        let mediaUrl = "";
        let mediaPublicId = "";

        if (req.file) {
            type = req.file.mimetype?.startsWith("video/") ? "video" : "image";
            mediaUrl = req.file.path;
            mediaPublicId = req.file.filename; // public_id (includes "chat-media/")
        } else if (!text) {
            return res.status(400).json({ status: false, message: "Status text is required" });
        }

        const status = await Status.create({
            userId: req.user._id,
            type,
            mediaUrl,
            mediaPublicId,
            text,
            backgroundColor: type === "text" ? req.body.backgroundColor : undefined,
            font: req.body.font === "b" ? "b" : "a",
        });

        const populatedStatus = await Status.findById(status._id).populate("userId", "fullName profilePic");

        getIO()?.emit("newStatus", populatedStatus);

        res.status(200).json({ status: true, populatedStatus, message: "Uploaded successfully" });
    } catch (err) {
        res.status(500).json({ status: false, message: err.message });
    }
};

exports.getStatuses = async (req, res) => {
    try {
        const me = req.user._id.toString();

        const contacts = await Contact.find({
            owner: req.user._id,
        });
        
        console.log("Contacts fetched:", contacts);
        const contactMap = {};

        contacts.forEach((contact) => {
            contactMap[contact.contactUser.toString()] =
                contact.savedName;
        });

        const statuses = await Status.find({
            expiresAt: { $gt: new Date() },
        })
            .populate("userId", "name profilePic")
            .populate("viewers.userId", "name profilePic")
            .populate("likes.userId", "name profilePic")
            .sort({ createdAt: -1 });

        const grouped = {};

        for (const s of statuses) {
            if (!s.userId) continue;

            const o = s.toObject();

            const ownerId = o.userId._id.toString();

            o.userId.savedName =
                contactMap[ownerId] ||
                o.userId.name;

            if (ownerId !== me) {
                o.viewers = o.viewers
                    .filter(
                        (v) =>
                            v.userId?._id?.toString() === me
                    )
                    .map((v) => ({
                        ...v,
                        userId: {
                            ...v.userId,
                            savedName:
                                contactMap[
                                v.userId._id.toString()
                                ] || v.userId.name,
                        },
                    }));
            } else {
                o.viewers = o.viewers.map((v) => ({
                    ...v,
                    userId: {
                        ...v.userId,
                        savedName:
                            contactMap[
                            v.userId._id.toString()
                            ] || v.userId.name,
                    },
                }));
            }

            o.likes = (o.likes || []).map((l) => ({
                ...l,
                userId: {
                    ...l.userId,
                    savedName:
                        contactMap[
                        l.userId._id.toString()
                        ] || l.userId.name,
                },
            }));

            if (!grouped[ownerId]) {
                grouped[ownerId] = {
                    user: o.userId,
                    statuses: [],
                };
            }

            grouped[ownerId].statuses.push(o);
        }
        res.status(200).json({
            status: true,
            groupedStatuses: Object.values(grouped),
            message: "Statuses fetched successfully",
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message,
            error: console.error(error)
        });
    }
};

exports.markStatusAsSeen = async (req, res) => {
    try {
        const exists = await Status.exists({ _id: req.params.id });
        if (!exists) return res.status(404).json({ status: false, message: "Status not found" });

        // atomic: skips the owner and anyone who already viewed it
        await Status.updateOne(
            {
                _id: req.params.id,
                userId: { $ne: req.user._id },
                "viewers.userId": { $ne: req.user._id },
            },
            { $push: { viewers: { userId: req.user._id } } }
        );

        res.json({ status: true, message: "Status marked as seen successfully" });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};

exports.deleteStatus = async (req, res) => {
    try {
        const status = await Status.findById(req.params.id);
        if (!status) return res.status(404).json({ status: false, message: "Status not found" });

        if (status.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ status: false, message: "Not authorized" });
        }

        if (status.mediaPublicId) {
            await cloudinary.uploader
                .destroy(status.mediaPublicId, { resource_type: status.type === "video" ? "video" : "image" })
                .catch((e) => console.log("Cloudinary delete failed:", e.message));
        }

        await status.deleteOne();

        getIO()?.emit("statusDeleted", { statusId: req.params.id });

        res.status(200).json({ status: true, message: "Status deleted successfully" });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
};


exports.likeStatus = async (req, res) => {
    try {
        const status = await Status.findById(req.params.id);

        if (!status) {
            return res.status(404).json({
                status: false,
                message: "Status not found",
            });
        }

        const alreadyLiked = status.likes.some(
            (like) =>
                like.userId.toString() ===
                req.user._id.toString()
        );

        if (!alreadyLiked) {
            status.likes.push({
                userId: req.user._id,
            });

            await status.save();
        }

        const updatedStatus = await Status.findById(
            status._id
        )
            .populate("likes.userId", "fullName profilePic");

        res.status(200).json({
            status: true,
            updatedStatus,
        });
    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message,
        });
    }
};