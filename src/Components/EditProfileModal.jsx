import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { apiFetch, API_URL } from "../Utils/Api";
import { readError } from "../Utils/Http";
import Avatar from "./Avatar";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function EditProfileModal({ profile, user, onClose }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  // the modal is only mounted while editing, so the inputs start with the current values
  const [name, setName] = useState(user.name);
  const [surname, setSurname] = useState(user.surname);
  const [bio, setBio] = useState(user.bio ?? "");
  const [birthDate, setBirthDate] = useState(user.birthDate?.slice(0, 10) ?? "");

  // ---------- photo ----------
  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      // no Content-Type header: the browser sets it with the multipart boundary
      const response = await apiFetch(`${API_URL}/api/users/${profile.userId}/avatar`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error(await readError(response, "Failed to upload image"));
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Photo updated");
    },
    onError: (error) => toast.error(error.message),
  });

  const removeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiFetch(`${API_URL}/api/users/${profile.userId}/avatar`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(await readError(response, "Failed to remove image"));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Photo removed");
    },
    onError: (error) => toast.error(error.message),
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the user pick the same file again later
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Please choose a JPEG, PNG or WebP image");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Image must be 2 MB or smaller");
      return;
    }
    uploadMutation.mutate(file);
  };

  // ---------- profile data ----------
  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const response = await apiFetch(`${API_URL}/api/users/${profile.userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error(await readError(response, "Failed to update profile"));
      // 204 = empty body, so no response.json() here
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["user", profile.userId] });
      toast.success("Profile updated");
      onClose();
    },
    onError: (error) => toast.error(error.message),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      name,
      surname,
      bio,
      email: user.email, // sent unchanged
      birthDate,
    });
  };

  const photoBusy = uploadMutation.isPending || removeMutation.isPending;
  const saving = updateMutation.isPending;

return (
  <div className="modal-overlay" onClick={onClose}>
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-label="Edit profile"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="modal-header">
        <h2>Edit profile</h2>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          &times;
        </button>
      </div>

      {/* photo */}
      <div className="profile-avatar-editor">
        <div className="profile-avatar-small">
          <Avatar url={profile.avatarUrl} name={profile.fullName} />
        </div>

        <div className="profile-avatar-buttons">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          <button
            type="button"
            className="action-button action-small"
            disabled={photoBusy}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadMutation.isPending ? "Uploading..." : "Change photo"}
          </button>
          {profile.avatarUrl && (
            <button
              type="button"
              className="action-button action-small action-danger"
              disabled={photoBusy}
              onClick={() => removeMutation.mutate()}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* details */}
      <form className="session-form" onSubmit={handleSubmit}>
        <div className="form-half">
          <label className="auth-label" htmlFor="p-name">Name</label>
          <input id="p-name" className="auth-inputbox" type="text"
            value={name} onChange={(e) => setName(e.target.value)} disabled={saving} />
        </div>
        <div className="form-half">
          <label className="auth-label" htmlFor="p-surname">Surname</label>
          <input id="p-surname" className="auth-inputbox" type="text"
            value={surname} onChange={(e) => setSurname(e.target.value)} disabled={saving} />
        </div>

        <div className="form-half">
          <label className="auth-label" htmlFor="p-birth">Birth date</label>
          <input id="p-birth" className="auth-inputbox" type="date"
            value={birthDate} onChange={(e) => setBirthDate(e.target.value)} disabled={saving} />
        </div>
        <div className="form-half">
          <label className="auth-label" htmlFor="p-email">Email</label>
          <input id="p-email" className="auth-inputbox" type="email" value={user.email} disabled />
        </div>

        <div className="form-full">
          <label className="auth-label" htmlFor="p-bio">Bio</label>
          <textarea id="p-bio" className="auth-inputbox form-textarea"
            value={bio} onChange={(e) => setBio(e.target.value)} disabled={saving} />
        </div>

        <div className="form-full modal-actions">
          <button type="button" className="action-button" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="action-button" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  </div>
);
}

export default EditProfileModal;