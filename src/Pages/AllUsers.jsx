import { useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "react-toastify";
import ConfirmModal from "../Components/ConfirmModal";
import { apiFetch, getTokenPayload, isAdmin } from "../Utils/Api";

const USERS_URL = "http://localhost:5083/api/Users";
const PAGE_SIZE = 10;

// the endpoint may return a plain array or a { resources } shape
function extractUsers(data) {
  if (Array.isArray(data)) return data;
  return (data?.resources ?? []).map((item) => item.resource ?? item);
}

function Users() {
  const queryClient = useQueryClient();

  const payload = getTokenPayload();
  const currentUserId =
    payload?.sub ??
    payload?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ??
    null;

  const admin = isAdmin();

  const [pageNumber, setPageNumber] = useState(1);
  const [userToDelete, setUserToDelete] = useState(null); // { id, name }

  // Fetch users
  const usersQuery = useQuery({
    queryKey: ["users", pageNumber],
    enabled: admin,
    placeholderData: keepPreviousData, // keeps the old page visible while the next loads
    queryFn: async () => {
      const response = await apiFetch(
        `${USERS_URL}?pageNumber=${pageNumber}&pageSize=${PAGE_SIZE}`
      );

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Session expired. Please log in again."
            : response.status === 403
            ? "You do not have permission to view users."
            : "Failed to fetch users."
        );
      }

      return response.json();
    },
  });

  // Delete user
  const deleteMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await apiFetch(`${USERS_URL}/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const text = await response.text();
        let message = `Failed to delete user (${response.status})`;

        try {
          const errorData = JSON.parse(text);
          message = errorData.message ?? errorData.title ?? message;
        } catch {}

        throw new Error(message);
      }
    },

    onSuccess: async () => {
      toast.success("User permanently deleted!");
      setUserToDelete(null);

      // if the deleted user was the only one on this page, go back one page
      const current = extractUsers(
        queryClient.getQueryData(["users", pageNumber])
      );
      if (current.length === 1 && pageNumber > 1) {
        setPageNumber((previous) => previous - 1);
      }

      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Admin-only page
  if (!admin) {
    return (
      <div>
        <h1 className="sessions-title">All users</h1>
        <p>Only administrators can access this page.</p>
      </div>
    );
  }

  if (usersQuery.isPending) {
    return <p>Loading users...</p>;
  }

  if (usersQuery.isError) {
    return (
      <div>
        <h1 className="sessions-title">All users</h1>
        <p>An error occurred: {usersQuery.error.message}</p>

        <button className="action-button" onClick={() => usersQuery.refetch()}>
          Try again
        </button>
      </div>
    );
  }

  // Handle API response
  const data = usersQuery.data;
  const users = extractUsers(data);

  // Support common pagination metadata
  const totalCount = data?.totalCount ?? data?.totalItems ?? data?.total ?? null;
  const totalPages =
    totalCount != null ? Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) : null;

  const getName = (user) =>
    `${user.name ?? ""} ${user.lastName ?? user.surname ?? ""}`.trim() ||
    user.userName ||
    user.email ||
    user.id;

  return (
    <div>
      <h1 className="sessions-title">All users</h1>

      <div className="games-card">
        {users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <div className="table-scroll">
            <table className="players-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => {
                  const isCurrentUser = String(user.id) === String(currentUserId);

                  return (
                    <tr key={user.id}>
                      <td>
                        {getName(user)}
                        {isCurrentUser && " (you)"}
                      </td>

                      <td>{user.email ?? user.userName}</td>

                      <td className="players-action">
                        {isCurrentUser ? (
                          <span>Current account</span>
                        ) : (
                          <button
                            className="action-button action-small action-danger"
                            disabled={deleteMutation.isPending}
                            onClick={() =>
                              setUserToDelete({
                                id: user.id,
                                name: getName(user),
                              })
                            }
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

{/* Pagination */}
<div className="pagination">
  <button
    type="button"
    className="action-button action-small"
    disabled={pageNumber === 1}
    onClick={() => setPageNumber((previous) => previous - 1)}
  >
    Previous
  </button>

  <span>
    Page {pageNumber}
    {totalPages !== null && ` of ${totalPages}`}
  </span>

  <button
    type="button"
    className="action-button action-small"
    disabled={
      users.length < PAGE_SIZE ||
      (totalPages !== null && pageNumber >= totalPages)
    }
    onClick={() => setPageNumber((previous) => previous + 1)}
  >
    Next
  </button>
</div>
      </div>

      {/* Delete confirmation */}
      {userToDelete && (
        <ConfirmModal
          title="Delete user"
          message={`Are you sure you want to permanently delete ${userToDelete.name}? This action cannot be undone.`}
          busy={deleteMutation.isPending}
          onCancel={() => setUserToDelete(null)}
          onConfirm={() => deleteMutation.mutate(userToDelete.id)}
        />
      )}
    </div>
  );
}

export default Users;