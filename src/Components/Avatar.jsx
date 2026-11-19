import { API_URL } from "../Utils/Api";

// photo, or the user's initials when there is no photo
function Avatar({ url, name }) {
  if (url) {
    return (
      <img
        className="profile-avatar"
        src={`${API_URL}${url}`}
        alt={`${name}'s photo`}
      />
    );
  }

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return <div className="profile-avatar profile-avatar-empty">{initials || "?"}</div>;
}

export default Avatar;