import { motion } from "framer-motion";
import type { ReactNode, MouseEventHandler } from "react";

interface ButtonProps {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

const Button = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  icon,
  className = "",
  disabled,
  type = "button",
  onClick,
}: ButtonProps) => {
  const baseStyles = `
    inline-flex items-center justify-center rounded-full font-medium
    transition-all duration-300 
    disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 focus:ring-offset-2
  `;

  const variants = {
    primary: `
      bg-emerald-950 text-white 
      hover:bg-emerald-900 
      focus:ring-emerald-500
    `,
    secondary: `
      bg-white text-emerald-950 
      hover:bg-amber-50 
      focus:ring-amber-500
    `,
    outline: `
      border-2 border-stone-300 text-stone-700 
      hover:border-emerald-950 hover:text-emerald-950
      focus:ring-emerald-500
    `,
    ghost: `
      text-stone-600 
      hover:bg-stone-100 hover:text-emerald-950
      focus:ring-stone-500
    `,
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || disabled}
      type={type}
      onClick={onClick}
    >
      {isLoading ? (
        <svg
          className="animate-spin -ml-1 mr-3 h-5 w-5 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </motion.button>
  );
};

export default Button;
