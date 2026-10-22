const cloudinary = require("../config/cloudinary");

const chunk = (arr, size = 100) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

exports.deleteMediaFromCloudinary = async (messages = []) => {
  const buckets = { image: new Set(), video: new Set(), raw: new Set() };

  for (const m of messages) {
    const id = m.media?.publicId;
    if (!id) continue;

    switch (m.media.type) {
      case "image":
        buckets.image.add(id);
        break;
      case "video":
      case "audio":
        buckets.video.add(id);
        break;
      default: // "file"
        buckets.raw.add(id);
        buckets.image.add(id); // auto-upload wale PDFs ke liye
    }
  }

  let failed = 0;

  for (const [resource_type, set] of Object.entries(buckets)) {
    for (const ids of chunk([...set])) {
      try {
        await cloudinary.api.delete_resources(ids, {
          resource_type,
          type: "upload",
          invalidate: true,
        });
      } catch (err) {
        failed += ids.length;
        console.log(`❌ Cloudinary delete (${resource_type}) failed:`, err.message);
      }
    }
  }

  return { failed };
};