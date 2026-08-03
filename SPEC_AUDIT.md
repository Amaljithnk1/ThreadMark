# Locked Build Plan — Strict Audit

**Audit basis:** the user-provided “B2B Textile Marketplace — Full Build Specification.”

**Method:** code and route review only. A successful TypeScript build, lint run, or unit test is **not** treated as proof that an external service, database workflow, browser permission, deployment, or full end-to-end flow works.

---

## A. Unauthorized additions or deviations from the locked plan

### A1. Product/brand naming — added
**What was added:** the name **former placeholder brand** is used in UI copy, metadata, demo emails, and project/package names.

**Why this is a deviation:** the locked plan specifies a visual system but does not name the product. This is a presentation decision I made without confirmation.

**Impact:** low functional impact, but it is outside a literal “follow it exactly” interpretation.

---

### A2. Supplier sample-management page — added beyond explicit supplier scope
**What was added:** `/supplier/samples`, plus supplier sample status APIs.

**Plan source:** the plan requires buyer-side sample tracking: **“Sample request tracking (requested/shipped/delivered), separate from order history.”** It requires a sample request to have its lifecycle, but does not explicitly require a separate supplier sample-management module/page.

**Impact:** additive functionality, not a replacement for any specified workflow. It should be treated as extra scope.

---

### A3. README, Playwright, runtime smoke-test tooling — added
**What was added:** `README.md`, Playwright dependency/browser setup, responsive smoke-test setup, and API/frontend runtime smoke tests.

**Impact:** development/quality tooling only, not a buyer/supplier/admin feature. This is extra implementation support, not a product-scope substitution.

---

### A4. AI command prefixes — implementation-specific addition
**What was added:** assistant command recognition such as `semantic:`, `similar to`, and `inspiration` to trigger semantic search.

**Plan source:** semantic search is required, but these literal phrases are not specified.

**Impact:** low; this is an implementation detail for the required semantic-search capability.

---

### A5. Cloudinary integration — user-approved, not an unauthorized addition
**What was added:** Cloudinary upload transport and storage.

**Source of authorization:** the user explicitly selected **“cloud object storage, using Cloudinary free tier.”**

**Impact:** not counted as an unapproved extra.

---

## B. Previously added deviations that were corrected

### B1. Silent marketplace/product fallback catalogue — removed
A frontend demo fallback was previously added. The user/Claude correction required that it be removed or visibly labeled. It was removed from marketplace discovery and product-detail API failure paths.

**Current status:** marketplace and product detail show an unavailable/error state rather than silently pretending demo data is live.

### B2. Keyword-based AI category suggestion — removed
The initial keyword suggestion did not satisfy the plan requirement: **“AI-assisted categorization … using the embedding/AI layer.”**

**Current status:** replaced with Hugging Face embeddings plus cosine similarity against category embeddings.

---

## C. Genuine omissions or incomplete/partial plan implementations

### C1. Landing-page featured products still use frontend demo data — critical deviation
**Current code behavior:** the landing page imports `demoProducts` directly and renders them as Featured Fabric Lots.

**Why this is incomplete/deviates:** the user/Claude correction rejected silently showing frontend fallback catalogue data as if it were live. While the marketplace and product detail were corrected, the landing featured-products section still uses frontend demo data.

**Required correction:** fetch featured products from the live `/api/products` endpoint and render an explicit error/empty state if the backend is unavailable. Do not silently use the frontend `demoProducts` list in production.

---

### C2. Buyer/supplier onboarding is scripted chat/voice, not Hugging Face-driven conversational AI — partial
**Plan source:** **“Buyer Onboarding — AI-driven (chat-based conversational flow, not a static form)”** and **“Supplier Onboarding — AI-driven (chat/voice)”**.

**Current implementation:** a scripted sequence of questions with browser voice transcription. It persists answers correctly and uses shared Zod validation, but it does not use the Hugging Face conversational model to conduct/adapt the onboarding conversation.

**Required correction:** route onboarding conversation prompts/responses through the defined Hugging Face assistant service, while retaining deterministic field collection and validation.

