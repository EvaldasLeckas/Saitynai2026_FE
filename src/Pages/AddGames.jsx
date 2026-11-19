import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { toast } from "react-toastify";
import { triggerAnimation } from "../Utils/Auth";
import ConfirmModal from "../Components/ConfirmModal";
import { apiFetch, getTokenPayload } from "../Utils/Api";


const lengthLabels = ["Short", "Normal", "Long"];
const difficultyLabels = ["Easy", "Medium", "Hard"];

async function readError(response, fallback) {
  const text = await response.text();
  let message = `${fallback} (${response.status})`;
  try {
    const body = JSON.parse(text);
    message = body.message ?? body.title ?? message;
  } catch {
    if (text) message = text;
  }
  return message;
}

function AddGames() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = getTokenPayload()?.sub ?? null;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [playerCount, setPlayerCount] = useState("");
  const [gameLength, setGameLength] = useState(1);
  const [difficulty, setDifficulty] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [gameToDelete, setGameToDelete] = useState(null);

  const nameInputRef = useRef(null);
  const playerCountInputRef = useRef(null);
  const formRef = useRef(null);


  const sessionQuery = useQuery({
  queryKey: ["session", id],
  queryFn: async () => {
    const response = await apiFetch(`http://localhost:5083/api/Session/${id}`);
    if (!response.ok) throw new Error("Failed to fetch session");
    return response.json();
  },
});

  const gamesQuery = useQuery({
    queryKey: ["games"],
    queryFn: async () => {
      const response = await apiFetch(
        "http://localhost:5083/api/Game?pageSize=100&pageNumber=1"
      );
      if (!response.ok) throw new Error("Failed to fetch games");
      return response.json();
    },
  });

  const sessionGames = (gamesQuery.data?.resources ?? [])
    .map((item) => item.resource)
    .filter((g) => g.sessionId === Number(id));

  const resetForm = () => {
    setName("");
    setDescription("");
    setPlayerCount("");
    setGameLength(1);
    setDifficulty(1);
    setEditingId(null);
    setError("");
  };

  // ---------- Mutations ----------

  


  const addGameMutation = useMutation({
    mutationFn: async (game) => {
      const response = await apiFetch("http://localhost:5083/api/Game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(game),
      });
      if (!response.ok) throw new Error(await readError(response, "Failed to add game"));
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      resetForm();
      toast.success("Game added");
      nameInputRef.current?.focus();
    },
    onError: (err) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const updateGameMutation = useMutation({
    mutationFn: async (game) => {
      const response = await apiFetch(`http://localhost:5083/api/Game/${game.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(game),
      });
      if (!response.ok) throw new Error(await readError(response, "Failed to update game"));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      resetForm();
      toast.success("Game updated");
    },
    onError: (err) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const deleteGameMutation = useMutation({
    mutationFn: async (gameId) => {
      const response = await apiFetch(`http://localhost:5083/api/Game/${gameId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(await readError(response, "Failed to delete game"));
    },
    onSuccess: (data, gameId) => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
      if (gameId === editingId) resetForm(); // deleted the game being edited
      toast.success("Game deleted");
    },
    onError: (err) => toast.error(err.message),
  });

  // ---------- Form logic ----------
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
    if (!name.trim()) return fail(nameInputRef, "Name is required");
    if (!playerCount) return fail(playerCountInputRef, "Player count is required");
    if (!Number.isInteger(Number(playerCount)) || Number(playerCount) < 1)
      return fail(playerCountInputRef, "Player count must be a whole number, 1 or more");
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const game = {
      name: name.trim(),
      description: description.trim(),
      playerCount: Number(playerCount),
      gameLength: Number(gameLength),
      difficulty: Number(difficulty),
      sessionId: Number(id),
    };

    if (editingId !== null) {
      updateGameMutation.mutate({ ...game, id: editingId });
    } else {
      addGameMutation.mutate(game);
    }
  };

  const startEdit = (g) => {
    setEditingId(g.id);
    setName(g.name ?? "");
    setDescription(g.description ?? "");
    setPlayerCount(String(g.playerCount));
    setGameLength(g.gameLength);
    setDifficulty(g.difficulty);
    setError("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    nameInputRef.current?.focus();
  };

  if (sessionQuery.isPending) return <p>Loading...</p>;
  if (sessionQuery.error) return <p>An error has occurred: {sessionQuery.error.message}</p>;

  const session = sessionQuery.data?.resource ?? sessionQuery.data;

  if (session.createdByUserId !== userId) {
    return (
      <div>
        <h1 className="sessions-title">Add games</h1>
        <p>Only the owner of this session can manage its games.</p>
      </div>
    );
  }
  const busy = addGameMutation.isPending || updateGameMutation.isPending;
  const isEditing = editingId !== null;

  return (
    <div>
      <h1 className="sessions-title">{isEditing ? "Edit game" : "Add games"}</h1>

      <form ref={formRef} className="session-form" onSubmit={handleSubmit} noValidate>
        {error && <div className="error-box form-full">{error}</div>}

        <div className="form-half">
          <label className="auth-label" htmlFor="name">Name</label>
          <input
            id="name"
            ref={nameInputRef}
            className="auth-inputbox"
            type="text"
            placeholder="Catan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={busy}
          />
        </div>
        <div className="form-half">
          <label className="auth-label" htmlFor="playerCount">Player count</label>
          <input
            id="playerCount"
            ref={playerCountInputRef}
            className="auth-inputbox"
            type="number"
            min="1"
            placeholder="4"
            value={playerCount}
            onChange={(e) => setPlayerCount(e.target.value)}
            disabled={busy}
          />
        </div>

        <div className="form-half">
          <label className="auth-label" htmlFor="gameLength">Length</label>
          <select
            id="gameLength"
            className="auth-inputbox"
            value={gameLength}
            onChange={(e) => setGameLength(e.target.value)}
            disabled={busy}
          >
            {lengthLabels.map((label, i) => (
              <option key={label} value={i}>{label}</option>
            ))}
          </select>
        </div>
        <div className="form-half">
          <label className="auth-label" htmlFor="difficulty">Difficulty</label>
          <select
            id="difficulty"
            className="auth-inputbox"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            disabled={busy}
          >
            {difficultyLabels.map((label, i) => (
              <option key={label} value={i}>{label}</option>
            ))}
          </select>
        </div>

        <div className="form-full">
          <label className="auth-label" htmlFor="description">Description</label>
          <textarea
            id="description"
            className="auth-inputbox form-textarea"
            placeholder="Short description of the game..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={busy}
          />
        </div>

        <div className="form-full form-buttons">
          {isEditing && (
            <button type="button" className="action-button" onClick={resetForm} disabled={busy}>
              Cancel
            </button>
          )}
          <button className="action-button" type="submit" disabled={busy}>
            {busy
              ? "Saving..."
              : isEditing
              ? "Save changes"
              : "Add game"}
          </button>
        </div>
      </form>

      <h2 className="added-title">Games in this session</h2>

      <div className="games-card">
        {gamesQuery.isPending ? (
          <p>Loading...</p>
        ) : gamesQuery.error ? (
          <p>Failed to load games.</p>
        ) : sessionGames.length === 0 ? (
          <p>No games yet.</p>
        ) : (
          <div className="table-scroll">
            <table className="players-table">
              <thead>
                <tr>
                  <th>Game</th>
                  <th>Length</th>
                  <th>Difficulty</th>
                  <th>Players</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sessionGames.map((g) => (
                  <tr key={g.id} className={g.id === editingId ? "row-editing" : ""}>
                    <td>{g.name}</td>
                    <td>{lengthLabels[g.gameLength] ?? g.gameLength}</td>
                    <td>{difficultyLabels[g.difficulty] ?? g.difficulty}</td>
                    <td>{g.playerCount}</td>
                    <td className="players-action">
                      <div className="row-actions">
                       <button
  className="action-button action-small"
  onClick={() => startEdit(g)}
  disabled={busy}
>
  Edit
</button>
<button
  className="action-button action-small action-danger"
  onClick={() => setGameToDelete(g)}
  disabled={deleteGameMutation.isPending}
>
  Delete
</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <button className="auth-button" onClick={() => navigate(`/sessions/${id}`)}>
        Done
      </button>

      {gameToDelete && (
  <ConfirmModal
    title="Delete game"
    message={`Delete "${gameToDelete.name}"? This cannot be undone.`}
    busy={deleteGameMutation.isPending}
    onCancel={() => setGameToDelete(null)}
    onConfirm={() =>
      deleteGameMutation.mutate(gameToDelete.id, {
        onSettled: () => setGameToDelete(null),
      })
    }
  />
)}
    </div>
  );
}

export default AddGames;