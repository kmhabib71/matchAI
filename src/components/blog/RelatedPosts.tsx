import Link from "next/link";
import Image from "next/image";

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  featuredImage: string;
  category: string;
  publishedDate: string;
}

interface RelatedPostsProps {
  posts: BlogPost[];
}

// Helper to format date
function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function RelatedPosts({ posts }: RelatedPostsProps) {
  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {posts.map((post) => (
        <Link
          key={post._id.toString()}
          href={`/blog/${post.slug}`}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group"
        >
          <div className="h-40 relative">
            <Image
              src={post.featuredImage}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div className="p-4">
            <span className="text-purple-600 text-sm">{post.category}</span>
            <h3 className="text-lg font-semibold mt-1 mb-2 group-hover:text-purple-600 transition-colors">
              {post.title}
            </h3>
            <div className="text-gray-500 text-xs mb-2">
              {formatDate(post.publishedDate)}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
