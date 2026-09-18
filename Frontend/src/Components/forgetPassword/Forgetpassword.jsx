import React, { useState, useRef, useEffect } from "react";
import { X, Check } from "lucide-react";
import "./Forgetpassword.css";
import { sendOtp,resetPassword } from "../../../Apis/auth";
import { toast } from "react-toastify";

const Forgetpassword = ({ onClose, isOpen }) => {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [timer, setTimer] = useState(0);
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const inputsRef = useRef([]);

    useEffect(() => {
        let interval;

        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }

        return () => clearInterval(interval);
    }, [timer]);

    const handleSendOtp = async () => {
        try {
            if (email!==""){
                await sendOtp({ email, purpose: "resetPassword" });
                setTimer(60);
                toast.success("OTP sent successfully");
            }else{
                toast.error("Enter email to proceed")
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to send OTP");
        }
    };

    const handleChange = (e, index) => {
        const value = e.target.value.replace(/\D/g, "");

        const updatedOtp = [...otp];
        updatedOtp[index] = value;
        setOtp(updatedOtp);

        if (value && index < otp.length - 1) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (
            e.key === "Backspace" &&
            !otp[index] &&
            index > 0
        ) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const handleSubmit = async () => {
        try {
            const enteredOtp = otp.join("");

            if (!email) {
                return toast.error("Email is required");
            }

            if (enteredOtp.length !== 6) {
                return toast.error("Enter valid OTP");
            }

            if (!newPassword) {
                return toast.error("Password is required");
            }

            const res = await resetPassword({
                email,
                otp: enteredOtp,
                newPassword,
            });

            if (res.status) {
                toast.success(res.message);

                setOtp(["", "", "", "", "", ""]);
                setEmail("");
                setNewPassword("");

                onClose();
            } else {
                toast.error(res.message);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to reset password");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-card">
                <div className="modal-header d-flex justify-content-between align-items-center">
                    <h2>Reset Password</h2>

                    <button
                        onClick={onClose}
                        className="close-btn"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="input-groupp">
                        <label>Email</label>

                        <input
                            type="Email"
                            value={email}
                            onChange={(e) =>
                                setEmail(e.target.value)
                            }
                            placeholder="Enter Email"
                        />
                    </div>

                    <div className="input-groupp">
                        <label>Enter OTP</label>

                        <div className="otp-container">
                            {otp.map((digit, i) => (
                                <input
                                    key={i}
                                    type="text"
                                    maxLength="1"
                                    value={digit}
                                    onChange={(e) =>
                                        handleChange(e, i)
                                    }
                                    onKeyDown={(e) =>
                                        handleKeyDown(e, i)
                                    }
                                    ref={(el) =>
                                        (inputsRef.current[i] = el)
                                    }
                                    className="otp-box"
                                />
                            ))}
                        </div>

                        <button
                            type="button"
                            className="sendd-btn"
                            onClick={handleSendOtp}
                            disabled={timer > 0}
                        >
                            {timer > 0
                                ? `Resend in ${timer}s`
                                : "Send OTP"}
                        </button>
                    </div>

                    <div className="input-groupp">
                        <label>New Password</label>

                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) =>
                                setNewPassword(e.target.value)
                            }
                            placeholder="Enter new password"
                        />
                    </div>
                </div>

                <div className="modal-footer d-flex justify-content-end gap-2">
                    <button
                        onClick={handleSubmit}
                        className="sendd-btn"
                    >
                        <Check size={18} />
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Forgetpassword;