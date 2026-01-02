/**
 * Narrative Director Engine
 * Phase 2 Component: Handles AI story generation using Anthropic's Claude
 */

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

export interface GeneratedStory {
  pages: {
    text: string;
    imagePrompt: string;
  }[];
}

/**
 * generateStoryScript - Generates a 6-page story script based on user config
 */
export async function generateStoryScript(config: {
  childName: string;
  gender: string;
  theme: string;
  lesson: string;
}): Promise<GeneratedStory> {
  if (!ANTHROPIC_API_KEY) {
    console.warn("VITE_ANTHROPIC_API_KEY missing. Falling back to simulation.");
    return simulateStoryGeneration(config);
  }

  // In production, this would call a secure Edge Function/Backend
  // to avoid exposing the API Key. For this local MVP, we use the key directly.
  try {
    const prompt = `Write a Children's story for a child named ${config.childName} (${config.gender}). 
    Theme: ${config.theme}. 
    Moral Lesson: ${config.lesson}. 
    
    Format the response as a JSON object with a "pages" array. Each page should have:
    1. "text": (2-3 sentences, whimsical and magical)
    2. "imagePrompt": (Detailed description for an AI image generator, style: hand-painted oil illustration, whimsical, high quality)
    
    The story should be exactly 6 pages. Return ONLY the JSON object.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "dangerously-allow-browser": "true", // Required for client-side demo
      },
      body: JSON.stringify({
        model: "claude-3-sonnet-20240229",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "API request failed");
    }

    const content = data.content?.[0]?.text;
    if (!content) {
      throw new Error("No content in API response");
    }

    try {
      return JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response as JSON:", content);
      return simulateStoryGeneration(config);
    }
  } catch (error) {
    console.error("AI Generation failed:", error);
    return simulateStoryGeneration(config);
  }
}

/**
 * simulateStoryGeneration - Fallback simulation for when API keys aren't available
 */
async function simulateStoryGeneration(config: {
  childName: string;
  theme: string;
}): Promise<GeneratedStory> {
  // Artificial delay to simulate "Thinking"
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const themeAdj =
    config.theme === "space"
      ? "starlit"
      : config.theme === "safari"
      ? "verdant"
      : "enchanted";

  return {
    pages: [
      {
        text: `Once upon a time, ${config.childName} looked up at the sky and saw a shimmering door made of light.`,
        imagePrompt: `A child looking at a magical glowing door in a ${themeAdj} setting.`,
      },
      {
        text: `With a deep breath and a brave heart, ${config.childName} stepped through into a world of pure wonder.`,
        imagePrompt: `A child stepping through a portal into a ${themeAdj} landscape.`,
      },
      {
        text: `In this place, the trees whispered secrets and the clouds tasted like sweet vanilla cream.`,
        imagePrompt: `Whimsical landscape with whispering trees and fluffy clouds.`,
      },
      {
        text: `But ${config.childName} soon met a tiny friend who needed help finding their way home.`,
        imagePrompt: `A child helping a small magical creature.`,
      },
      {
        text: `By working together, they discovered that even the smallest act of kindness can change the world.`,
        imagePrompt: `A child and a creature sharing a moment of friendship.`,
      },
      {
        text: `And so, ${config.childName} returned home, knowing that magic lives in every brave and kind heart.`,
        imagePrompt: `A child back at home, glowing with a soft magical light.`,
      },
    ],
  };
}
