import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Sparkles, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppRoutes } from "../../types";

interface MagicUploaderProps {
  onUploadStart?: () => void;
}

/**
 * MagicUploader - The "Hook" component for instant AI preview
 * Goal: "Time to Awe" < 15 seconds (Masterplan Phase 1)
 */
const MagicUploader = ({ onUploadStart }: MagicUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = useCallback(
    (file: File) => {
      // 1. Explicit allowed MIME types check
      const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
      if (!file || !ALLOWED_TYPES.includes(file.type)) {
        alert("Please upload a valid image file (JPG, PNG, or WebP).");
        return;
      }

      // 2. Enforce max file size (5MB)
      const MAX_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_SIZE) {
        alert("File is too large. Please upload an image smaller than 5MB.");
        return;
      }

      setIsProcessing(true);
      onUploadStart?.();

      const reader = new FileReader();

      // 3. Handle successful read
      reader.onload = (e) => {
        try {
          const result = e.target?.result as string;
          if (!result) throw new Error("Failed to read file content");

          // 4. Wrap sessionStorage in try/catch with fallback
          sessionStorage.setItem("uploadedImage", result);
          sessionStorage.setItem("uploadedFileName", file.name);

          // Simulate "magical" processing time
          const PROCESSING_DURATION = 2500;
          setTimeout(() => {
            setIsProcessing(false);
            navigate(AppRoutes.PREVIEW);
          }, PROCESSING_DURATION);
        } catch (error) {
          console.error("Storage error:", error);
          alert(
            "Failed to process image. You can still continue, but preview may be limited."
          );
          setIsProcessing(false);
        }
      };

      // 5. Wire up FileReader errors to clear processing state
      reader.onerror = () => {
        console.error("FileReader error");
        alert("Error reading file. Please try again.");
        setIsProcessing(false);
      };

      reader.onabort = () => {
        console.warn("FileReader abort");
        setIsProcessing(false);
      };

      reader.readAsDataURL(file);
    },
    [navigate, onUploadStart]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processFile(e.dataTransfer.files[0]);
      }
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        processFile(e.target.files[0]);
      }
    },
    [processFile]
  );

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        layout
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative cursor-pointer group rounded-3xl border-2 border-dashed 
          p-8 transition-all duration-500 ease-out
          ${
            isDragging
              ? "border-amber-500 bg-amber-50/50 scale-105"
              : "border-stone-300 hover:border-amber-400 hover:bg-white bg-white/60"
          }
          ${
            isProcessing ? "pointer-events-none border-none bg-emerald-950" : ""
          }
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileSelect}
        />

        <AnimatePresence mode="wait">
          {!isProcessing ? (
            <motion.div
              key="upload-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center text-center space-y-4"
            >
              <div
                className={`
                  p-4 rounded-full transition-colors duration-300
                  ${
                    isDragging
                      ? "bg-amber-100 text-amber-600"
                      : "bg-stone-100 text-stone-500 group-hover:bg-amber-50 group-hover:text-amber-600"
                  }
                `}
              >
                <Upload size={32} />
              </div>
              <div>
                <h3 className="text-lg font-serif font-semibold text-emerald-950 mb-1">
                  Upload a photo
                </h3>
                <p className="text-sm text-stone-500">
                  Drag & drop or click to see the magic
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="processing-state"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center text-center space-y-6 py-8"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border-t-2 border-amber-400"
                  style={{ width: 64, height: 64 }}
                />
                <div className="p-4 rounded-full bg-emerald-900 text-amber-400">
                  <Sparkles size={32} />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-white mb-2">
                  Weaving Magic...
                </h3>
                <p className="text-emerald-200 text-sm">
                  Transforming your photo into a storybook illustration
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Decorative background blobs */}
        {!isProcessing && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden rounded-3xl">
            <div className="absolute -top-10 -right-10 w-20 h-20 bg-amber-200/20 rounded-full blur-xl" />
            <div className="absolute -bottom-10 -left-10 w-20 h-20 bg-emerald-200/20 rounded-full blur-xl" />
          </div>
        )}
      </motion.div>

      {/* Trust indicators */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-stone-400">
        <ShieldCheck size={14} />
        <span>Private & Secure • 100% Satisfaction Guarantee</span>
      </div>
    </div>
  );
};

export default MagicUploader;
