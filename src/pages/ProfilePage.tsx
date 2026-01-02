import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Settings,
  Bell,
  Trash2,
  LogOut,
  Save,
  Check,
  ChevronRight,
  Camera,
  Moon,
  Sun,
  Shield,
  Heart,
  Baby,
  AlertCircle,
  Mail,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../lib/supabase";
import Button from "../components/ui/Button";

type Tab = "profile" | "preferences" | "security";

const ProfilePage = () => {
  const { user, signOut, updateUser } = useAuth();
  const { darkMode, setDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState(
    user?.user_metadata?.display_name || ""
  );
  const [defaultChildName, setDefaultChildName] = useState(
    user?.user_metadata?.default_child_name || ""
  );
  const [defaultGender, setDefaultGender] = useState(
    user?.user_metadata?.default_gender || "neutral"
  );
  const [defaultTheme, setDefaultTheme] = useState(
    user?.user_metadata?.default_theme || "Magic Forest"
  );
  const [defaultLesson, setDefaultLesson] = useState(
    user?.user_metadata?.default_lesson || "Kindness"
  );

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const { error } = await updateUser({
        display_name: displayName,
        default_child_name: defaultChildName,
        default_gender: defaultGender,
        default_theme: defaultTheme,
        default_lesson: defaultLesson,
        dark_mode: darkMode,
      });

      if (error) throw error;

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setSaveError(err?.message || "Failed to save changes. Please try again.");
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setIsResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/#/auth/login`,
      });
      if (error) throw error;
      setResetEmailSent(true);
    } catch (err) {
      console.error("Error sending reset email:", err);
      setSaveError("Failed to send reset email. Please try again.");
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setIsResetting(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "preferences", label: "Preferences", icon: Settings },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* Error Toast */}
      <AnimatePresence>
        {saveError && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-rose-100 border border-rose-200 text-rose-800 px-6 py-3 rounded-2xl shadow-lg flex items-center gap-3"
          >
            <AlertCircle size={18} />
            <span className="text-sm font-medium">{saveError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-white border-b border-stone-200 pt-32 pb-12 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={40} className="text-emerald-900" />
                )}
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-emerald-900 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={14} />
              </button>
            </div>
            <div>
              <h1 className="text-3xl font-serif text-emerald-950 mb-1">
                {displayName ||
                  user?.email?.split("@")[0] ||
                  "Mysterious Storyteller"}
              </h1>
              <p className="text-stone-500 text-sm">
                Member since{" "}
                {new Date(user?.created_at || "").toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-6 -mt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar Tabs */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-3xl p-2 shadow-xl shadow-stone-200/50 border border-stone-100 sticky top-24">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                    activeTab === tab.id
                      ? "bg-emerald-950 text-white shadow-md"
                      : "text-stone-500 hover:bg-stone-50 hover:text-emerald-950"
                  }`}
                >
                  <tab.icon size={18} />
                  <span className="font-medium text-sm">{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div layoutId="activeTab" className="ml-auto">
                      <ChevronRight size={14} />
                    </motion.div>
                  )}
                </button>
              ))}
              <div className="my-2 border-t border-stone-100" />
              <button
                onClick={() => signOut()}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-rose-500 hover:bg-rose-50 transition-all"
              >
                <LogOut size={18} />
                <span className="font-medium text-sm">Sign Out</span>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="md:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-stone-200/50 border border-stone-100"
              >
                {activeTab === "profile" && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-xl font-serif text-emerald-950 mb-6 flex items-center gap-2">
                        <User className="text-emerald-700" size={20} />
                        Personal Information
                      </h2>
                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-stone-400 ml-1">
                            Display Name
                          </label>
                          <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-medium text-emerald-950"
                            placeholder="What should we call you?"
                          />
                        </div>
                        <div className="space-y-2 opacity-60">
                          <label className="text-xs font-bold uppercase tracking-wider text-stone-400 ml-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={user?.email || ""}
                            disabled
                            className="w-full px-5 py-4 bg-stone-100 border border-stone-200 rounded-2xl cursor-not-allowed font-medium text-emerald-950"
                          />
                          <p className="text-[10px] text-stone-400 italic mt-1">
                            Email cannot be changed currently.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <h2 className="text-xl font-serif text-emerald-950 mb-6 flex items-center gap-2">
                        <Baby className="text-emerald-700" size={20} />
                        Child Defaults
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-stone-400 ml-1">
                            Child's First Name
                          </label>
                          <input
                            type="text"
                            value={defaultChildName}
                            onChange={(e) =>
                              setDefaultChildName(e.target.value)
                            }
                            className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-medium text-emerald-950"
                            placeholder="e.g. Leo"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-stone-400 ml-1">
                            Gender Preferences
                          </label>
                          <div className="flex p-1 bg-stone-100 rounded-2xl">
                            {["boy", "girl", "neutral"].map((g) => (
                              <button
                                key={g}
                                onClick={() => setDefaultGender(g as any)}
                                className={`flex-1 py-3 px-2 rounded-xl text-xs font-bold capitalize transition-all ${
                                  defaultGender === g
                                    ? "bg-white text-emerald-900 shadow-sm"
                                    : "text-stone-400 hover:text-stone-600"
                                }`}
                              >
                                {g}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 flex justify-end gap-4">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="min-w-[140px]"
                        icon={
                          saveSuccess ? <Check size={18} /> : <Save size={18} />
                        }
                      >
                        {isSaving
                          ? "Saving..."
                          : saveSuccess
                          ? "Saved!"
                          : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === "preferences" && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-xl font-serif text-emerald-950 mb-6 flex items-center gap-2">
                        <Settings className="text-emerald-700" size={20} />
                        App Experience
                      </h2>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-6 bg-stone-50 rounded-3xl border border-stone-100">
                          <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-900">
                              {darkMode ? (
                                <Moon size={24} />
                              ) : (
                                <Sun size={24} />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-emerald-950">
                                Dark Mode
                              </p>
                              <p className="text-xs text-stone-500">
                                Easier on the eyes at night
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setDarkMode(!darkMode)}
                            className={`w-14 h-8 rounded-full transition-all relative ${
                              darkMode ? "bg-emerald-900" : "bg-stone-300"
                            }`}
                          >
                            <div
                              className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${
                                darkMode ? "left-7" : "left-1"
                              } shadow-md`}
                            />
                          </button>
                        </div>

                        <div className="flex items-center justify-between p-6 bg-stone-50 rounded-3xl border border-stone-100 opacity-60">
                          <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-900">
                              <Bell size={24} />
                            </div>
                            <div>
                              <p className="font-bold text-emerald-950">
                                Email Notifications
                              </p>
                              <p className="text-xs text-stone-500">
                                Get updates on your story generation
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-1 rounded-md uppercase">
                            Coming Soon
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <h2 className="text-xl font-serif text-emerald-950 mb-6 flex items-center gap-2">
                        <Heart className="text-emerald-700" size={20} />
                        Story Preferences
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-stone-400 ml-1">
                            Default Theme
                          </label>
                          <select
                            value={defaultTheme}
                            onChange={(e) => setDefaultTheme(e.target.value)}
                            className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none font-medium text-emerald-950"
                          >
                            <option>Magic Forest</option>
                            <option>Space Adventure</option>
                            <option>Underwater Kingdom</option>
                            <option>Dinosaur World</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-wider text-stone-400 ml-1">
                            Default Lesson
                          </label>
                          <select
                            value={defaultLesson}
                            onChange={(e) => setDefaultLesson(e.target.value)}
                            className="w-full px-5 py-4 bg-stone-50 border border-stone-100 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none font-medium text-emerald-950"
                          >
                            <option>Kindness</option>
                            <option>Bravery</option>
                            <option>Sharing</option>
                            <option>Honesty</option>
                            <option>Perseverance</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="min-w-[140px]"
                        icon={
                          saveSuccess ? <Check size={18} /> : <Save size={18} />
                        }
                      >
                        {isSaving
                          ? "Saving..."
                          : saveSuccess
                          ? "Saved!"
                          : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === "security" && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-xl font-serif text-emerald-950 mb-6 flex items-center gap-2">
                        <Shield className="text-emerald-700" size={20} />
                        Security & Privacy
                      </h2>
                      <div className="space-y-4">
                        <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100">
                          <p className="font-bold text-emerald-950 mb-1">
                            Update Password
                          </p>
                          <p className="text-sm text-stone-500 mb-6">
                            Want to change your login credentials? We'll send a
                            secure link to your email.
                          </p>
                          {resetEmailSent ? (
                            <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-4 py-3 rounded-xl">
                              <Mail size={18} />
                              <span className="text-sm font-medium">
                                Reset link sent to {user?.email}
                              </span>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handlePasswordReset}
                              disabled={isResetting}
                            >
                              {isResetting ? "Sending..." : "Send Reset Link"}
                            </Button>
                          )}
                        </div>

                        <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100">
                          <div className="flex gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-600">
                              <Trash2 size={24} />
                            </div>
                            <div>
                              <p className="font-bold text-rose-950">
                                Danger Zone
                              </p>
                              <p className="text-xs text-rose-600/70">
                                Careful, this cannot be undone
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-rose-900/60 mb-6">
                            Once you delete your account, all your stories,
                            photo memories, and purchase history will be
                            permanently erased from our magical library.
                          </p>
                          <button className="flex items-center gap-2 text-rose-600 font-bold text-sm hover:underline">
                            Permanently Delete My Account
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
