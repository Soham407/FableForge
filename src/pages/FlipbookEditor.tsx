import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Edit2,
  RefreshCw,
  ShoppingBag,
  Share2,
  Loader2,
  Sparkles,
} from "lucide-react";
import Button from "../components/ui/Button";
import BookPage from "../components/features/BookPage";
import GoldFoil from "../components/ui/GoldFoil";
import { AppRoutes } from "../types";
import type { StoryConfig } from "../types";
import { generateStoryScript } from "../lib/narrative";
import { generateStoryImage } from "../lib/imageGen";
import { getSamplePages } from "../data/sampleStory";
import { supabase } from "../lib/supabase";

interface AIPage {
  text: string;
  imagePrompt?: string;
  imageUrl?: string;
}

/**
 * FlipbookEditor - Interactive 3D book preview and editor
 * Phase 2: Luxury Upgrade - Integrated with Supabase and AI Narrative
 */
const FlipbookEditor = () => {
  const [searchParams] = useSearchParams();
  const bookId = searchParams.get("id");

  const [currentSpreadIndex, setCurrentSpreadIndex] = useState(0);
  const [storyConfig, setStoryConfig] = useState<StoryConfig | null>(null);
  const [loading, setLoading] = useState(bookId ? true : false);
  const [bookStatus, setBookStatus] = useState<string>("ready");
  const [aiPages, setAiPages] = useState<AIPage[]>([]);

  useEffect(() => {
    const loadBook = async () => {
      if (bookId) {
        try {
          const { data, error } = await supabase
            .from("books")
            .select("*")
            .eq("id", bookId)
            .single();

          if (error) throw error;

          if (data) {
            setStoryConfig(data.config as StoryConfig);
            setBookStatus(data.status);

            // Real Generation Trigger
            if (data.status === "generating") {
              const script = await generateStoryScript(
                data.config as StoryConfig
              );

              // Generate images for each page with robust error handling
              const pagesWithImages: AIPage[] = [];
              for (const page of script.pages) {
                try {
                  const imageResult = await generateStoryImage(
                    page.imagePrompt
                  );
                  pagesWithImages.push({
                    text: page.text,
                    imagePrompt: page.imagePrompt,
                    imageUrl: imageResult.imageUrl,
                  });
                } catch (imgErr) {
                  console.error("Failed to generate image for page:", imgErr);
                  // Push page with null imageUrl so individual page failure doesn't stop the loop
                  pagesWithImages.push({
                    text: page.text,
                    imagePrompt: page.imagePrompt,
                    imageUrl: undefined,
                  });
                }
                // Show progress in UI
                setAiPages([...pagesWithImages]);
              }

              setAiPages(pagesWithImages);
              setBookStatus("ready");

              // Update database with generated pages and mark as ready
              const { error: updateError } = await supabase
                .from("books")
                .update({
                  status: "ready",
                  pages: pagesWithImages,
                })
                .eq("id", bookId);

              if (updateError) {
                console.error(
                  "Failed to update book status in DB:",
                  updateError
                );
                // We don't throw here to allow the user to see the generated pages anyway
              }
            } else if (data.pages) {
              setAiPages(data.pages);
            }
          }
        } catch (err) {
          console.error("Error loading book from DB:", err);
        } finally {
          setLoading(false);
        }
      } else {
        // Check if we have a pending book creation (guest who just signed up)
        const pendingCreation = sessionStorage.getItem("pendingBookCreation");
        const configStr = sessionStorage.getItem("storyConfig");

        if (pendingCreation && configStr) {
          // We need to get the user from supabase auth
          const createBookForNewUser = async () => {
            try {
              const {
                data: { user },
              } = await supabase.auth.getUser();

              if (user && configStr) {
                const config = JSON.parse(configStr) as StoryConfig;
                const title = `${config.childName}'s ${
                  config.theme === "space"
                    ? "Space"
                    : config.theme === "safari"
                    ? "Jungle"
                    : "Magic"
                } Adventure`;

                // Create the book
                const { data, error } = await supabase
                  .from("books")
                  .insert({
                    user_id: user.id,
                    title,
                    config,
                    status: "generating",
                  })
                  .select()
                  .single();

                if (error) throw error;

                // Clear pending flag
                sessionStorage.removeItem("pendingBookCreation");

                // Redirect to editor with the new book ID
                if (data) {
                  window.location.href = `${window.location.origin}${window.location.pathname}#${AppRoutes.EDITOR}?id=${data.id}`;
                  return;
                }
              }
            } catch (err) {
              console.error("Error creating book for new user:", err);
            }

            // Fallback: use session storage config
            try {
              if (configStr) {
                setStoryConfig(JSON.parse(configStr));
              }
            } catch (error) {
              console.error("Failed to parse story config", error);
            }
          };

          createBookForNewUser();
        } else {
          // Fallback to session storage for guests/demo
          try {
            if (configStr) {
              setStoryConfig(JSON.parse(configStr));
            }
          } catch (error) {
            console.error("Failed to parse story config", error);
          }
        }
      }
    };

    loadBook();
  }, [bookId]);

  // Use AI pages if available, otherwise fallback to sample pages
  const displayPages =
    aiPages && aiPages.length > 0
      ? aiPages.map((p) => ({
          text: p.text,
          image:
            p.imageUrl ||
            "https://images.unsplash.com/photo-1451187530220-af7142958a7f?w=800&q=80",
        }))
      : getSamplePages(storyConfig?.childName || "Oliver");

  const pages = displayPages;

  const handleNext = () => {
    if (currentSpreadIndex < pages.length) {
      setCurrentSpreadIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSpreadIndex > 0) {
      setCurrentSpreadIndex((prev) => prev - 1);
    }
  };

  const bookTitle = storyConfig?.childName
    ? `${storyConfig.childName}'s ${
        storyConfig.theme === "space"
          ? "Space Adventure"
          : storyConfig.theme === "safari"
          ? "Jungle Adventure"
          : "Castle Adventure"
      }`
    : "Oliver's Space Adventure";

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-emerald-900 mb-4" size={48} />
        <p className="font-serif italic text-stone-600">
          Retrieving your magic story...
        </p>
      </div>
    );
  }

  if (bookStatus === "generating") {
    return (
      <div className="min-h-screen bg-emerald-950 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="w-24 h-24 bg-amber-500 rounded-3xl flex items-center justify-center mb-12 shadow-2xl shadow-amber-500/20"
        >
          <Sparkles size={48} className="text-emerald-950" />
        </motion.div>
        <h2 className="text-3xl md:text-5xl font-serif text-amber-500 mb-6">
          Weaving the Magic...
        </h2>
        <p className="text-emerald-100/60 max-w-md text-lg leading-relaxed">
          Our Narrative Director and Digital Twin Engine are crafting your
          unique story. This legacy will be ready in just a few moments.
        </p>
        <div className="mt-12 w-64 h-1 bg-emerald-900 rounded-full overflow-hidden">
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            transition={{ duration: 5, ease: "linear" }}
            className="h-full bg-amber-500"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col">
      {/* Editor Header */}
      <div className="bg-white border-b border-stone-200 p-4 px-8 flex justify-between items-center sticky top-0 z-40 shadow-sm">
        <Link
          to={AppRoutes.DIRECTOR}
          className="text-sm font-medium text-stone-500 hover:text-emerald-950 flex items-center gap-1"
        >
          <ArrowLeft size={16} /> Edit Details
        </Link>
        <span className="font-serif font-bold text-emerald-950">
          {bookTitle}
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" icon={<Share2 size={16} />}>
            Share
          </Button>
          <Link to={AppRoutes.CHECKOUT}>
            <Button
              size="sm"
              variant="secondary"
              icon={<ShoppingBag size={16} />}
            >
              Order Heirloom ($199)
            </Button>
          </Link>
        </div>
      </div>

      {/* Book Stage */}
      <div className="flex-grow flex items-center justify-center p-4 lg:p-12 overflow-hidden perspective-1500">
        {/* The Book Container */}
        <div className="relative w-full max-w-6xl aspect-[3/2] flex items-center justify-center">
          {/* Base Left Page (Static underlay) */}
          <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-stone-50 rounded-l-sm shadow-2xl flex items-center justify-center overflow-hidden border-r border-stone-200/50">
            <img
              src={pages[0].image}
              alt="Start"
              loading="lazy"
              className="w-full h-full object-cover p-12 opacity-50 blur-sm"
            />
            <div className="absolute inset-0 bg-white/60" />
            <div className="absolute inset-0 flex items-center justify-center text-center p-8">
              <div>
                <h3 className="font-serif text-3xl text-emerald-950 mb-2">
                  {storyConfig?.childName || "Oliver"}'s Journey
                </h3>
                <p className="text-stone-500 font-serif italic">
                  Beginning the adventure...
                </p>
              </div>
            </div>
          </div>

          {/* Static Right Page Base (Last page underlay) */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-white rounded-r-sm shadow-xl flex items-center justify-center">
            <div className="text-center p-8">
              <GoldFoil className="text-4xl mb-4 block">The End</GoldFoil>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentSpreadIndex(0)}
              >
                Read Again
              </Button>
            </div>
          </div>

          {/* The Pages Stack */}
          <div
            className="absolute right-0 top-0 bottom-0 w-1/2 h-full preserve-3d"
            style={{ perspective: "2000px" }}
          >
            {pages.map((page, index) => {
              const zIndex = pages.length - index;
              const isFlipped = index < currentSpreadIndex;
              const nextImage =
                index < pages.length - 1 ? pages[index + 1].image : null;

              return (
                <BookPage
                  key={index}
                  zIndex={zIndex}
                  isFlipped={isFlipped}
                  onFlip={() => {
                    if (isFlipped) handlePrev();
                    else handleNext();
                  }}
                  front={
                    <div className="w-full h-full relative group p-12 lg:p-16 flex flex-col justify-between">
                      <div className="text-center mt-8">
                        <p className="font-serif text-2xl lg:text-3xl leading-relaxed text-emerald-950">
                          {page.text}
                        </p>
                      </div>
                      <div className="flex justify-between items-end text-stone-300 font-serif text-sm">
                        <span>{index + 1}</span>
                        <button
                          className="p-2 hover:bg-stone-100 rounded-full text-stone-400 hover:text-amber-600 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Edit text"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </div>
                  }
                  back={
                    <div className="w-full h-full relative group">
                      {nextImage ? (
                        <img
                          src={nextImage}
                          alt={`Scene ${index + 2}`}
                          loading="lazy"
                          className="w-full h-full object-cover p-8 lg:p-10"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-emerald-950 text-white p-8 text-center">
                          <GoldFoil className="text-3xl">Fin</GoldFoil>
                        </div>
                      )}
                      <div className="absolute top-4 right-4">
                        <button
                          className="p-2 bg-white/80 backdrop-blur rounded-full shadow-md text-stone-500 hover:text-amber-600 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Regenerate image"
                        >
                          <RefreshCw size={16} />
                        </button>
                      </div>
                    </div>
                  }
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="bg-white border-t border-stone-200 p-6 flex justify-center gap-8 z-50 relative">
        <Button
          onClick={handlePrev}
          disabled={currentSpreadIndex === 0}
          variant="outline"
          className="rounded-full w-12 h-12 !p-0 flex items-center justify-center"
          aria-label="Previous page"
        >
          <ArrowLeft size={20} />
        </Button>

        <div className="flex items-center gap-2">
          <span className="font-serif text-stone-400 text-sm">Spread</span>
          <span className="font-serif font-bold text-emerald-950 text-xl w-6 text-center">
            {currentSpreadIndex + 1}
          </span>
          <span className="font-serif text-stone-400 text-sm">
            of {pages.length}
          </span>
        </div>

        <Button
          onClick={handleNext}
          disabled={currentSpreadIndex === pages.length}
          variant="outline"
          className="rounded-full w-12 h-12 !p-0 flex items-center justify-center"
          aria-label="Next page"
        >
          <ArrowRight size={20} />
        </Button>
      </div>
    </div>
  );
};

export default FlipbookEditor;
