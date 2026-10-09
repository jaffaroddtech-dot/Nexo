import React, { useState, useRef, useEffect } from "react";
import { Check, X, Eye, EyeOff, ShieldCheck } from "lucide-react";
import "./resetPassword.css";
import OtpInput from "../OTPinput/OtpInput";
import { sendOtp } from "../../../Apis/auth";
import { toast } from "react-toastify";

const OTP_LENGTH = 6;

const ResetPassword = ({ isOpen, onClose, onSubmit, email }) => {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [timer, setTimer] = useState(0);
  const inputsRef = useRef([]);

  // resend countdown
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  // Esc se band + modal khulte hi pehla box focus
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    inputsRef.current[0]?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  // modal band hone par form reset
  useEffect(() => {
    if (!isOpen) {
      setOtp(Array(OTP_LENGTH).fill(""));
      setNewPassword("");
      setShowPassword(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const otpValue = otp.join("");
  const canSubmit = otpValue.length === OTP_LENGTH && newPassword.length >= 6;

  const handleSendOtp = async () => {
    try {
      await sendOtp({ email, purpose: "resetPassword" });
      setTimer(60);
      toast.success("OTP sent successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to send OTP");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit({ otp: otpValue, newPassword });
  };

  return (
    <div
      className="rp-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <form className="rp-card" onSubmit={handleSubmit}>
        <button type="button" onClick={onClose} className="rp-close" aria-label="Close">
          <X size={18} />
        </button>

        <div className="rp-icon">
          <ShieldCheck size={24} />
        </div>
        <h2 className="rp-title">Reset Password</h2>
        <p className="rp-subtitle">
          Verification code sent to <b>{email}</b> 
        </p>

        {/* OTP */}
        <div className="rp-group">
          <label>Verification Code</label>
          <OtpInput value={otp} onChange={setOtp} length={OTP_LENGTH} autoFocus />

          <div className="rp-resend">
            <span>Get your code</span>
            <button
              type="button"
              className="rp-link"
              onClick={handleSendOtp}
              disabled={timer > 0}
            >
              {timer > 0 ? `Resend in ${timer}s` : "Send OTP"}
            </button>
          </div>
        </div>

        {/* PASSWORD */}
        <div className="rp-group">
          <label>New Password</label>
          <div className="rp-password">
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="rp-eye"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button type="submit" className="rp-confirm" disabled={!canSubmit}>
          <Check size={18} /> Confirm
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;