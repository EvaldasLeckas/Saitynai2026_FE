import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "react-toastify";
import EditSessionModal from "../Components/EditSessionModal";
import ConfirmModal from "../Components/ConfirmModal";
import { apiFetch, getTokenPayload } from "../Utils/Api";


function formatDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}


function SessionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = getTokenPayload()?.sub ?? null;
  const [editing, setEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [kickTarget, setKickTarget] = useState(null);
  const [resultToDelete, setResultToDelete] = useState(null); // { id, name }


  // ---------- Queries ----------
  const sessionQuery = useQuery({
    queryKey: ["session", id],
    queryFn: async () => {
      const response = await apiFetch(`http://localhost:5083/api/Session/${id}`);
      if (!response.ok) throw new Error("Failed to fetch session");
      return response.json();
    },
  });

  const participantsQuery = useQuery({
    queryKey: ["participants", id],
    queryFn: async () => {
      const response = await apiFetch(
        `http://localhost:5083/api/session-participants/session/${id}`
      );
      if (!response.ok) throw new Error("Failed to fetch participants");
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

  const resultsQuery = useQuery({
    queryKey: ["results"],
    queryFn: async () => {
      const response = await apiFetch(
        "http://localhost:5083/api/UserResult?pageSize=100&pageNumber=1"
      );
      if (!response.ok) throw new Error("Failed to fetch results");
      return response.json();
    },
  });

  // ---------- Mutations ----------
  const kickMutation = useMutation({
    mutationFn: async ({ userId: participantUserId, resultIds }) => {

      // delete their results first, so nothing is left orphaned if a call fails
      for (const resultId of resultIds) {
        const res = await apiFetch(`http://localhost:5083/api/UserResult/${resultId}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete player's results");
      }

      const response = await apiFetch(
        `http://localhost:5083/api/session-participants/session/${id}/user/${participantUserId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to remove participant");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participants"] });
      queryClient.invalidateQueries({ queryKey: ["results"] });
      toast.success("Participant removed");
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteResultMutation = useMutation({
  mutationFn: async (resultId) => {
    const response = await apiFetch(`http://localhost:5083/api/UserResult/${resultId}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete result");
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["results"] });
    toast.success("Result deleted");
  },
  onError: (error) => toast.error(error.message),
});

  const joinMutation = useMutation({
    mutationFn: async (join) => {
      const response = await apiFetch(
        `http://localhost:5083/api/session-participants/session/${id}/${join ? "join" : "leave"}`,
        {
          method: join ? "POST" : "DELETE",
        }
      );
      if (!response.ok) {
        const text = await response.text();
        let message = join ? "Failed to join" : "Failed to leave";
        try {
          message = JSON.parse(text).message ?? message;
        } catch {}
        throw new Error(message);
      }
    },
    onSuccess: (data, join) => {
      queryClient.invalidateQueries({ queryKey: ["participants"] });
      toast.success(join ? "Joined session" : "Left session");
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiFetch(`http://localhost:5083/api/Session/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete session");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session deleted");
      navigate("/");
    },
    onError: (error) => toast.error(error.message),
  });

  // ---------- Loading / error states ----------
  if (
    sessionQuery.isPending ||
    participantsQuery.isPending ||
    gamesQuery.isPending ||
    resultsQuery.isPending
  ) {
    return <p>Loading...</p>;
  }
  if (sessionQuery.error) return <p>An error has occurred: {sessionQuery.error.message}</p>;
  if (participantsQuery.error) return <p>An error has occurred: {participantsQuery.error.message}</p>;
  if (gamesQuery.error) return <p>An error has occurred: {gamesQuery.error.message}</p>;
  if (resultsQuery.error) return <p>An error has occurred: {resultsQuery.error.message}</p>;

  // ---------- Derived data ----------
  const session = sessionQuery.data;
  const participants = participantsQuery.data;
  const games = gamesQuery.data.resources
    .map((item) => item.resource)
    .filter((g) => g.sessionId === Number(id));

  const results = resultsQuery.data.resources.map((item) => item.resource);

  const getPlayerName = (uid) => {
    const p = participants.find((p) => p.userId === uid);
    if (!p) return "Removed player";
    return `${p.name ?? ""} ${p.lastName ?? ""}`.trim() || uid;
  };

  // only games that have at least one result, players sorted by placement
  const gamesWithResults = games
    .map((g) => ({
      game: g,
      rows: results
        .filter((r) => r.gameId === g.id)
        .sort((a, b) => a.placement - b.placement),
    }))
    .filter((x) => x.rows.length > 0);

  const isOwner = session.createdByUserId === userId;
  const isJoined = participants.some((p) => p.userId === userId);

  // ---------- Render ----------
  return (
    <div>
      {/* Top bar: Back centered, actions on the right */}
      <div className="details-topbar">
        <Link to="/" className="back-link"> Back</Link>

        {userId && (
          <div className="details-actions">
            {isOwner ? (
              <>
                <button className="action-button" onClick={() => setEditing(true)}>
                  Edit
                </button>
                <button
                  className="action-button action-danger"
                  disabled={deleteMutation.isPending}
                  onClick={() => setShowDelete(true)}
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete"}
                </button>
              </>
            ) : (
              <button
                className="action-button"
                disabled={joinMutation.isPending}
                onClick={() => joinMutation.mutate(!isJoined)}
              >
                {isJoined ? "Leave" : "Join"}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="details-card">
        {/* Left column: session info */}
        <div className="details-info">
          <h1 className="sessions-title">{session.city}, {session.address}</h1>
          <p className="details-date">
            {formatDate(session.startDate)} - {formatDate(session.endDate)}
          </p>
          <p>{session.description}</p>

          {isOwner && (
            <div className="owner-actions">
              <Link to={`/sessions/${id}/games`} className="action-button">
                Add games
              </Link>
              <Link to={`/sessions/${id}/results`} className="action-button">
                Add results
              </Link>
            </div>
          )}
        </div>

        {/* Right column: players and games */}
        <div className="details-side">
          <section className="details-box">
            <h2>Players ({participants.length} / {session.playerCount})</h2>
            {participants.length === 0 ? (
              <p>No players yet.</p>
            ) : (
              <table className="players-table">
                <tbody>
                  {participants.map((p) => {
                    const name = `${p.name ?? ""} ${p.lastName ?? ""}`.trim() || p.userId;
                    const canKick = isOwner && p.userId !== session.createdByUserId;

                    return (
                      <tr key={p.userId}>
                        <td>
                          {name}
                          {p.userId === session.createdByUserId && " (owner)"}
                        </td>
                        {isOwner && (
                          <td className="players-action">
                            {canKick && (
                              <button
                                className="action-button action-small action-danger"
                                disabled={kickMutation.isPending}
                                onClick={() => setKickTarget({ id: p.userId, name })}
                              >
                                Kick
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>

          <section className="details-box">
            <h2>Games</h2>
            {games.length === 0 ? (
              <p>No games yet.</p>
            ) : (
              <table className="players-table">
                <tbody>
                  {games.map((g) => (
                    <tr key={g.id}>
                      <td title={g.description}>{g.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </div>
      </div>

      {/* Results, one table per game */}
      <h2 className="added-title">Results</h2>

      {gamesWithResults.length === 0 ? (
        <div className="games-card">
          <p>No results yet.</p>
        </div>
      ) : (
        gamesWithResults.map(({ game, rows }) => (
          <div className="games-card" key={game.id}>
            <h2 className="added-title" style={{ marginTop: 0 }}>Game: {game.name}</h2>
            <div className="table-scroll">
              <table className="players-table">
                <thead>
                <tr>
                  <th>Player</th>
                  <th>Score</th>
                  <th>Placement</th>
                  {isOwner && <th></th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{getPlayerName(r.userId)}</td>
                    <td>{r.score}</td>
                    <td>{r.placement}</td>
                    {isOwner && (
                      <td className="players-action">
                        <button
                          className="action-button action-small action-danger"
                          onClick={() => setResultToDelete({ id: r.id, name: getPlayerName(r.userId) })}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {editing && (
        <EditSessionModal
          session={session}
          minPlayers={participants.length}
          onClose={() => setEditing(false)}
        />
      )}

      {showDelete && (
        <ConfirmModal
          title="Delete session"
          message="Delete this session? This cannot be undone."
          busy={deleteMutation.isPending}
          onCancel={() => setShowDelete(false)}
          onConfirm={() =>
            deleteMutation.mutate(undefined, { onSettled: () => setShowDelete(false) })
          }
        />
      )}

      {kickTarget && (
        <ConfirmModal
          title="Remove player"
          message={`Remove ${kickTarget.name} from this session? Their results will be deleted too.`}
          confirmLabel="Remove"
          busy={kickMutation.isPending}
          onCancel={() => setKickTarget(null)}
          onConfirm={() =>
            kickMutation.mutate(
              {
                userId: kickTarget.id,
                resultIds: results
                  .filter((r) => r.userId === kickTarget.id && games.some((g) => g.id === r.gameId))
                  .map((r) => r.id),
              },
              { onSettled: () => setKickTarget(null) }
            )
          }
        />
      )}

      {resultToDelete && (
        <ConfirmModal
          title="Delete result"
          message={`Delete the result of ${resultToDelete.name}? This cannot be undone.`}
          busy={deleteResultMutation.isPending}
          onCancel={() => setResultToDelete(null)}
          onConfirm={() =>
            deleteResultMutation.mutate(resultToDelete.id, {
              onSettled: () => setResultToDelete(null),
            })
          }
        />
      )}
    </div>
  );
}

export default SessionDetails;