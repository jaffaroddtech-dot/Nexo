import React, { useRef, useEffect } from "react";

const OtpInput = ({ value, onChange, length = 6, autoFocus = false }) => {
  const refs = useRef([]);

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const handleChange = (e, index) => {
    const digit = e.target.value.replace(/\D/g, "");
    if (!digit) return;
    const next = [...value];
    next[index] = digit[digit.length - 1];
    onChange(next);
    if (index < length - 1) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      const next = [...value];
      if (value[index]) {
        next[index] = "";
        onChange(next);
      } else if (index > 0) {
        next[index - 1] = "";
        onChange(next);
        refs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    const next = Array(length).fill("");
    pasted.split("").forEach((d, i) => (next[i] = d));
    onChange(next);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  };

  return (
    <div className="rp-otp" onPaste={handlePaste}>
      {value.map((digit, i) => (
        <input
          key={i}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          onFocus={(e) => e.target.select()}
          ref={(el) => (refs.current[i] = el)}
          className={`rp-otp-box ${digit ? "filled" : ""}`}
        />
      ))}
    </div>
  );
};

export default OtpInput;