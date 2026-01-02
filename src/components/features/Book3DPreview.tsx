import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Environment,
  ContactShadows,
  Text,
  Float,
  MeshReflectorMaterial,
} from "@react-three/drei";
import * as THREE from "three";

interface Book3DPreviewProps {
  coverImage?: string;
  title?: string;
  childName?: string;
  tier?: "standard" | "premium" | "heirloom";
  autoRotate?: boolean;
}

/**
 * 3D Book Model Component
 * Renders a realistic hardcover book with page physics
 */
function Book({
  coverImage,
  title = "A Magical Adventure",
  tier = "premium",
}: {
  coverImage?: string;
  title?: string;
  tier?: "standard" | "premium" | "heirloom";
}) {
  const bookRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Gentle floating animation
  useFrame((state) => {
    if (bookRef.current) {
      bookRef.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.3) * 0.1 + Math.PI * 0.1;
      bookRef.current.position.y =
        Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  // Book dimensions (8.5 x 8.5 inches scaled)
  const bookWidth = 2;
  const bookHeight = 2;
  const bookDepth = 0.2;
  const pageDepth = 0.15;

  // Material colors based on tier
  const coverMaterials = {
    standard: {
      color: "#1a1a2e",
      roughness: 0.6,
      metalness: 0.1,
    },
    premium: {
      color: "#0f1b2b",
      roughness: 0.3,
      metalness: 0.2,
    },
    heirloom: {
      color: "#2c1810",
      roughness: 0.4,
      metalness: 0.3,
    },
  };

  const foilColor = tier === "heirloom" ? "#ffd700" : "#c0c0c0";

  return (
    <group
      ref={bookRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.05 : 1}
    >
      {/* Front Cover */}
      <mesh position={[0, 0, bookDepth / 2]} castShadow receiveShadow>
        <boxGeometry args={[bookWidth, bookHeight, 0.02]} />
        <meshStandardMaterial {...coverMaterials[tier]} />
      </mesh>

      {/* Cover Texture/Image */}
      {coverImage && (
        <mesh position={[0, 0.1, bookDepth / 2 + 0.011]}>
          <planeGeometry args={[bookWidth * 0.8, bookHeight * 0.6]} />
          <meshBasicMaterial transparent opacity={0.9}>
            {/* In production, load actual cover image texture */}
          </meshBasicMaterial>
        </mesh>
      )}

      {/* Gold Foil Title Text (Heirloom) */}
      <Text
        position={[0, 0.6, bookDepth / 2 + 0.015]}
        fontSize={0.12}
        color={foilColor}
        font="/fonts/Playfair-Display.woff"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.8}
      >
        {title}
      </Text>

      {/* Decorative Foil Border (Heirloom) */}
      {tier === "heirloom" && (
        <>
          {/* Top border */}
          <mesh position={[0, bookHeight / 2 - 0.05, bookDepth / 2 + 0.011]}>
            <boxGeometry args={[bookWidth * 0.9, 0.03, 0.001]} />
            <meshStandardMaterial
              color={foilColor}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
          {/* Bottom border */}
          <mesh position={[0, -bookHeight / 2 + 0.05, bookDepth / 2 + 0.011]}>
            <boxGeometry args={[bookWidth * 0.9, 0.03, 0.001]} />
            <meshStandardMaterial
              color={foilColor}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
        </>
      )}

      {/* Pages */}
      <mesh position={[0.02, 0, 0]} castShadow>
        <boxGeometry args={[bookWidth - 0.04, bookHeight - 0.02, pageDepth]} />
        <meshStandardMaterial color="#f5f0e6" roughness={0.8} />
      </mesh>

      {/* Page edges detail */}
      {[...Array(5)].map((_, i) => (
        <mesh
          key={i}
          position={[
            bookWidth / 2 - 0.01,
            0,
            -pageDepth / 2 + (i * pageDepth) / 5,
          ]}
        >
          <boxGeometry args={[0.001, bookHeight - 0.04, 0.02]} />
          <meshStandardMaterial color="#e8e0d0" />
        </mesh>
      ))}

      {/* Back Cover */}
      <mesh position={[0, 0, -bookDepth / 2]} castShadow receiveShadow>
        <boxGeometry args={[bookWidth, bookHeight, 0.02]} />
        <meshStandardMaterial {...coverMaterials[tier]} />
      </mesh>

      {/* Spine */}
      <mesh
        position={[-bookWidth / 2 - 0.01, 0, 0]}
        rotation={[0, Math.PI / 2, 0]}
        castShadow
      >
        <boxGeometry args={[bookDepth, bookHeight, 0.02]} />
        <meshStandardMaterial {...coverMaterials[tier]} />
      </mesh>

      {/* Spine Title */}
      <Text
        position={[-bookWidth / 2 - 0.02, 0, 0]}
        rotation={[0, -Math.PI / 2, Math.PI / 2]}
        fontSize={0.08}
        color={foilColor}
        anchorX="center"
        anchorY="middle"
      >
        {title}
      </Text>
    </group>
  );
}

/**
 * Sparkle particles for magical effect
 */
function Sparkles() {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 50;

  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 4;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 3;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2;
  }

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#ffd700"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

/**
 * Book3DPreview - Interactive 3D book preview component
 * Uses react-three-fiber for WebGL rendering
 */
const Book3DPreview = ({
  coverImage,
  title,
  childName,
  tier = "premium",
  autoRotate = true,
}: Book3DPreviewProps) => {
  const displayTitle = title || `${childName}'s Adventure`;

  return (
    <div className="w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden bg-gradient-to-b from-emerald-950 to-emerald-900">
      <Canvas camera={{ position: [0, 0, 4], fov: 45 }} dpr={[1, 2]} shadows>
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <spotLight
          position={[5, 5, 5]}
          angle={0.3}
          penumbra={0.5}
          intensity={1}
          castShadow
          shadow-mapSize={1024}
        />
        <spotLight
          position={[-5, 3, 2]}
          angle={0.4}
          penumbra={0.5}
          intensity={0.5}
          color="#ffd700"
        />

        {/* Environment for realistic reflections */}
        <Environment preset="studio" />

        {/* Floating Book */}
        <Float
          speed={autoRotate ? 1.5 : 0}
          rotationIntensity={autoRotate ? 0.2 : 0}
          floatIntensity={autoRotate ? 0.3 : 0}
        >
          <Book coverImage={coverImage} title={displayTitle} tier={tier} />
        </Float>

        {/* Magical sparkles */}
        {tier === "heirloom" && <Sparkles />}

        {/* Reflective floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
          <planeGeometry args={[10, 10]} />
          <MeshReflectorMaterial
            blur={[300, 100]}
            resolution={1024}
            mixBlur={1}
            mixStrength={30}
            roughness={1}
            depthScale={1.2}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
            color="#0a1f1a"
            metalness={0.5}
            mirror={0.5}
          />
        </mesh>

        {/* Contact shadows */}
        <ContactShadows
          position={[0, -1.49, 0]}
          opacity={0.4}
          scale={5}
          blur={2.4}
        />
      </Canvas>
    </div>
  );
};

export default Book3DPreview;
