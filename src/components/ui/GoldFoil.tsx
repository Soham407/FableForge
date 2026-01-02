import type { ReactNode } from "react";

interface GoldFoilProps {
  children: ReactNode;
  className?: string;
  as?: "span" | "h1" | "h2" | "h3" | "p";
}

/**
 * GoldFoil - Creates a shimmering gold foil text effect
 * Used for premium/luxury text elements (titles, "The End", etc.)
 */
const GoldFoil = ({
  children,
  className = "",
  as: Component = "span",
}: GoldFoilProps) => {
  return (
    <Component className={`gold-foil font-serif ${className}`}>
      {children}
    </Component>
  );
};

export default GoldFoil;
