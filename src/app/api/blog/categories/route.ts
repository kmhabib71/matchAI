import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import Blog, { BlogStatus } from "@/models/Blog";

// GET /api/blog/categories - Get all unique blog categories
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Aggregate to find unique categories with count of posts in each category
    const categories = await Blog.aggregate([
      // Only include published posts for public view
      { $match: { status: BlogStatus.PUBLISHED } },
      // Group by category and count posts
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
          // Get a sample post for each category to have a featured image
          sample: {
            $first: {
              title: "$title",
              slug: "$slug",
              featuredImage: "$featuredImage",
            },
          },
        },
      },
      // Sort by category name
      { $sort: { _id: 1 } },
      // Project to format the output
      {
        $project: {
          _id: 0,
          name: "$_id",
          count: 1,
          sample: 1,
        },
      },
    ]);

    return NextResponse.json({ categories });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch blog categories", details: error.message },
      { status: 500 }
    );
  }
}
