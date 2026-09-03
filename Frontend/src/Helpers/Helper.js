const time = new Date().toLocaleTimeString([], {
  hour: "2-digit",
  minute: "2-digit",
});

export default time;


// utils/formatPhone.js
export const formatPhoneNumber = (number) => {
  // Agar number "0" se start ho raha hai (jaise 0334...)
  if (number.startsWith("0")) {
    return "+92" + number.slice(1); // "0334..." -> "+92334..."
  }

  // Agar already +92 format me hai to direct return
  if (number.startsWith("+92")) {
    return number;
  }

  // Agar kisi aur format me hai to as-is return
  return number;
};
