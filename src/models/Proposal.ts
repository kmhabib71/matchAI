import mongoose, { Schema, Document } from "mongoose";

export interface IProposal extends Document {
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  message: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}

const ProposalSchema = new Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
ProposalSchema.index({ senderId: 1, receiverId: 1 });
ProposalSchema.index({ status: 1 });
ProposalSchema.index({ createdAt: -1 });

// Prevent duplicate proposals between the same users
ProposalSchema.index(
  { senderId: 1, receiverId: 1, status: "pending" },
  { unique: true }
);

export default mongoose.models.Proposal ||
  mongoose.model<IProposal>("Proposal", ProposalSchema);
