import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISubscription extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  planId: string;
  status: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date | null;
  paymentMethod?: string;
  paymentId?: string;
  amount?: number;
  currency?: string;
  autoRenew?: boolean;
  matchesLimit: number;
  proposalsLimit: number;
  contactsLimit: number;
  chatsLimit: number;
  usedMatches: number;
  usedProposals: number;
  usedContacts: number;
  usedChats: number;
  mobileNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema: Schema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    planId: {
      type: String,
      required: true,
      enum: ["free", "premium_basic", "premium_plus"],
      default: "free",
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "cancelled", "expired", "pending", "failed"],
      default: "active",
    },
    currentPeriodStart: {
      type: Date,
      required: true,
      default: Date.now,
    },
    currentPeriodEnd: {
      type: Date,
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ["bKash", "Credit Card", "Debit Card"],
      default: "bKash",
    },
    paymentId: {
      type: String,
    },
    amount: {
      type: Number,
    },
    currency: {
      type: String,
      default: "BDT",
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    matchesLimit: {
      type: Number,
      default: 3, // Default for free plan
    },
    proposalsLimit: {
      type: Number,
      default: 3, // Default for free plan
    },
    contactsLimit: {
      type: Number,
      default: 3, // Default for free plan
    },
    chatsLimit: {
      type: Number,
      default: 3, // Default for free plan
    },
    usedMatches: {
      type: Number,
      default: 0,
    },
    usedProposals: {
      type: Number,
      default: 0,
    },
    usedContacts: {
      type: Number,
      default: 0,
    },
    usedChats: {
      type: Number,
      default: 0,
    },
    mobileNumber: {
      type: String,
    },
  },
  { timestamps: true }
);

// Create index for efficient querying
SubscriptionSchema.index({ userId: 1 });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ currentPeriodEnd: 1 }); // For finding expiring subscriptions

// Delete the model if it exists to prevent OverwriteModelError
const Subscription =
  (mongoose.models.Subscription as Model<ISubscription>) ||
  mongoose.model<ISubscription>("Subscription", SubscriptionSchema);

export default Subscription;
