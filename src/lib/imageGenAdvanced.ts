/**
 * Digital Twin Engine - Advanced Version
 * Phase 5 Enhancement: High-fidelity identity preservation
 *
 * Supports:
 * - Flux.1 [schnell] for instant preview (fast, low cost)
 * - Flux.1 [dev] + PuLID for production (high fidelity identity)
 * - FaceDetailer for automatic eye/expression fixing
 */

const FAL_API_KEY = import.meta.env.VITE_FAL_API_KEY;

export interface ImageGenerationResult {
  imageUrl: string;
  seed?: number;
  model?: string;
}

export interface IdentityReference {
  imageUrl: string; // Reference photo of the child
  faceEmbedding?: number[]; // Pre-computed face embedding for consistency
}

export type ImageQuality = "preview" | "production" | "heirloom";

/**
 * Quality presets for different use cases
 */
const QUALITY_PRESETS = {
  preview: {
    model: "fal-ai/flux/schnell",
    steps: 4,
    size: "square_hd",
    description: "Fast preview (~2s)",
  },
  production: {
    model: "fal-ai/flux/dev",
    steps: 28,
    size: "square_hd",
    description: "High quality (~15s)",
  },
  heirloom: {
    model: "fal-ai/flux/dev",
    steps: 50,
    size: "square_hd",
    description: "Maximum quality (~30s)",
  },
} as const;

/**
 * Style presets for storybook illustrations
 */
const STYLE_PRESETS = {
  whimsical:
    "children's book illustration, hand-painted oil, whimsical, magical lighting, studio ghibli inspired, artstation, highly detailed",
  classic:
    "classic storybook illustration, golden age illustration style, detailed watercolor, warm lighting, nostalgic",
  modern:
    "modern children's book, clean vector style, vibrant colors, friendly characters, pixar-inspired",
  fairytale:
    "fairy tale illustration, dreamy atmosphere, soft pastels, magical sparkles, enchanted forest style",
} as const;

export type StylePreset = keyof typeof STYLE_PRESETS;

/**
 * Generate a storybook illustration with identity preservation
 * Uses PuLID for high-fidelity face consistency when reference is provided
 */
export async function generateStoryImageAdvanced(
  prompt: string,
  options: {
    quality?: ImageQuality;
    style?: StylePreset;
    identityRef?: IdentityReference;
    negativePrompt?: string;
    seed?: number;
  } = {}
): Promise<ImageGenerationResult> {
  const {
    quality = "preview",
    style = "whimsical",
    identityRef,
    negativePrompt = "blurry, bad anatomy, bad hands, missing fingers, extra fingers, disfigured, deformed",
    seed,
  } = options;

  const preset = QUALITY_PRESETS[quality];
  const stylePrompt = STYLE_PRESETS[style];
  const fullPrompt = `${prompt}, ${stylePrompt}, 8k resolution`;

  if (!FAL_API_KEY) {
    console.warn("VITE_FAL_API_KEY missing. Falling back to placeholder.");
    return getPlaceholderImage(prompt, quality);
  }

  try {
    // Use PuLID for identity preservation if reference provided
    if (identityRef && quality !== "preview") {
      return await generateWithPuLID(
        fullPrompt,
        identityRef,
        preset,
        negativePrompt,
        seed
      );
    }

    // Standard generation without identity preservation
    return await generateStandard(fullPrompt, preset, negativePrompt, seed);
  } catch (error) {
    console.error("Image generation failed:", error);
    return getPlaceholderImage(prompt, quality);
  }
}

/**
 * Generate with PuLID for identity preservation
 * Maintains consistent facial features across all story pages
 */
