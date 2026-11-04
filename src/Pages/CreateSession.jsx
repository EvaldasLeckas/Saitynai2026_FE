// src/Pages/CreateSession.jsx
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";

function CreateSession() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [playerCount, setPlayerCount] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const navigate = useNavigate();

  const createMutation = useMutation({
    mutationFn: async (session) => {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5083/api/Session", {
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
    onSuccess: () => {
      toast.success("Session created");
      navigate(`/sessions/${session.id}/games`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      playerCount: Number(playerCount),
      city,
      address,
      description,
    });
  };

  return (
    <div>
      <h1>Create session</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div>
          <input type="number" placeholder="Player count" value={playerCount} onChange={(e) => setPlayerCount(e.target.value)} />
        </div>
        <div>
          <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div>
          <input type="text" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>
        <div>
          <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <button type="submit" disabled={createMutation.isPending}>
          {createMutation.isPending ? "Creating..." : "Create"}
        </button>
      </form>
    </div>
  );
}

export default CreateSession;