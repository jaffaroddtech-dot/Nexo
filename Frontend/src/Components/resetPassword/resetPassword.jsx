// import React, { useState, useRef, useEffect } from "react";
// import { Check, X } from "lucide-react";
// import "./resetPassword.css";
// import { sendOtp } from "../../../utils/Otp" ; // 👈 tumhara sendOtp function

// const ResetPassword = ({ isOpen, onClose, onSubmit, phoneNumber }) => {
//   const [otp, setOtp] = useState(Array(6).fill(""));
//   const [newPassword, setNewPassword] = useState("");
//   const [timer, setTimer] = useState(0); // countdown state
//   const modalRef = useRef(null);
//   const inputsRef = useRef([]);

//   useEffect(() => {
//     let interval;
//     if (timer > 0) {
//       interval = setInterval(() => setTimer((t) => t - 1), 1000);
//     }
//     return () => clearInterval(interval);
//   }, [timer]);

//   if (!isOpen) return null;

//   const handleSendOtp = async () => {
//      console.log("ye phone number ja rha hai",phoneNumber)  ; // default number if not provided
//     try {
//       await sendOtp(phoneNumber); // redux se phoneNumber pass karo
//       setTimer(60); // 1 min disable
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const handleChange = (e, index) => {
//     const value = e.target.value.replace(/[^0-9]/g, "");
//     if (!value) return;
//     const newOtp = [...otp];
//     newOtp[index] = value[0];
//     setOtp(newOtp);
//     if (index < 5) inputsRef.current[index + 1].focus();
//   };

//   const handleKeyDown = (e, index) => {
//     if (e.key === "Backspace") {
//       const newOtp = [...otp];
//       if (otp[index]) {
//         newOtp[index] = "";
//         setOtp(newOtp);
//       } else if (index > 0) {
//         newOtp[index - 1] = "";
//         setOtp(newOtp);
//         inputsRef.current[index - 1].focus();
//       }
//     }
//   };

//   const handleSubmit = () => {
//     onSubmit({ otp: otp.join(""), newPassword });
//   };

//   return (
//     <div className="modal-overlay">
//       <div className="modal-card" ref={modalRef}>
//         <div className="modal-header d-flex justify-content-between align-items-center">
//           <h2>Reset Password</h2>
//           <button onClick={onClose} className="close-btn">
//             <X size={18} />
//           </button>
//         </div>

//         <div className="modal-body">
//           <div className="input-groupp">
//             <label>Enter OTP</label>
//             <div className="otp-container">
//               {otp.map((digit, i) => (
//                 <input
//                   key={i}
//                   type="text"
//                   maxLength="1"
//                   value={digit}
//                   onChange={(e) => handleChange(e, i)}
//                   onKeyDown={(e) => handleKeyDown(e, i)}
//                   ref={(el) => (inputsRef.current[i] = el)}
//                   className="otp-box"
//                 />
//               ))}
//             </div>
//             <button
//               type="button"
//               className="sendd-btn"
//               onClick={handleSendOtp}
//               disabled={timer > 0}
//             >
//               {timer > 0 ? `Resend in ${timer}s` : "Send OTP"}
//             </button>
//           </div>

//           <div className="input-groupp">
//             <label>New Password</label>
//             <input
//               type="password"
//               value={newPassword}
//               onChange={(e) => setNewPassword(e.target.value)}
//               placeholder="Enter new password"
//             />
//           </div>
//         </div>

//         <div className="modal-footer d-flex justify-content-end gap-2">
//           <button onClick={handleSubmit} className="sendd-btn">
//             <Check size={18} /> Confirm
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ResetPassword;
