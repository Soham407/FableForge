import { Link } from "react-router-dom";
import { BookOpen, Heart } from "lucide-react";
import { AppRoutes } from "../../types";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: "How it Works", href: "#how-it-works" },
      { name: "Pricing", href: "#pricing" },
      { name: "Examples", href: "#showcase" },
    ],
    company: [
      { name: "About Us", path: "#" },
      { name: "Blog", path: "#" },
      { name: "Careers", path: "#" },
    ],
    support: [
      { name: "Help Center", path: "#" },
      { name: "Contact", path: "#" },
      { name: "Shipping", path: "#" },
    ],
    legal: [
      { name: "Privacy Policy", path: "#" },
      { name: "Terms of Service", path: "#" },
      { name: "Refund Policy", path: "#" },
    ],
  };

  return (
    <footer className="bg-emerald-950 text-white py-16 mt-20">
      <div className="container mx-auto px-6">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link to={AppRoutes.HOME} className="flex items-center gap-2 mb-4">
              <div className="bg-amber-500 p-2 rounded-lg text-emerald-950">
                <BookOpen size={20} strokeWidth={2.5} />
              </div>
              <span className="text-lg font-serif font-bold">
                Our Story Books
              </span>
            </Link>
            <p className="text-emerald-200 text-sm leading-relaxed">
              Transforming family photos into magical, heirloom-quality
              storybooks that last generations.
            </p>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-semibold mb-4 text-amber-400">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="text-emerald-200 hover:text-white text-sm transition-colors"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-semibold mb-4 text-amber-400">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-emerald-200 hover:text-white text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-semibold mb-4 text-amber-400">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-emerald-200 hover:text-white text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold mb-4 text-amber-400">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-emerald-200 hover:text-white text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-emerald-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-emerald-300 text-sm">
            © {currentYear} Our Story Books. All rights reserved.
          </p>
          <p className="text-emerald-300 text-sm flex items-center gap-1">
            Made with{" "}
            <Heart size={14} className="text-amber-500 fill-amber-500" /> for
            families everywhere
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
