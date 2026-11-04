import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { toast } from "react-toastify";

const lengthLabels = ["Short", "Normal", "Long"];
const difficultyLabels = ["Easy", "Medium", "Hard"];

function formatDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getUserId() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)).sub ?? null;
  } catch {
    return null;
  }
}

function SessionDetails() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const userId = getUserId();

  const sessionQuery = useQuery({
    queryKey: ["session", id],
    queryFn: async () => {
      const response = await fetch(`http://localhost:5083/api/Session/${id}`);
      if (!response.ok) throw new Error("Failed to fetch session");
      return response.json();
    },
  });

  const participantsQuery = useQuery({
    queryKey: ["participants", id],
    queryFn: async () => {
      const response = await fetch(
        `http://localhost:5083/api/session-participants/session/${id}`
      );
      if (!response.ok) throw new Error("Failed to fetch participants");
      return response.json();
    },
  });

  const gamesQuery = useQuery({
    queryKey: ["games"],
    queryFn: async () => {
      const response = await fetch(
        "http://localhost:5083/api/Game?pageSize=100&pageNumber=1"
      );
      if (!response.ok) throw new Error("Failed to fetch games");
      return response.json();
    },
  });

  const kickMutation = useMutation({
    mutationFn: async (participantUserId) => {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5083/api/session-participants/session/${id}/user/${participantUserId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error("Failed to remove participant");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participants"] });
      toast.success("Participant removed");
    },
    onError: (error) => toast.error(error.message),
  });

  if (sessionQuery.isPending || participantsQuery.isPending || gamesQuery.isPending) {
    return <p>Loading...</p>;
  }
  if (sessionQuery.error) return <p>An error has occurred: {sessionQuery.error.message}</p>;
  if (participantsQuery.error) return <p>An error has occurred: {participantsQuery.error.message}</p>;
  if (gamesQuery.error) return <p>An error has occurred: {gamesQuery.error.message}</p>;

  const session = sessionQuery.data;
  const participants = participantsQuery.data;
  const games = gamesQuery.data.resources
    .map((item) => item.resource)
    .filter((g) => g.sessionId === Number(id));

  const isOwner = session.createdByUserId === userId;

  return (
    <div>
      <p><Link to="/">&larr; Back to sessions</Link></p>

      <h1>{session.city}, {session.address}</h1>
      <div>{session.description}</div>
      <div>{formatDate(session.startDate)} - {formatDate(session.endDate)}</div>
      {isOwner && <em>You created this session</em>}

      <h2>Players ({participants.length} / {session.playerCount})</h2>
      {participants.length === 0 && <p>No players yet.</p>}
      <ul>
        {participants.map((p) => {
          const name = `${p.name ?? ""} ${p.lastName ?? ""}`.trim() || p.userId;
          return (
            <li key={p.userId}>
              {name}
              {p.userId === session.createdByUserId && " (owner)"}
              {isOwner && p.userId !== session.createdByUserId && (
                <>
                  {" "}
                  <button
                    disabled={kickMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Remove ${name}?`)) {
                        kickMutation.mutate(p.userId);
                      }
                    }}
                  >
                    Kick
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>

      <h2>Games</h2>
      {games.length === 0 && <p>No games yet.</p>}
      <ul>
        {games.map((g) => (
          <li key={g.id}>
            <strong>{g.name}</strong> - {g.description}
            <div>
              {lengthLabels[g.gameLength] ?? g.gameLength},{" "}
              {difficultyLabels[g.difficulty] ?? g.difficulty},{" "}
              {g.playerCount} players
            </div>
            {/* results will go here in the next step */}
          </li>
        ))}
      </ul>

      {isOwner && <Link to={`/sessions/${id}/games`}>Add games</Link>}
    </div>
  );
}

export default SessionDetails;