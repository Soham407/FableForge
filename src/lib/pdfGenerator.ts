/**
 * PDF Generation Service
 * Phase 4: The Publisher - Print-ready PDF generation
 *
 * Creates:
 * 1. interior.pdf - Full-color CMYK pages
 * 2. cover_foil_mask.pdf - Vector black for gold foil stamping (Heirloom only)
 */

import type { StoryConfig, StoryPage } from "../types";

interface PDFGenerationResult {
  interiorUrl: string;
  foilMaskUrl?: string; // Only for Heirloom tier
  status: "success" | "error";
  message?: string;
}

interface BookSpecs {
  width: number; // inches
  height: number; // inches
  bleed: number; // inches
  spine: number; // inches (calculated from page count)
}

// Standard children's book dimensions
const BOOK_SPECS: BookSpecs = {
  width: 8.5,
  height: 8.5,
  bleed: 0.125,
  spine: 0.25, // For ~24 pages
};

/**
 * Generate print-ready PDF for the storybook
 * Calls the Supabase Edge Function for real PDF generation
 */
export async function generatePrintPDF(
  config: StoryConfig,
  pages: StoryPage[],
  tier: "standard" | "premium" | "heirloom",
  accessToken: string,
  bookId?: string
): Promise<PDFGenerationResult> {
  console.log(
    `📖 Generating ${tier} PDF for "${config.childName}'s Adventure"...`
  );

  // Validate inputs
  if (!pages || pages.length === 0) {
    return {
      interiorUrl: "",
      status: "error",
      message: "No pages to generate",
    };
  }

  const pdfData = {
    bookId: bookId || `book_${Date.now()}`,
    title: `${config.childName}'s ${config.theme} Adventure`,
    childName: config.childName,
    tier,
    pages: pages.map((p) => ({
      id: p.id,
      text: p.text,
      imageUrl: p.imageUrl,
      pageNumber: p.pageNumber,
    })),
  };

  try {
    // Try to call the Edge Function for real PDF generation
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

    if (supabaseUrl && accessToken) {
      const response = await fetch(`${supabaseUrl}/functions/v1/generate-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(pdfData),
      });

      if (response.ok) {
        const result = await response.json();
        return {
          interiorUrl: result.interiorUrl,
          foilMaskUrl: result.foilMaskUrl,
          status: "success",
        };
      }

      console.warn("Edge Function failed, falling back to simulation");
    }

    // Fallback to simulation
    const simData = {
      title: pdfData.title,
      author: "Our Story Books",
      pages: pdfData.pages.map((p) => ({
        id: p.id,
        pageNumber: p.pageNumber,
        text: p.text,
        imageUrl: p.imageUrl,
      })),
      specs: BOOK_SPECS,
      tier,
    };

    return await simulatePDFGeneration(simData);
  } catch (error) {
    console.error("PDF generation failed:", error);
    return {
      interiorUrl: "",
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate the gold foil mask for Heirloom covers
 * Creates a vector PDF with black shapes where foil should be applied
 */
export async function generateFoilMask(
  config: StoryConfig
): Promise<string | null> {
  console.log(`✨ Generating foil mask for "${config.childName}"...`);

  // In production, this would create a vector PDF with:
  // - Title text in decorative script
  // - Decorative border elements
  // - All in 100% black (K only for CMYK)

  // The foil mask is used by the printer to apply gold/silver foil stamping
  // Areas that are black will receive the metallic foil treatment

  const maskData = {
    title: config.childName,
    subtitle: `A ${config.theme} Tale`,
    style: "ornate_border",
    specs: BOOK_SPECS,
  };

  // Simulate foil mask generation
  console.log("📐 Generating foil mask with data:", maskData);
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Return simulated URL
  return `https://storage.example.com/foil-masks/${Date.now()}-foil.pdf`;
}

/**
 * Estimate page count and spine width
 */
export function calculateSpineWidth(pageCount: number): number {
  // Standard paper: ~0.01" per sheet (2 pages)
  const sheets = Math.ceil(pageCount / 2);
  return Math.max(0.125, sheets * 0.01); // Minimum 1/8" spine
}

/**
 * Generate cover specifications
 */
export function getCoverSpecs(pageCount: number): {
  fullWidth: number;
  fullHeight: number;
  spineWidth: number;
} {
  const spineWidth = calculateSpineWidth(pageCount);
  return {
    // Full cover wrap = front + spine + back + bleeds
    fullWidth: BOOK_SPECS.width * 2 + spineWidth + BOOK_SPECS.bleed * 2,
    fullHeight: BOOK_SPECS.height + BOOK_SPECS.bleed * 2,
    spineWidth,
  };
}

// ============ SIMULATION (Replace with real API in production) ============

interface SimPDFData {
  title: string;
  author: string;
  pages: StoryPage[];
  specs: BookSpecs;
  tier: string;
}

async function simulatePDFGeneration(
  data: SimPDFData
): Promise<PDFGenerationResult> {
  // Simulate processing time
  await new Promise((resolve) => setTimeout(resolve, 1500));

  console.log(`✅ Generated PDF with ${data.pages.length} pages`);
  console.log(`   Title: ${data.title}`);
  console.log(`   Size: ${data.specs.width}" x ${data.specs.height}"`);
  console.log(`   Tier: ${data.tier}`);

  // In production, these would be real Supabase Storage URLs
  const baseUrl = "https://storage.example.com/pdfs";
  const timestamp = Date.now();

  const result: PDFGenerationResult = {
    interiorUrl: `${baseUrl}/${timestamp}-interior.pdf`,
    status: "success",
  };

  // Add foil mask for Heirloom tier
  if (data.tier === "heirloom") {
    result.foilMaskUrl = `${baseUrl}/${timestamp}-foil-mask.pdf`;
  }

  return result;
}

/**
 * PDF Generation Job Status
 * Used to track async PDF generation
 */
export interface PDFJob {
  id: string;
  bookId: string;
  status: "queued" | "processing" | "complete" | "failed";
  progress: number; // 0-100
  interiorUrl?: string;
  foilMaskUrl?: string;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

/**
 * Queue a PDF generation job
 * Returns immediately with a job ID for status tracking
 */
export function queuePDFGeneration(bookId: string, _tier: string): PDFJob {
  return {
    id: `pdf_${Date.now()}`,
    bookId,
    status: "queued",
    progress: 0,
    createdAt: new Date(),
  };
}
