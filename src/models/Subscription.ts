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
      enum: ["free", "monthly", "yearly"],
      default: "free",
    },
    status: {
      type: String,
      required: true,
      enum: ["active", "cancelled", "expired", "failed"],
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
    },
    paymentId: {
      type: String,
    },
    amount: {
      type: Number,
    },
    currency: {
      type: String,
      default: "USD",
    },
    autoRenew: {
      type: Boolean,
      default: true,
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
