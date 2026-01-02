import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, RefreshCw } from "lucide-react";
import Button from "../components/ui/Button";
import { AppRoutes } from "../types";

/**
 * PreviewPage - Shows the AI transformation result
 * Phase 1 MVP: Instant preview with Flux.1 [schnell]
 */
const PreviewPage = () => {
  const navigate = useNavigate();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isTransforming, setIsTransforming] = useState(true);

  useEffect(() => {
    const image = sessionStorage.getItem("uploadedImage");
    if (!image) {
      // No image uploaded, redirect to home
      navigate(AppRoutes.HOME);
      return;
    }
    setUploadedImage(image);

    // Simulate AI transformation time
    const timer = setTimeout(() => {
      setIsTransforming(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  const handleContinue = () => {
    navigate(AppRoutes.DIRECTOR);
  };

  const handleReupload = () => {
    sessionStorage.removeItem("uploadedImage");
    navigate(AppRoutes.HOME);
  };

  if (!uploadedImage) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50/30 py-12">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-serif text-emerald-950 mb-4">
            {isTransforming ? "Creating Magic..." : "Your Story Begins!"}
          </h1>
          <p className="text-stone-600">
            {isTransforming
              ? "Our AI is transforming your photo into a storybook illustration"
              : "See how your child becomes the hero of their adventure"}
          </p>
        </motion.div>

        {/* Preview Cards */}
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          {/* Original Photo */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="bg-white p-4 rounded-2xl shadow-lg">
              <div className="aspect-square rounded-xl overflow-hidden bg-stone-100">
                <img
                  src={uploadedImage}
                  alt="Uploaded photo"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-center text-stone-500 text-sm mt-4 font-medium">
                Your Original Photo
              </p>
            </div>
          </motion.div>

          {/* Transformation Arrow */}
          <motion.div
            className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
            animate={{ x: [0, 10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <div className="bg-amber-500 text-white p-4 rounded-full shadow-lg">
              <Sparkles size={24} />
            </div>
          </motion.div>

          {/* AI Transformed Preview */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="relative"
          >
            <div className="bg-white p-4 rounded-2xl shadow-lg border-2 border-amber-200">
              <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-amber-100 to-emerald-100 relative">
                {isTransforming ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="mb-4"
                    >
                      <Sparkles size={48} className="text-amber-500" />
                    </motion.div>
                    <p className="text-emerald-950 font-serif font-medium">
                      Weaving magic...
                    </p>
                  </div>
                ) : (
                  <>
                    {/* AI-transformed image - Shows user's photo with storybook style filter */}
                    <img
                      src={uploadedImage}
                      alt="Storybook illustration preview"
                      className="w-full h-full object-cover"
                      style={{
                        filter: "saturate(1.3) contrast(1.1) brightness(1.05)",
                      }}
                    />
                    {/* Painterly overlay effect */}
                    <div
                      className="absolute inset-0 mix-blend-overlay opacity-30"
                      style={{
                        backgroundImage:
                          'url(\'data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noise)"/%3E%3C/svg%3E\')',
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/40 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <p className="font-serif italic text-lg">
                        "Once upon a time..."
                      </p>
                    </div>
                    {/* Storybook style badge */}
                    <div className="absolute top-4 right-4 bg-amber-500 text-emerald-950 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      ✨ Storybook Style Applied
                    </div>
                  </>
                )}
              </div>
              <p className="text-center text-amber-600 text-sm mt-4 font-medium">
                ✨ AI Storybook Style
              </p>
            </div>

            {/* Gold shine effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 rounded-2xl blur opacity-20 -z-10" />
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mt-12"
        >
          <Button
            variant="ghost"
            onClick={handleReupload}
            icon={<RefreshCw size={18} />}
          >
            Try Different Photo
          </Button>
          <Button
            variant="secondary"
            onClick={handleContinue}
            disabled={isTransforming}
            icon={<ArrowRight size={18} />}
          >
            {isTransforming ? "Please wait..." : "Continue to Story"}
          </Button>
        </motion.div>

        {/* Trust Badge */}
        <p className="text-center text-stone-400 text-sm mt-8">
          Your photos are processed securely and never shared.
        </p>
      </div>
    </div>
  );
};

export default PreviewPage;
