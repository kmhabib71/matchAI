import mongoose, { Document, Schema } from "mongoose";

export enum BlogStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
}

export interface IBlog extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  author: string;
  category: string;
  tags: string[];
  featuredImage: string;
  publishedDate: Date;
  status: BlogStatus;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    slug: {
      type: String,
      required: false,
      unique: true,
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    excerpt: {
      type: String,
      required: [true, "Excerpt is required"],
      maxlength: 160,
      trim: true,
    },
    author: {
      type: String,
      required: [true, "Author is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    featuredImage: {
      type: String,
      required: [true, "Featured image is required"],
    },
    publishedDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(BlogStatus),
      default: BlogStatus.DRAFT,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Generate slug from title
BlogSchema.pre<IBlog>("save", function (next) {
  if (this.isModified("title")) {
    const timestamp = new Date().getTime();
    this.slug = this.title
      ? this.title
          .toLowerCase()
          .replace(/[^\w\s]/gi, "")
          .replace(/\s+/g, "-")
      : `blog-${timestamp}`;
  }

  // Set published date when status changes to published
  if (
    this.isModified("status") &&
    this.status === BlogStatus.PUBLISHED &&
    !this.publishedDate
  ) {
    this.publishedDate = new Date();
  }

  next();
});

// Check if we're on the client side or server side
const isServer = typeof window === "undefined";

// Only create and export the model on the server side
const BlogModel = isServer
  ? mongoose.models.Blog || mongoose.model<IBlog>("Blog", BlogSchema)
  : null;

export default BlogModel;
