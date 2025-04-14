import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import BlogSearch from "@/components/blog/BlogSearch";
import BlogCategoriesSidebar from "@/components/blog/BlogCategoriesSidebar";
import BlogPagination from "@/components/blog/BlogPagination";
import { BlogStatus } from "@/models/Blog";
import dbConnect from "@/lib/db/mongodb";

// Define metadata for SEO
export const metadata: Metadata = {
  title: "Blog - AIMatchmaking",
  description:
    "Discover tips, advice, and success stories about matchmaking and relationships",
  openGraph: {
    title: "Blog - AIMatchmaking",
    description:
      "Discover tips, advice, and success stories about matchmaking and relationships",
    url: "/blog",
    type: "website",
  },
};

// Interface for blog post data
interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  featuredImage: string;
  publishedDate: string;
  views: number;
}

// Helper to format date
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: {
    page?: string;
    category?: string;
    tag?: string;
    search?: string;
  };
}) {
  // Extract query parameters
  const page = Number(searchParams.page) || 1;
  const category = searchParams.category || "";
  const tag = searchParams.tag || "";
  const search = searchParams.search || "";

  // Connect to database
  await dbConnect();

  // Get the Blog model
  const { default: Blog } = await import("@/models/Blog");

  // Build the query
  let query: any = { status: BlogStatus.PUBLISHED };

  if (category) {
    query.category = category;
  }

  if (tag) {
    query.tags = { $in: [tag] };
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
      { tags: { $in: [new RegExp(search, "i")] } },
    ];
  }

  // Get total count for pagination
  const totalBlogs = await Blog.countDocuments(query);
  const pageSize = 9;
  const totalPages = Math.ceil(totalBlogs / pageSize);

  // Fetch blog posts
  const blogs = await Blog.find(query)
    .sort({ publishedDate: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .lean();

  // Get categories for sidebar
  const categories = await Blog.aggregate([
    { $match: { status: BlogStatus.PUBLISHED } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  // Get popular tags
  const tags = await Blog.aggregate([
    { $match: { status: BlogStatus.PUBLISHED } },
    { $unwind: "$tags" },
    { $group: { _id: "$tags", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 15 },
  ]);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-purple-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            AIMatchmaking Blog
          </h1>
          <p className="text-xl max-w-2xl mx-auto">
            Discover tips, advice, and success stories to find your perfect
            match
          </p>

          {/* Search */}
          <div className="mt-8 max-w-md mx-auto">
            <BlogSearch initialQuery={search} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Blog Posts */}
          <div className="lg:w-3/4">
            {/* Current category or search heading */}
            {(category || tag || search) && (
              <div className="mb-8">
                {category && (
                  <h2 className="text-2xl font-bold mb-2">
                    Category: {category}
                  </h2>
                )}
                {tag && <h2 className="text-2xl font-bold mb-2">Tag: {tag}</h2>}
                {search && (
                  <h2 className="text-2xl font-bold mb-2">
                    Search results for: {search}
                  </h2>
                )}
                <Link
                  href="/blog"
                  className="text-purple-600 hover:text-purple-800"
                >
                  &larr; Back to all posts
                </Link>
              </div>
            )}

            {/* No results message */}
            {blogs.length === 0 && (
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold mb-4">No blog posts found</h2>
                <p className="text-gray-600 mb-6">
                  {search
                    ? `No results for "${search}"`
                    : category
                    ? `No posts in the "${category}" category`
                    : tag
                    ? `No posts with the "${tag}" tag`
                    : "There are no blog posts yet"}
                </p>
                <Link
                  href="/blog"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  View all posts
                </Link>
              </div>
            )}

            {/* Blog post grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog: BlogPost) => (
                <div
                  key={blog._id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <Link href={`/blog/${blog.slug}`}>
                    <div className="h-48 relative">
                      <Image
                        src={blog.featuredImage}
                        alt={blog.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  </Link>
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded">
                        {blog.category}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {formatDate(blog.publishedDate)}
                      </span>
                    </div>
                    <Link href={`/blog/${blog.slug}`}>
                      <h2 className="text-xl font-bold mb-2 hover:text-purple-600">
                        {blog.title}
                      </h2>
                    </Link>
                    <p className="text-gray-600 text-sm mb-4">{blog.excerpt}</p>
                    <div className="flex justify-between items-center">
                      <Link
                        href={`/blog/${blog.slug}`}
                        className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                      >
                        Read More →
                      </Link>
                      <span className="text-gray-500 text-xs">
                        {blog.views} views
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-10">
                <BlogPagination
                  currentPage={page}
                  totalPages={totalPages}
                  baseUrl={`/blog?${category ? `category=${category}&` : ""}${
                    tag ? `tag=${tag}&` : ""
                  }${search ? `search=${search}&` : ""}`}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <BlogCategoriesSidebar
                categories={categories}
                tags={tags}
                currentCategory={category}
                currentTag={tag}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
