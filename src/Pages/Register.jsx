import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";

function Register() {
  const [name, setName] = useState("");
  const [lastName, setlastName] = useState("");
  const [birthDate, setbirthDate] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const registerMutation = useMutation({
    mutationFn: async (credentials) => {
      const response = await fetch("http://localhost:5083/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) throw new Error("Register failed");
      return null;
    },
    onSuccess: () => {
      navigate("/login");
      toast.success("Registration succesful")
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    registerMutation.mutate({name, lastName, email, password, birthDate });
    
  };

  return (
    <div>
      <h1>register</h1>
      <form onSubmit={handleSubmit}>
        <div>
        <input
          type="text"
          placeholder="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        </div>
        <div>
        <input
          type="text"
          placeholder="lastName"
          value={lastName}
          onChange={(e) => setlastName(e.target.value)}
        />
        </div>
        <div>
        <input
          type="date"
          value={birthDate}
          onChange={(e) => setbirthDate(e.target.value)}
        />
        </div>
        <div>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        </div>
        <div>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        </div>
        <button type="submit" disabled={registerMutation.isPending}>
          {registerMutation.isPending ? "Logging in..." : "register"}
        </button>
      </form>
      {registerMutation.error && <p>{registerMutation.error.message}</p>}
    </div>
  );
}
export default Register;