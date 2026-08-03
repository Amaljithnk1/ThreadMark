# ThreadMark — B2B Textile Marketplace

A role-based B2B textile marketplace prototype with a separate Next.js frontend, Express REST API, PostgreSQL + pgvector data layer, Hugging Face AI features, and Cloudinary uploads.

## Applications

- `frontend/` — Next.js + Tailwind CSS + Zustand
- `backend/` — Node.js + Express REST API
- `shared/` — frontend/backend shared Zod schemas

## Required services

| Service | Purpose |
|---|---|
| PostgreSQL with pgvector | application data and vector similarity search |
| Hugging Face Serverless Inference | Llama/Mistral chat and sentence-transformer embeddings |
| Cloudinary | supplier product-image and verification-document storage |

## Environment configuration

Copy `backend/.env.example` to `backend/.env` and set the required values:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/threadmark
JWT_SECRET=replace-with-a-secure-random-secret-of-at-least-32-characters
CORS_ORIGIN=http://localhost:3000
HF_API_TOKEN=your-hugging-face-token
HF_CHAT_MODEL=meta-llama/Llama-3.1-8B-Instruct
HF_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

## Local startup

```bash
npm install
npm run db:migrate --workspace=backend
npm run db:seed-demo --workspace=backend
npm run db:backfill-embeddings --workspace=backend
npm run dev:backend
npm run dev:frontend
```

The repository includes `docker-compose.yml` with a `pgvector/pgvector:pg16` PostgreSQL service.

## Demo accounts

After running the demo seed, all accounts use:

```text
DemoPass123!
```

| Role | Email |
|---|---|
| Buyer | `buyer@northstar.demo` |
| Supplier | `hello@malabarweaves.demo` |
| Supplier | `hello@coastaltextiles.demo` |
| Supplier | `hello@erodeloomhouse.demo` |
| Admin | `admin@threadmark.demo` |

## Quality commands

```bash
npm run test --workspace=backend
npm run build --workspace=backend
npm run lint --workspace=frontend
npm run build --workspace=frontend
```

## Important live verification sequence

1. Start PostgreSQL with pgvector and run the schema migration.
2. Configure Hugging Face and Cloudinary environment variables.
3. Seed demo data, then generate vector embeddings for the seeded products.
4. Verify buyer registration/onboarding, marketplace discovery, cart, checkout, sample request, RFQ, and buyer dashboard.
5. Verify supplier onboarding, document upload, product upload/create/edit, RFQ responses, samples, and order-status workflow.
6. Verify admin supplier approval/Verified badge, moderation, buyer oversight, order oversight, and analytics.
7. Verify desktop, tablet, and mobile browser layouts before deployment.
