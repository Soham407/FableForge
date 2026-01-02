/**
 * Digital Twin Engine
 * Phase 3 Component: AI Image Generation using Fal.ai or RunPod
 * Uses Flux.1 for high-quality storybook illustrations
 */

const FAL_API_KEY = import.meta.env.VITE_FAL_API_KEY;

export interface ImageGenerationResult {
  imageUrl: string;
  seed?: number;
}

/**
 * generateStoryImage - Generates a storybook illustration from a prompt
 * Uses Fal.ai's Flux.1 model for high-quality results
 */
export async function generateStoryImage(
  prompt: string,
  style: string = "children's book illustration"
): Promise<ImageGenerationResult> {
  const fullPrompt = `${prompt}, ${style}, hand-painted oil illustration, whimsical, magical lighting, studio ghibli inspired, artstation, highly detailed, 8k`;

  if (!FAL_API_KEY) {
    console.warn("VITE_FAL_API_KEY missing. Falling back to placeholder.");
    return getPlaceholderImage(prompt);
  }

  try {
    // Fal.ai Flux.1 endpoint
    const response = await fetch("https://fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        image_size: "square_hd",
        num_inference_steps: 4,
        num_images: 1,
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
      };
    }

    throw new Error("No images returned from API");
  } catch (error) {
    console.error("Image generation failed:", error);
    return getPlaceholderImage(prompt);
  }
}

/**
 * generateStoryImages - Batch generate images for all pages
 */
export async function generateStoryImages(
  pages: { text: string; imagePrompt: string }[]
): Promise<string[]> {
  const imageUrls: string[] = [];

  for (const page of pages) {
    try {
      const result = await generateStoryImage(page.imagePrompt);
      imageUrls.push(result.imageUrl);
    } catch (error) {
      console.error(`Failed to generate image for: ${page.imagePrompt}`);
      imageUrls.push(getPlaceholderImage(page.imagePrompt).imageUrl);
    }
  }

  return imageUrls;
}

/**
 * getPlaceholderImage - Returns a themed placeholder when API is unavailable
 */
function getPlaceholderImage(prompt: string): ImageGenerationResult {
  // Use Unsplash for beautiful placeholders based on keywords
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
    imageUrl: `https://images.unsplash.com/${imageId}?w=800&h=800&fit=crop`,
  };
}
