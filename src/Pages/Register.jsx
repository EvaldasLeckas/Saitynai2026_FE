import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { triggerAnimation } from "../Utils/Auth";
import { validatePassword } from "../Utils/PasswordValidation";
import PasswordRequirements from "../Components/PasswordRequirements";
import { Link } from "react-router"
import { FiEye, FiEyeOff } from "react-icons/fi";

// Registracijos funkcija

function Register() {

  // Kintamieji
  const [name, setName] = useState("");
  const [lastName, setlastName] = useState("");
  const [birthDate, setbirthDate] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordValidation = validatePassword(password);

  const allPasswordRequirementsMet =
    Object.values(passwordValidation).every(Boolean);

  const navigate = useNavigate();

  const NAME_REGEX = /^[A-Za-zĄČĘĖĮŠŲŪŽąčęėįšųūž]+$/;

  
  // Input references
  const nameInputRef = useRef(null);
  const lastNameInputRef = useRef(null);
  const birthDateInputRef = useRef(null);
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const confirmPasswordInputRef = useRef(null);

  // Back-End API kvietimas (kas tas mutation?)
  const registerMutation = useMutation({
    mutationFn: async (credentials) => {
      const response = await fetch("http://localhost:5083/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Registration failed");
      } 
      
      return null;
    },
    onSuccess: () => {
      navigate("/login");
      toast.success("Registration succesful")
    },
    onError: (error) => {
      setError(error.message);
      toast.error("Registration failed")
    },
  });

  // Validacija
  const validateForm = () => {
    setError("");

    const fields = [
      {
        value: name.trim(),
        ref: nameInputRef,
        message: "Name is required",
      },
      {
        value: lastName.trim(),
        ref: lastNameInputRef,
        message: "Surname is required",
      },
      {
        value: birthDate,
        ref: birthDateInputRef,
        message: "Birth date is required",
      },
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
      {
        value: confirmPassword,
        ref: confirmPasswordInputRef,
        message: "Please confirm your password",
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


    //Name validation
    if (!NAME_REGEX.test(name)) {
      triggerAnimation(nameInputRef.current, "animate-shake");
      nameInputRef.current.focus();
      setError("Name only uses letters");
      return false;
    }

    //LastName validation
    if (!NAME_REGEX.test(lastName)) {
      triggerAnimation(lastNameInputRef.current, "animate-shake");
      lastNameInputRef.current.focus();
      setError("Lastname only uses letters");
      return false;
    }

    // Email validacija
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      triggerAnimation(emailInputRef.current, "animate-shake");
      emailInputRef.current.focus();
      setError("Please enter a valid email address");
      return false;
    }

    // Slaptažodžio validacija
    if (!allPasswordRequirementsMet) {
      triggerAnimation(passwordInputRef.current, "animate-shake");
      passwordInputRef.current.focus();
      setError("Please meet all password requirements");
      return false;
    }

    // Slatažodžio patvirtinimas
    if (password !== confirmPassword) {
      triggerAnimation(confirmPasswordInputRef.current, "animate-shake");
      confirmPasswordInputRef.current.focus();
      setError("Passwords do not match");
      return false;
    }

    // Gimimo datos validacija
    const today = new Date().toISOString().split("T")[0];

    if (birthDate >= today || birthDate <= "1900-01-01") {
      triggerAnimation(birthDateInputRef.current, "animate-shake");
      birthDateInputRef.current.focus();
      setError("Please enter a valid birth date");
      return false;
    }

    return true;
  };


  // Paspaudimo logika
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    registerMutation.mutate({
      name: name.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password,
      birthDate });
    
  };

 // --------------- HTML -------------- //
  return (
    <>
    <h1 className="auth-title">Create an account</h1>
    <div className="auth-card">
      <form onSubmit={handleSubmit} noValidate>

        {error && (
            <div className="error-box">
              {error}
            </div>
          )}
        <div>
        <label className="auth-label"> Name </label>
        <input
          ref={nameInputRef}
          className="auth-inputbox"
          type="text"
          placeholder="John"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={registerMutation.isPending}
        />
        </div>
        <div>
        <label className="auth-label"> Surname </label>
        <input
          ref={lastNameInputRef}
          className="auth-inputbox"
          type="text"
          placeholder="Snow"
          value={lastName}
          onChange={(e) => setlastName(e.target.value)}
          disabled={registerMutation.isPending}
        />
        </div>
        <div>
          <label className="auth-label"> Birth Date </label>
        <input
          ref={birthDateInputRef}
          className="auth-inputbox"
          type="date"
          value={birthDate}
          onChange={(e) => setbirthDate(e.target.value)}
          disabled={registerMutation.isPending}
        />
        </div>
        <div>
          <label className="auth-label"> Email </label>
        <input
          ref={emailInputRef}
          className="auth-inputbox"
          type="email"
          placeholder="example@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={registerMutation.isPending}
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
            disabled={registerMutation.isPending}
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
        {password.length > 0 && (
          <PasswordRequirements validation={passwordValidation} />
        )}
      </div>
      <div>
        <label className="auth-label" htmlFor="confirmPassword"> Confirm Password </label>
        <div className="password-wrapper">
          <input
            id="confirmPassword"
            ref={confirmPasswordInputRef}
            className="auth-inputbox"
            type={showPassword ? "text" : "password"}
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={registerMutation.isPending}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
          </button>
          </div>
        </div>
        <button className="auth-button" type="submit" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? "Registering..." : "Register"}
        </button>
        <div>
          <p>Already have an account? <Link className="bold_white" to="/login">Sign In</Link></p>
        </div>
      </form>

    </div>
    </>
  );
}
export default Register;