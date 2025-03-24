import { getCurrentUser } from "@/lib/getCurrentUser";

export default async function DebugSessionPage() {
  const user = await getCurrentUser();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Session Debug</h1>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">User Session Info</h2>

        {user ? (
          <div className="space-y-4">
            <div>
              <span className="font-medium">Status:</span> Signed In
            </div>
            <div>
              <span className="font-medium">ID:</span> {user.id}
            </div>
            <div>
              <span className="font-medium">Name:</span> {user.name}
            </div>
            <div>
              <span className="font-medium">Email:</span> {user.email}
            </div>
            <div>
              <span className="font-medium">Admin Status:</span>{" "}
              {user.isAdmin ? (
                <span className="text-green-600 font-semibold">Admin ✓</span>
              ) : (
                <span className="text-red-600">Not Admin ✗</span>
              )}
            </div>
            <div>
              <span className="font-medium">Roles:</span>{" "}
              {user.roles?.length > 0 ? (
                <ul className="list-disc list-inside ml-2">
                  {user.roles.map((role, index) => (
                    <li key={index}>{role}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-gray-500">No roles</span>
              )}
            </div>
          </div>
        ) : (
          <div className="text-red-600">
            Not signed in or error retrieving session
          </div>
        )}

        <div className="mt-6 space-y-2">
          <p className="text-sm text-gray-600">
            If you see your admin role listed but your admin status is "Not
            Admin", there might be a role comparison issue.
          </p>
          <p className="text-sm text-gray-600">
            Check the console logs for detailed debugging information.
          </p>
          <div className="flex space-x-4 mt-4">
            <a
              href="/bootstrap-admin"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Go to Bootstrap Admin
            </a>
            <a
              href="/admin"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Try Admin Dashboard
            </a>
            <a
              href="/api/auth/signout"
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Sign Out
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
