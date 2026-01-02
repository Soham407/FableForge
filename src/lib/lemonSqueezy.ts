/**
 * Lemon Squeezy Payment Integration
 * Phase 4: The Publisher - Payment processing via Merchant of Record
 *
 * Lemon Squeezy handles:
 * - Global payment collection
 * - Sales Tax / VAT compliance
 * - Apple Pay / Google Pay
 * - Fraud protection
 */

// Note: API Key is no longer used client-side for security.
// It is handled by the lemonsqueezy-service Edge Function.
const LEMON_SQUEEZY_STORE_ID = import.meta.env.VITE_LEMONSQUEEZY_STORE_ID;
import { supabase } from "./supabase";

/**
 * Product Variant IDs from your Lemon Squeezy dashboard
 * You'll need to create these products in your store and add the IDs here
 */
export const PRODUCT_VARIANTS = {
  standard: import.meta.env.VITE_LS_VARIANT_STANDARD || "demo_standard",
  premium: import.meta.env.VITE_LS_VARIANT_PREMIUM || "demo_premium",
  heirloom: import.meta.env.VITE_LS_VARIANT_HEIRLOOM || "demo_heirloom",
} as const;

// Pricing tiers for display (actual prices set in Lemon Squeezy dashboard)
export const PRICING_TIERS = {
  standard: {
    id: "standard",
    name: "Digital Edition",
    price: 4500, // $45.00 in cents (for display)
    description: "Instant digital download",
    features: [
      "High-resolution PDF",
      "Web flipbook access",
      "Printable at home",
    ],
  },
  premium: {
    id: "premium",
    name: "Hardcover Edition",
    price: 12000, // $120.00 in cents
    description: "Professional hardcover book",
    features: [
      "Everything in Digital",
      "Premium hardcover binding",
      "Archival-quality paper",
      "Free shipping",
    ],
  },
  heirloom: {
    id: "heirloom",
    name: "Heirloom Edition",
    price: 20000, // $200.00 in cents
    description: "Luxury collector's edition",
    features: [
      "Everything in Premium",
      "Leather binding",
      "Gold foil stamping",
      "Presentation box",
      "Certificate of authenticity",
    ],
  },
} as const;

export type TierId = keyof typeof PRICING_TIERS;

interface CreateCheckoutParams {
  bookId: string;
  tierId: TierId;
  customerEmail: string;
  customerName?: string;
  successUrl: string;
  cancelUrl?: string;
}

interface CheckoutResponse {
  checkoutUrl: string;
  orderId?: string;
  error?: boolean;
  message?: string;
}

/**
 * Create a Lemon Squeezy checkout session
 * Redirects user to hosted checkout page
 */
export async function createCheckout(
  params: CreateCheckoutParams
): Promise<CheckoutResponse> {
  const variantId = PRODUCT_VARIANTS[params.tierId];

  // Demo mode: simulate checkout when variant is demo
  if (variantId.startsWith("demo_")) {
    console.log("🧪 Demo Mode: Simulating Lemon Squeezy checkout");
    console.log(`   Product: ${PRICING_TIERS[params.tierId].name}`);
    console.log(`   Price: ${formatPrice(PRICING_TIERS[params.tierId].price)}`);

    // Simulate successful checkout redirect
    return {
      checkoutUrl: `${
        params.successUrl
      }?session_id=demo_${Date.now()}&book_id=${params.bookId}`,
      orderId: `demo_order_${Date.now()}`,
    };
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Authentication required");

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lemonsqueezy-service`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: "create-checkout",
          params: {
            ...params,
            variantId,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Lemon Squeezy service error:", error);
      throw new Error(error.error || "Failed to create checkout");
    }

    const result = await response.json();
    return {
      checkoutUrl: result.checkoutUrl,
      orderId: result.orderId,
    };
  } catch (error) {
    console.error("Checkout creation failed:", error);
    return {
      checkoutUrl: "",
      error: true,
      message:
        error instanceof Error
          ? error.message
          : "Checkout creation failed. Please try again later.",
    };
  }
}

// verifyWebhookSignature removed as it is dead client-side code.
// Webhook verification MUST occur server-side only.

export async function getOrder(orderId: string): Promise<unknown> {
  // Demo mode: simulate fallback
  if (PRODUCT_VARIANTS.standard.startsWith("demo_")) {
    console.log("🧪 Demo Mode: Cannot fetch order");
    return null;
  }

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Authentication required");

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/lemonsqueezy-service`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: "get-order",
          params: { orderId },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch order: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to get order:", error);
    return null;
  }
}

/**
 * Format price for display
 */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function isConfigured(): boolean {
  return !!(
    LEMON_SQUEEZY_STORE_ID && !PRODUCT_VARIANTS.standard.startsWith("demo_")
  );
}
