import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { triggerAnimation } from "../Utils/Auth";

const pad = (n) => String(n).padStart(2, "0");

// ISO string -> value for <input type="datetime-local">
function toInputValue(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function EditSessionModal({ session, minPlayers, onClose }) {
  const queryClient = useQueryClient();

  const [startDate, setStartDate] = useState(toInputValue(session.startDate));
  const [endDate, setEndDate] = useState(toInputValue(session.endDate));
  const [playerCount, setPlayerCount] = useState(String(session.playerCount));
  const [address, setAddress] = useState(session.address ?? "");
  const [city, setCity] = useState(session.city ?? "");
  const [description, setDescription] = useState(session.description ?? "");
  const [error, setError] = useState("");

  const startRef = useRef(null);
  const endRef = useRef(null);
  const playerCountRef = useRef(null);
  const addressRef = useRef(null);
  const cityRef = useRef(null);

  // Close on Escape + stop the page behind from scrolling
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const updateMutation = useMutation({
    mutationFn: async (body) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5083/api/Session/${session.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const text = await response.text();
        let message = `Failed to update session (${response.status})`;
        try {
          const json = JSON.parse(text);
          message = json.message ?? json.title ?? message;
        } catch {
          if (text) message = text;
        }
        throw new Error(message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", String(session.id)] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session updated");
      onClose();
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

  const validate = () => {
    setError("");
    if (!startDate) return fail(startRef, "Start date is required");
    if (!endDate) return fail(endRef, "End date is required");
    if (new Date(endDate) <= new Date(startDate))
      return fail(endRef, "End must be after start");
    if (!Number.isInteger(Number(playerCount)) || Number(playerCount) < 1)
      return fail(playerCountRef, "Player count must be a whole number, 1 or more");
    if (Number(playerCount) < minPlayers)
      return fail(playerCountRef, `${minPlayers} players already joined, so the limit can't be lower`);
    if (!address.trim()) return fail(addressRef, "Address is required");
    if (!city.trim()) return fail(cityRef, "City is required");
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    updateMutation.mutate({
      id: session.id,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      playerCount: Number(playerCount),
      city: city.trim(),
      address: address.trim(),
      description: description.trim(),
    });
  };

  const busy = updateMutation.isPending;

  return createPortal(
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="edit-title">
        <div className="modal-header">
          <h2 id="edit-title">Edit session</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <form className="session-form" onSubmit={handleSubmit} noValidate>
          {error && <div className="error-box form-full">{error}</div>}

          <div className="form-third">
            <label className="auth-label" htmlFor="edit-start">Start</label>
            <input id="edit-start" ref={startRef} className="auth-inputbox" type="datetime-local"
              value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={busy} />
          </div>
          <div className="form-third">
            <label className="auth-label" htmlFor="edit-end">End</label>
            <input id="edit-end" ref={endRef} className="auth-inputbox" type="datetime-local"
              value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={busy} />
          </div>
          <div className="form-third">
            <label className="auth-label" htmlFor="edit-players">Player count</label>
            <input id="edit-players" ref={playerCountRef} className="auth-inputbox" type="number"
              min={Math.max(1, minPlayers)} value={playerCount}
              onChange={(e) => setPlayerCount(e.target.value)} disabled={busy} />
          </div>

          <div className="form-half">
            <label className="auth-label" htmlFor="edit-address">Address</label>
            <input id="edit-address" ref={addressRef} className="auth-inputbox" type="text"
              value={address} onChange={(e) => setAddress(e.target.value)} disabled={busy} />
          </div>
          <div className="form-half">
            <label className="auth-label" htmlFor="edit-city">City</label>
            <input id="edit-city" ref={cityRef} className="auth-inputbox" type="text"
              value={city} onChange={(e) => setCity(e.target.value)} disabled={busy} />
          </div>

          <div className="form-full">
            <label className="auth-label" htmlFor="edit-description">Description</label>
            <textarea id="edit-description" className="auth-inputbox form-textarea"
              value={description} onChange={(e) => setDescription(e.target.value)} disabled={busy} />
          </div>

          <div className="form-full modal-actions">
            <button type="button" className="action-button" onClick={onClose} disabled={busy}>
              Cancel
            </button>
            <button type="submit" className="action-button" disabled={busy}>
              {busy ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default EditSessionModal;