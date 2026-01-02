/**
 * Vector Database Service for Memory Jar
 * Phase 5 Enhancement: RAG (Retrieval Augmented Generation) for narrative consistency
 *
 * Uses Supabase pgvector for storing and querying memory embeddings
 * Enables the AI to recall and reference past memories when generating stories
 */

import { supabase } from "./supabase";

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export interface MemoryEmbedding {
  id: string;
  userId: string;
  memoryId: string;
  embedding: number[];
  content: string;
  month: number;
  year: number;
  tags: string[];
  createdAt: Date;
}

export interface SimilarMemory {
  memoryId: string;
  caption: string;
  imageUrl: string;
  similarity: number;
  month: number;
  year: number;
}

/**
 * Generate text embedding
 * Uses OpenAI's text-embedding-3-small when available, falls back to semantic mock
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // Try OpenAI embeddings first (recommended for production)
  if (OPENAI_API_KEY) {
    try {
      const response = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: text,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data?.[0]?.embedding) {
          console.log("📦 Generated embedding using OpenAI");
          return data.data[0].embedding;
        }
      }
    } catch (error) {
      console.warn("OpenAI embedding failed, using semantic mock:", error);
    }
  }

  // Fallback to improved semantic mock embedding
  console.warn(
    "Using semantic mock embedding (set VITE_OPENAI_API_KEY for production)"
  );
  return generateSemanticMockEmbedding(text);
}

/**
 * Generate a semantic-aware mock embedding for development
 * Uses word-based features for better similarity matching than pure random
 */
function generateSemanticMockEmbedding(text: string): number[] {
  const dimensions = 384;
  const embedding: number[] = new Array(dimensions).fill(0);

  // Tokenize and normalize
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  // Semantic word categories for children's storybooks
  const semanticCategories: Record<string, number[]> = {
    // Emotions (dims 0-40)
    happy: [0, 1, 2],
    joy: [0, 1, 3],
    smile: [1, 2, 4],
    laugh: [2, 3, 5],
    brave: [10, 11, 12],
    courage: [10, 11, 13],
    fear: [15, 16, 17],
    kind: [20, 21, 22],
    love: [20, 22, 23],
    friend: [25, 26, 27],

    // Activities (dims 50-100)
    play: [50, 51, 52],
    run: [53, 54, 55],
    jump: [56, 57, 58],
    learn: [60, 61, 62],
    read: [63, 64, 65],
    draw: [66, 67, 68],
    swim: [70, 71, 72],
    bike: [73, 74, 75],
    climb: [76, 77, 78],

    // Nature/Places (dims 100-150)
    beach: [100, 101, 102],
    ocean: [100, 103, 104],
    sand: [101, 105],
    forest: [110, 111, 112],
    tree: [110, 113],
    garden: [115, 116],
    park: [120, 121, 122],
    adventure: [125, 126, 127],
    explore: [128, 129],

    // Family (dims 150-200)
    mom: [150, 151],
    mother: [150, 152],
    dad: [155, 156],
    father: [155, 157],
    family: [160, 161, 162],
    brother: [165, 166],
    sister: [167, 168],
    grandma: [170, 171],
    grandpa: [172, 173],
    pet: [175, 176],
    dog: [177],
    cat: [178],

    // Seasons/Time (dims 200-250)
    summer: [200, 201, 202],
    winter: [205, 206, 207],
    spring: [210, 211],
    fall: [215, 216],
    autumn: [215, 217],
    birthday: [220, 221, 222],
    holiday: [225, 226, 227],
    christmas: [225, 228],
    first: [230, 231],

    // Milestones (dims 250-300)
    school: [250, 251, 252],
    celebrate: [255, 256],
    graduation: [258, 259],
    tooth: [260, 261],
    walk: [265, 266],
    talk: [268, 269],
    new: [270, 271],
  };

  // Activate dimensions based on semantic words found
  for (const word of words) {
    const dims = semanticCategories[word];
    if (dims) {
      for (const dim of dims) {
        embedding[dim] += 1.0;
      }
    }

    // Also use character-based hash for words not in categories
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash << 5) - hash + word.charCodeAt(i);
      hash = hash & hash;
    }
    const baseDim = 300 + (Math.abs(hash) % 84);
    embedding[baseDim] += 0.5;
  }

  // Add overall text characteristics
  embedding[380] = Math.min(words.length / 20, 1); // Length feature
  embedding[381] = text.includes("!") ? 1 : 0; // Excitement
  embedding[382] = text.includes("?") ? 1 : 0; // Question
  embedding[383] =
    words.filter((w) => w.length > 6).length / Math.max(words.length, 1); // Complexity

  // Normalize the embedding
  const magnitude = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0)
  );

  if (magnitude > 0) {
    return embedding.map((val) => val / magnitude);
  }

  // Return small random values if text is empty
  return embedding.map((_, i) => Math.sin(i * 0.1) * 0.01);
}

/**
 * Store a memory with its embedding for future retrieval
 */
export async function storeMemoryEmbedding(
  memoryId: string,
  caption: string,
  tags: string[],
  month: number,
  year: number
): Promise<boolean> {
  try {
    const embedding = await generateEmbedding(caption);

    // Store in Supabase (requires pgvector extension)
    const { error } = await supabase.from("memory_embeddings").upsert({
      memory_id: memoryId,
      embedding,
      content: caption,
      tags,
      month,
      year,
    });

    if (error) {
      // If table doesn't exist, log and continue (demo mode)
      console.warn(
        "Memory embedding storage failed (table may not exist):",
        error.message
      );
      return false;
    }

    console.log("📦 Memory embedding stored successfully");
    return true;
  } catch (error) {
    console.error("Failed to store memory embedding:", error);
    return false;
  }
}

/**
 * Find similar memories using vector similarity search
 * Used by the narrative engine to recall relevant past memories
 */
export async function findSimilarMemories(
  query: string,
  userId: string,
  options: {
    limit?: number;
    minSimilarity?: number;
    yearFilter?: number;
  } = {}
): Promise<SimilarMemory[]> {
  const { limit = 5, minSimilarity = 0.7, yearFilter } = options;

  try {
    const queryEmbedding = await generateEmbedding(query);

    // Query using pgvector similarity search
    // Note: This requires the pgvector extension in Supabase
    let queryBuilder = supabase.rpc("match_memories", {
      query_embedding: queryEmbedding,
      match_threshold: minSimilarity,
      match_count: limit,
      user_id_filter: userId,
    });

    if (yearFilter) {
      queryBuilder = queryBuilder.eq("year", yearFilter);
    }

    const { data, error } = await queryBuilder;

    if (error) {
      console.warn(
        "Similar memory search failed (function may not exist):",
        error.message
      );
      return getDemoSimilarMemories();
    }

    return data || [];
  } catch (error) {
    console.error("Failed to find similar memories:", error);
    return getDemoSimilarMemories();
  }
}

/**
 * Get demo similar memories for development
 */
function getDemoSimilarMemories(): SimilarMemory[] {
  return [
    {
      memoryId: "demo-1",
      caption: "First day at the beach, building sandcastles with Dad",
      imageUrl:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400",
      similarity: 0.92,
      month: 6,
      year: 2024,
    },
    {
      memoryId: "demo-2",
      caption: "Learning to ride a bike in the park",
      imageUrl:
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
      similarity: 0.85,
      month: 4,
      year: 2024,
    },
    {
      memoryId: "demo-3",
      caption: "Birthday party with friends and the big chocolate cake",
      imageUrl:
        "https://images.unsplash.com/photo-1464349153735-7db50ed83c84?w=400",
      similarity: 0.78,
      month: 9,
      year: 2024,
    },
  ];
}

/**
 * Build a narrative context from similar memories
 * Used to provide the AI with relevant past experiences
 */
export async function buildNarrativeContext(
  userId: string,
  currentTheme: string,
  year?: number
): Promise<string> {
  const similarMemories = await findSimilarMemories(
    `A ${currentTheme} adventure story for a child`,
    userId,
    { limit: 5, yearFilter: year }
  );

  if (similarMemories.length === 0) {
    return "";
  }

  const memoryContext = similarMemories
    .map((m, i) => `[Memory ${i + 1} - ${getMonthName(m.month)}]: ${m.caption}`)
    .join("\n");

  return `
The following are real memories from this child's year that should be woven into the story:

${memoryContext}

Use these memories naturally within the narrative to create a personalized story that references real experiences.
  `.trim();
}

/**
 * Get month name from number
 */
function getMonthName(month: number): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[month] || "Unknown";
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
