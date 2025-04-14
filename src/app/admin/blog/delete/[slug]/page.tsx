"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function DeleteBlogPage() {
  const router = useRouter();
  const params = useParams();
  const { slug } = params;
  const { data: session, status } = useSession();

  // States
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [blog, setBlog] = useState<any>(null);

  // Redirect to login if not authenticated
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  // Fetch blog post data
  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await fetch(`/api/blog/${slug}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch blog post");
        }

        setBlog(data.blog);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchBlog();
    }
  }, [slug]);

  // Handle delete
  const handleDelete = async () => {
    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/blog/${slug}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete blog post");
      }

      // Redirect to blog management page on success
      router.push("/admin/blog");
    } catch (err: any) {
      setError(err.message);
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Blog post not found
        </div>
        <Link
          href="/admin/blog"
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Back to Blog Management
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6 text-red-600">
            Delete Blog Post
          </h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete the following blog post? This
              action cannot be undone.
            </p>

            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h2 className="text-xl font-bold mb-2">{blog.title}</h2>
              <p className="text-gray-600 mb-2">
                <span className="font-medium">Slug:</span> {blog.slug}
              </p>
              <p className="text-gray-600 mb-2">
                <span className="font-medium">Category:</span> {blog.category}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Status:</span> {blog.status}
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Link
              href="/admin/blog"
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors ${
                isDeleting ? "opacity-75 cursor-not-allowed" : ""
              }`}
            >
              {isDeleting ? "Deleting..." : "Delete Blog Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
