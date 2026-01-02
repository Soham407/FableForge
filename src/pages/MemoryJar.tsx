import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Camera,
  Sparkles,
  X,
  Image as ImageIcon,
  MessageSquare,
  ChevronRight,
  Loader2,
  Check,
} from "lucide-react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button";
import GoldFoil from "../components/ui/GoldFoil";
import { AppRoutes } from "../types";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { storeMemoryEmbedding } from "../lib/vectorDb";

interface Memory {
  id: string;
  image_url: string;
  caption: string;
  created_at: string;
  month: number;
  year: number;
}

/**
 * MemoryJar - Phase 3 Feature for year-round photo collection
 * Enables the "Tradition" ecosystem with monthly prompts
 */
const MemoryJar = () => {
  const { user } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Form state for new memory
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthlyPrompts = [
    "What was their biggest smile moment this month?",
    "Capture a cozy reading moment",
    "Their favorite outdoor adventure",
    "A silly face or funny moment",
    "Learning something new",
    "Summer sunshine memories",
    "Their creative masterpiece",
    "A moment with a friend or pet",
    "Back to school excitement",
    "Fall colors and fun",
    "Grateful moments",
    "Holiday magic and wonder",
  ];

  useEffect(() => {
    if (user) {
      fetchMemories();
    }
  }, [user]);

  const fetchMemories = async () => {
    try {
      const { data, error } = await supabase
        .from("memories")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMemories(data || []);
    } catch (err) {
      console.error("Error fetching memories:", err);
    }
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const hasThisMonthMemory = memories.some(
    (m) => m.month === currentMonth && m.year === currentYear
  );

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle upload area click
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Reset form state
  const resetForm = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setCaption("");
    setUploadSuccess(false);
  };

  // Close modal and reset
  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // Save memory to database
  const handleSaveMemory = async () => {
    if (!selectedImage || !user) return;

    setIsLoading(true);
    try {
      // 1. Upload image to Supabase Storage
      const fileExt = selectedImage.name.split(".").pop();
      const fileName = `${
        user.id
      }/${currentYear}-${currentMonth}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("memories")
        .upload(fileName, selectedImage);

      if (uploadError) {
        // If bucket doesn't exist, use a placeholder URL for demo
        console.warn(
          "Storage upload failed, using data URL:",
          uploadError.message
        );
      }

      // Get public URL (or use preview for demo)
      let imageUrl = imagePreview || "";
      const { data: urlData } = supabase.storage
        .from("memories")
        .getPublicUrl(fileName);

      if (urlData?.publicUrl && !uploadError) {
        imageUrl = urlData.publicUrl;
      }

      // 2. Insert memory record into database
      const { data: memoryData, error: insertError } = await supabase
        .from("memories")
        .insert({
          user_id: user.id,
          image_url: imageUrl,
          caption: caption || monthlyPrompts[currentMonth],
          month: currentMonth,
          year: currentYear,
          prompt: monthlyPrompts[currentMonth],
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 3. Store embedding for RAG (async, non-blocking)
      if (memoryData) {
        storeMemoryEmbedding(
          memoryData.id,
          caption || monthlyPrompts[currentMonth],
          [],
          currentMonth,
          currentYear
        ).catch((err) => console.warn("Embedding storage failed:", err));
      }

      // 4. Update UI
      setUploadSuccess(true);
      await fetchMemories();

      // Auto-close after success
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (err) {
      console.error("Error saving memory:", err);
      alert("Failed to save memory. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-stone-50 pb-20">
      {/* Header */}
      <div className="bg-emerald-950 pt-32 pb-20 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="absolute w-2 h-2 bg-amber-400 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <div className="w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-amber-500/30">
            <Sparkles size={40} className="text-emerald-950" />
          </div>
          <GoldFoil className="text-4xl md:text-5xl font-serif mb-4 block">
            Memory Jar
          </GoldFoil>
          <p className="text-emerald-100/70 max-w-lg mx-auto">
            Collect magical moments throughout the year. Each month, add a photo
            that captures your child's journey.
          </p>
        </motion.div>
      </div>

      <div className="container mx-auto max-w-6xl px-6 -mt-10">
        {/* Monthly Prompt Card */}
        {!hasThisMonthMemory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2rem] p-8 shadow-xl shadow-stone-200/50 border border-amber-100 mb-12"
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Camera size={32} className="text-amber-600" />
              </div>
              <div className="flex-grow text-center md:text-left">
                <h3 className="text-xl font-serif text-emerald-950 mb-2">
                  {months[currentMonth]}'s Prompt
                </h3>
                <p className="text-stone-500 italic">
                  "{monthlyPrompts[currentMonth]}"
                </p>
              </div>
              <Button
                onClick={() => setIsModalOpen(true)}
                icon={<Plus size={18} />}
              >
                Add Memory
              </Button>
            </div>
          </motion.div>
        )}

        {/* Year Grid */}
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-12">
          {months.map((month, index) => {
            const monthMemories = memories.filter(
              (m) => m.month === index && m.year === currentYear
            );
            const hasMemory = monthMemories.length > 0;
            const isPast = index < currentMonth;
            const isCurrent = index === currentMonth;

            return (
              <motion.div
                key={month}
                whileHover={{ scale: hasMemory ? 1.05 : 1 }}
                className={`aspect-square rounded-2xl relative overflow-hidden cursor-pointer transition-all ${
                  hasMemory
                    ? "shadow-lg"
                    : isPast
                    ? "bg-stone-100 opacity-50"
                    : isCurrent
                    ? "bg-amber-50 border-2 border-dashed border-amber-300"
                    : "bg-stone-50 border border-stone-200"
                }`}
                onClick={() => {
                  if (isCurrent && !hasMemory) {
                    setIsModalOpen(true);
                  }
                }}
              >
                {hasMemory ? (
                  <>
                    <img
                      src={monthMemories[0].image_url}
                      alt={month}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/60 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <span className="text-white text-xs font-bold uppercase tracking-widest">
                        {month.slice(0, 3)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                    <span className="text-stone-400 text-xs font-bold uppercase tracking-widest mb-1">
                      {month.slice(0, 3)}
                    </span>
                    {isCurrent && <Plus size={20} className="text-amber-400" />}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="bg-emerald-950 rounded-[2rem] p-8 md:p-12 text-center">
          <h3 className="text-2xl md:text-3xl font-serif text-white mb-4">
            Ready to create this year's storybook?
          </h3>
          <p className="text-emerald-100/60 mb-8 max-w-lg mx-auto">
            Once you've collected 12 months of memories, transform them into a
            beautiful heirloom storybook.
          </p>
          <Link to={AppRoutes.HOME}>
            <Button variant="secondary" icon={<ChevronRight size={18} />}>
              Create Annual Storybook
            </Button>
          </Link>
        </div>
      </div>

      {/* Add Memory Modal - Now Fully Functional */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-emerald-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-serif text-emerald-950">
                  Add a Memory
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-stone-100 rounded-full transition-colors"
                  disabled={isLoading}
                >
                  <X size={20} />
                </button>
              </div>

              {uploadSuccess ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="py-12 text-center"
                >
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check size={32} className="text-emerald-600" />
                  </div>
                  <h4 className="text-xl font-serif text-emerald-950 mb-2">
                    Memory Saved!
                  </h4>
                  <p className="text-stone-500">
                    Your magical moment has been added to the jar.
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />

                  {/* Upload area */}
                  <div
                    onClick={handleUploadClick}
                    className={`aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                      imagePreview
                        ? "border-amber-400 bg-amber-50/50"
                        : "border-stone-200 hover:border-amber-300 hover:bg-amber-50/50 bg-stone-100"
                    }`}
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <>
                        <ImageIcon size={32} className="text-stone-300 mb-2" />
                        <span className="text-stone-400 text-sm">
                          Click to upload photo
                        </span>
                      </>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                      Caption
                    </label>
                    <div className="relative">
                      <MessageSquare
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300"
                      />
                      <input
                        type="text"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        placeholder="What made this moment special?"
                        className="w-full pl-12 pr-4 py-3 bg-stone-50 border-2 border-transparent rounded-2xl focus:border-amber-400 focus:bg-white focus:outline-none transition-all"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    icon={
                      isLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Sparkles size={18} />
                      )
                    }
                    onClick={handleSaveMemory}
                    disabled={!selectedImage || isLoading}
                  >
                    {isLoading ? "Saving..." : "Save to Memory Jar"}
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MemoryJar;
