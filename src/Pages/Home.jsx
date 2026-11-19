import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Link } from "react-router";
import { useState } from "react";
import { apiFetch, getTokenPayload, API_URL } from "../Utils/Api";

function formatDate(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}


function Home() {
  const queryClient = useQueryClient();
  const userId = getTokenPayload()?.sub ?? null;
  const [cityFilter, setCityFilter] = useState("");
  const [sortBy, setSortBy] = useState("date-asc");
  

  const sessionsQuery = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const response = await apiFetch(
        `${API_URL}/api/Session?pageSize=10&pageNumber=1`
      );
      if (!response.ok) throw new Error("Failed to fetch sessions");
      return response.json();
    },
  });

  const participantsQuery = useQuery({
    queryKey: ["participants"],
    queryFn: async () => {
      const response = await apiFetch(`${API_URL}/api/session-participants`);
      if (!response.ok) throw new Error("Failed to fetch participants");
      return response.json();
    },
  });

  const joinMutation = useMutation({
    mutationFn: async ({ sessionId, join }) => {
      const response = await apiFetch(
        `${API_URL}/api/session-participants/session/${sessionId}/${join ? "join" : "leave"}`,
        {
          method: join ? "POST" : "DELETE"}
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

  const participants = participantsQuery.data;
  const allSessions = sessionsQuery.data.resources.map((item) => item.resource);
  const now = new Date();

  const upcoming = allSessions.filter((s) => new Date(s.endDate) > now);

  const cities = [...new Set(upcoming.map((s) => s.city))];

  const sessions = upcoming
    .filter((s) => !cityFilter || s.city === cityFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.startDate) - new Date(a.startDate);
        case "players-asc":
          return a.playerCount - b.playerCount;
        case "players-desc":
          return b.playerCount - a.playerCount;
        default: // "date-asc"
          return new Date(a.startDate) - new Date(b.startDate);
      }
    });

  return (
    <div className="sessions-page">
      <h1 className="sessions-title">Upcoming sessions</h1>

      <div className="sessions-toolbar">
        <select
          className="filter-box"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        >
          <option value="">Filter by: all cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          className="filter-box"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
<option value="date-asc">Sort by: date (soonest first)</option>
<option value="date-desc">Sort by: date (latest first)</option>
<option value="players-asc">Sort by: players (fewest first)</option>
<option value="players-desc">Sort by: players (most first)</option>
        </select>
      </div>

      {sessions.length === 0 && <p>No sessions available.</p>}

      <ul className="session-list">
        {sessions.map((session, index) => {
          const joined = participants.filter((p) => p.sessionId === session.id);
          const isJoined = joined.some((p) => p.userId === userId);
          const isOwner = session.createdByUserId === userId;

          return (
            <li key={session.id} className="session-row" style={{ "--i": index}}>
              <Link to={`/sessions/${session.id}`} className="session-card">
                <strong>{session.city}, {session.address}</strong>
                <span>{session.description}</span>
                <span>{formatDate(session.startDate)} - {formatDate(session.endDate)}</span>
                <span>Players: {joined.length} / {session.playerCount}</span>
              </Link>

              <div className="session-actions">
                {userId && isOwner && <em className="session-owner">Your session</em>}
                {userId && !isOwner && (
                  <button
                    className="action-button"
                    disabled={joinMutation.isPending}
                    onClick={() =>
                      joinMutation.mutate({ sessionId: session.id, join: !isJoined })
                    }
                  >
                    {isJoined ? "Leave" : "Join"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default Home;