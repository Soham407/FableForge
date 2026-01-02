/**
 * Supabase Edge Function: Generate Image
 * Phase 3: The Digital Twin Engine - Secure Fal.ai API access
 *
 * Supports:
 * - Flux.1 schnell for fast previews
 * - Flux.1 dev for high quality
 * - PuLID for identity preservation
 *
 * Deploy: supabase functions deploy generate-image
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const FAL_API_KEY = Deno.env.get("FAL_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface GenerateImageRequest {
  prompt: string;
  quality?: "preview" | "production" | "heirloom";
  style?: "whimsical" | "classic" | "modern" | "fairytale";
  identityImageUrl?: string; // For PuLID identity preservation
  seed?: number;
}

interface GeneratedImage {
  imageUrl: string;
  seed?: number;
  model: string;
}

// Quality presets
const QUALITY_PRESETS = {
  preview: { model: "fal-ai/flux/schnell", steps: 4 },
  production: { model: "fal-ai/flux/dev", steps: 28 },
  heirloom: { model: "fal-ai/flux/dev", steps: 50 },
};

// Style prompts
const STYLE_PROMPTS = {
  whimsical:
    "children's book illustration, hand-painted oil, whimsical, magical lighting, studio ghibli inspired, artstation, highly detailed",
  classic:
    "classic storybook illustration, golden age illustration style, detailed watercolor, warm lighting, nostalgic",
  modern:
    "modern children's book, clean vector style, vibrant colors, friendly characters, pixar-inspired",
  fairytale:
    "fairy tale illustration, dreamy atmosphere, soft pastels, magical sparkles, enchanted forest style",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await (async () => {
      const { createClient } = await import(
        "https://esm.sh/@supabase/supabase-js@2.39.0"
      );
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      return await supabase.auth.getUser();
    })();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const body: GenerateImageRequest = await req.json();
    const quality = body.quality || "preview";
    const style = body.style || "whimsical";
    const preset = QUALITY_PRESETS[quality];
    const stylePrompt = STYLE_PROMPTS[style];

    const fullPrompt = `${body.prompt}, ${stylePrompt}, 8k resolution`;
    const negativePrompt =
      "blurry, bad anatomy, bad hands, missing fingers, extra fingers, disfigured, deformed, ugly, duplicate";

    if (!FAL_API_KEY) {
      console.warn("FAL_API_KEY not configured, returning placeholder");
      return new Response(JSON.stringify(getPlaceholderImage(body.prompt)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log(
      `🎨 Generating ${quality} image for User ${user.id} with ${preset.model}...`
    );

    let result: GeneratedImage;

    // Use PuLID for identity preservation if reference image provided
    if (body.identityImageUrl && quality !== "preview") {
      result = await generateWithPuLID(
        fullPrompt,
        body.identityImageUrl,
        negativePrompt,
        body.seed
      );
    } else {
      result = await generateStandard(
        fullPrompt,
        preset,
        negativePrompt,
        body.seed
      );
    }

    console.log(`✅ Image generated successfully`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Image generation failed:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

/**
 * Standard Flux generation
 */
async function generateStandard(
  prompt: string,
  preset: { model: string; steps: number },
  negativePrompt: string,
  seed?: number
): Promise<GeneratedImage> {
  const response = await fetch(`https://fal.run/${preset.model}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${FAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      negative_prompt: negativePrompt,
      image_size: "square_hd",
      num_inference_steps: preset.steps,
      num_images: 1,
      seed: seed || Math.floor(Math.random() * 1000000),
      enable_safety_checker: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Fal.ai API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.images && data.images.length > 0) {
    return {
      imageUrl: data.images[0].url,
      seed: data.seed,
      model: preset.model,
    };
  }

  throw new Error("No images returned from API");
}

/**
 * Generate with PuLID for identity preservation
 */
async function generateWithPuLID(
  prompt: string,
  identityImageUrl: string,
  negativePrompt: string,
  seed?: number
): Promise<GeneratedImage> {
  console.log("🎭 Using PuLID for identity preservation...");

  const response = await fetch("https://fal.run/fal-ai/flux-pulid", {
    method: "POST",
    headers: {
      Authorization: `Key ${FAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      negative_prompt: negativePrompt,
      reference_image_url: identityImageUrl,
      id_weight: 0.8,
      num_inference_steps: 28,
      guidance_scale: 7.5,
      image_size: "square_hd",
      num_images: 1,
      seed: seed || Math.floor(Math.random() * 1000000),
      enable_safety_checker: true,
    }),
  });

  if (!response.ok) {
    // Fallback to standard generation
    console.warn("PuLID failed, falling back to standard generation");
    return generateStandard(
      prompt,
      QUALITY_PRESETS.production,
      negativePrompt,
      seed
    );
  }

  const data = await response.json();

  if (data.images && data.images.length > 0) {
    return {
      imageUrl: data.images[0].url,
      seed: data.seed,
      model: "flux-pulid",
    };
  }

  throw new Error("No images returned from PuLID API");
}

/**
 * Get placeholder image for demo mode
 */
function getPlaceholderImage(prompt: string): GeneratedImage {
  const keywords = prompt.toLowerCase();
  let imageId = "photo-1516627145497-ae6968895b74"; // Default magical

  if (keywords.includes("space") || keywords.includes("star")) {
    imageId = "photo-1462331940025-496dfbfc7564";
  } else if (keywords.includes("forest") || keywords.includes("tree")) {
    imageId = "photo-1448375240586-882707db888b";
  } else if (keywords.includes("castle") || keywords.includes("magic")) {
    imageId = "photo-1518709268805-4e9042af9f23";
  } else if (keywords.includes("ocean") || keywords.includes("sea")) {
    imageId = "photo-1507525428034-b723cf961d3e";
  } else if (keywords.includes("child") || keywords.includes("kid")) {
    imageId = "photo-1503454537195-1dcabb73ffb9";
  }

  return {
    imageUrl: `https://images.unsplash.com/${imageId}?w=1024&h=1024&fit=crop`,
    model: "placeholder",
  };
}
