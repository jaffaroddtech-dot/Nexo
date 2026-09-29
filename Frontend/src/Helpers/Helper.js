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