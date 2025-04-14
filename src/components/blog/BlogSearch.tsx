"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FiSearch } from "react-icons/fi";

interface BlogSearchProps {
  initialQuery?: string;
}

export default function BlogSearch({ initialQuery = "" }: BlogSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/blog?search=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/blog");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search blog posts..."
        className="w-full py-3 px-5 pr-12 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900"
      />
      <button
        type="submit"
        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-purple-700"
        aria-label="Search"
      >
        <FiSearch size={20} />
      </button>
    </form>
  );
}
