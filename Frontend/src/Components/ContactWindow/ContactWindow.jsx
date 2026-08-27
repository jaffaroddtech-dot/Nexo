import React from "react";
import "./ContactWindow.css";
import { Phone, MessageCircle, Trash2, Send} from "lucide-react";
import nopfp from "../../Assets/nopfp.jpg";

import {
    Mail,
    UserRound,
    MapPin,
} from "lucide-react";
import { deleteContact } from "../../../Apis/contact";
import { toast } from "react-toastify";

const ContactWindow = ({ contact }) => {
    console.log("reponse", contact)
    if (!contact) {
        return (
            <div className="empty-contact d-flex flex-column justify-content-center">
                <div className="contact-logo"></div>
                <h2>Choose a conversation to continue</h2>
            </div>
        );
    }

    const handleDelete = async() => {
        try {
            const res = await deleteContact(contact._id);
            if (res.status){
                toast.success(res.message);
            }else{
                toast.error(res.message);
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    };


    return (
        <div className="contact-page">

            <div className="contact-card">

                {/* Profile Image */}
                <div className="profile-avatar">
                    <img src={contact.contactUser.profilePic} className="profilepic" />
                </div>

                {/* Header */}
                <div className="contact-header">
                    <h2>{contact.savedName}</h2>
                    <span>{contact.contactUser.online ? "Online" : "Offline"}</span>
                </div>

                <div className="divider"></div>

                {/* Contact Details */}
                <div className="contact-body">

                    <div className="contact-top">

                        <div className="contact-info-2">

                            <div className="info-row">
                                <Phone size={18} />
                                <span>{contact.contactUser.phoneNumber}</span>
                            </div>

                        </div>

                        {/* Action Icons */}
                        <div className="action-icons">
                            <Phone size={20} />
                            <MessageCircle size={20} />
                        </div>

                    </div>

                    {/* Contact Info */}
                    <div className="details">

                        <p className="details-title">
                            Contact Info
                        </p>

                        <div className="detail-row">
                            <UserRound size={18} />
                            <span>{contact.contactUser.bio}</span>
                        </div>

                        <div className="detail-row">
                            <MapPin size={18} />
                            <span>{contact.contactUser.country}</span>
                        </div>

                    </div>

                    {/* Button */}
                    <div className="d-flex align-items-center justify-content-between">

                        <button className="delete-btn" onClick={handleDelete}>
                            <Trash2/>
                        </button>
                        <button className="sendd-btn">
                            <Send/>
                        </button>
                    </div>

                </div>

            </div>

        </div>
    );
};

export default ContactWindow;
