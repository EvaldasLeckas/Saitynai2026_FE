import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

function formatDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getTokenPayload() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

// the role claim can be a string or an array, under either name
function getRoles(payload) {
  const raw =
    payload?.role ??
    payload?.["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
    [];
  return Array.isArray(raw) ? raw : [raw];
}

function MySessions() {
  const payload = getTokenPayload();
  const userId = payload?.sub ?? null;
  const isLobbyOwner = getRoles(payload).includes("LobbyOwner");

  const sessionsQuery = useQuery({
    queryKey: ["sessions"],
    enabled: isLobbyOwner,
    queryFn: async () => {
      const response = await fetch(
        "http://localhost:5083/api/Session?pageSize=100&pageNumber=1"
      );
      if (!response.ok) throw new Error("Failed to fetch sessions");
      return response.json();
    },
  });

  if (!isLobbyOwner) {
    return (
      <div>
        <h1 className="sessions-title">My sessions</h1>
        <p>Only lobby owners have sessions of their own.</p>
      </div>
    );
  }

  if (sessionsQuery.isPending) return <p>Loading...</p>;
  if (sessionsQuery.error) return <p>An error has occurred: {sessionsQuery.error.message}</p>;

  const sessions = sessionsQuery.data.resources
    .map((item) => item.resource)
    .filter((s) => s.createdByUserId === userId)
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  return (
    <div>
      <h1 className="sessions-title">My sessions</h1>

      {sessions.length === 0 && <p>You haven't created any sessions yet.</p>}

      <ul className="session-list">
        {sessions.map((session) => (
          <li key={session.id} className="session-row">
            <Link to={`/sessions/${session.id}`} className="session-card">
              <strong>{session.city}, {session.address}</strong>
              <span>{session.description}</span>
              <span>{formatDate(session.startDate)} - {formatDate(session.endDate)}</span>
              <span>Max players: {session.playerCount}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MySessions;