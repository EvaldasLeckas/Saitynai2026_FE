import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

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

// Separate component so the inputs start with the user's current values
function EditForm({ user, userId }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(user.name);
  const [surname, setSurname] = useState(user.surname);
  const [bio, setBio] = useState(user.bio ?? "");
  const [birthDate, setBirthDate] = useState(user.birthDate?.slice(0, 10) ?? "");

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5083/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const text = await response.text();
        let message = "Failed to update profile";
        try {
          const body = JSON.parse(text);
          if (body.errors) message = Object.values(body.errors).flat().join(" ");
        } catch {}
        throw new Error(message);
      }
      // 204 = empty body, so no response.json() here
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      toast.success("Profile updated");
    },
    onError: (error) => toast.error(error.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      name,
      surname,
      bio,
      email: user.email, // sent unchanged, see the note below
      birthDate,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <input type="text" placeholder="Surname" value={surname} onChange={(e) => setSurname(e.target.value)} />
      </div>
      <div>
        <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
      </div>
      <div>
        <textarea placeholder="Bio" value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>
      <div>
        <input type="email" value={user.email} disabled />
      </div>
      <button type="submit" disabled={updateMutation.isPending}>
        {updateMutation.isPending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}

function Profile() {
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5083/api/users/me/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch profile");
      return response.json();
    },
  });

  const profile = profileQuery.data; // declared before it is used below

  const userQuery = useQuery({
    queryKey: ["user", profile?.userId],
    enabled: !!profile, // wait until the profile has loaded
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5083/api/users/${profile.userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to fetch user");
      return response.json();
    },
  });

  if (profileQuery.isPending || userQuery.isPending) return <p>Loading...</p>;
  if (profileQuery.error) return <p>An error has occurred: {profileQuery.error.message}</p>;
  if (userQuery.error) return <p>An error has occurred: {userQuery.error.message}</p>;

  return (
    <div>
      <h1>{profile.fullName}</h1>
      <div>{profile.email}</div>
      <div>Age: {profile.age}</div>
      {profile.bio && <p>{profile.bio}</p>}

      <h2>Stats</h2>
      <ul>
        <li>Games played: {profile.gamesPlayed}</li>
        <li>Wins: {profile.wins}</li>
        <li>Win rate: {profile.winRate}%</li>
        <li>Average placement: {profile.averagePlacement ?? "-"}</li>
      </ul>

      <h2>Recent results</h2>
      {profile.recentResults.length === 0 && <p>No results yet.</p>}
      <ul>
        {profile.recentResults.map((r, i) => (
          <li key={i}>
            {r.gameName}: place {r.placement}, score {r.score}
          </li>
        ))}
      </ul>

      <h2>Edit profile</h2>
      <EditForm user={userQuery.data} userId={profile.userId} />
    </div>
  );
}

export default Profile;