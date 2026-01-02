import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Package,
  Mail,
  ArrowRight,
  Download,
  Loader2,
  Book,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import Button from "../components/ui/Button";
import GoldFoil from "../components/ui/GoldFoil";
import { AppRoutes } from "../types";
import { supabase } from "../lib/supabase";

interface OrderDetails {
  tier: string;
  bookTitle: string;
  status: string;
}

interface BookPage {
  text: string;
  imageUrl?: string;
}

interface BookData {
  title: string;
  childName: string;
  pages: BookPage[];
}

/**
 * OrderSuccessPage - Celebratory confirmation after successful purchase
 * Phase 4: Shows PDF download for digital tier, tracking for physical
 */
const OrderSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const bookId = searchParams.get("book_id");
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [bookData, setBookData] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!bookId) {
        setLoading(false);
        return;
      }

      try {
        const { data: book } = await supabase
          .from("books")
          .select("title, config, pages")
          .eq("id", bookId)
          .single();

        const { data: order } = await supabase
          .from("orders")
          .select("tier, status")
          .eq("book_id", bookId)
          .single();

        if (book && order) {
          setOrderDetails({
            tier: order.tier,
            bookTitle: book.title || `${book.config?.childName}'s Adventure`,
            status: order.status,
          });

          // Store book data for PDF generation
          setBookData({
            title: book.title || `${book.config?.childName}'s Adventure`,
            childName: book.config?.childName || "Your Child",
            pages: book.pages || [],
          });
        }
      } catch (error) {
        console.error("Failed to fetch order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [bookId]);

  /**
   * Generate and download PDF storybook
   * Creates an HTML document styled as a storybook and triggers download
   */
  const handleDownloadPDF = async () => {
    setPdfGenerating(true);
    setDownloadComplete(false);

    try {
      // Simulate processing time for UX
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Use actual book data or create demo content
      const title =
        bookData?.title || orderDetails?.bookTitle || "My Magical Storybook";
      const childName = bookData?.childName || "Little Explorer";
      const pages = bookData?.pages?.length
        ? bookData.pages
        : getDemoPages(childName);

      // Generate HTML content for the storybook
      const htmlContent = generateStorybookHTML(title, childName, pages);

      // Create a blob and download
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);

      // Open in new window for print-to-PDF
      const printWindow = window.open(url, "_blank");

      if (printWindow) {
        printWindow.onload = () => {
          // Add a small delay for images to load
          setTimeout(() => {
            printWindow.print();
          }, 1000);
        };
      } else {
        // Fallback: direct download as HTML
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}_Storybook.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      URL.revokeObjectURL(url);
      setDownloadComplete(true);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setPdfGenerating(false);
    }
  };

  /**
   * Generate demo pages when no book data is available
   */
  const getDemoPages = (childName: string): BookPage[] => [
    {
      text: `Once upon a time, in a land of wonder, lived a brave little explorer named ${childName}.`,
      imageUrl:
        "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=600",
    },
    {
      text: `${childName} looked up at the stars and whispered, "One day, I will touch the moon."`,
      imageUrl:
        "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=600",
    },
    {
      text: "With a shiny silver rocket ship, they zoomed past the fluffy white clouds.",
      imageUrl:
        "https://images.unsplash.com/photo-1454789548928-9efd52dc4031?w=600",
    },
    {
      text: "They met a friendly alien who taught them that kindness is the universal language.",
      imageUrl:
        "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600",
    },
    {
      text: `And so, ${childName} returned home, knowing that magic lives in every brave and kind heart. The End.`,
      imageUrl:
        "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=600",
    },
  ];

  /**
   * Escape HTML to prevent XSS
   */
  const escapeHtml = (text: string): string => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  };

  /**
   * Generate styled HTML document for the storybook
   */
  const generateStorybookHTML = (
    title: string,
    childName: string,
    pages: BookPage[]
  ): string => {
    const pageStyles = `
      @media print {
        .page { page-break-after: always; }
        .page:last-child { page-break-after: avoid; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: 'Georgia', serif; 
        background: #faf9f6;
        color: #1a2e1a;
      }
      .cover {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #1a3a2a 0%, #0d1f15 100%);
        color: white;
        text-align: center;
        padding: 40px;
      }
      .cover h1 {
        font-size: 3rem;
        color: #d4a857;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        margin-bottom: 20px;
      }
      .cover .subtitle {
        font-size: 1.5rem;
        color: #a8c4a8;
        font-style: italic;
      }
      .cover .ornament {
        font-size: 2rem;
        color: #d4a857;
        margin: 30px 0;
      }
      .page {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        padding: 60px;
        background: #fffef9;
      }
      .page-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 40px;
      }
      .page img {
        max-width: 70%;
        max-height: 50vh;
        border-radius: 20px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.15);
      }
      .page p {
        font-size: 1.5rem;
        line-height: 1.8;
        text-align: center;
        max-width: 600px;
        color: #2a4a3a;
      }
      .page-number {
        text-align: center;
        color: #888;
        font-size: 0.9rem;
        margin-top: auto;
      }
      .end-page {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #1a3a2a 0%, #0d1f15 100%);
        color: white;
        text-align: center;
      }
      .end-page h2 {
        font-size: 3rem;
        color: #d4a857;
        margin-bottom: 20px;
      }
      .end-page .credits {
        color: #a8c4a8;
        font-style: italic;
      }
    `;

    const pagesHTML = pages
      .map(
        (page, index) => `
      <div class="page">
        <div class="page-content">
          ${
            page.imageUrl
              ? `<img src="${page.imageUrl}" alt="Story illustration ${
                  index + 1
                }" crossorigin="anonymous" />`
              : ""
          }
          <p>${escapeHtml(page.text)}</p>
        </div>
        <div class="page-number">${index + 1}</div>
      </div>
    `
      )
      .join("");

    const escapedTitle = escapeHtml(title);
    const escapedChildName = escapeHtml(childName);

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapedTitle}</title>
        <style>${pageStyles}</style>
      </head>
      <body>
        <div class="cover page">
          <div class="ornament">✦ ✦ ✦</div>
          <h1>${escapedTitle}</h1>
          <div class="subtitle">A Magical Story for ${escapedChildName}</div>
          <div class="ornament">✦ ✦ ✦</div>
        </div>
        
        ${pagesHTML}
        
        <div class="end-page page">
          <h2>The End</h2>
          <p class="credits">Created with love by Our Story Books</p>
          <div class="ornament" style="color: #d4a857; margin-top: 30px;">✦ ✦ ✦</div>
        </div>
      </body>
      </html>
    `;
  };

  const isDigital = orderDetails?.tier === "standard";
  const isHeirloom = orderDetails?.tier === "heirloom";

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 to-emerald-900 flex items-center justify-center px-6 py-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-2xl w-full text-center relative"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-amber-500/30"
        >
          <CheckCircle
            size={48}
            className="text-emerald-950"
            strokeWidth={2.5}
          />
        </motion.div>

        {/* Title */}
        <GoldFoil className="text-4xl md:text-5xl font-serif mb-4 block">
          Order Confirmed!
        </GoldFoil>

        <p className="text-emerald-100/70 text-lg mb-12 max-w-md mx-auto leading-relaxed">
          {isDigital
            ? "Your digital storybook is ready! Download it below."
            : isHeirloom
            ? "Your heirloom is being hand-crafted with love and care at our London workshop."
            : "Your premium storybook is being prepared. A confirmation email has been sent."}
        </p>

        {/* Order Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 mb-12 border border-white/10"
        >
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={32} className="text-amber-400 animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Book Title */}
              {orderDetails && (
                <div className="text-center pb-6 border-b border-white/10">
                  <div className="flex items-center justify-center gap-3 text-amber-400 mb-2">
                    <Book size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">
                      Your Story
                    </span>
                  </div>
                  <p className="text-white font-serif text-2xl">
                    {orderDetails.bookTitle}
                  </p>
                  <span className="text-emerald-300 text-sm capitalize">
                    {orderDetails.tier} Edition
                  </span>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-8 text-left">
                <div>
                  <div className="flex items-center gap-3 text-amber-400 mb-2">
                    <Package size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">
                      {isDigital ? "Format" : "Estimated Delivery"}
                    </span>
                  </div>
                  <p className="text-white font-serif text-xl">
                    {isDigital
                      ? "High-Resolution PDF"
                      : isHeirloom
                      ? "10-14 Business Days"
                      : "7-10 Business Days"}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-3 text-amber-400 mb-2">
                    <Mail size={18} />
                    <span className="text-xs font-bold uppercase tracking-widest">
                      Confirmation Sent
                    </span>
                  </div>
                  <p className="text-white font-serif text-xl">
                    Check your inbox
                  </p>
                </div>
              </div>

              {/* Digital Download Button */}
              {isDigital && (
                <div className="pt-6 border-t border-white/10">
                  <Button
                    onClick={handleDownloadPDF}
                    isLoading={pdfGenerating}
                    icon={
                      downloadComplete ? (
                        <CheckCircle size={18} />
                      ) : (
                        <Download size={18} />
                      )
                    }
                    className={`w-full ${
                      downloadComplete
                        ? "bg-emerald-500 text-white hover:bg-emerald-600"
                        : "bg-white text-emerald-950 hover:bg-amber-100"
                    }`}
                  >
                    {pdfGenerating
                      ? "Generating PDF..."
                      : downloadComplete
                      ? "Download Complete! Click to Download Again"
                      : "Download Your Storybook"}
                  </Button>
                </div>
              )}

              {/* Tracking Info for Physical */}
              {!isDigital && (
                <div className="pt-6 border-t border-white/10">
                  <p className="text-emerald-200/60 text-sm">
                    📦 You'll receive a tracking number via email once your book
                    ships.
                    {isHeirloom && (
                      <span className="block mt-2 text-amber-300/80">
                        ✨ Heirloom editions include a certificate of
                        authenticity signed by our master craftsmen.
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to={AppRoutes.DASHBOARD}>
            <Button variant="secondary" className="px-8">
              View My Library
            </Button>
          </Link>
          <Link to={AppRoutes.HOME}>
            <Button
              variant="ghost"
              className="text-white hover:text-amber-400"
              icon={<ArrowRight size={18} />}
            >
              Create Another Story
            </Button>
          </Link>
        </div>

        {/* Decorative sparkles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 100 }}
              animate={{
                opacity: [0, 1, 0],
                y: -200,
              }}
              transition={{
                duration: 3,
                delay: i * 0.5,
                repeat: Infinity,
                repeatDelay: 2,
              }}
              className="absolute w-2 h-2 bg-amber-400 rounded-full"
              style={{
                left: `${20 + i * 12}%`,
                bottom: "10%",
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default OrderSuccessPage;
