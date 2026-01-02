import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const LEMON_SQUEEZY_API_KEY = Deno.env.get("LEMONSQUEEZY_API_KEY");
const LEMON_SQUEEZY_STORE_ID = Deno.env.get("LEMONSQUEEZY_STORE_ID");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const API_BASE = "https://api.lemonsqueezy.com/v1";

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Authenticate user
    const authHeader = req.headers.get("Authorization")!;
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { action, params } = await req.json();

    if (!LEMON_SQUEEZY_API_KEY) {
      throw new Error("Missing LEMONSQUEEZY_API_KEY environment variable");
    }

    if (action === "create-checkout") {
      const {
        bookId,
        tierId,
        customerEmail,
        customerName,
        successUrl,
        variantId,
      } = params;

      const response = await fetch(`${API_BASE}/checkouts`, {
        method: "POST",
        headers: {
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
          Authorization: `Bearer ${LEMON_SQUEEZY_API_KEY}`,
        },
        body: JSON.stringify({
          data: {
            type: "checkouts",
            attributes: {
              checkout_data: {
                email: customerEmail,
                name: customerName || "",
                custom: {
                  book_id: bookId,
                  tier_id: tierId,
                },
              },
              checkout_options: {
                embed: false,
                media: true,
                button_color: "#059669",
              },
              product_options: {
                redirect_url: successUrl,
                receipt_link_url: successUrl,
              },
            },
            relationships: {
              store: {
                data: {
                  type: "stores",
                  id: LEMON_SQUEEZY_STORE_ID,
                },
              },
              variant: {
                data: {
                  type: "variants",
                  id: variantId,
                },
              },
            },
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Lemon Squeezy API error:", error);
        return new Response(
          JSON.stringify({ error: "Failed to create checkout" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: response.status,
          }
        );
      }

      const data = await response.json();
      return new Response(
        JSON.stringify({
          checkoutUrl: data.data.attributes.url,
          orderId: data.data.id,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (action === "get-order") {
      const { orderId } = params;
      const response = await fetch(`${API_BASE}/orders/${orderId}`, {
        headers: {
          Accept: "application/vnd.api+json",
          Authorization: `Bearer ${LEMON_SQUEEZY_API_KEY}`,
        },
      });

      if (!response.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to fetch order" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: response.status,
          }
        );
      }

      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  } catch (error) {
    console.error("Lemon Squeezy service error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
