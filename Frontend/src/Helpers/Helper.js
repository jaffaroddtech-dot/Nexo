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
