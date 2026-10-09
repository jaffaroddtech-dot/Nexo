import React, { useState, useEffect } from "react";
import { X, Check, Eye, EyeOff, KeyRound } from "lucide-react";
import { sendOtp, resetPassword } from "../../../Apis/auth";
import { toast } from "react-toastify";
import OtpInput from "../OTPinput/OtpInput";
import "../resetPassword/resetPassword.css"; // shared modal styles

const OTP_LENGTH = 6;

const Forgetpassword = ({ onClose, isOpen }) => {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [timer, setTimer] = useState(0);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    if (!isOpen) {
      setOtp(Array(OTP_LENGTH).fill(""));
      setEmail("");
      setNewPassword("");
      setShowPassword(false);
      setTimer(0);
      return;
    }
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const otpValue = otp.join("");
  const canSubmit =
    email.trim() !== "" && otpValue.length === OTP_LENGTH && newPassword.length >= 6;

  const handleSendOtp = async () => {
    if (!email.trim()) {
      return toast.error("Enter email to proceed");
    }
    try {
      await sendOtp({ email, purpose: "resetPassword" });
      setTimer(60);
      toast.success("OTP sent successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to send OTP");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      const res = await resetPassword({ email, otp: otpValue, newPassword });
      if (res.status) {
        toast.success(res.message);
        onClose();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to reset password");
    }
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
          <KeyRound size={24} />
        </div>
        <h2 className="rp-title">Forgot Password</h2>
        <p className="rp-subtitle">
          Enter your email to receive a verification code and reset your password.
        </p>

        {/* EMAIL */}
        <div className="rp-group">
          <label>Email</label>
          <input
            type="email"
            className="rp-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        {/* OTP */}
        <div className="rp-group">
          <label>Verification Code</label>
          <OtpInput value={otp} onChange={setOtp} length={OTP_LENGTH} />

          <div className="rp-resend">
            <span>Get your code</span>
            <button
              type="button"
              className="rp-link"
              onClick={handleSendOtp}
              disabled={timer > 0 || !email.trim()}
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

export default Forgetpassword;