"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminUsersPage() {
  const [userEmail, setUserEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const router = useRouter();

  // Fetch admin users on component mount
  useEffect(() => {
    const fetchAdminUsers = async () => {
      try {
        const response = await fetch("/api/users/admin");
        if (!response.ok) {
          throw new Error("Failed to fetch admin users");
        }
        const data = await response.json();
        setAdminUsers(data.users || []);
      } catch (error) {
        console.error("Error fetching admin users:", error);
      }
    };

    fetchAdminUsers();
  }, [status]); // Refetch when status changes (after adding/removing an admin)

  const handlePromoteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail.trim()) return;

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/users/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to promote user to admin");
      }

      setStatus("success");
      setMessage(
        data.message || "User has been promoted to admin successfully"
      );
      setUserEmail("");
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "An error occurred");
    }
  };

  const handleCreateFirstAdmin = async () => {
    if (!userEmail.trim()) return;

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/bootstrap-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create first admin");
      }

      setStatus("success");
      setMessage(data.message || "First admin created successfully");
      setUserEmail("");

      // Redirect after creating first admin
      setTimeout(() => {
        router.push("/admin");
      }, 2000);
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "An error occurred");
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (
      !confirm(
        `Are you sure you want to remove admin privileges from ${email}?`
      )
    ) {
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch("/api/users/admin", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove admin");
      }

      setStatus("success");
      setMessage(data.message || "Admin privileges removed successfully");
    } catch (error: any) {
      setStatus("error");
      setMessage(error.message || "An error occurred");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Manage Admin Users</h1>

      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Admin</h2>
        <form onSubmit={handlePromoteAdmin} className="mb-4">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="email"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              placeholder="Enter user email"
              className="flex-1 p-2 border rounded-md"
              required
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400"
            >
              {status === "loading" ? "Processing..." : "Promote to Admin"}
            </button>
            <button
              type="button"
              onClick={handleCreateFirstAdmin}
              disabled={status === "loading"}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              Create First Admin
            </button>
          </div>
        </form>

        {message && (
          <div
            className={`p-3 rounded-md ${
              status === "error"
                ? "bg-red-100 text-red-700"
                : "bg-green-100 text-green-700"
            }`}
          >
            {message}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Current Admin Users</h2>
        {adminUsers.length === 0 ? (
          <p className="text-gray-500">No admin users found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {adminUsers.map((user) => (
                  <tr key={user._id}>
                    <td className="px-4 py-2">{user.name}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleRemoveAdmin(user.email)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove Admin
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
