const time = new Date().toLocaleTimeString([], {
  hour: "2-digit",
  minute: "2-digit",
});

export default time;


// utils/formatPhone.js
export const maskEmail = (email) => {
    if (!email || !email.includes("@")) return email;

    const [username, domain] = email.split("@");

    if (username.length <= 2) {
        return `${username[0]}***@${domain}`;
    }

    return `${username[0]}${"*".repeat(username.length - 2)}${username[username.length - 1]}@${domain}`;
};




export const formatLastSeen = (date) => {
  if (!date) return "Offline";

  const lastSeen = new Date(date);
  const now = new Date();

  const diffMs = now - lastSeen;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) {
    return "Last seen just now";
  }

  if (diffMinutes < 60) {
    return `Last seen ${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `Last seen ${diffHours} hr ago`;
  }

  return `Last seen ${lastSeen.toLocaleString()}`;
};



export const formatTime = (date) => {
return new Date(date).toLocaleTimeString("en-PK", {
hour: "numeric",
minute: "2-digit",
});
};



export const formatChatTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d)) return "";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor(
    (startOfToday - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000
  );

  if (diffDays <= 0) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { day: "2-digit", month: "short" });
};

export const getConversationPreview = (message) => {
  if (message.media?.type === "image") {
    return {
      type: "image",
      text: message.caption?.trim() || "Photo",
    };
  }

  if (message.media?.type === "video") {
    return {
      type: "video",
      text: message.caption?.trim() || "Video",
    };
  }

  if (message.media?.type === "file") {
    return {
      type: "file",
      text: message.caption?.trim() || message.media.name || "Document",
    };
  }

  if (message.media?.type === "audio") {
    return {
      type: "audio",
      text: message.caption?.trim() || "Voice message",
    };
  }

  return {
    type: "text",
    text: message.text || "",
  };
};