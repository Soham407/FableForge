import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Rocket,
  Palmtree,
  Castle,
  ArrowLeft,
  ArrowRight,
  Check,
} from "lucide-react";
import Button from "../components/ui/Button";
import { AppRoutes } from "../types";
import type { StoryConfig } from "../types";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

/**
 * StoryDirector - Multi-step story configuration wizard
 * Step 1: Child's name and gender
 * Step 2: Adventure theme selection
 * Step 3: Life lesson selection
 */
const StoryDirector = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [config, setConfig] = useState<StoryConfig>({
    childName: "",
    gender: "neutral",
    theme: "",
    lesson: "",
  });

  const updateConfig = (key: keyof StoryConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Save for guest (sessionStorage)
      sessionStorage.setItem("storyConfig", JSON.stringify(config));

      if (user) {
        // Real Persistence for logged in users
        setIsSaving(true);
        try {
          const title = `${config.childName}'s ${
            config.theme === "space"
              ? "Space"
              : config.theme === "safari"
              ? "Jungle"
              : "Magic"
          } Adventure`;

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

          // Navigate to editor with the new book ID
          navigate(`${AppRoutes.EDITOR}?id=${data.id}`);
        } catch (err) {
          console.error("Error saving book:", err);
          // Fallback to anonymous flow if DB fails
          navigate(AppRoutes.EDITOR);
        } finally {
          setIsSaving(false);
        }
      } else {
        // Redirect guest to signup to "Save the Magic"
        // Set a flag so FlipbookEditor knows to create the book after auth
        sessionStorage.setItem("pendingBookCreation", "true");
        navigate(AppRoutes.SIGNUP + "?redirect=" + AppRoutes.EDITOR);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate(AppRoutes.PREVIEW);
    }
  };

  const themes = [
    {
      id: "space",
      title: "Space Explorer",
      icon: <Rocket size={32} />,
      color: "bg-indigo-900",
      text: "text-indigo-100",
      desc: "A journey through the stars to find the moon.",
    },
    {
      id: "safari",
      title: "Jungle Safari",
      icon: <Palmtree size={32} />,
      color: "bg-emerald-800",
      text: "text-emerald-100",
      desc: "Meeting friendly animals in the deep green forest.",
    },
    {
      id: "castle",
      title: "Magic Castle",
      icon: <Castle size={32} />,
      color: "bg-purple-900",
      text: "text-purple-100",
      desc: "A royal adventure with dragons and knights.",
    },
  ];

  const lessons = [
    {
      id: "bravery",
      title: "Bravery",
      desc: "Overcoming fears to do what is right.",
    },
    {
      id: "kindness",
      title: "Kindness",
      desc: "Sharing joy and helping others in need.",
    },
    {
      id: "sharing",
      title: "Sharing",
      desc: "Learning that fun is better when shared.",
    },
  ];

  const isStepValid = () => {
    switch (step) {
      case 1:
        return config.childName.trim().length > 0;
      case 2:
        return config.theme !== "";
      case 3:
        return config.lesson !== "";
      default:
        return false;
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl min-h-[80vh] flex flex-col">
      {/* Progress Bar */}
      <div className="w-full h-2 bg-stone-200 rounded-full mb-12 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(step / 3) * 100}%` }}
          transition={{ duration: 0.3 }}
          className="h-full bg-amber-500"
        />
      </div>

      {/* Step Content */}
      <div className="flex-grow flex flex-col items-center">
        <AnimatePresence mode="wait">
          {/* Step 1: Hero Details */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-md text-center space-y-8"
            >
              <h2 className="text-3xl font-serif text-emerald-950">
                Who is the hero?
              </h2>

              <div className="space-y-4 text-left">
                <label className="block text-sm font-bold text-stone-600 uppercase tracking-wide">
                  Child's Name
                </label>
                <input
                  type="text"
                  value={config.childName}
                  onChange={(e) => {
                    // Sanitize: only allow letters, spaces, hyphens, and apostrophes
                    const sanitized = e.target.value.replace(
                      /[^a-zA-Z\s\-']/g,
                      ""
                    );
                    updateConfig("childName", sanitized);
                  }}
                  maxLength={30}
                  placeholder="e.g. Oliver"
                  className="w-full text-2xl p-4 bg-white border-2 border-stone-200 rounded-xl 
                    focus:border-amber-500 focus:outline-none font-serif text-emerald-950 
                    placeholder:text-stone-300 transition-colors"
                />
              </div>

              <div className="space-y-4 text-left">
                <label className="block text-sm font-bold text-stone-600 uppercase tracking-wide">
                  Gender Presentation
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {["Boy", "Girl", "Neutral"].map((g) => (
                    <button
                      key={g}
                      onClick={() =>
                        updateConfig(
                          "gender",
                          g.toLowerCase() as "boy" | "girl" | "neutral"
                        )
                      }
                      className={`p-3 rounded-lg border-2 font-medium transition-all ${
                        config.gender === g.toLowerCase()
                          ? "border-emerald-950 bg-emerald-50 text-emerald-950"
                          : "border-stone-200 text-stone-400 hover:border-emerald-200"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Theme Selection */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full text-center space-y-8"
            >
              <h2 className="text-3xl font-serif text-emerald-950">
                Choose an Adventure
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => updateConfig("theme", t.id)}
                    className={`relative p-6 rounded-3xl text-left transition-all duration-300 hover:scale-105 ${
                      config.theme === t.id
                        ? "ring-4 ring-amber-500 shadow-2xl"
                        : "hover:shadow-xl opacity-80 hover:opacity-100"
                    } ${t.color}`}
                  >
                    <div className={`${t.text} mb-4`}>{t.icon}</div>
                    <h3
                      className={`text-xl font-bold font-serif mb-2 ${t.text}`}
                    >
                      {t.title}
                    </h3>
                    <p className={`text-sm opacity-80 ${t.text}`}>{t.desc}</p>
                    {config.theme === t.id && (
                      <div className="absolute top-4 right-4 bg-white text-emerald-950 rounded-full p-1">
                        <Check size={16} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: Lesson Selection */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-lg text-center space-y-8"
            >
              <h2 className="text-3xl font-serif text-emerald-950">
                What will they learn?
              </h2>
              <div className="space-y-4">
                {lessons.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => updateConfig("lesson", l.id)}
                    className={`w-full p-6 rounded-2xl flex items-center justify-between transition-all ${
                      config.lesson === l.id
                        ? "bg-emerald-950 text-white shadow-lg scale-105"
                        : "bg-white border border-stone-200 text-stone-600 hover:border-emerald-200 hover:bg-emerald-50"
                    }`}
                  >
                    <div className="text-left">
                      <h3 className="text-lg font-bold font-serif mb-1">
                        {l.title}
                      </h3>
                      <p
                        className={`text-sm ${
                          config.lesson === l.id
                            ? "text-emerald-200"
                            : "text-stone-400"
                        }`}
                      >
                        {l.desc}
                      </p>
                    </div>
                    {config.lesson === l.id && (
                      <Check size={24} className="text-amber-500" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-12 pt-8 border-t border-stone-200">
        <Button
          variant="ghost"
          onClick={handleBack}
          disabled={isSaving}
          icon={<ArrowLeft size={18} />}
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={!isStepValid() || isSaving}
          variant={step === 3 ? "secondary" : "primary"}
          isLoading={isSaving}
          icon={
            !isSaving &&
            (step === 3 ? <Rocket size={18} /> : <ArrowRight size={18} />)
          }
        >
          {step === 3 ? "Generate Story" : "Next Step"}
        </Button>
      </div>
    </div>
  );
};

export default StoryDirector;
