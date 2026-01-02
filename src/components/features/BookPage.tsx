import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface BookPageProps {
  front: ReactNode;
  back: ReactNode;
  isFlipped: boolean;
  zIndex: number;
  onFlip?: () => void;
}

/**
 * BookPage - 3D flipping page component for the flipbook editor
 * Uses CSS 3D transforms for realistic book page turning
 */
const BookPage = ({
  front,
  back,
  isFlipped,
  zIndex,
  onFlip,
}: BookPageProps) => {
  return (
    <motion.div
      className="absolute inset-0 w-full h-full preserve-3d cursor-pointer"
      style={{
        zIndex: isFlipped ? 1 : zIndex,
        transformOrigin: "left center",
      }}
      animate={{
        rotateY: isFlipped ? -180 : 0,
      }}
      transition={{
        duration: 0.8,
        ease: [0.645, 0.045, 0.355, 1],
      }}
      onClick={onFlip}
    >
      {/* Front of page (right side when closed) */}
      <div
        className="absolute inset-0 w-full h-full backface-hidden bg-white rounded-r-sm shadow-lg overflow-hidden"
        style={{ backfaceVisibility: "hidden" }}
      >
        {front}
      </div>

      {/* Back of page (left side when flipped) */}
      <div
        className="absolute inset-0 w-full h-full backface-hidden bg-stone-50 rounded-l-sm shadow-lg overflow-hidden"
        style={{
          backfaceVisibility: "hidden",
          transform: "rotateY(180deg)",
        }}
      >
        {back}
      </div>
    </motion.div>
  );
};

export default BookPage;
