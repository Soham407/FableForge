/**
 * Supabase Edge Function: Generate Story
 * Phase 2: The Luxury Upgrade - Secure Claude API access
 *
 * This keeps the Anthropic API key secure on the server side
 *
 * Deploy: supabase functions deploy generate-story
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface GenerateStoryRequest {
  childName: string;
  gender: string;
  theme: string;
  lesson: string;
  pageCount?: number;
}

interface StoryPage {
  text: string;
  imagePrompt: string;
}

interface GeneratedStory {
  pages: StoryPage[];
}

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

    const body: GenerateStoryRequest = await req.json();
    const pageCount = body.pageCount || 6;

    if (!ANTHROPIC_API_KEY) {
      console.warn("ANTHROPIC_API_KEY not configured, returning demo story");
      return new Response(
        JSON.stringify(generateDemoStory(body.childName, body.theme)),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    console.log(
      `📖 Generating story for ${body.childName} (User: ${user.id})...`
    );

    const prompt = `Write a children's story for a child named ${body.childName} (${body.gender}). 
Theme: ${body.theme}. 
Moral Lesson: ${body.lesson}. 

Format the response as a JSON object with a "pages" array. Each page should have:
1. "text": (2-3 sentences, whimsical and magical, age-appropriate for 3-8 year olds)
2. "imagePrompt": (Detailed description for an AI image generator, style: hand-painted oil illustration, whimsical, magical, studio ghibli inspired, children's book art)

The story should be exactly ${pageCount} pages. 
Make the child the hero of their own adventure.
Include sensory details and magical elements.
Return ONLY the JSON object, no other text.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 3000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Claude API request failed");
    }

    const content = data.content?.[0]?.text;
    if (!content) {
      throw new Error("No content in Claude response");
    }

    // Parse the JSON from Claude's response
    let story: GeneratedStory;
    try {
      // Try to extract JSON from the response (Claude sometimes wraps it)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        story = JSON.parse(jsonMatch[0]);
      } else {
        story = JSON.parse(content);
      }
    } catch {
      console.error("Failed to parse Claude response:", content);
      story = generateDemoStory(body.childName, body.theme);
    }

    console.log(`✅ Generated ${story.pages.length} pages`);

    return new Response(JSON.stringify(story), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Story generation failed:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

/**
 * Generate a demo story when API key is not configured
 */
function generateDemoStory(childName: string, theme: string): GeneratedStory {
  const themeAdj =
    theme === "space"
      ? "starlit"
      : theme === "safari"
      ? "verdant"
      : "enchanted";

  return {
    pages: [
      {
        text: `Once upon a time, ${childName} looked up at the sky and saw a shimmering door made of light.`,
        imagePrompt: `A young child with wonder in their eyes looking at a magical glowing doorway in the sky, ${themeAdj} setting, hand-painted oil illustration, whimsical, magical lighting, studio ghibli inspired`,
      },
      {
        text: `With a deep breath and a brave heart, ${childName} stepped through into a world of pure wonder.`,
        imagePrompt: `A child stepping through a magical portal into a ${themeAdj} landscape, swirling colors, hand-painted oil illustration, whimsical, magical lighting`,
      },
      {
        text: `In this place, the trees whispered secrets and the clouds tasted like sweet vanilla cream.`,
        imagePrompt: `Whimsical landscape with talking trees and fluffy cotton-candy clouds, magical forest, hand-painted oil illustration, dreamy atmosphere`,
      },
      {
        text: `But ${childName} soon met a tiny friend who needed help finding their way home.`,
        imagePrompt: `A child kneeling down to help a small magical creature, friendly expression, ${themeAdj} forest background, hand-painted oil illustration`,
      },
      {
        text: `By working together, they discovered that even the smallest act of kindness can change the world.`,
        imagePrompt: `A child and a small magical creature sharing a warm moment of friendship, golden light, hand-painted oil illustration, heartwarming scene`,
      },
      {
        text: `And so, ${childName} returned home, knowing that magic lives in every brave and kind heart.`,
        imagePrompt: `A child back at home, glowing with a soft magical light, peaceful bedroom, stars visible through window, hand-painted oil illustration`,
      },
    ],
  };
}
