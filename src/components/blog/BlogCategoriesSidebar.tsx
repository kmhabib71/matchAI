"use client";

import Link from "next/link";

interface Category {
  _id: string;
  count: number;
}

interface Tag {
  _id: string;
  count: number;
}

interface BlogCategoriesSidebarProps {
  categories: Category[];
  tags: Tag[];
  currentCategory?: string;
  currentTag?: string;
}

export default function BlogCategoriesSidebar({
  categories,
  tags,
  currentCategory,
  currentTag,
}: BlogCategoriesSidebarProps) {
  return (
    <div>
      <h3 className="text-lg font-bold mb-4">Categories</h3>
      <ul className="space-y-2 mb-8">
        {categories.map((category) => (
          <li key={category._id}>
            <Link
              href={`/blog?category=${encodeURIComponent(category._id)}`}
              className={`flex justify-between items-center hover:text-purple-600 ${
                currentCategory === category._id
                  ? "text-purple-600 font-medium"
                  : "text-gray-700"
              }`}
            >
              <span>{category._id}</span>
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                {category.count}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <h3 className="text-lg font-bold mb-4">Popular Tags</h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Link
            key={tag._id}
            href={`/blog?tag=${encodeURIComponent(tag._id)}`}
            className={`text-sm px-3 py-1 rounded-full ${
              currentTag === tag._id
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {tag._id} ({tag.count})
          </Link>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <Link
          href="/blog"
          className="text-purple-600 hover:text-purple-800 font-medium"
        >
          View All Blog Posts
        </Link>
      </div>
    </div>
  );
}
