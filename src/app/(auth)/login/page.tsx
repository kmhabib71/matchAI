"use client";
import { getSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";

// Define validation schema for login
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    // Check if user just registered
    const registered = searchParams.get("registered");
    if (registered === "true") {
      setSuccessMessage(
        "Registration successful! Please log in with your credentials."
      );
    }

    // Check for error message
    const errorMessage = searchParams.get("error");
    if (errorMessage) {
      setError(decodeURIComponent(errorMessage));
    }
  }, [searchParams]);

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      console.log("Attempting to sign in with:", data.email);
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      console.log("Sign in result:", result);

      if (result?.error) {
        console.log("NextAuth login failed, trying direct login API...");

        // Try direct login API as fallback
        const directLoginResponse = await fetch("/api/auth/direct-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: data.email,
            password: data.password,
          }),
        });

        const directLoginResult = await directLoginResponse.json();

        if (directLoginResponse.ok) {
          console.log("Direct login successful:", directLoginResult);
          // Store token in localStorage
          localStorage.setItem("authToken", directLoginResult.token);

          // Store user data in localStorage for immediate access
          localStorage.setItem("user", JSON.stringify(directLoginResult.user));

          // Add a small delay before redirecting
          setTimeout(() => {
            // Force a hard navigation to dashboard
            window.location.href = "/dashboard";
          }, 500);
          return;
        } else {
          // If direct login also fails, show error
          console.error("Direct login failed:", directLoginResult);
          setError(
            directLoginResult.error ||
              "Invalid email or password. Please check your credentials and try again."
          );
        }

        return;
      }

      // NextAuth login was successful
      console.log("NextAuth login successful");
      // Add a small delay before redirecting
      setTimeout(() => {
        // Force a hard navigation to dashboard
        window.location.href = "/dashboard";
      }, 500);
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };
  const handleSocialLogin = async (provider: string) => {
    setIsLoading(true);
    setError("");

    try {
      console.log(`Attempting ${provider} sign in/sign up`);

      const result = await signIn(provider, {
        redirect: true,
        callbackUrl: "/auth/social-sync",
      });

      if (result?.error) {
        console.error(`${provider} sign in error:`, result.error);
        setError(result.error);
        return;
      }

      // ✅ Retry logic to wait until session is populated
      let session = null;
      let retries = 5;
      while (!session && retries > 0) {
        session = await getSession();
        if (!session) {
          await new Promise((res) => setTimeout(res, 300));
          retries--;
        }
      }

      const email = session?.user?.email;
      if (!email) {
        throw new Error("Could not retrieve user email from session");
      }

      // 🔁 Call your social-token API to generate custom JWT
      const tokenRes = await fetch("/api/auth/social-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || !tokenData.token) {
        console.error("Failed to get auth token from server:", tokenData);
        setError(tokenData.error || "Authentication token error");
        return;
      }

      // Check if user has a subscription, if not create a free subscription
      const subscriptionRes = await fetch("/api/subscriptions/create-free", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenData.token}`,
        },
      });

      if (!subscriptionRes.ok) {
        console.warn(
          "Could not create free subscription, but continuing login"
        );
      }

      // 💾 Store token and user in localStorage
      localStorage.setItem("authToken", tokenData.token);
      localStorage.setItem("user", JSON.stringify(tokenData.user));

      console.log("Social login complete, token stored.");

      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 500);
    } catch (err: any) {
      console.error(`${provider} sign in/up error:`, err);
      setError(
        err.message || `An error occurred during ${provider} authentication`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link
              href="/register"
              className="font-medium text-purple-600 hover:text-purple-500"
            >
              create a new account
            </Link>
          </p>
          <p className="mt-2 text-center text-sm text-gray-500">
            Demo credentials: user@example.com / password
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4">
            <p className="text-green-700">{successMessage}</p>
          </div>
        )}

        {/* Google Sign In Button (Now as the first option) */}
        <div className="mt-8">
          <button
            onClick={() => handleSocialLogin("google")}
            disabled={isLoading}
            className="w-full flex justify-center items-center py-3 px-4 rounded-md shadow-sm text-sm font-medium transition-colors bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
          >
            <svg
              className="mr-2"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="24"
              viewBox="0 0 40 48"
              aria-hidden="true"
            >
              <path
                fill="#ffffff"
                d="M39.2 24.45c0-1.55-.16-3.04-.43-4.45H20v8h10.73c-.45 2.53-1.86 4.68-4 6.11v5.05h6.5c3.78-3.48 5.97-8.62 5.97-14.71z"
              ></path>
              <path
                fill="#ffffff"
                d="M20 44c5.4 0 9.92-1.79 13.24-4.84l-6.5-5.05C24.95 35.3 22.67 36 20 36c-5.19 0-9.59-3.51-11.15-8.23h-6.7v5.2C5.43 39.51 12.18 44 20 44z"
              ></path>
              <path
                fill="#ffffff"
                d="M8.85 27.77c-.4-1.19-.62-2.46-.62-3.77s.22-2.58.62-3.77v-5.2h-6.7C.78 17.73 0 20.77 0 24s.78 6.27 2.14 8.97l6.71-5.2z"
              ></path>
              <path
                fill="#ffffff"
                d="M20 12c2.93 0 5.55 1.01 7.62 2.98l5.76-5.76C29.92 5.98 25.39 4 20 4 12.18 4 5.43 8.49 2.14 15.03l6.7 5.2C10.41 15.51 14.81 12 20 12z"
              ></path>
            </svg>
            <span>{isLoading ? "Signing in..." : "Sign in with Google"}</span>
          </button>
          <p className="mt-2 text-center text-xs text-gray-500">
            New users will be prompted to complete their profile
          </p>
        </div>

        <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              Or sign in with email
            </span>
          </div>
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                type="email"
                {...register("email")}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center z-50 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPassword(!showPassword);
                  }}
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 text-gray-500"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5 text-gray-500"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-900"
              >
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-purple-600 hover:text-purple-500"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
