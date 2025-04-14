import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db/mongodb";
import Blog, { BlogStatus } from "@/models/Blog";

// GET /api/blog/tags - Get all unique blog tags
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Aggregate to find unique tags with count of posts for each tag
    const tags = await Blog.aggregate([
      // Only include published posts for public view
      { $match: { status: BlogStatus.PUBLISHED } },
      // Unwind the tags array
      { $unwind: "$tags" },
      // Group by tag and count posts
      {
        $group: {
          _id: "$tags",
          count: { $sum: 1 },
        },
      },
      // Sort by count (descending) and then tag name
      { $sort: { count: -1, _id: 1 } },
      // Project to format the output
      {
        $project: {
          _id: 0,
          name: "$_id",
          count: 1,
        },
      },
    ]);

    return NextResponse.json({ tags });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch blog tags", details: error.message },
      { status: 500 }
    );
  }
}
