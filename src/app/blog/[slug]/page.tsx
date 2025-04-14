import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import {
  FiClock,
  FiUser,
  FiTag,
  FiCalendar,
  FiEye,
  FiShare2,
} from "react-icons/fi";
import { BlogStatus } from "@/models/Blog";
import dbConnect from "@/lib/db/mongodb";
import ShareButtons from "@/components/blog/ShareButtons";
import RelatedPosts from "@/components/blog/RelatedPosts";
import { getCurrentUser } from "@/lib/getCurrentUser";

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { slug } = params;

  // Connect to database
  await dbConnect();

  // Get the Blog model
  const { default: Blog } = await import("@/models/Blog");

  // Fetch blog post
  const blog = await Blog.findOne({ slug }).lean();

  if (!blog) {
    return {
      title: "Blog Post Not Found - AIMatchmaking",
    };
  }

  return {
    title: `${blog.title} - AIMatchmaking Blog`,
    description: blog.excerpt,
    openGraph: {
      title: `${blog.title} - AIMatchmaking Blog`,
      description: blog.excerpt,
      url: `/blog/${blog.slug}`,
      type: "article",
      publishedTime: blog.publishedDate?.toISOString() || undefined,
      authors: [blog.author],
      tags: blog.tags,
      images: [
        {
          url: blog.featuredImage,
          alt: blog.title,
        },
      ],
    },
  };
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

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const user = await getCurrentUser();

  // Connect to database
  await dbConnect();

  // Get the Blog model
  const { default: Blog } = await import("@/models/Blog");

  // Fetch blog post
  const blog = await Blog.findOne({ slug }).lean();

  if (!blog) {
    notFound();
  }

  // Check if draft post is being accessed by non-admin
  if (blog.status === BlogStatus.DRAFT && (!user || !user.isAdmin)) {
    notFound();
  }

  // Fetch related posts (same category or tags)
  const relatedPosts = await Blog.find({
    $and: [
      { _id: { $ne: blog._id } }, // Not the current post
      { status: BlogStatus.PUBLISHED }, // Only published posts
      {
        $or: [{ category: blog.category }, { tags: { $in: blog.tags } }],
      },
    ],
  })
    .sort({ publishedDate: -1 })
    .limit(3)
    .lean();

  // Canonical URL for sharing
  const canonicalUrl = `${
    process.env.NEXT_PUBLIC_SITE_URL || "https://aimatchmaking.com"
  }/blog/${slug}`;

  return (
    <div className="bg-gray-50 min-h-screen pb-16">
      {blog.status === BlogStatus.DRAFT && (
        <div className="bg-yellow-100 p-2 text-center text-yellow-800">
          This post is currently in draft mode and is only visible to admins.
        </div>
      )}

      {/* Featured Image */}
      <div className="relative h-72 md:h-96 w-full">
        <Image
          src={blog.featuredImage}
          alt={blog.title}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40" />

        {/* Category Badge */}
        <div className="absolute top-6 left-6">
          <Link
            href={`/blog?category=${encodeURIComponent(blog.category)}`}
            className="bg-purple-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-purple-700 transition-colors"
          >
            {blog.category}
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto bg-white -mt-16 relative rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 md:px-10 py-8 md:py-12">
            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {blog.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-4 text-gray-600 mb-8">
              <div className="flex items-center">
                <FiUser className="mr-2" />
                <span>{blog.author}</span>
              </div>
              <div className="flex items-center">
                <FiCalendar className="mr-2" />
                <span>{formatDate(blog.publishedDate)}</span>
              </div>
              <div className="flex items-center">
                <FiEye className="mr-2" />
                <span>{blog.views} views</span>
              </div>
            </div>

            {/* Tags */}
            {blog.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                <FiTag className="mt-1 text-gray-500" />
                {blog.tags.map((tag: string) => (
                  <Link
                    key={tag}
                    href={`/blog?tag=${encodeURIComponent(tag)}`}
                    className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}

            {/* Share */}
            <div className="border-t border-b border-gray-200 py-4 my-8">
              <div className="flex items-center">
                <span className="mr-4 flex items-center text-gray-700">
                  <FiShare2 className="mr-2" /> Share this article:
                </span>
                <ShareButtons url={canonicalUrl} title={blog.title} />
              </div>
            </div>

            {/* Content */}
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />

            {/* Author Info */}
            <div className="mt-12 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-xl font-bold mb-2">About the Author</h3>
              <p className="text-gray-700">
                {blog.author} is a contributor to the AIMatchmaking blog,
                sharing insights about relationships and matchmaking.
              </p>
            </div>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
                <RelatedPosts posts={relatedPosts} />
              </div>
            )}

            {/* Back to Blog */}
            <div className="mt-12 text-center">
              <Link
                href="/blog"
                className="inline-block bg-purple-600 text-white px-6 py-3 rounded-md shadow hover:bg-purple-700 transition-colors"
              >
                Back to Blog
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
