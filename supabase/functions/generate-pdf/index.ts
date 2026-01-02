/**
 * Supabase Edge Function: PDF Generation
 * Phase 4: The Publisher - Real print-ready PDF generation
 *
 * Uses pdf-lib for Node.js-based PDF creation
 * Generates:
 * 1. interior.pdf - Full-color pages with images and text
 * 2. cover_foil_mask.pdf - Vector black for gold foil stamping (Heirloom only)
 *
 * Deploy: supabase functions deploy generate-pdf
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface GeneratePDFRequest {
  bookId: string;
  title: string;
  childName: string;
  tier: "standard" | "premium" | "heirloom";
  pages: Array<{
    text: string;
    imageUrl: string;
  }>;
}

// Book specifications (8.5" x 8.5" at 300dpi)
const BOOK_SPECS = {
  width: 2550, // 8.5" * 300dpi
  height: 2550, // 8.5" * 300dpi
  bleed: 38, // 0.125" * 300dpi
  margin: 150, // 0.5" * 300dpi
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: GeneratePDFRequest = await req.json();
    console.log(`📖 Generating PDF for "${body.title}"...`);

    // Generate interior PDF
    const interiorPdf = await generateInteriorPDF(body);

    // Upload to Supabase Storage
    const interiorPath = `books/${body.bookId}/interior.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("book-pdfs")
      .upload(interiorPath, interiorPdf, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload interior PDF: ${uploadError.message}`);
    }

    // Get signed URL for interior
    const { data: interiorUrl } = await supabase.storage
      .from("book-pdfs")
      .createSignedUrl(interiorPath, 3600 * 24); // 24 hour expiry

    let foilMaskUrl = null;

    // Generate foil mask for Heirloom tier
    if (body.tier === "heirloom") {
      const foilMaskPdf = await generateFoilMaskPDF(body);
      const foilPath = `books/${body.bookId}/foil_mask.pdf`;

      await supabase.storage.from("book-pdfs").upload(foilPath, foilMaskPdf, {
        contentType: "application/pdf",
        upsert: true,
      });

      const { data: foilUrl } = await supabase.storage
        .from("book-pdfs")
        .createSignedUrl(foilPath, 3600 * 24);

      foilMaskUrl = foilUrl?.signedUrl;
    }

    // Update book record with PDF URLs
    await supabase
      .from("books")
      .update({
        pdf_interior_url: interiorUrl?.signedUrl,
        pdf_foil_mask_url: foilMaskUrl,
        pdf_generated_at: new Date().toISOString(),
      })
      .eq("id", body.bookId);

    console.log("✅ PDF generation complete!");

    return new Response(
      JSON.stringify({
        success: true,
        interiorUrl: interiorUrl?.signedUrl,
        foilMaskUrl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("PDF generation failed:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

/**
 * Generate the interior PDF with all story pages
 */
