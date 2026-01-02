import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, BookOpen } from "lucide-react";
import Button from "../components/ui/Button";
import { AppRoutes } from "../types";

const NotFound = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        {/* Decorative illustration */}
        <div className="mb-8 relative">
          <div className="w-32 h-32 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
            <BookOpen size={48} className="text-amber-600" />
          </div>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-2 -right-2 bg-emerald-950 text-white p-2 rounded-full text-sm font-bold"
          >
            404
          </motion.div>
        </div>

        <h1 className="text-4xl font-serif text-emerald-950 mb-4">
          Story Not Found
        </h1>
        <p className="text-stone-600 mb-8">
          It seems this chapter of our story hasn't been written yet. Let's take
          you back to where the magic begins.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to={AppRoutes.HOME}>
            <Button icon={<Home size={18} />}>Return Home</Button>
          </Link>
          <Link to={AppRoutes.DASHBOARD}>
            <Button variant="outline" icon={<BookOpen size={18} />}>
              My Library
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
