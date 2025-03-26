"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SocialSyncPage() {
  const router = useRouter();

  useEffect(() => {
    const syncSocialToken = async () => {
      try {
        const res = await fetch("/api/auth/social-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // 👈 Ensure cookies are sent
          body: JSON.stringify({}),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to sync social token");
        }

        console.log("🔐 Social token cookie set");

        // Redirect based on profile completion
        if (data.user?.profileCompleted === false) {
          router.push("/profile");
        } else {
          router.push("/dashboard");
        }
      } catch (error: any) {
        console.error("Social sync error:", error);
        router.push(`/login?error=${encodeURIComponent(error.message)}`);
      }
    };

    syncSocialToken();
  }, [router]);

  return <p className="text-center mt-20">Syncing your account...</p>;
}
