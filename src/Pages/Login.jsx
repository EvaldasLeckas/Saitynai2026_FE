import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { Link } from "react-router"
import { triggerAnimation } from "../Utils/Auth";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { setAccessToken, API_URL } from "../Utils/Api";

function Login() {

  // Login kintamieji

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // Login logika
  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) throw new Error("Wrong credentials");
      return response.json();
    },
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      navigate("/");
      toast.success("Logged in successfully");
    },
    onError: (error) => {
      setError(error.message);
      toast.error("Login failed")
    },
  });
  // Validacija
  const validateForm = () => {
    setError("");

    const fields = [
      {
        value: email.trim(),
        ref: emailInputRef,
        message: "Email is required",
      },
      {
        value: password,
        ref: passwordInputRef,
        message: "Password is required",
      },
    ];

    // Check empty fields
    for (const field of fields) {
      if (!field.value) {
        if (field.ref.current) {
          triggerAnimation(
            field.ref.current,
            "animate-shake"
          );
          field.ref.current.focus();
        }

        setError(field.message);
        return false;
      }
    }

    // Email validacija
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      triggerAnimation(emailInputRef.current, "animate-shake");
      emailInputRef.current.focus();
      setError("Wrong email format");
      return false;
    }

    return true;
  };
  // Mygtuko paspaudimas
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    loginMutation.mutate({ email: email.trim(), password });
  };



 // --------------- HTML -------------- //
  return (
    <>
    <h1 className="auth-title">Sign In</h1>
    <div className="auth-card">
      <form onSubmit={handleSubmit} noValidate>
        {error && (
            <div className="error-box">
              {error}
            </div>
          )}
        <div>
        <label className="auth-label"> Email </label>
        <input
          ref={emailInputRef}
          className="auth-inputbox"
          type="email"
          placeholder="example@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loginMutation.isPending}
        />
        </div>
        <div>
          <label className="auth-label" htmlFor="password"> Password </label>
          <div className="password-wrapper">
            <input
              id="password"
              ref={passwordInputRef}
              className="auth-inputbox"
              type={showPassword ? "text" : "password"}
              placeholder="Must be at least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loginMutation.isPending}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>

        <button className="auth-button" type="submit" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? "Logging in..." : "Login"}
        </button>
        <div>
          <p>Dont have an account? <Link className="bold_white" to="/register">Register</Link></p>
        </div>
      </form>
    </div>
    </>

  );
}

export default Login;