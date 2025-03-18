// Report status enum
export enum ReportStatus {
  PENDING = "pending",
  INVESTIGATING = "investigating",
  RESOLVED = "resolved",
  DISMISSED = "dismissed",
}

// Report reason enum
export enum ReportReason {
  INAPPROPRIATE_CONTENT = "inappropriate_content",
  HARASSMENT = "harassment",
  FAKE_PROFILE = "fake_profile",
  SCAM = "scam",
  UNDERAGE = "underage",
  OTHER = "other",
}

// Report severity enum
export enum ReportSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

// Only import mongoose on the server side
import mongoose, { Schema, Document, Model } from "mongoose";

// Interface for report document
export interface IReport extends Document {
  reporterId: mongoose.Types.ObjectId;
  reportedUserId: mongoose.Types.ObjectId;
  reason: ReportReason;
  description: string;
  evidence?: string[];
  status: ReportStatus;
  severity?: ReportSeverity;
  adminNotes?: string;
  actionTaken?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

// Only create the model on the server side
const ReportSchema = new Schema<IReport>(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportedUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      enum: Object.values(ReportReason),
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    evidence: {
      type: [String], // URLs to images or screenshots
    },
    status: {
      type: String,
      enum: Object.values(ReportStatus),
      default: ReportStatus.PENDING,
    },
    severity: {
      type: String,
      enum: Object.values(ReportSeverity),
      default: ReportSeverity.MEDIUM,
    },
    adminNotes: {
      type: String,
    },
    actionTaken: {
      type: String,
    },
    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Create indexes for faster lookups
ReportSchema.index({ reporterId: 1 });
ReportSchema.index({ reportedUserId: 1 });
ReportSchema.index({ status: 1 });
ReportSchema.index({ createdAt: 1 });

// Create model
const Report =
  mongoose.models?.Report || mongoose.model<IReport>("Report", ReportSchema);

export default Report;