---

### C3. Assistant product Q&A is only partly deterministic — partial
**Plan source:** **“Product Q&A (answers grounded in that product's actual DB record — RAG-style, not hallucinated)”**.

**Current implementation:** GSM, composition, weave, certifications, stock type, lead time, and available stock are answered directly from the database for common matching questions. Other questions still go to the Hugging Face chat model with product record context.

**Risk:** context grounding reduces hallucination but does not prove that every arbitrary answer is fully record-bounded.

**Required correction:** constrain product-context Q&A to a strict structured field allowlist or post-validate all generated answers against the selected product record.

---

### C4. Assistant comparison is not directly invoked by ordinary comparison language — partial
**Plan source:** **“Product comparison (structured side-by-side output on request).”**

**Current implementation:** the comparison API and comparison UI work; buyers can select products from marketplace discovery and compare them. The AI chat does not robustly resolve ordinary requests such as “compare Organic Cotton Twill and Linen Cotton Herringbone” into the comparison page/result.

**Required correction:** add entity resolution in the assistant, then open/render the structured comparison result on an ordinary chat comparison request.

---

### C5. Admin “most compared products” shows product IDs, not product names — partial
**Plan source:** **“Analytics: category-level demand trends, most-viewed/most-compared products.”**

**Current implementation:** comparison analytics returns/render product IDs and event counts, while most-viewed products render names.

**Required correction:** join `comparison_events.product_ids` back to `products` and render product names for most-compared analytics.

---

### C6. Category demand is aggregate demand, not a time-series trend — partial
**Plan source:** **“Analytics: category-level demand trends.”**

**Current implementation:** category totals are aggregated from order items. No date grouping/trend comparison is rendered.

**Required correction:** aggregate category demand by a temporal period (for example weekly/monthly) and render change/trend data.

---

### C7. Supplier product edit supports adding Cloudinary images but not removing/reordering existing images — partial
**Plan source:** **“Upload Product Images”** and product inventory edit management.

**Current implementation:** creation uploads images; editing can append new Cloudinary images. Existing images cannot be selected for deletion or reordered in the edit UI.

**Required correction:** add explicit image-gallery management controls and save the updated `images[]` order/list.

---

### C8. Buyer/supplier/admin frontend pages lack explicit client-side route guards — partial
**Plan source:** **“Role-based access control (RBAC) enforced on every protected route.”**

**Current implementation:** backend protected API routes use JWT/RBAC middleware. A user can manually navigate to a role page in Next.js, but the protected API calls reject access. This protects data/actions but not the frontend route shell itself.

**Required correction:** add Next.js role-aware route protection/redirects for buyer, supplier, and admin UI routes in addition to the backend enforcement.

---

### C9. Shared Zod coverage is incomplete outside the explicitly listed primary forms — partial
**Plan source:** **“Zod — schemas shared between frontend and backend, applied to every form (auth, onboarding, checkout, product create/edit).”**

**Current status:** shared schemas now cover auth, onboarding/profile, checkout, product create/edit, RFQ request/quote, and sample requests. Several operational actions still use local backend Zod schemas or no frontend schema, such as order status updates, supplier verification metadata, admin moderation actions, comparison selection, and AI request payloads.

**Interpretation note:** the parenthetical explicitly names the primary forms; those are covered. The strict “every form” wording is not yet fully covered.

---

### C10. Full reusable component library is partial
**Plan source:** **“Reusable component library: shared components (e.g. ProductCard, FormField, Modal, StatusBadge, DashboardWidget) reused across buyer, supplier, and admin UIs.”**

**Current implementation:** shared `ProductCard`, `StatusBadge`, `DashboardWidget`, `SiteHeader`, AI widget, cart panel, and related modules exist. There is no reusable generic `FormField` or generic `Modal`; the sample request dialog is page-specific.

**Required correction:** extract common form-field and modal components where they are actually reused.

---

## D. Required items implemented in code but NOT live-verified

These are not claimed complete until credentials/environment are supplied.

### D1. PostgreSQL + pgvector database lifecycle
**Plan source:** **“PostgreSQL, with the `pgvector` extension enabled”** and realistic seed/embedding requirements.

**Blocked because:** this workspace has no Docker and no `psql` binary.

Not live-tested:
- `001_initial_schema.sql` migration execution
- pgvector extension/index creation
- demo seed execution
- time-staggered data verification
- embedding backfill
- pgvector similarity queries
- cart transaction/oversell handling against a live database
- all database-backed visibility and RFQ/order flows

### D2. Hugging Face live service behavior
**Plan source:** Hugging Face model, warming, cache, retry, embeddings, assistant requirements.

**Blocked because:** no `HF_API_TOKEN` has been supplied.

Not live-tested:
- inference endpoint availability/model access
- real cold-start warm-up
- rate-limit/backoff behavior
- actual embeddings/vector dimensions
- real assistant responses and privacy guard under model output

### D3. Cloudinary live uploads
**Plan source:** supplier image/document uploads, with Cloudinary selected by the user.

**Blocked because:** no Cloudinary credentials have been supplied.

Not live-tested:
- product image upload
- verification document upload
- returned hosted URLs
- Cloudinary image rendering with a real account

### D4. Browser microphone and spoken output
**Plan source:** Web Speech API input/output.

**Blocked because:** automated/headless browser tests do not provide a real user microphone permission flow.

Not live-tested:
- microphone permission prompt
- actual speech transcription quality
- audible SpeechSynthesis output on a user device

### D5. Full end-to-end role workflow and deployment
**Plan source:** **“Core marketplace workflows should function end-to-end”** and a **“Live deployed website URL.”**

Not live-tested/deployed:
- buyer → cart → checkout → supplier order → supplier lifecycle status → buyer tracking
- buyer RFQ → supplier quote → buyer acceptance → order conversion
- supplier document upload → admin review → approve/verify → buyer marketplace visibility
- buyer sample → supplier shipped/delivered → buyer tracking
- deployed frontend/backend/database/CORS/cookie behavior
- live deployed URL

---

## E. Items that appear implemented in code

The following have code paths/pages/APIs and passed local compile/lint/unit/runtime smoke checks, but database-dependent behavior is still in section D.

- Separate Next.js frontend, Express REST API, shared package, Zustand, Tailwind custom token system.
- JWT auth, public buyer/supplier registration, seeded-only admin script, login/logout, backend RBAC.
- Guest marketplace product listing/detail APIs with unapproved/flagged/removed buyer-visibility filtering.
- Technical filters, pagination, grid/list views, mobile navigation, lazy/optimized image rendering.
- Product details, colors, multi-image gallery, specification ledger, price tiers, certifications, sustainability tags, Verified badge.
- Cart, checkout, transactional backend order creation/stock controls.
- Buyer dashboard, order history/status tracker, reorder-cadence calculation, sample requests, RFQs, profile.
- Supplier onboarding/profile, Cloudinary upload code, catalogue create/edit/delete, inventory/tiers, order and RFQ management, samples, dashboard.
- Admin dashboard, supplier approval/verification, buyer oversight, order oversight, moderation, analytics surfaces.
- Hugging Face API service code, cache/backoff/warm code, embeddings, semantic search, recommendations, similar products, use-case matching, AI chat/voice UI, product-context Q&A, agentic cart action.
- Responsive browser check for marketplace desktop/tablet/mobile widths without horizontal overflow.

---

## F. Exact corrections recommended before final handoff

1. Replace landing-page `demoProducts` with live featured-products API data and an explicit unavailable state.
2. Make onboarding genuinely Hugging Face-driven while preserving deterministic form fields/validation.
3. Make product-context Q&A strict allowlist/record-validated for every answer.
4. Add assistant entity-resolution for ordinary product-comparison language.
5. Render product names and time-based category trends in admin analytics.
6. Add product image delete/reorder in supplier edit flow.
7. Add client-side role route guards.
8. Finish reusable `FormField` / `Modal` extraction where warranted.
9. Supply live service credentials and a PostgreSQL + pgvector database, then run the section D verification list.
