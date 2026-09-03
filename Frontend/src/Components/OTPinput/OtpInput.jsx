// import React, { useState, useRef } from "react";
// import "./otpInput.css";

// const OtpInput = ({ length = 6, onComplete }) => {
//   const [otp, setOtp] = useState(Array(length).fill(""));
//   const inputsRef = useRef([]);

//   const handleChange = (e, index) => {
//     const value = e.target.value.replace(/[^0-9]/g, ""); // sirf digits
//     if (!value) return;

//     const newOtp = [...otp];
//     newOtp[index] = value[0]; // ek digit hi allow
//     setOtp(newOtp);

//     // next box focus
//     if (index < length - 1) {
//       inputsRef.current[index + 1].focus();
//     }

//     // agar pura OTP fill ho gaya
//     if (newOtp.every((digit) => digit !== "")) {
//       onComplete(newOtp.join(""));
//     }
//   };

//   const handleKeyDown = (e, index) => {
//     if (e.key === "Backspace" && !otp[index] && index > 0) {
//       inputsRef.current[index - 1].focus();
//     }
//   };

//   return (
//     <div className="otp-container">
//       {otp.map((digit, i) => (
//         <input
//           key={i}
//           type="text"
//           maxLength="1"
//           value={digit}
//           onChange={(e) => handleChange(e, i)}
//           onKeyDown={(e) => handleKeyDown(e, i)}
//           ref={(el) => (inputsRef.current[i] = el)}
//           className="otp-box"
//         />
//       ))}
//     </div>
//   );
// };

// export default OtpInput;
