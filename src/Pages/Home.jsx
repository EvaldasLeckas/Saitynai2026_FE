import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Link } from "react-router";


function formatDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// reads the user id ("sub") from the JWT
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

function Home() {
  const queryClient = useQueryClient();
  const userId = getUserId();

  const sessionsQuery = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const response = await fetch(
        "http://localhost:5083/api/Session?pageSize=5&pageNumber=1"
      );
      if (!response.ok) throw new Error("Failed to fetch sessions");
      return response.json();
    },
  });

  const participantsQuery = useQuery({
    queryKey: ["participants"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5083/api/session-participants");
      if (!response.ok) throw new Error("Failed to fetch participants");
      return response.json();
    },
  });

  const joinMutation = useMutation({
    mutationFn: async ({ sessionId, join }) => {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5083/api/session-participants/session/${sessionId}/${join ? "join" : "leave"}`,
        {
          method: join ? "POST" : "DELETE",
          headers: { Authorization: `Bearer ${token}` },
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["participants"] });
      toast.success(variables.join ? "Joined session" : "Left session");
    },
    onError: (error) => toast.error(error.message),
  });

  if (sessionsQuery.isPending || participantsQuery.isPending) return <p>Loading...</p>;
  if (sessionsQuery.error) return <p>An error has occurred: {sessionsQuery.error.message}</p>;
  if (participantsQuery.error) return <p>An error has occurred: {participantsQuery.error.message}</p>;

  const sessions = sessionsQuery.data.resources.map((item) => item.resource);
  const participants = participantsQuery.data;

  if (sessions.length === 0) return <p>No sessions available.</p>;

  return (
    <div>
      <h1>Sessions</h1>
      <ul>
        {sessions.map((session) => {
          const joined = participants.filter((p) => p.sessionId === session.id);
          const isJoined = joined.some((p) => p.userId === userId);
          const isOwner = session.createdByUserId === userId;

          return (
            <li key={session.id}>
              <Link to={`/sessions/${session.id}`}>
              <strong>{session.city}, {session.address}</strong>
              </Link>
              <div>{session.description}</div>
              <div>{formatDate(session.startDate)} - {formatDate(session.endDate)}</div>
              <div>Players: {joined.length} / {session.playerCount}</div>


              {userId && isOwner && <em>You created this session</em>}
              {userId && !isOwner && (
                <button
                  disabled={joinMutation.isPending}
                  onClick={() =>
                    joinMutation.mutate({ sessionId: session.id, join: !isJoined })
                  }
                >
                  {isJoined ? "Leave" : "Join"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Home;