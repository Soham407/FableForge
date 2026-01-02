# **Masterplan: Our Story Books (Project FableForge)**

## 1. Executive Summary

* **Concept:** A premium "tradition-as-a-service" platform that turns a year's worth of family photos into a high-quality, AI-illustrated storybook.
* **Core Value:** Transforming fleeting digital moments into permanent physical heirlooms.
* **Monetization:** Direct sales ($45-$200+) + Annual Subscriptions + B2B2C Photographer Packages.
* **Logistics Strategy:** "Waterfall" routing—local printing for standard books, boutique printing for heirlooms.

## 2. Target Audience

* **Primary:** Affluent parents (30-45) valuing heritage and "non-digital" play.
* **Secondary:** Grandparents seeking high-impact "legacy" gifts.
* **Strategic Partners:** High-end Photography Studios (upselling to their existing clients).

## 3. Core Features & Functionality

* **The "Hook" (Instant Preview):** Zero-shot AI generation using **Flux.1 [schnell]** for low-cost, instant results.
* **The "Digital Twin" Engine:**

  * Uses **Flux.1 [dev] + PuLID** for high-fidelity identity preservation without long training times.
  * **FaceDetailer** node (YOLO/MediaPipe) to fix eyes and expressions automatically.
* **The "Director" (Narrative):** LLM (Claude 3.5 Sonnet) generating text + image prompts in strict JSON format.
* **The "Press" (Fulfillment):** Automated generation of print-ready PDFs, including specific **Vector Masks** for foil stamping.

## 4. Financial & Global Strategy

### Unit Economics (Heirloom Edition)

| Item                  | Cost Estimate | Notes                                   |
| :-------------------- | :------------ | :-------------------------------------- |
| **Sale Price**        | **$200.00**   | Leather/Foil Edition                    |
| **COGS (Print)**      | ~$40.00       | Bookvault (Leather case, foil blocking) |
| **COGS (AI Compute)** | ~$5.00        | ~160 images via RunPod (Flux.1)         |
| **Shipping/Pack**     | ~$15.00       | Premium boxing + shipping               |
| **Gross Profit**      | **~$140.00**  | **~70% Margin**                         |

### Global Logistics ("Waterfall" Model)

* **Tier 1 (Standard - $45):** Routed to **Gelato API**.

  * *Why:* Global local production (130+ partners), low shipping costs.
* **Tier 2/3 (Heirloom - $120+):** Routed to **Bookvault API**.

  * *Why:* Exclusive access to Cloth/Leather bindings and Hot Foil Stamping (Gold/Silver).

## 5. High-Level Technical Stack

### Frontend (The Storefront)

* **Framework:** React (for web), React Native (Expo) for mobile focus.
* **Visuals:** `react-three-fiber` for 3D book previews (showing off the foil shine).

### Backend & Data (The Brain)

* **BaaS:** Supabase (PostgreSQL + Auth).
* **Vector DB:** Pinecone/Milvus to store "Memory Jar" entries (RAG) for long-term narrative consistency.
* **Orchestration:** Python (FastAPI) or ComfyUI on Serverless GPU.

### AI Pipeline (The Artist)

* **Infrastructure:** **RunPod Serverless** or Modal (Auto-scaling GPUs).
* **Model Workflow:** ComfyUI backend.

  * *Base:* Flux.1 [dev] (Superior prompt adherence).
  * *Identity:* PuLID (Zero-shot ID injection).
  * *Refinement:* FaceDetailer + 4x-UltraSharp Upscaler.

### Fulfillment Engine (The Publisher)

* **Pre-Press:** Python (`ReportLab`) or Node (`pdf-lib`) to generate:

  1. `interior.pdf` (CMYK)
  2. `cover_foil_mask.pdf` (Vector Black for foil die).

## 6. Development Milestones

### Phase 1: The "Proof of Magic" (MVP)

* **Goal:** Validate "Time to Awe" < 15s.
* **Tech:** Web App + React (Preview Mode) with Flux.1 [schnell].
* **Output:** Digital Flipbook only.

### Phase 2: The "Luxury" Upgrade

* **Goal:** Enable the $200+ price point.
* **Tech:** Integration with **Bookvault API**.
* **Feature:** Build the PDF generator for **Foil Masks**.

### Phase 3: The "Tradition" Ecosystem

* **Goal:** Retention (ARR).
* **Feature:** **"Memory Jar"** (Monthly prompts to collect photos year-round).
* **Feature:** B2B Portal for Photographers to upload client sessions.

## 7. Risk Management

* **AI Hallucinations:** Use ControlNet/OpenPose to fix anatomy; offer "Human Review" upsell ($20) for Heirloom tiers.
* **GPU Availability:** Architecture is provider-agnostic (switch between RunPod/Fal.ai/Modal).
* **Copyright:** Terms of service clarify user ownership of stories.

---
