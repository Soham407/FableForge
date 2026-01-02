import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowRight, BookOpen } from "lucide-react";
import { supabase } from "../lib/supabase";
import Button from "../components/ui/Button";
import { AppRoutes } from "../types";

/**
 * AuthPage - Handles both Sign In and Sign Up
 */
const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoginPage = location.pathname === AppRoutes.LOGIN;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLoginPage) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate(AppRoutes.DASHBOARD);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        setError("Success! Check your email for the confirmation link.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-emerald-950 text-amber-500 mb-4">
            <BookOpen size={32} />
          </div>
          <h1 className="text-3xl font-serif text-emerald-950 mb-2">
            {isLoginPage ? "Welcome Back" : "Start Your Story"}
          </h1>
          <p className="text-stone-500">
            {isLoginPage
              ? "Sign in to access your library of magic."
              : "Create an account to preserve your family's legacy."}
          </p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-stone-200/50 border border-stone-100">
          <form onSubmit={handleAuth} className="space-y-6">
            <AnimatePresence mode="wait">
              {!isLoginPage && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300"
                      size={18}
                    />
                    <input
                      type="text"
                      required={!isLoginPage}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full pl-12 pr-4 py-3 bg-stone-50 border-2 border-transparent rounded-2xl focus:border-amber-400 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300"
                  size={18}
                />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="w-full pl-12 pr-4 py-3 bg-stone-50 border-2 border-transparent rounded-2xl focus:border-amber-400 focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-400 uppercase tracking-widest ml-1">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300"
                  size={18}
                />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3 bg-stone-50 border-2 border-transparent rounded-2xl focus:border-amber-400 focus:bg-white focus:outline-none transition-all"
                />
              </div>
            </div>

            {error && (
              <div
                className={`p-4 rounded-xl text-sm ${
                  error.includes("Success")
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full py-4 shadow-xl"
              isLoading={loading}
              icon={!loading && <ArrowRight size={18} />}
            >
              {isLoginPage ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-stone-100 text-center">
            <p className="text-stone-500 text-sm">
              {isLoginPage
                ? "Don't have an account yet?"
                : "Already have an account?"}{" "}
              <button
                onClick={() =>
                  navigate(isLoginPage ? AppRoutes.SIGNUP : AppRoutes.LOGIN)
                }
                className="text-emerald-950 font-bold hover:text-amber-600 transition-colors"
              >
                {isLoginPage ? "Sign Up Free" : "Sign In Here"}
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
