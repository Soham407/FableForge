import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { BookOpen, Menu, X, User, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../ui/Button";
import { AppRoutes } from "../../types";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: "How it Works", href: "#how-it-works" },
    { name: "Showcase", href: "#showcase" },
    { name: "My Library", path: AppRoutes.DASHBOARD },
    { name: "Memory Jar", path: AppRoutes.MEMORY_JAR },
  ];

  // Hide nav links on flow pages to reduce distraction
  // With HashRouter, we need to check the hash portion of the URL
  const currentPath = location.pathname + location.hash.replace("#", "");
  const isFlowPage = [
    AppRoutes.DIRECTOR,
    AppRoutes.EDITOR,
    AppRoutes.PREVIEW,
    AppRoutes.CHECKOUT,
  ].some(
    (route) =>
      currentPath.includes(route) &&
      !currentPath.includes(AppRoutes.ORDER_SUCCESS)
  );

  const handleAnchorClick = (e: React.MouseEvent, href: string) => {
    if (location.pathname === AppRoutes.HOME) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", href);
      }
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to={AppRoutes.HOME} className="flex items-center gap-2 z-50">
          <div className="bg-emerald-950 p-2 rounded-lg text-amber-500">
            <BookOpen size={24} strokeWidth={2.5} />
          </div>
          <span
            className={`text-xl font-serif font-bold tracking-tight text-emerald-950`}
          >
            Our Story Books
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {!isFlowPage &&
            navLinks.map((link) => {
              if (link.path) {
                // Only show Dashboard and Memory Jar if logged in
                if (
                  (link.path === AppRoutes.DASHBOARD ||
                    link.path === AppRoutes.MEMORY_JAR) &&
                  !user
                )
                  return null;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className="text-sm font-medium text-emerald-950/80 hover:text-emerald-950 transition-colors"
                  >
                    {link.name}
                  </Link>
                );
              }

              const isHome = location.pathname === AppRoutes.HOME;
              const target = isHome
                ? link.href || "#"
                : `${AppRoutes.HOME}${link.href}`;

              return isHome ? (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) => handleAnchorClick(e, link.href || "#")}
                  className="text-sm font-medium text-emerald-950/80 hover:text-emerald-950 transition-colors cursor-pointer"
                >
                  {link.name}
                </a>
              ) : (
                <Link
                  key={link.name}
                  to={target}
                  className="text-sm font-medium text-emerald-950/80 hover:text-emerald-950 transition-colors"
                >
                  {link.name}
                </Link>
              );
            })}

          {user ? (
            <div className="flex items-center gap-4">
              <Link
                to={AppRoutes.PROFILE}
                className="text-sm font-medium text-emerald-950/80 hover:text-emerald-950 flex items-center gap-1"
              >
                <User size={16} /> My Account
              </Link>
              <button
                onClick={() => signOut()}
                className="text-sm font-medium text-red-600/80 hover:text-red-700 flex items-center gap-1 transition-colors"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          ) : (
            <Link
              to={AppRoutes.LOGIN}
              className="text-sm font-medium text-emerald-950/80 hover:text-emerald-950 flex items-center gap-1"
            >
              <User size={16} /> Sign In
            </Link>
          )}

          <Link to={AppRoutes.HOME}>
            <Button
              size="sm"
              variant="primary"
              className={!isScrolled ? "shadow-xl shadow-emerald-900/10" : ""}
            >
              Create Story
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden z-50 text-emerald-950"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-stone-50 flex flex-col items-center justify-center space-y-8 md:hidden z-40"
            >
              {!isFlowPage &&
                navLinks.map((link) => {
                  if (link.path) {
                    if (
                      (link.path === AppRoutes.DASHBOARD ||
                        link.path === AppRoutes.MEMORY_JAR) &&
                      !user
                    )
                      return null;
                    return (
                      <Link
                        key={link.name}
                        to={link.path}
                        className="text-2xl font-serif text-emerald-950"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {link.name}
                      </Link>
                    );
                  }

                  const isHome = location.pathname === AppRoutes.HOME;
                  const target = isHome
                    ? link.href || "#"
                    : `${AppRoutes.HOME}${link.href}`;

                  return isHome ? (
                    <a
                      key={link.name}
                      href={link.href}
                      className="text-2xl font-serif text-emerald-950 cursor-pointer"
                      onClick={(e) => handleAnchorClick(e, link.href || "#")}
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      key={link.name}
                      to={target}
                      className="text-2xl font-serif text-emerald-950"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.name}
                    </Link>
                  );
                })}

              {user ? (
                <>
                  <Link
                    to={AppRoutes.PROFILE}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-2xl font-serif text-emerald-950"
                  >
                    My Account
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="text-2xl font-serif text-red-600"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  to={AppRoutes.LOGIN}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-2xl font-serif text-emerald-950"
                >
                  Sign In
                </Link>
              )}

              <Link
                to={AppRoutes.HOME}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Button size="lg">Create Story</Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
