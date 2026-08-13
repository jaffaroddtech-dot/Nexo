import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { registerUser } from "../../../Apis/auth";
import logo from "../../assets/logo.png";
import { toast } from "react-toastify"
import "./Signup.css";

const Signup = () => {
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm();

    const [showPassword, setShowPassword] = useState(false);

    const onSubmit = async (data) => {
        const response = await registerUser(data);
        console.log("response from api", response);
        if (response.status) {
            localStorage.setItem("@token", response.token);
            toast.success("Signup successful! 🎉");
        } else {
            toast.error(response.message);
        }
    };

    const password = watch("password");

    return (
        <div className="nexo-page d-flex flex-column">
            <header className="nexo-header d-flex align-items-center">
                <div className="d-flex align-items-center">
                    <img
                        src={logo}
                        alt="Logo"
                        className="logo-image d-flex justify-content-center"
                        width={65}
                        height={40}
                    />
                    <span className="nexo-logo-text">NEXO</span>
                </div>
            </header>

            <main className="flex-grow-1 d-flex align-items-center justify-content-center px-3 py-5">
                <div className="nexo-card">
                    <div className="text-center mb-4">
                        <img src={logo} alt="Logo" className="nexo-icon-box" />
                        <h5 className="nexo-title mb-1">Create  account</h5>
                        <p className="nexo-subtitle mb-0">Join NEXO and start messaging</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)}>
                        {/* name */}
                        <div className="mb-3">
                            <label className="nexo-label form-label">Full Name</label>
                            <input
                                type="name"
                                className="nexo-input"
                                placeholder="Jon Desc"
                                {...register("name", {
                                    required: "Name is required",
                                })}
                            />
                            {errors.name && <p className="text-danger error">{"*" + errors.name.message + "*"}</p>}
                        </div>
                        <div className="mb-3">
                            <label className="nexo-label form-label">Phone Number</label>
                            <input
                                type="tel"
                                className="nexo-input"
                                placeholder="0300 1234567"
                                {...register("phoneNumber", {
                                    required: "Phone number is required",
                                    pattern: {
                                        value: /^[0-9]{11}$/,
                                        message: "Enter a valid phone number"
                                    }
                                })}
                            />
                            {errors.phoneNumber && (
                                <p className="text-danger error">{"*" + errors.phoneNumber.message + "*"}</p>
                            )}
                        </div>
                        <div className="mb-3">
                            <label className="nexo-label form-label">Country</label>
                            <input
                                type="text"
                                className="nexo-input"
                                placeholder="Pakistan"
                                {...register("country", {
                                    required: "Country is required"
                                })}
                            />
                            {errors.country && (
                                <p className="text-danger error">{"*" + errors.country.message + "*"}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="mb-3 position-relative">
                            <label className="nexo-label form-label">Password</label>
                            <div className="nexo-input-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="nexo-input"
                                    placeholder="Enter password"
                                    {...register("password", {
                                        required: "Password is required",
                                        minLength: { value: 6, message: "Password must be at least 6 characters" }
                                    })}
                                />
                                <button
                                    type="button"
                                    className="nexo-toggle-btnn"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                            {errors.password && <p className="text-danger error">{"*" + errors.password.message}*</p>}
                        </div>

                        {/* Confirm Password */}
                        <div className="mb-3 position-relative">
                            <label className="nexo-label form-label">Confirm password</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                className="nexo-input"
                                placeholder="Re-enter  password"
                                {...register("confirmPassword", {
                                    required: "Please confirm password",
                                    validate: (value) =>
                                        value === password || "Passwords do not match"
                                })}
                            />
                            {errors.confirmPassword && (
                                <p className="text-danger error">{"*" + errors.confirmPassword.message + "*"}</p>
                            )}
                        </div>

                        {/* Remember Me */}
                        <div className="form-check mb-3">
                            <input
                                type="checkbox"
                                className="form-check-input"
                                id="Agreement"
                                {...register("Agreement", { required: "Please agree to the Terms and Privacy Policy" })}

                            />
                            <label
                                className="form-check-label nexo-check-label"
                                htmlFor="Agreement"
                            >
                                I agree to the Terms and Privacy Policy
                            </label>
                            {errors.Agreement && (
                                <p className="text-danger error">{"*" + errors.Agreement.message + "*"}</p>
                            )}
                        </div>

                        <button type="submit" className="nexo-btn-primary w-100">
                            Sign up
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default Signup;
