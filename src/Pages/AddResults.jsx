import { useState, Fragment } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";
import { toast } from "react-toastify";
import { apiFetch, getTokenPayload, isAdmin, API_URL } from "../Utils/Api";


function AddResults() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = getTokenPayload()?.sub ?? null;
  const [gameId, setGameId] = useState("");
  const [scores, setScores] = useState({});         // userId -> typed score
  const [placements, setPlacements] = useState({}); // userId -> typed placement


  const sessionQuery = useQuery({
  queryKey: ["session", id],
  queryFn: async () => {
    const response = await apiFetch(`${API_URL}/api/Session/${id}`);
    if (!response.ok) throw new Error("Failed to fetch session");
    return response.json();
  },
});
  const gamesQuery = useQuery({
    queryKey: ["games"],
    queryFn: async () => {
      const response = await apiFetch(`${API_URL}/api/Game?pageSize=100&pageNumber=1`);
      if (!response.ok) throw new Error("Failed to fetch games");
      return response.json();
    },
  });

  const participantsQuery = useQuery({
    queryKey: ["participants", id],
    queryFn: async () => {
      const response = await apiFetch(`${API_URL}/api/session-participants/session/${id}`);
      if (!response.ok) throw new Error("Failed to fetch participants");
      return response.json();
    },
  });

  const resultsQuery = useQuery({
    queryKey: ["results"],
    queryFn: async () => {
      const response = await apiFetch(`${API_URL}/api/UserResult?pageSize=100&pageNumber=1`);
      if (!response.ok) throw new Error("Failed to fetch results");
      return response.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (rows) => {
      await Promise.all(
        rows.map(async ({ existing, body }) => {
          const response = await apiFetch(
            existing
              ? `${API_URL}/api/UserResult/${existing.id}`
              : `${API_URL}/api/UserResult`,
            {
              method: existing ? "PUT" : "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(body),
            }
          );
          if (!response.ok) throw new Error("Failed to save results");
        })
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["results"] });
      setScores({});
      setPlacements({});
      toast.success("Results saved");
    },
    onError: (err) => toast.error(err.message),
  });


  const games = (gamesQuery.data?.resources ?? [])
    .map((item) => item.resource)
    .filter((g) => g.sessionId === Number(id));

  const participants = participantsQuery.data ?? [];

  const gameResults = (resultsQuery.data?.resources ?? [])
    .map((item) => item.resource)
    .filter((r) => r.gameId === Number(gameId));

  const getExisting = (userId) => gameResults.find((r) => r.userId === userId);

  // typed value first, then the saved score, then empty
  const getValue = (userId) => scores[userId] ?? getExisting(userId)?.score ?? "";

  // automatic placement: highest score = 1st, equal scores share a place
  const autoPlacement = (userId) => {
    const mine = getValue(userId);
    if (mine === "") return "";
    return (
      1 +
      participants.filter((p) => {
        const v = getValue(p.userId);
        return v !== "" && Number(v) > Number(mine);
      }).length
    );
  };

  // typed placement > saved placement (if the score wasn't touched) > automatic
  const getPlacement = (userId) => {
    if (placements[userId] !== undefined) return placements[userId];
    const existing = getExisting(userId);
    if (existing && scores[userId] === undefined) return existing.placement ?? "";
    return autoPlacement(userId);
  };

  const handleGameChange = (e) => {
    setGameId(e.target.value);
    setScores({});
    setPlacements({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const rows = participants
      .filter((p) => getValue(p.userId) !== "")
      .map((p) => ({
        existing: getExisting(p.userId),
        body: {
          gameId: Number(gameId),
          userId: p.userId,
          score: Number(getValue(p.userId)),
          placement: Number(getPlacement(p.userId)),
        },
      }));

    if (rows.length === 0) {
      toast.error("Enter at least one score");
      return;
    }
    saveMutation.mutate(rows);
  };

  if (gamesQuery.isPending || participantsQuery.isPending || resultsQuery.isPending) {
    return <p>Loading...</p>;
  }

if (
  sessionQuery.isPending ||
  gamesQuery.isPending ||
  participantsQuery.isPending ||
  resultsQuery.isPending
) {
  return <p>Loading...</p>;
}

if (sessionQuery.error) {
  return <p>An error has occurred: {sessionQuery.error.message}</p>;
}

const session = sessionQuery.data?.resource ?? sessionQuery.data;

if (session.createdByUserId !== userId && !isAdmin()) {
  return (
    <div>
      <h1 className="sessions-title">Add results</h1>
      <p>Only the owner of this session can add results.</p>
    </div>
  );
}

const busy = saveMutation.isPending;
  return (
    <div>
      <h1 className="sessions-title">Add results</h1>

      <form className="session-form" onSubmit={handleSubmit} noValidate>
        <div className="form-full">
          <label className="auth-label" htmlFor="game">Game</label>
          <select
            id="game"
            className="auth-inputbox"
            value={gameId}
            onChange={handleGameChange}
            disabled={busy}
          >
            <option value="">Select a game</option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        {gameId &&
          participants.map((p) => {
            const name = `${p.name ?? ""} ${p.lastName ?? ""}`.trim() || p.userId;
            const existing = getExisting(p.userId);
            return (
              <Fragment key={p.userId}>
                <div className="form-half">
                  <label className="auth-label" htmlFor={`score-${p.userId}`}>{name} - score</label>
                  <input
                    id={`score-${p.userId}`}
                    className="auth-inputbox"
                    type="number"
                    placeholder="Score"
                    value={getValue(p.userId)}
                    onChange={(e) => setScores({ ...scores, [p.userId]: e.target.value })}
                    disabled={busy}
                  />
                </div>
                <div className="form-half">
                  <label className="auth-label" htmlFor={`place-${p.userId}`}>{name} - place</label>
                  <input
                    id={`place-${p.userId}`}
                    className="auth-inputbox"
                    type="number"
                    min="1"
                    placeholder="Place"
                    value={getPlacement(p.userId)}
                    onChange={(e) => setPlacements({ ...placements, [p.userId]: e.target.value })}
                    disabled={busy}
                  />
                </div>
              </Fragment>
            );
          })}

        {gameId && (
          <div className="form-full form-buttons">
            <button className="action-button" type="submit" disabled={busy}>
              {saveMutation.isPending ? "Saving..." : "Save results"}
            </button>
          </div>
        )}
      </form>

      <button className="auth-button" onClick={() => navigate(`/sessions/${id}`)}>
        Done
      </button>
    </div>
  );
}

export default AddResults;