import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import logo from "../../assets/logo.png";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faApple, faGoogle } from '@fortawesome/free-brands-svg-icons';
import { loginUser } from "../../../Apis/auth";
import { useDispatch } from "react-redux";
import { getProfile } from "../../../Apis/auth";
import { setCredentials } from "../../features/authSlice";
import { toast } from "react-toastify";
import "./Login.css";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (data) => {
  try {
    const response = await loginUser(data);
    console.log("Login response:", response);

    // Axios HTTP code + backend status
    if (response.status) {
      toast.success(response.message);
      
      localStorage.setItem("@token", response.token);

      // Get user profile
      const userRes = await getProfile();
      if (userRes.status) {
        dispatch(setCredentials({ token: response.token, user: userRes.data }));
        navigate("/"); // ✅ redirect only after Redux update
      } else {
        toast.error(userRes.message);
      }
    } else {
      toast.error(response.message);
    }
  } catch (err) {
    console.error("Login failed:", err);
    toast.error("Login request failed");
  }
};




  return (
    <div className="nexo-page d-flex flex-column">
      {/* Header */}
      <header className="nexo-header d-flex align-items-center">
        <div className="d-flex align-items-center">
          <img
            src={logo}
            alt="Logo"
            className="logo-image d-flex justify-content-center"
            width={65}
            height={40}
          />
          <Link to='/' className="text-decoration-none"><span className="nexo-logo-text">NEXO</span></Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow-1 d-flex align-items-center justify-content-center px-3 py-5">
        <div className="nexo-card">
          <div className="text-center mb-4">
            <img src={logo} alt="Logo" className="nexo-icon-box" />
            <h5 className="nexo-title mb-1">Welcome back</h5>
            <p className="nexo-subtitle mb-0">Log in to your NEXO account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
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

            {/* Password */}
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center">
                <label className="nexo-label form-label">Password</label>
                <a href="#" className="nexo-link mb-1">Forgot password?</a>
              </div>
              <div className="nexo-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  className="nexo-input"
                  placeholder="Enter your password"
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 6, message: "Password must be at least 6 characters" }
                  })}
                />
                <button
                  type="button"
                  className="nexo-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && (
                <p className="text-danger error">{"*" + errors.password.message + "*"}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="form-check mb-3">
              <input
                type="checkbox"
                className="form-check-input"
                id="rememberMe"
                {...register("remember")}
              />
              <label
                className="form-check-label nexo-check-label"
                htmlFor="rememberMe"
              >
                Keep me signed in
              </label>
            </div>

            <button type="submit" className="nexo-btn-primary w-100">
              Log in
            </button>
          </form>

          <div className="d-flex align-items-center gap-2 my-4">
            <div className="nexo-divider-line" />
            <span className="nexo-divider-text">or continue with</span>
            <div className="nexo-divider-line" />
          </div>

          <div className="row g-2">
            <div className="col-6">
              <button className="nexo-btn-social w-100">
                <FontAwesomeIcon icon={faGoogle} size="2x" color="#6C5DFB" />
              </button>
            </div>
            <div className="col-6">
              <button className="nexo-btn-social w-100">
                <FontAwesomeIcon icon={faApple} size="2x" color="#6C5DFB" />
              </button>
            </div>
          </div>

          <p className="text-center nexo-footer-text mt-4 mb-0">
            Don't have an account? <Link to="/Signup" className="nexo-link">Sign up</Link>
          </p>

        </div>
      </main>
    </div>
  );
};

export default Login;
