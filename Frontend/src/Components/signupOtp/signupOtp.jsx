import React, { useState, useEffect } from "react";
import { Check, X, MailCheck } from "lucide-react";
import { maskEmail } from "../../Helpers/Helper";
import OtpInput from "../OTPinput/OtpInput";
import "../resetPassword/resetPassword.css"; // shared modal styles

const OTP_LENGTH = 6;

const SignupOtp = ({ isOpen, onClose, onConfirm, onSendOtp, submitData }) => {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    if (!isOpen) {
      setOtp(Array(OTP_LENGTH).fill(""));
      setTimer(0);
      return;
    }
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const otpValue = otp.join("");
  const canSubmit = otpValue.length === OTP_LENGTH;

  const handleSendOtp = async () => {
    try {
      await onSendOtp();
      setTimer(60);
    } catch (error) {}
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    onConfirm(otpValue);
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
          <MailCheck size={24} />
        </div>
        <h2 className="rp-title">Verify your email</h2>
        <p className="rp-subtitle">
          6-digit code sent to <b>{maskEmail(submitData?.email)}</b> 
        </p>

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

        <button type="submit" className="rp-confirm" disabled={!canSubmit}>
          <Check size={18} /> Confirm
        </button>
      </form>
    </div>
  );
};

export default SignupOtp;