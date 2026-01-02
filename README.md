# FableForge (Our Story Books)

Transform family photos into magical, heirloom-quality storybooks using AI.

## Project Overview

FableForge is a "tradition-as-a-service" platform that allows users to upload a photo of their child and instantly see them transformed into the hero of an AI-illustrated storybook. The platform aims to bridge the gap between digital rapidity and physical heirlooms.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS (v4), Framer Motion for animations
- **Routing:** React Router DOM
- **Backend:** Supabase (Auth, Database, Storage, Edge Functions)
- **Payments:** Stripe (Checkout, Webhooks)
- **AI Integration:**
  - Anthropic Claude 3.5 Sonnet (Narrative Director)
  - Fal.ai Flux.1 (Digital Twin Engine - Image Generation)
- **Print Fulfillment:**
  - Gelato API (Standard tier - global local printing)
  - Bookvault API (Premium/Heirloom - specialty printing with foil)
- **Deployment:** Vercel / Netlify (Ready)

## Features

### Phase 1: Proof of Magic ✅

- **Instant Magic Preview:** Zero-shot AI transformation of uploaded photos.
- **Interactive Story Director:** Wizard to configure child's name, theme, and life lesson.
- **3D Flipbook Editor:** Realistic page-turning experience to preview the final book.
- **Heirloom Design System:** Premium UI with gold foil effects and luxury aesthetics.

### Phase 2: The Luxury Upgrade ✅

- **User Authentication:** Sign up, login, and protected routes via Supabase Auth.
- **My Magic Library:** Dashboard to view and manage saved storybooks.
- **Persistence Engine:** Stories saved to the database for logged-in users.
- **Narrative Director AI:** Integration with Claude 3.5 Sonnet for AI-generated story scripts.
- **Premium Checkout:** Tier selection (Digital, Hardcover, Heirloom) with order confirmation.
- **Input Sanitization:** Security hardening for user inputs.

### Phase 3: The Tradition Ecosystem ✅

- **Memory Jar:** Year-round photo collection with monthly prompts.
- **Digital Twin Engine:** AI image generation using Fal.ai Flux.1.
- **B2B Photographer Portal:** Partner dashboard for studios to upsell storybooks.
- **Annual Storybook Creation:** Transform 12 months of memories into a cohesive story.

### Phase 4: The Publisher ✅

- **Lemon Squeezy Integration:** Merchant of Record handling global payments, taxes, and compliance.
- **Multi-step Checkout:** Tier selection → Shipping → Payment flow.
- **PDF Generation Service:** Print-ready PDFs with foil masks for Heirloom tier.
- **Print Fulfillment:** Gelato (Standard) and Bookvault (Premium/Heirloom) API integration.
- **Supabase Edge Functions:** Secure backend for payment webhooks and order processing.
- **Order Tracking:** Status updates and PDF download for digital orders.
- **20% Photographer Commission:** Automated revenue sharing for B2B partners.

### Phase 5: Advanced Features ✅

- **PuLID Identity Preservation:** High-fidelity face consistency using Flux.1 dev + PuLID.
- **FaceDetailer:** Automatic eye and expression fixing for AI-generated images.
- **3D Book Preview:** react-three-fiber powered WebGL book with gold foil shader.
- **Vector Database (RAG):** pgvector embeddings for Memory Jar narrative consistency.
- **Real PDF Generation:** Supabase Edge Function using pdf-lib for print-ready files.

## Development

1. **Install Dependencies:**

   ```bash
   npm install
   ```

2. **Configure Environment:**
   Create a `.env` file with your keys:

   ```
   # Supabase
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

   # AI Services (optional - falls back to simulation)
   VITE_ANTHROPIC_API_KEY=your_anthropic_key
   VITE_FAL_API_KEY=your_fal_api_key

   # Payments - Lemon Squeezy (optional - falls back to simulation)
   VITE_LEMONSQUEEZY_API_KEY=your_lemonsqueezy_api_key
   VITE_LEMONSQUEEZY_STORE_ID=your_store_id
   VITE_LS_VARIANT_STANDARD=your_digital_variant_id
   VITE_LS_VARIANT_PREMIUM=your_hardcover_variant_id
   VITE_LS_VARIANT_HEIRLOOM=your_heirloom_variant_id

   # Print Fulfillment (optional - falls back to simulation)
   VITE_GELATO_API_KEY=your_gelato_key
   VITE_BOOKVAULT_API_KEY=your_bookvault_key
   ```

3. **Apply Database Migrations:**

   - Run `/supabase/migrations/initial_schema.sql` for Phase 2
   - Run `/supabase/migrations/phase3_memory_jar.sql` for Phase 3
   - Run `/supabase/migrations/phase4_photographer_portal.sql` for Phase 4
   - Run `/supabase/migrations/phase5_vector_db.sql` for Phase 5 (requires pgvector)

4. **Deploy Edge Functions:**

   ```bash
   # Payment processing (Lemon Squeezy)
   supabase functions deploy lemonsqueezy-webhook

   # AI services
   supabase functions deploy generate-story
   supabase functions deploy generate-image

   # PDF generation
   supabase functions deploy generate-pdf
   ```

5. **Run Development Server:**

   ```bash
   npm run dev
   ```

6. **Build:**
   ```bash
   npm run build
   ```

## Masterplan Status

- [x] Phase 1 MVP: "Proof of Magic" (Digital Flipbook)
- [x] Phase 2: "The Luxury Upgrade" (User Accounts, Dashboard, AI Narrative)
- [x] Phase 3: "The Tradition Ecosystem" (Memory Jar, B2B Photographer Portal)
- [x] Phase 4: "The Publisher" (Lemon Squeezy Payments, PDF Generation, Print Fulfillment)
- [x] Phase 5: "Advanced Features" (PuLID, FaceDetailer, 3D Preview, Vector DB)

## Architecture

```
src/
├── components/     # UI components (auth, features, layout, ui)
├── context/        # React contexts (AuthContext)
├── data/           # Static data (sample stories)
├── lib/            # Service integrations
│   ├── supabase.ts      # Database client
│   ├── narrative.ts     # AI story generation
│   ├── imageGen.ts      # AI image generation
│   ├── stripe.ts        # Payment processing
│   ├── pdfGenerator.ts  # PDF creation
│   └── fulfillment.ts   # Print API integration
├── pages/          # Route components
└── types/          # TypeScript definitions

supabase/
├── migrations/     # Database schema
└── functions/      # Edge Functions (Stripe webhooks)
```

## License

Proprietary. All rights reserved.
