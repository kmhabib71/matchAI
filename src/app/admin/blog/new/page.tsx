"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
// Import only the BlogStatus enum, not the entire model
import { BlogStatus } from "@/models/Blog";

// Import Tiptap editor without SSR
const Editor = dynamic(() => import("@/components/blog/Editor"), {
  ssr: false,
});

// Common blog categories for matchmaking website
const CATEGORIES = [
  "Dating Tips",
  "Relationship Advice",
  "Success Stories",
  "Platform Updates",
  "Matchmaking Insights",
  "Love & Psychology",
  "Communication Skills",
  "Self Improvement",
];

export default function NewBlogPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Redirect to login if not authenticated
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "",
    tags: "",
    featuredImage: "",
    status: BlogStatus.DRAFT,
  });

  // Loading and error states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Handle form field changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle content changes from the editor
  const handleContentChange = (content: string) => {
    setFormData((prev) => ({
      ...prev,
      content,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error("Title is required");
      }
      if (!formData.excerpt.trim()) {
        throw new Error("Excerpt is required");
      }
      if (!formData.content.trim()) {
        throw new Error("Content is required");
      }
      if (!formData.category.trim()) {
        throw new Error("Category is required");
      }
      if (!formData.featuredImage.trim()) {
        throw new Error("Featured image is required");
      }

      // Parse tags into an array
      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // Prepare data for submission
      const blogData = {
        ...formData,
        tags: tagsArray,
        // Generate a temporary slug to avoid unique constraints
        slug:
          formData.title
            .toLowerCase()
            .replace(/[^\w\s]/gi, "")
            .replace(/\s+/g, "-") +
          "-" +
          new Date().getTime(),
      };

      console.log("Submitting blog post:", { ...blogData, content: "..." });

      // Send data to API
      const response = await fetch("/api/blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(blogData),
      });

      // Parse response
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Failed to parse JSON response:", jsonError);
        throw new Error("Invalid response from server");
      }

      if (!response.ok) {
        console.error("API error:", data);
        throw new Error(
          data.error || data.details || "Failed to create blog post"
        );
      }

      // Redirect to blog management page on success
      router.push("/admin/blog");
    } catch (err: any) {
      console.error("Blog submission error:", err);
      setError(err.message || "An unknown error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Create New Blog Post</h1>
        <Link
          href="/admin/blog"
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Cancel
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="e.g., 10 Tips for a Successful Match"
          />
        </div>

        {/* Excerpt */}
        <div>
          <label
            htmlFor="excerpt"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Excerpt (max 160 characters)
          </label>
          <textarea
            id="excerpt"
            name="excerpt"
            value={formData.excerpt}
            onChange={handleChange}
            required
            maxLength={160}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Brief summary of your blog post for SEO and previews"
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.excerpt.length}/160 characters
          </p>
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Category
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label
            htmlFor="tags"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Tags (comma separated)
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="e.g., dating, relationships, love"
          />
        </div>

        {/* Featured Image */}
        <div>
          <label
            htmlFor="featuredImage"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Featured Image URL
          </label>
          <input
            type="url"
            id="featuredImage"
            name="featuredImage"
            value={formData.featuredImage}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="https://example.com/image.jpg"
          />
          {formData.featuredImage && (
            <div className="mt-2">
              <img
                src={formData.featuredImage}
                alt="Featured"
                className="h-24 w-auto object-cover rounded-md"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <div className="border border-gray-300 rounded-md">
            <Editor initialContent="" onChange={handleContentChange} />
          </div>
        </div>

        {/* Status */}
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value={BlogStatus.DRAFT}>Draft</option>
            <option value={BlogStatus.PUBLISHED}>Published</option>
          </select>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <Link
            href="/admin/blog"
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors ${
              isSubmitting ? "opacity-75 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? "Saving..." : "Save Blog Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
