import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Book as BookIcon,
  Clock,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { AppRoutes } from "../types";
import Button from "../components/ui/Button";

interface Book {
  id: string;
  title: string;
  cover_image: string;
  status: string;
  created_at: string;
  config: {
    childName: string;
    theme: string;
  };
}

const Dashboard = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("books")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setBooks(data || []);
      } catch (err) {
        console.error("Error fetching library:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [user]);

  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* Dashboard Header */}
      <div className="bg-white border-b border-stone-200 pt-32 pb-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl font-serif text-emerald-950 mb-2">
                My Magic Library
              </h1>
              <p className="text-stone-500">
                Welcome back, {user?.email?.split("@")[0]}
              </p>
            </div>
            <Link to={AppRoutes.HOME}>
              <Button icon={<Plus size={18} />}>Create New Story</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-6 -mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-emerald-900 mb-4" size={40} />
            <p className="text-stone-400 font-serif italic">
              Dusting off the bookshelves...
            </p>
          </div>
        ) : books.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {books.map((book) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-[2rem] overflow-hidden shadow-xl shadow-stone-200/50 border border-stone-100 group"
              >
                <div className="aspect-[4/3] bg-stone-200 relative overflow-hidden">
                  {book.cover_image ? (
                    <img
                      src={book.cover_image}
                      alt={book.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-emerald-950 text-amber-500/20">
                      <BookIcon size={64} />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 capitalize px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-emerald-950 shadow-sm">
                    {book.status}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-serif text-emerald-950 mb-2 line-clamp-1">
                    {book.title}
                  </h3>
                  <div className="flex items-center gap-4 text-stone-400 text-xs mb-6">
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {new Date(book.created_at).toLocaleDateString()}
                    </span>
                    <span className="capitalize">
                      {book.config?.theme || "Magic"} Adventure
                    </span>
                  </div>
                  <Link to={`${AppRoutes.EDITOR}?id=${book.id}`}>
                    <Button
                      variant="outline"
                      className="w-full justify-between group/btn"
                    >
                      Open Book
                      <ChevronRight
                        size={16}
                        className="transition-transform group-hover/btn:translate-x-1"
                      />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-[3rem] p-12 md:p-20 text-center border-2 border-dashed border-stone-200 shadow-sm"
          >
            <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6 text-stone-300">
              <BookIcon size={40} />
            </div>
            <h2 className="text-2xl font-serif text-emerald-950 mb-4">
              Your library is currently empty
            </h2>
            <p className="text-stone-500 max-w-md mx-auto mb-10">
              The magic hasn't started yet! Upload a photo and transform your
              child into a hero to see your first book appear here.
            </p>
            <Link to={AppRoutes.HOME}>
              <Button size="lg">Generate My First Story</Button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
