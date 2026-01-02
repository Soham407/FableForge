/**
 * Supabase Edge Function: Lemon Squeezy Webhook Handler
 * Phase 4: The Publisher - Handle payment confirmations
 *
 * Deploy to Supabase Edge Functions:
 * supabase functions deploy lemonsqueezy-webhook
 *
 * Configure webhook in Lemon Squeezy Dashboard:
 * Settings > Webhooks > Add Endpoint
 * URL: https://<project-ref>.supabase.co/functions/v1/lemonsqueezy-webhook
 * Events: order_created, order_refunded
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import {
  createHmac,
  timingSafeEqual,
} from "https://deno.land/std@0.177.0/node/crypto.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const WEBHOOK_SECRET = Deno.env.get("LEMONSQUEEZY_WEBHOOK_SECRET")!;

/**
 * Verify Lemon Squeezy webhook signature
 */
function verifySignature(payload: string, signature: string): boolean {
  try {
    const hmac = createHmac("sha256", WEBHOOK_SECRET);
    hmac.update(payload);
    const digest = hmac.digest("hex");

    const digestBuffer = Buffer.from(digest, "hex");
    const signatureBuffer = Buffer.from(signature, "hex");

    if (digestBuffer.length !== signatureBuffer.length) {
      return false;
    }

    return timingSafeEqual(digestBuffer, signatureBuffer);
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
  }
}

serve(async (req: Request) => {
  const signature = req.headers.get("x-signature");
  if (!signature) {
    return new Response("Missing signature", { status: 401 });
  }

  try {
    const payload = await req.text();

    // Verify webhook signature
    if (!verifySignature(payload, signature)) {
      console.error("Invalid webhook signature");
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(payload);
    const eventName = event.meta.event_name;
    const customData = event.meta.custom_data || {};

    console.log(`Received Lemon Squeezy event: ${eventName}`);

    switch (eventName) {
      case "order_created": {
        const { book_id: bookId, tier_id: tierId } = customData;
        const orderData = event.data.attributes;

        if (bookId) {
          console.log(`Payment completed for book: ${bookId}`);

          // Create/update order in database
          const { error: orderError } = await supabase.from("orders").upsert({
            book_id: bookId,
            tier: tierId,
            status: "processing",
            price: orderData.total / 100, // Convert cents to dollars
            lemonsqueezy_order_id: event.data.id,
            customer_email: orderData.user_email,
            created_at: new Date().toISOString(),
          });

          if (orderError) {
            console.error("Failed to create order:", orderError);
            return new Response(
              JSON.stringify({ error: "Failed to create order" }),
              { status: 500 }
            );
          }

          // Update book status
          const { error: bookError } = await supabase
            .from("books")
            .update({ status: "ordered" })
            .eq("id", bookId);

          if (bookError) {
            console.error("Failed to update book:", bookError);
            return new Response(
              JSON.stringify({ error: "Failed to update book status" }),
              { status: 500 }
            );
          }

          // TODO: Trigger PDF generation and print fulfillment
          // Call your PDF generator Edge Function here
        }
        break;
      }

      case "order_refunded": {
        const lsOrderId = event.data.id;
        console.log(`Order refunded: ${lsOrderId}`);

        // Update order status
        const { error } = await supabase
          .from("orders")
          .update({ status: "refunded" })
          .eq("lemonsqueezy_order_id", lsOrderId);

        if (error) {
          console.error("Failed to update refunded order:", error);
        }
        break;
      }

      case "subscription_created":
      case "subscription_updated":
      case "subscription_cancelled": {
        // Handle subscription events for future Memory Jar subscription feature
        console.log(`Subscription event: ${eventName}`);
        break;
      }

      default:
        console.log(`Unhandled event: ${eventName}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
    });
  }
});