async function generateWithPuLID(
  prompt: string,
  identityRef: IdentityReference,
  preset: (typeof QUALITY_PRESETS)[ImageQuality],
  negativePrompt: string,
  seed?: number
): Promise<ImageGenerationResult> {
  console.log("🎭 Generating with PuLID identity preservation...");

  // Fal.ai PuLID endpoint for identity-aware generation
  const response = await fetch("https://fal.run/fal-ai/flux-pulid", {
    method: "POST",
    headers: {
      Authorization: `Key ${FAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      negative_prompt: negativePrompt,
      reference_image_url: identityRef.imageUrl,
      id_weight: 0.8, // How strongly to preserve identity (0-1)
      num_inference_steps: preset.steps,
      guidance_scale: 7.5,
      image_size: preset.size,
      num_images: 1,
      seed: seed || Math.floor(Math.random() * 1000000),
      enable_safety_checker: true,
    }),
  });

  if (!response.ok) {
    // Fallback to standard generation if PuLID fails
    console.warn("PuLID generation failed, falling back to standard");
    return generateStandard(prompt, preset, negativePrompt, seed);
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
 * Standard Flux generation without identity preservation
 */
async function generateStandard(
  prompt: string,
  preset: (typeof QUALITY_PRESETS)[ImageQuality],
  negativePrompt: string,
  seed?: number
): Promise<ImageGenerationResult> {
  const response = await fetch(`https://fal.run/${preset.model}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${FAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      negative_prompt: negativePrompt,
      image_size: preset.size,
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
 * Apply FaceDetailer to fix eyes and expressions
 * Uses face detection + inpainting for corrections
 */
export async function applyFaceDetailer(
  imageUrl: string,
  options: {
    fixEyes?: boolean;
    enhanceExpression?: boolean;
    denoiseStrength?: number;
  } = {}
): Promise<ImageGenerationResult> {
  const { fixEyes = true, denoiseStrength = 0.4 } = options;

  if (!FAL_API_KEY) {
    console.warn("VITE_FAL_API_KEY missing. Returning original image.");
    return { imageUrl };
  }

  console.log("👁️ Applying FaceDetailer corrections...");

  try {
    // Use Fal.ai's face enhancement endpoint
    const response = await fetch("https://fal.run/fal-ai/face-to-sticker", {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image_url: imageUrl,
        prompt: fixEyes ? "perfect eyes, clear expression, detailed face" : "",
        negative_prompt:
          "crossed eyes, lazy eye, blurry face, distorted features",
        strength: denoiseStrength,
      }),
    });

    if (!response.ok) {
      console.warn("FaceDetailer failed, returning original");
      return { imageUrl };
    }

    const data = await response.json();

    if (data.image) {
      return {
        imageUrl: data.image.url,
        model: "face-detailer",
      };
    }

    return { imageUrl };
  } catch (error) {
    console.error("FaceDetailer error:", error);
    return { imageUrl };
  }
}

/**
 * Generate all story images with consistent identity
 * Uses the same seed family for visual consistency
 */
export async function generateStoryImagesAdvanced(
  pages: { text: string; imagePrompt: string }[],
  options: {
    quality?: ImageQuality;
    style?: StylePreset;
    childPhotoUrl?: string;
    applyFaceDetailer?: boolean;
  } = {}
): Promise<ImageGenerationResult[]> {
  const {
    quality = "preview",
    style = "whimsical",
    childPhotoUrl,
    applyFaceDetailer: shouldApplyFaceDetailer = quality === "heirloom",
  } = options;

  const identityRef: IdentityReference | undefined = childPhotoUrl
    ? { imageUrl: childPhotoUrl }
    : undefined;

  // Use a base seed for consistency across all pages
  const baseSeed = Math.floor(Math.random() * 1000000);

  const results: ImageGenerationResult[] = [];

  for (let i = 0; i < pages.length; i++) {
    console.log(`🎨 Generating page ${i + 1}/${pages.length}...`);

    let result = await generateStoryImageAdvanced(pages[i].imagePrompt, {
      quality,
      style,
      identityRef,
      seed: baseSeed + i * 1000, // Related seeds for visual harmony
    });

    // Apply FaceDetailer for heirloom quality
    if (shouldApplyFaceDetailer && result.imageUrl) {
      result = await applyFaceDetailer(result.imageUrl);
    }

    results.push(result);
  }

  return results;
}

/**
 * Get placeholder image for demo/fallback
 */
function getPlaceholderImage(
  prompt: string,
  _quality: ImageQuality
): ImageGenerationResult {
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

// Re-export original function for backwards compatibility
export { generateStoryImageAdvanced as generateStoryImage };
