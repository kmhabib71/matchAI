import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import Blog, { BlogStatus } from "@/models/Blog";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@/models/User";

// GET /api/blog - Get all blog posts (public, but filtering based on status)
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const category = url.searchParams.get("category");
    const tag = url.searchParams.get("tag");
    const search = url.searchParams.get("search");
    const skip = (page - 1) * limit;

    await dbConnect();

    let query: any = { status: BlogStatus.PUBLISHED };

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by tag
    if (tag) {
      query.tags = { $in: [tag] };
    }

    // Search by title, content, or tags
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const totalBlogs = await Blog.countDocuments(query);
    const blogs = await Blog.find(query)
      .sort({ publishedDate: -1 })
      .skip(skip)
      .limit(limit)
      .select(
        "title slug excerpt category tags featuredImage publishedDate views"
      );

    return NextResponse.json({
      blogs,
      pagination: {
        total: totalBlogs,
        page,
        limit,
        pages: Math.ceil(totalBlogs / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch blog posts", details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/blog - Create a new blog post (admin only)
export async function POST(req: NextRequest) {
  try {
    console.log("POST /api/blog: Starting request processing");

    const session = await getServerSession(authOptions);
    console.log(
      "Session data:",
      session ? "Session found" : "No session found"
    );

    // Check if user is authenticated
    if (!session || !session.user) {
      console.log("Authentication failed: No valid session");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log(`Authenticated user: ${session.user.email}`);

    try {
      // Import User model to check admin status directly
      const { default: User } = await import("@/models/User");
      await dbConnect();
      console.log("Database connected successfully");

      // Find the user in the database
      const user = await User.findOne({ email: session.user.email });

      if (!user) {
        console.log(`User not found in database: ${session.user.email}`);
        return NextResponse.json(
          { error: "User not found in database" },
          { status: 404 }
        );
      }

      console.log(`User found: ${user._id}, roles: ${user.roles.join(", ")}`);

      // Check if user is admin
      if (!user.roles.includes(UserRole.ADMIN)) {
        console.log("User is not an admin");
        return NextResponse.json(
          { error: "Unauthorized. Admin access required." },
          { status: 403 }
        );
      }

      const body = await req.json();
      console.log("Request body parsed successfully");

      // Create new blog post
      console.log("Creating new blog post");
      const blog = new Blog({
        ...body,
        author: body.author || session.user.name || "Admin",
      });

      await blog.save();
      console.log(`Blog post saved successfully with ID: ${blog._id}`);

      return NextResponse.json({ blog }, { status: 201 });
    } catch (dbError: any) {
      console.error("Database operation error:", dbError);
      return NextResponse.json(
        {
          error: "Database operation failed",
          details: dbError.message,
          stack:
            process.env.NODE_ENV === "development" ? dbError.stack : undefined,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Unhandled error in POST /api/blog:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { error: "A blog post with this title already exists." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to create blog post",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