async function generateInteriorPDF(
  data: GeneratePDFRequest
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // Title page
  const titlePage = pdfDoc.addPage([BOOK_SPECS.width, BOOK_SPECS.height]);
  titlePage.drawText(data.title, {
    x: BOOK_SPECS.width / 2 - 200,
    y: BOOK_SPECS.height / 2 + 100,
    size: 72,
    font: boldFont,
    color: rgb(0.05, 0.15, 0.1),
  });
  titlePage.drawText(`A story for ${data.childName}`, {
    x: BOOK_SPECS.width / 2 - 150,
    y: BOOK_SPECS.height / 2 - 50,
    size: 36,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });

  // Story pages
  for (let i = 0; i < data.pages.length; i++) {
    const page = data.pages[i];
    const pdfPage = pdfDoc.addPage([BOOK_SPECS.width, BOOK_SPECS.height]);

    // Try to embed image
    try {
      const imageResponse = await fetch(page.imageUrl);
      const imageBytes = await imageResponse.arrayBuffer();

      let image;
      if (page.imageUrl.includes(".png")) {
        image = await pdfDoc.embedPng(imageBytes);
      } else {
        image = await pdfDoc.embedJpg(imageBytes);
      }

      // Draw image (centered, taking up 60% of page)
      const imageWidth = BOOK_SPECS.width * 0.7;
      const imageHeight = imageWidth; // Square images
      pdfPage.drawImage(image, {
        x: (BOOK_SPECS.width - imageWidth) / 2,
        y: BOOK_SPECS.height - BOOK_SPECS.margin - imageHeight,
        width: imageWidth,
        height: imageHeight,
      });
    } catch (error) {
      console.warn(`Failed to embed image for page ${i + 1}:`, error);
      // Draw placeholder
      pdfPage.drawRectangle({
        x: BOOK_SPECS.margin,
        y: BOOK_SPECS.height - BOOK_SPECS.margin - BOOK_SPECS.width * 0.6,
        width: BOOK_SPECS.width * 0.7,
        height: BOOK_SPECS.width * 0.7,
        color: rgb(0.95, 0.95, 0.95),
      });
    }

    // Draw text below image
    const textY = BOOK_SPECS.margin + 200;
    const lines = wrapText(page.text, 50);

    lines.forEach((line, lineIndex) => {
      pdfPage.drawText(line, {
        x: BOOK_SPECS.margin + 50,
        y: textY - lineIndex * 40,
        size: 28,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
    });

    // Page number
    pdfPage.drawText(`${i + 1}`, {
      x: BOOK_SPECS.width / 2,
      y: BOOK_SPECS.margin / 2,
      size: 18,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }

  // End page
  const endPage = pdfDoc.addPage([BOOK_SPECS.width, BOOK_SPECS.height]);
  endPage.drawText("The End", {
    x: BOOK_SPECS.width / 2 - 100,
    y: BOOK_SPECS.height / 2,
    size: 64,
    font: boldFont,
    color: rgb(0.05, 0.15, 0.1),
  });
  endPage.drawText("Made with ♥ by Our Story Books", {
    x: BOOK_SPECS.width / 2 - 180,
    y: BOOK_SPECS.margin,
    size: 24,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  return pdfDoc.save();
}

/**
 * Generate the foil mask PDF for gold stamping
 * Black areas = where foil will be applied
 */
async function generateFoilMaskPDF(
  data: GeneratePDFRequest
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  // Cover dimensions (front + spine + back)
  const spineWidth = 75; // ~0.25" spine
  const coverWidth = BOOK_SPECS.width * 2 + spineWidth;
  const coverHeight = BOOK_SPECS.height;

  const coverPage = pdfDoc.addPage([coverWidth, coverHeight]);

  // Black = 100% K for foil mask
  const black = rgb(0, 0, 0);

  // Title on front cover (right side)
  const frontCoverX = coverWidth / 2 + spineWidth / 2;
  coverPage.drawText(data.title, {
    x: frontCoverX - 200,
    y: coverHeight / 2 + 200,
    size: 72,
    font: boldFont,
    color: black,
  });

  // Decorative border on front
  const borderInset = 100;
  const borderWidth = 10;

  // Top border
  coverPage.drawRectangle({
    x: frontCoverX - BOOK_SPECS.width / 2 + borderInset,
    y: coverHeight - borderInset - borderWidth,
    width: BOOK_SPECS.width - borderInset * 2,
    height: borderWidth,
    color: black,
  });

  // Bottom border
  coverPage.drawRectangle({
    x: frontCoverX - BOOK_SPECS.width / 2 + borderInset,
    y: borderInset,
    width: BOOK_SPECS.width - borderInset * 2,
    height: borderWidth,
    color: black,
  });

  // Left border
  coverPage.drawRectangle({
    x: frontCoverX - BOOK_SPECS.width / 2 + borderInset,
    y: borderInset,
    width: borderWidth,
    height: coverHeight - borderInset * 2,
    color: black,
  });

  // Right border
  coverPage.drawRectangle({
    x: frontCoverX + BOOK_SPECS.width / 2 - borderInset - borderWidth,
    y: borderInset,
    width: borderWidth,
    height: coverHeight - borderInset * 2,
    color: black,
  });

  // Spine title
  coverPage.drawText(data.title, {
    x: coverWidth / 2 - 50,
    y: coverHeight / 2,
    size: 24,
    font: boldFont,
    color: black,
    rotate: { angle: 90, type: 0 },
  });

  return pdfDoc.save();
}

/**
 * Wrap text to fit within a character limit per line
 */
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + word).length <= maxChars) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}
