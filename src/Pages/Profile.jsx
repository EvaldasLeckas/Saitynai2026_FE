import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import ConfirmModal from "../Components/ConfirmModal";
import Avatar from "../Components/Avatar";
import EditProfileModal from "../Components/EditProfileModal";
import { apiFetch, API_URL, logout } from "../Utils/Api";
import { readError } from "../Utils/Http";

function Profile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const response = await apiFetch(`${API_URL}/api/users/me/profile`);
      if (!response.ok) throw new Error("Failed to fetch profile");
      return response.json();
    },
  });

  const profile = profileQuery.data;

  const userQuery = useQuery({
    queryKey: ["user", profile?.userId],
    enabled: !!profile, // wait until the profile has loaded
    queryFn: async () => {
      const response = await apiFetch(`${API_URL}/api/users/${profile.userId}`);
      if (!response.ok) throw new Error("Failed to fetch user");
      return response.json();
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await apiFetch(`${API_URL}/api/users/${profile.userId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(await readError(response, "Failed to delete account"));
    },
    onSuccess: async () => {
      try {
        await logout(); // clears the token and the refresh cookie
      } catch {
        // the account is gone anyway, continue
      }
      queryClient.clear(); // so cached data of this user isn't shown to the next one
      navigate("/login");
      toast.success("Account deleted");
    },
    onError: (error) => {
      setShowDelete(false);
      toast.error(error.message);
    },
  });

  // errors first: a failed profile query leaves userQuery disabled (pending forever)
  if (profileQuery.error) return <p>An error has occurred: {profileQuery.error.message}</p>;
  if (userQuery.error) return <p>An error has occurred: {userQuery.error.message}</p>;
  if (profileQuery.isPending || userQuery.isPending) return <p>Loading...</p>;

return (
  <div>
    <div className="details-topbar profile-topbar">
      <div className="details-actions">
        <button className="action-button" onClick={() => setEditing(true)}>
          Edit
        </button>
        <button
          className="action-button action-danger"
          disabled={deleteAccountMutation.isPending}
          onClick={() => setShowDelete(true)}
        >
          Delete account
        </button>
      </div>
    </div>

    <div className="details-card profile-card">
      <div className="profile-main">
        <h1 className="sessions-title profile-name">
          {profile.fullName}
          <span className="profile-age">{profile.age}m.</span>
        </h1>

        <p className="profile-stats">
          <span title="Games played">G: {profile.gamesPlayed}</span>
          <span title="Win rate">WR: {profile.winRate}%</span>
          <span title="Wins">W: {profile.wins}</span>
          <span title="Average placement">
            AVG PLACEMENT: {profile.averagePlacement ?? "-"}
          </span>
        </p>

        {profile.bio && <p className="profile-bio">{profile.bio}</p>}

        <section className="details-box">
          <h2>Recent results</h2>
          {profile.recentResults.length === 0 ? (
            <p>No results yet.</p>
          ) : (
            <div className="table-scroll">
              <table className="players-table">
                <thead>
                  <tr>
                    <th>Game</th>
                    <th>Place</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.recentResults.map((r, i) => (
                    <tr key={i}>
                      <td>{r.gameName}</td>
                      <td>{r.placement}</td>
                      <td>{r.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <div className="profile-side">
        <Avatar url={profile.avatarUrl} name={profile.fullName} />
      </div>
    </div>

    {editing && (
      <EditProfileModal
        profile={profile}
        user={userQuery.data}
        onClose={() => setEditing(false)}
      />
    )}

    {showDelete && (
      <ConfirmModal
        title="Delete account"
        message="Delete your account permanently? Your profile and data will be removed and this cannot be undone."
        confirmLabel="Delete account"
        busy={deleteAccountMutation.isPending}
        onCancel={() => setShowDelete(false)}
        onConfirm={() => deleteAccountMutation.mutate()}
      />
    )}
  </div>
);
}

export default Profile;