import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import { triggerAnimation } from "../Utils/Auth";
import { apiFetch, refreshSession, API_URL} from "../Utils/Api";


function CreateSession() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [playerCount, setPlayerCount] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const startDateInputRef = useRef(null);
  const endDateInputRef = useRef(null);
  const playerCountInputRef = useRef(null);
  const cityInputRef = useRef(null);
  const addressInputRef = useRef(null);

  const createMutation = useMutation({
    mutationFn: async (session) => {
      const token = localStorage.getItem("token");
      const response = await apiFetch(`${API_URL}/api/Session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(session),
      });
      if (!response.ok) throw new Error("Failed to create session");
      return response.json();
    },
    onSuccess: async (created) => {
      try {
          await refreshSession();
        } catch (err) {
          console.warn("Could not refresh token after creating session", err);
        }
      toast.success("Session created");
      navigate(`/sessions/${created.id}/games`);
      
    },
    onError: (err) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const fail = (ref, message) => {
    if (ref.current) {
      triggerAnimation(ref.current, "animate-shake");
      ref.current.focus();
    }
    setError(message);
    return false;
  };

  const validateForm = () => {
    setError("");

    if (!startDate) return fail(startDateInputRef, "Start date is required");
    if (!endDate) return fail(endDateInputRef, "End date is required");
    if (!playerCount) return fail(playerCountInputRef, "Player count is required");
    if (!address.trim()) return fail(addressInputRef, "Address is required");
    if (!city.trim()) return fail(cityInputRef, "City is required");

    if (new Date(startDate) < new Date())
      return fail(startDateInputRef, "You can't create a session in the past");
    if (new Date(endDate) <= new Date(startDate))
      return fail(endDateInputRef, "End must be after start");
    if (!Number.isInteger(Number(playerCount)) || Number(playerCount) < 1)
      return fail(playerCountInputRef, "Player count must be a whole number, 1 or more");

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    createMutation.mutate({
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      playerCount: Number(playerCount),
      city: city.trim(),
      address: address.trim(),
      description: description.trim(),
    });
  };

  const busy = createMutation.isPending;

  return (
    <div>
      <h1 className="sessions-title">Create session</h1>

      <form className="session-form" onSubmit={handleSubmit} noValidate>
        {error && <div className="error-box form-full">{error}</div>}

        {/* Row 1: three fields */}
        <div className="form-third">
          <label className="auth-label" htmlFor="startDate">Start</label>
          <input
            id="startDate"
            ref={startDateInputRef}
            className="auth-inputbox"
            type="datetime-local"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            disabled={busy}
          />
        </div>
        <div className="form-third">
          <label className="auth-label" htmlFor="endDate">End</label>
          <input
            id="endDate"
            ref={endDateInputRef}
            className="auth-inputbox"
            type="datetime-local"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            disabled={busy}
          />
        </div>
        <div className="form-third">
          <label className="auth-label" htmlFor="playerCount">Player count</label>
          <input
            id="playerCount"
            ref={playerCountInputRef}
            className="auth-inputbox"
            type="number"
            min="1"
            placeholder="2"
            value={playerCount}
            onChange={(e) => setPlayerCount(e.target.value)}
            disabled={busy}
          />
        </div>

        {/* Row 2: two fields */}
        <div className="form-half">
          <label className="auth-label" htmlFor="address">Address</label>
          <input
            id="address"
            ref={addressInputRef}
            className="auth-inputbox"
            type="text"
            placeholder="Studentų g. 50"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={busy}
          />
        </div>
        <div className="form-half">
          <label className="auth-label" htmlFor="city">City</label>
          <input
            id="city"
            ref={cityInputRef}
            className="auth-inputbox"
            type="text"
            placeholder="Kaunas"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={busy}
          />
        </div>

        {/* Row 3: big description */}
        <div className="form-full">
          <label className="auth-label" htmlFor="description">Description</label>
          <textarea
            id="description"
            className="auth-inputbox form-textarea"
            placeholder="Tell players what to expect..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={busy}
          />
        </div>

        <div className="form-full">
          <button className="auth-button" type="submit" disabled={busy}>
            {busy ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateSession;