import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { toast } from "react-toastify";

const lengthLabels = ["Short", "Normal", "Long"];
const difficultyLabels = ["Easy", "Medium", "Hard"];

function AddGames() {
  const { id } = useParams(); // the session id from the URL
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [playerCount, setPlayerCount] = useState("");
  const [gameLength, setGameLength] = useState(1);
  const [difficulty, setDifficulty] = useState(1);
  const [addedGames, setAddedGames] = useState([]);

  const addGameMutation = useMutation({
    mutationFn: async (game) => {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5083/api/Game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(game),
      });
      if (!response.ok) throw new Error("Failed to add game");
      return response.json();
    },
    onSuccess: (data, game) => {
      // "game" is what we sent, so we can show it in the list
      setAddedGames([...addedGames, game]);
      setName("");
      setDescription("");
      setPlayerCount("");
      toast.success("Game added");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    addGameMutation.mutate({
      name,
      description,
      playerCount: Number(playerCount),
      gameLength: Number(gameLength),
      difficulty: Number(difficulty),
      sessionId: Number(id),
    });
  };

  return (
    <div>
      <h1>Add games to session #{id}</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <input type="number" placeholder="Player count" value={playerCount} onChange={(e) => setPlayerCount(e.target.value)} />
        </div>
        <div>
          <select value={gameLength} onChange={(e) => setGameLength(e.target.value)}>
            <option value={0}>Short</option>
            <option value={1}>Normal</option>
            <option value={2}>Long</option>
          </select>
        </div>
        <div>
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value={0}>Easy</option>
            <option value={1}>Medium</option>
            <option value={2}>Hard</option>
          </select>
        </div>
        <button type="submit" disabled={addGameMutation.isPending}>
          {addGameMutation.isPending ? "Adding..." : "Add game"}
        </button>
      </form>

      <h3>Added games</h3>
      {addedGames.length === 0 && <p>No games yet.</p>}
      <ul>
        {addedGames.map((g, i) => (
          <li key={i}>
            {g.name} ({lengthLabels[g.gameLength]}, {difficultyLabels[g.difficulty]}, {g.playerCount} players)
          </li>
        ))}
      </ul>

      <button disabled={addedGames.length === 0} onClick={() => navigate("/")}>
        Done
      </button>
    </div>
  );
}

export default AddGames;