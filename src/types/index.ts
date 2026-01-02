// App Route definitions (const object for erasableSyntaxOnly compatibility)
export const AppRoutes = {
  HOME: "/",
  PREVIEW: "/preview",
  DIRECTOR: "/director",
  EDITOR: "/editor",
  LOGIN: "/auth/login",
  SIGNUP: "/auth/signup",
  DASHBOARD: "/dashboard",
  MEMORY_JAR: "/memories",
  PHOTOGRAPHER_PORTAL: "/photographer",
  CHECKOUT: "/checkout",
  ORDER_SUCCESS: "/checkout/success",
  PROFILE: "/profile",
} as const;

export type AppRoutes = (typeof AppRoutes)[keyof typeof AppRoutes];

// Story Configuration for the Director flow
export interface StoryConfig {
  childName: string;
  gender: "boy" | "girl" | "neutral";
  theme: string;
  lesson: string;
}

// Uploaded image state
export interface UploadedImage {
  file: File;
  previewUrl: string;
}

// Theme options for story selection
export interface ThemeOption {
  id: string;
  title: string;
  description: string;
  icon: string;
}

// Lesson options for story morals
export interface LessonOption {
  id: string;
  title: string;
  description: string;
}

// Book model for dashboard/library
export interface Book {
  id: string;
  title: string;
  coverImage: string;
  status: "draft" | "generating" | "ready" | "ordered" | "shipped";
  createdAt: Date;
  lastEdited: Date;
  config?: StoryConfig;
}

// Page content for flipbook
export interface StoryPage {
  id: string;
  text: string;
  imageUrl: string;
  pageNumber: number;
}

// Order tiers from masterplan
export type BookTier = "standard" | "premium" | "heirloom";

export interface BookOrder {
  id: string;
  bookId: string;
  tier: BookTier;
  price: number;
  status: "pending" | "processing" | "printed" | "shipped" | "delivered";
  shippingAddress?: ShippingAddress;
}

export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// User profile
export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  createdAt: Date;
}

// Memory Jar (Phase 3)
export interface Memory {
  id: string;
  userId: string;
  imageUrl: string;
  caption?: string;
  month: number;
  year: number;
  prompt?: string;
  createdAt: Date;
}
