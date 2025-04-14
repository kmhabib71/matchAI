import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import Blog, { BlogStatus } from "@/models/Blog";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@/models/User";

// GET /api/blog/[slug] - Get a single blog post
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await dbConnect();
    const { slug } = params;

    const blog = await Blog.findOne({ slug });

    if (!blog) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    // If blog is in draft status, only allow admins to view it
    if (blog.status === BlogStatus.DRAFT) {
      const session = await getServerSession(authOptions);

      if (!session || !session.user) {
        return NextResponse.json(
          { error: "Authentication required to view draft posts" },
          { status: 401 }
        );
      }

      // Import User model to check admin status
      const { default: User } = await import("@/models/User");
      const user = await User.findOne({ email: session.user.email });

      if (!user || !user.roles.includes(UserRole.ADMIN)) {
        return NextResponse.json(
          { error: "Admin access required to view draft posts" },
          { status: 403 }
        );
      }
    } else {
      // Increment view count for published posts
      blog.views += 1;
      await blog.save();
    }

    return NextResponse.json({ blog });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch blog post", details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/blog/[slug] - Update a blog post (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Import User model to check admin status
    await dbConnect();
    const { default: User } = await import("@/models/User");
    const user = await User.findOne({ email: session.user.email });

    // Check if user is admin
    if (!user || !user.roles.includes(UserRole.ADMIN)) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const { slug } = params;
    const body = await req.json();

    // Find blog post
    const blog = await Blog.findOne({ slug });

    if (!blog) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    // Update blog post fields
    Object.keys(body).forEach((key) => {
      if (key !== "_id" && key !== "slug") {
        blog[key] = body[key];
      }
    });

    await blog.save();

    return NextResponse.json({ blog });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update blog post", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/blog/[slug] - Delete a blog post (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Import User model to check admin status
    await dbConnect();
    const { default: User } = await import("@/models/User");
    const user = await User.findOne({ email: session.user.email });

    // Check if user is admin
    if (!user || !user.roles.includes(UserRole.ADMIN)) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const { slug } = params;

    // Find and delete blog post
    const blog = await Blog.findOneAndDelete({ slug });

    if (!blog) {
      return NextResponse.json(
        { error: "Blog post not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Blog post deleted successfully" });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to delete blog post", details: error.message },
      { status: 500 }
    );
  }
}
