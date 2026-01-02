/**
 * Print Fulfillment Service
 * Phase 4: The Publisher - Integration with print-on-demand services
 *
 * Supports:
 * - Gelato API (Standard tier - global local printing)
 * - Bookvault API (Premium/Heirloom - UK-based specialty printing)
 */

import type { ShippingAddress, BookTier } from "../types";

// API Configuration (set in .env)
const GELATO_API_KEY = import.meta.env.VITE_GELATO_API_KEY;
const BOOKVAULT_API_KEY = import.meta.env.VITE_BOOKVAULT_API_KEY;

// Print provider endpoints
const GELATO_BASE_URL = "https://order.gelatoapis.com/v4";
const BOOKVAULT_BASE_URL = "https://api.bookvault.app/v1";

/**
 * Print Order Status
 */
export type PrintStatus =
  | "pending"
  | "submitted"
  | "printing"
  | "shipped"
  | "delivered"
  | "error";

/**
 * Print Order
 */
export interface PrintOrder {
  id: string;
  provider: "gelato" | "bookvault";
  externalOrderId?: string;
  status: PrintStatus;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: Date;
  shippingAddress: ShippingAddress;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Print Product Specifications
 */
interface PrintProduct {
  provider: "gelato" | "bookvault";
  productId: string;
  name: string;
  paperType: string;
  binding: string;
  finish?: string;
}

/**
 * Map our tiers to print provider products
 */
const PRINT_PRODUCTS: Record<BookTier, PrintProduct> = {
  standard: {
    provider: "gelato",
    productId: "photobook_hc_a4_pf_cl_120",
    name: "Standard Hardcover",
    paperType: "Premium Photo Paper",
    binding: "Perfect Bound",
  },
  premium: {
    provider: "bookvault",
    productId: "BV_PREMIUM_HC_8x8",
    name: "Premium Hardcover",
    paperType: "170gsm Silk Art",
    binding: "Case Bound",
    finish: "Matt Lamination",
  },
  heirloom: {
    provider: "bookvault",
    productId: "BV_HEIRLOOM_LEATHER_8x8",
    name: "Heirloom Leather Edition",
    paperType: "200gsm Mohawk Superfine",
    binding: "Leather Case Bound",
    finish: "Gold Foil Stamping",
  },
};

/**
 * Submit order to print provider
 */
export async function submitPrintOrder(
  bookId: string,
  tier: BookTier,
  pdfUrl: string,
  foilMaskUrl: string | undefined,
  shippingAddress: ShippingAddress
): Promise<PrintOrder> {
  const product = PRINT_PRODUCTS[tier];

  console.log(`🖨️ Submitting ${product.name} order to ${product.provider}...`);

  if (product.provider === "gelato") {
    return submitToGelato(bookId, product, pdfUrl, shippingAddress);
  } else {
    return submitToBookvault(
      bookId,
      product,
      pdfUrl,
      foilMaskUrl,
      shippingAddress
    );
  }
}

/**
 * Submit to Gelato (Standard tier)
 */
async function submitToGelato(
  bookId: string,
  product: PrintProduct,
  pdfUrl: string,
  shippingAddress: ShippingAddress
): Promise<PrintOrder> {
  const now = new Date();

  if (!GELATO_API_KEY) {
    console.log("🧪 Simulating Gelato order submission");
    return simulatePrintOrder(bookId, "gelato", shippingAddress);
  }

  try {
    const response = await fetch(`${GELATO_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": GELATO_API_KEY,
      },
      body: JSON.stringify({
        orderReferenceId: bookId,
        customerReferenceId: bookId,
        currency: "USD",
        items: [
          {
            itemReferenceId: `${bookId}_interior`,
            productUid: product.productId,
            files: [{ url: pdfUrl, type: "default" }],
            quantity: 1,
          },
        ],
        shippingAddress: {
          firstName: shippingAddress.name.split(" ")[0],
          lastName: shippingAddress.name.split(" ").slice(1).join(" ") || "",
          addressLine1: shippingAddress.line1,
          addressLine2: shippingAddress.line2 || "",
          city: shippingAddress.city,
          state: shippingAddress.state,
          postCode: shippingAddress.postalCode,
          country: shippingAddress.country,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gelato API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: `po_${Date.now()}`,
      provider: "gelato",
      externalOrderId: data.id,
      status: "submitted",
      shippingAddress,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    console.error("Gelato submission failed:", error);
    return simulatePrintOrder(bookId, "gelato", shippingAddress);
  }
}

/**
 * Submit to Bookvault (Premium/Heirloom tier)
 */
async function submitToBookvault(
  bookId: string,
  product: PrintProduct,
  pdfUrl: string,
  foilMaskUrl: string | undefined,
  shippingAddress: ShippingAddress
): Promise<PrintOrder> {
  const now = new Date();

  if (!BOOKVAULT_API_KEY) {
    console.log("🧪 Simulating Bookvault order submission");
    return simulatePrintOrder(bookId, "bookvault", shippingAddress);
  }

  try {
    const files = [{ url: pdfUrl, type: "interior" }];

    // Add foil mask for Heirloom edition
    if (foilMaskUrl && product.productId.includes("HEIRLOOM")) {
      files.push({ url: foilMaskUrl, type: "foil_mask" });
    }

    const response = await fetch(`${BOOKVAULT_BASE_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${BOOKVAULT_API_KEY}`,
      },
      body: JSON.stringify({
        reference: bookId,
        product: product.productId,
        files,
        quantity: 1,
        shipping: {
          name: shippingAddress.name,
          address1: shippingAddress.line1,
          address2: shippingAddress.line2 || "",
          city: shippingAddress.city,
          state: shippingAddress.state,
          postcode: shippingAddress.postalCode,
          country: shippingAddress.country,
        },
        options: product.finish ? { finish: product.finish } : undefined,
      }),
    });

    if (!response.ok) {
      throw new Error(`Bookvault API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: `po_${Date.now()}`,
      provider: "bookvault",
      externalOrderId: data.orderId,
      status: "submitted",
      shippingAddress,
      createdAt: now,
      updatedAt: now,
    };
  } catch (error) {
    console.error("Bookvault submission failed:", error);
    return simulatePrintOrder(bookId, "bookvault", shippingAddress);
  }
}

/**
 * Get order status from print provider
 */
export async function getPrintOrderStatus(
  order: PrintOrder
): Promise<PrintOrder> {
  if (!order.externalOrderId) {
    return order;
  }

  // In production, call the respective API to get status
  // For now, simulate status progression
  return order;
}

/**
 * Simulate print order for development
 */
function simulatePrintOrder(
  _bookId: string,
  provider: "gelato" | "bookvault",
  shippingAddress: ShippingAddress
): PrintOrder {
  const now = new Date();
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(
    estimatedDelivery.getDate() + (provider === "gelato" ? 7 : 14)
  );

  return {
    id: `po_sim_${Date.now()}`,
    provider,
    externalOrderId: `SIM_${Date.now()}`,
    status: "submitted",
    estimatedDelivery,
    shippingAddress,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Calculate shipping estimate
 */
export function getShippingEstimate(
  tier: BookTier,
  country: string
): { minDays: number; maxDays: number; cost: number } {
  const product = PRINT_PRODUCTS[tier];

  if (product.provider === "gelato") {
    // Gelato prints locally, faster shipping
    return country === "US"
      ? { minDays: 3, maxDays: 5, cost: 0 } // Free for US
      : { minDays: 5, maxDays: 10, cost: 15 };
  } else {
    // Bookvault ships from UK
    return country === "GB"
      ? { minDays: 3, maxDays: 5, cost: 0 }
      : { minDays: 7, maxDays: 14, cost: 0 }; // Free for premium tiers
  }
}
