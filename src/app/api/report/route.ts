import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db/mongodb";
import User, { UserRole } from "@/models/User";
import Report, {
  ReportReason,
  ReportStatus,
  ReportSeverity,
} from "@/models/Report";
import mongoose from "mongoose";

// GET handler to retrieve user's reports
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Get user from session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get reports submitted by the user
    const reports = await Report.find({ reporterId: user._id })
      .sort({ createdAt: -1 })
      .populate("reportedUserId", "name profileImage");

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Get reports error:", error);
    return NextResponse.json(
      { error: "Failed to get reports" },
      { status: 500 }
    );
  }
}

// POST handler to create a new report
export async function POST(req: NextRequest) {
  try {
    // Get the current user session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "You must be logged in to report a user" },
        { status: 401 }
      );
    }

    // Connect to the database
    await dbConnect();

    // Parse request body
    const body = await req.json();
    const { reportedUserId, reason, description, evidence } = body;

    // Validate required fields
    if (!reportedUserId || !reason || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create new report
    const report = new Report({
      reporterId: session.user.id,
      reportedUserId,
      reason,
      description,
      evidence: evidence || [],
      status: ReportStatus.PENDING,
      severity: ReportSeverity.MEDIUM,
    });

    // Save report to database
    await report.save();

    // Return success response
    return NextResponse.json(
      { message: "Report submitted successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error submitting report:", error);
    return NextResponse.json(
      { error: "Failed to submit report" },
      { status: 500 }
    );
  }
}

// PUT handler to update a report (for admins only)
export async function PUT(req: NextRequest) {
  try {
    await dbConnect();

    // Get user from session
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find user
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is an admin
    if (!user.roles || !user.roles.includes(UserRole.ADMIN)) {
      return NextResponse.json(
        { error: "Only admins can update reports" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { reportId, status, adminNotes, actionTaken } = body;

    // Validate required fields
    if (!reportId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find report
    const report = await Report.findById(reportId);

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Update report
    report.status = status;

    if (adminNotes) {
      report.adminNotes = adminNotes;
    }

    if (actionTaken) {
      report.actionTaken = actionTaken;
    }

    // If status is resolved or dismissed, set resolvedAt
    if (status === ReportStatus.RESOLVED || status === ReportStatus.DISMISSED) {
      report.resolvedAt = new Date();
    }

    await report.save();

    // Return success response
    return NextResponse.json({
      message: "Report updated successfully",
      reportId: report._id,
    });
  } catch (error) {
    console.error("Update report error:", error);
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    );
  }
}
