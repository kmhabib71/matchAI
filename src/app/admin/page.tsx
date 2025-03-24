import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/getCurrentUser";
import Link from "next/link";

export default async function AdminPage() {
  const user = await getCurrentUser();

  // Check if user is admin
  if (!user || !user.isAdmin) {
    // Redirect to the bootstrap admin page if there's no admin
    return redirect("/bootstrap-admin");
  }

  const adminModules = [
    {
      title: "Users Management",
      description:
        "Manage users, view profiles, and handle user-related actions",
      href: "/admin/users",
      icon: "👥",
    },
    {
      title: "Matches",
      description: "View and manage user matches, compatibility scores",
      href: "/admin/matches",
      icon: "❤️",
    },
    {
      title: "Analytics",
      description: "View platform analytics, usage statistics, and metrics",
      href: "/admin/analytics",
      icon: "📊",
    },
    {
      title: "Test Users",
      description: "Manage test users with personality quiz data",
      href: "/admin/users/test",
      icon: "🧪",
    },
    {
      title: "Admin Users",
      description: "Manage admin privileges and roles",
      href: "/admin/users/admins",
      icon: "🔑",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">
          Welcome, {user.name}! Manage your application from here.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminModules.map((module) => (
          <Link
            key={module.title}
            href={module.href}
            className="block p-6 bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-50 transition-colors"
          >
            <div className="text-4xl mb-3">{module.icon}</div>
            <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">
              {module.title}
            </h5>
            <p className="font-normal text-gray-700">{module.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
