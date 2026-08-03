# B2B Textile Marketplace — Locked Build Checklist

**Implementation source of truth:** User-provided “B2B Textile Marketplace — Full Build Specification”.

**Control rule:** Every checkbox below corresponds to a specified implementation item. No feature, dependency, visual pattern, route, field, or workflow may be added unless it is represented in the supplied specification. Items are checked only after implementation and verification.

## 1. Fixed technology and operating constraints
- [ ] Next.js (React) frontend.
- [ ] Tailwind CSS is the only styling framework; custom §11 tokens are configured and default Tailwind colours/fonts are not used.
- [ ] Separate Node.js + Express REST API; Next.js API routes are not used.
- [ ] PostgreSQL database with pgvector enabled.
- [ ] Zustand for cart, auth, and AI chat/voice conversation state.
- [ ] Shared frontend/backend Zod validation schemas used on every auth, onboarding, checkout, and product create/edit form.
- [ ] JWT auth with buyer, supplier, admin roles and RBAC on every protected route.
- [ ] Server-side sentence-transformers-class embeddings stored in `products.embedding` pgvector.
- [ ] Hugging Face Serverless Inference conversational assistant using Llama 3.1 8B Instruct or Mistral 7B Instruct; no paid LLM API.
- [ ] Web Speech API input/output, with no external voice provider.
- [ ] HF model warm/ping on app load or before demo use.
- [ ] Explicit assistant “thinking…” state.
- [ ] Server-side embedding lookup cache.
- [ ] Exponential-backoff retries for rate-limit responses.
- [ ] No agent-managed version-control workflow; finished export is prepared for the user to push to GitHub as a real repository after build completion.

## 2. PostgreSQL schema and realistic seed data
- [ ] `users`: id, email, password_hash, role, created_at.
- [ ] `buyer_profiles`: all specified preference fields.
- [ ] `supplier_profiles`: all business fields, marketplace status, verification documents/status.
- [ ] `products`: all specified base/specification, stock, certification, lifecycle, and embedding fields.
- [ ] `products.sustainability_tags[]`.
- [ ] `sample_requests`: separate sample lifecycle fields.
- [ ] `price_tiers`.
- [ ] `carts` and `cart_items`.
- [ ] `orders`.
- [ ] `order_items`.
- [ ] `order_status_history` with all five specified statuses.
- [ ] `ai_conversations`.
- [ ] `product_views`.
- [ ] `comparison_events`.
- [ ] `rfq_requests`, including nullable product/custom-spec fields and all statuses.
- [ ] `rfq_quotes`, including all quote fields/statuses.
- [ ] Realistic time-staggered seeded order history and product views.

## 3. Authentication — build and test first
- [ ] Public buyer registration.
- [ ] Public supplier registration.
- [ ] No public admin registration; admin is seeded/invite-only.
- [ ] Login, JWT issuance, token role embedding, logout.
- [ ] RBAC middleware on every protected API route.
- [ ] Thorough authentication testing before other modules.

## 4. Buyer experience
### Discovery
- [ ] Landing page.
- [ ] Responsive navigation.
- [ ] Featured products.
- [ ] Product categories.
- [ ] Search.
- [ ] Filtering.
- [ ] Product grid/listing view.
- [ ] Filters: GSM range, composition, weave type, ready-stock/made-to-order, certifications.
- [ ] Guest browsing/search/filter/product details fully work without login.
- [ ] Product-grid pagination or infinite scrolling.
- [ ] Image lazy loading and compression.
- [ ] Indexed database search/filter columns.

### AI marketplace assistant
- [ ] Buyer-journey-wide conversational chat widget.
- [ ] Voice interaction: microphone input and spoken output.
- [ ] Natural-language search to structured filters.
- [ ] Embedding-based recommendations from onboarding preferences and browsing history.
- [ ] Structured side-by-side product comparison.
- [ ] Embedding nearest-neighbour similar products on product detail pages.
- [ ] DB-grounded product Q&A covering specified fabric fields.
- [ ] Agentic add-to-cart with explicit on-screen confirmation.
- [ ] Embedding-based use-case fabric matching.
- [ ] Strict public-only supplier-data allowlist; no private contact/address/operating-hours disclosure.
- [ ] Traditional browsing/search/filter independently functional with AI unavailable.

### Product details
- [ ] Images, name, category, description, colours, specifications, stock, price, add-to-cart.
- [ ] Price tiers table.
- [ ] GSM, composition, weave, width, shrinkage rate, colourfastness displayed.
- [ ] Stock type and made-to-order lead time displayed.
- [ ] Certification badges displayed.
- [ ] Verified supplier badge displayed when verified.
- [ ] Sustainability tags displayed.
- [ ] Separate sample-request action creating `sample_requests`.

### RFQ
- [ ] Product-linked quote request with quantity, optional target price, needed-by date.
- [ ] Off-catalog quote request with `custom_spec` and no product ID.
- [ ] Supplier quote/reject actions with price, lead time, notes.
- [ ] Buyer quote review, accept-to-order, reject flow.
- [ ] Structured-only exchange that does not expose either party’s personal contact data.

### Buyer account and onboarding
- [ ] Buyer register/login/logout and minimal profile management.
- [ ] Chat-based AI buyer onboarding collecting every specified buyer-profile field.

### Cart and checkout
- [ ] Add/update/remove cart items.
- [ ] Cart order summary.
- [ ] Checkout shipping information.
- [ ] Checkout order summary/review/place-order/confirmation.
- [ ] No payment implementation.

### Buyer dashboard
- [ ] Profile, previous orders, current orders, order-status tracking.
- [ ] Separate sample-request tracking.
- [ ] Simulated visual delivery progress from `order_status_history`.
- [ ] Computed reorder-pattern recognition from actual seeded order timestamps.

## 5. Supplier experience
### Onboarding
- [ ] Chat/voice AI supplier onboarding collecting all specified supplier-profile fields.
- [ ] Optional certification-document upload during onboarding and later profile editing; persists to verification documents.

### Dashboard
- [ ] Total products, active products, pending orders, recent orders, inventory alerts.
- [ ] Active pending-order notification badge/counter.
- [ ] Product-views-based trending/most-viewed widget with real counts.

### Inventory
- [ ] Add/edit/delete products.
- [ ] Inventory updates.
- [ ] Product image upload.
- [ ] Available/out-of-stock controls.
- [ ] Bulk price-tier controls.
- [ ] AI-assisted category/tag suggestions when adding products.

### Orders and RFQs
- [ ] Incoming order list/details.
- [ ] Exact status pipeline: Pending → Accepted → Preparing → Ready for Dispatch → Completed.
- [ ] Separate RFQ inbox for catalog and off-catalog requests.
- [ ] Structured quote/reject action with no personal-contact exposure.

### Profile
- [ ] Business name, contact information, business address, operating hours management.

## 6. Admin dashboard
- [ ] Seeded/invite-only admin auth tier.
- [ ] Overview: buyers, suppliers, products, orders, mock GMV, activity feed.
- [ ] Supplier list/search/profile review.
- [ ] Verification-document review.
- [ ] Approve/suspend supplier control.
- [ ] Grant/revoke Verified status control.
- [ ] Verified badge across listings, supplier profile, and assistant responses.
- [ ] Buyer list/search/activity view.
- [ ] Cross-supplier order/status view.
- [ ] Flag/remove product moderation.
- [ ] Demand trends and most-viewed/most-compared analytics.

## 7. Required cross-system wiring
- [ ] Flagged/removed products excluded from every buyer-facing query.
- [ ] Products from unapproved suppliers excluded from every buyer-facing query.
- [ ] AI public/private supplier fields share the same supplier-profile source of truth.
- [ ] RFQ privacy boundary consistently prevents contact exposure.

## 8. Scope exclusions
- [ ] No payment gateway or payment processing.
- [ ] No escrow.
- [ ] No real logistics/courier integration; only internal simulated delivery tracking.

## 9. Architecture, quality, and edge cases
- [ ] Responsive functionality explicitly tested on desktop, tablet, mobile.
- [ ] REST resources and separated `routes/`, `controllers/`, `services/`, `models/` API organization.
- [ ] Clean, organized codebase.
- [ ] Reused shared components: ProductCard, FormField, Modal, StatusBadge, DashboardWidget or equivalent specified examples.
- [ ] Backend prevention of overselling, invalid quantities, and other broken states.

## 10. Required build sequence
- [ ] 1. Database schema and tested authentication.
- [ ] 2. Buyer discovery, details, cart, checkout.
- [ ] 3. Supplier onboarding, dashboard, inventory, orders.
- [ ] 4. AI embedding layer.
- [ ] 5. AI conversational/voice assistant.
- [ ] 6. Full admin module.
- [ ] 7. All listed creativity features.
- [ ] 8. Performance and three-breakpoint responsive testing.
- [ ] 9. Realistic, time-staggered final demo seed data.

## 11. Required visual system and quality floor
- [ ] Custom theme: indigo #29335C, cotton #EDE6D8, ochre/rust #A8452F, walnut #2B241C, loom-grey #A79C8A, muted semantic colours.
- [ ] Fraunces display, IBM Plex Sans body, IBM Plex Mono utility/data typography.
- [ ] Swatch-tag physical-card motif with top-corner notch/hole.
- [ ] Swatch-tag product cards.
- [ ] Swatch-tag Verified Supplier badge.
- [ ] Swatch-tag assistant chat bubble/avatar container.
- [ ] Landing hero has a subtle CSS woven-grid texture; does not use a stock photo.
- [ ] Product spec ledger/table uses mono type.
- [ ] Buyer/supplier/admin data dashboards use dense, ledger-style tables and mono numeric data.
- [ ] No prohibited AI-default styling patterns.
- [ ] Visible keyboard focus on all interactive elements.
- [ ] `prefers-reduced-motion` support for animations.
- [ ] Plain active-voice user-facing copy with actionable errors.

## Verification log
- [ ] Checklist created and plan locked before application code.
- [ ] Workspace inspected.
- [ ] Plan revised: no agent-managed Git workflow; no application code written before plan lock.
