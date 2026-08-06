import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { query } from "../config/db.js";
import { HttpError } from "../utils/http-error.js";

const listingSchema = z.object({
  page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(48).default(12),
  search: z.string().trim().max(160).optional(), category: z.string().trim().max(100).optional(),
  gsmMin: z.coerce.number().min(0).optional(), gsmMax: z.coerce.number().min(0).optional(), composition: z.string().trim().max(100).optional(),
  weaveType: z.string().trim().max(100).optional(), stockType: z.enum(["ready_stock", "made_to_order"]).optional(), certification: z.string().trim().max(100).optional(), sustainabilityTag: z.string().trim().max(100).optional(),
});
const baseSelect = `SELECT p.id, p.supplier_id, p.name, p.category, p.description, p.colors, p.specifications, p.gsm, p.composition, p.weave_type, p.width, p.shrinkage_rate, p.colorfastness_rating, p.stock_qty, p.stock_type, p.lead_time_days, p.certifications, p.price, p.images, p.sustainability_tags, sp.business_name AS supplier_name, sp.product_categories AS supplier_categories, sp.fabric_types_offered, sp.moq, sp.verification_status, (jsonb_array_length(COALESCE(sp.verification_documents,'[]'::jsonb))>0 AND NOT sp.documents_flagged) AS documents_submitted FROM products p JOIN supplier_profiles sp ON sp.user_id = p.supplier_id WHERE p.status = 'available' AND sp.status = 'approved'`;
export async function listProducts(req: Request, res: Response, next: NextFunction) { try {
  const params = listingSchema.parse(req.query); const values: unknown[] = []; const conditions: string[] = [];
  const bind = (value: unknown) => { values.push(value); return `$${values.length}`; };
  if (params.search) { const p = bind(`%${params.search}%`); conditions.push(`(p.name ILIKE ${p} OR p.description ILIKE ${p} OR p.composition ILIKE ${p} OR p.category ILIKE ${p})`); }
  if (params.category) conditions.push(`p.category ILIKE ${bind(`%${params.category}%`)}`);
  if (params.gsmMin !== undefined) conditions.push(`p.gsm >= ${bind(params.gsmMin)}`);
  if (params.gsmMax !== undefined) conditions.push(`p.gsm <= ${bind(params.gsmMax)}`);
  if (params.composition) conditions.push(`p.composition ILIKE ${bind(`%${params.composition}%`)}`);
  if (params.weaveType) conditions.push(`p.weave_type ILIKE ${bind(`%${params.weaveType}%`)}`);
  if (params.stockType) conditions.push(`p.stock_type = ${bind(params.stockType)}`);
  if (params.certification) conditions.push(`${bind(params.certification)} = ANY(p.certifications)`);
  if (params.sustainabilityTag) conditions.push(`${bind(params.sustainabilityTag)} = ANY(p.sustainability_tags)`);
  const where = conditions.length ? ` AND ${conditions.join(" AND ")}` : "";
  const countResult = await query<{ count: string }>(`SELECT count(*) FROM products p JOIN supplier_profiles sp ON sp.user_id = p.supplier_id WHERE p.status = 'available' AND sp.status = 'approved'${where}`, values);
  values.push(params.limit, (params.page - 1) * params.limit);
  const products = await query(`${baseSelect}${where} ORDER BY p.id DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values);
  res.json({ data: products.rows, pagination: { page: params.page, limit: params.limit, total: Number(countResult.rows[0].count), totalPages: Math.ceil(Number(countResult.rows[0].count) / params.limit) } });
} catch (error) { next(error); } }
export async function getProduct(req: Request, res: Response, next: NextFunction) { try {
  const product = await query(`${baseSelect} AND p.id = $1`, [req.params.id]);
  if (!product.rows[0]) throw new HttpError(404, "This product is not available in the marketplace");
  const tiers = await query("SELECT min_qty, price_per_unit FROM price_tiers WHERE product_id = $1 ORDER BY min_qty ASC", [req.params.id]);
  res.json({ data: { ...product.rows[0], price_tiers: tiers.rows } });
} catch (error) { next(error); } }

export async function similarProducts(req: Request, res: Response, next: NextFunction) { try {
  const result = await query(`${baseSelect} AND p.id <> $1 AND p.embedding IS NOT NULL AND (SELECT embedding FROM products WHERE id = $1) IS NOT NULL ORDER BY p.embedding <=> (SELECT embedding FROM products WHERE id = $1) ASC LIMIT 4`, [req.params.id]);
  res.json({ data: result.rows });
} catch (error) { next(error); } }
export async function recordProductView(req: Request, res: Response, next: NextFunction) { try { const product=await query("SELECT p.id FROM products p JOIN supplier_profiles sp ON sp.user_id=p.supplier_id WHERE p.id=$1 AND p.status='available' AND sp.status='approved'",[req.params.id]); if(!product.rows[0]) throw new HttpError(404,"This product is not available in the marketplace"); await query("INSERT INTO product_views (buyer_id,product_id) VALUES ($1,$2)",[req.auth!.userId,req.params.id]); res.status(204).send(); } catch(error){next(error)} }
export async function getProductReviews(req: Request, res: Response, next: NextFunction) { try { const result = await query(`SELECT r.id, r.rating, r.comment, r.supplier_reply, r.supplier_replied_at, r.verified_purchase, r.created_at, split_part(u.email, '@', 1) AS buyer_name FROM product_reviews r JOIN users u ON u.id = r.buyer_id WHERE r.product_id = $1 ORDER BY r.created_at DESC`, [req.params.id]); res.json({ data: result.rows }); } catch (error) { next(error); } }
export async function checkReviewEligibility(req: Request, res: Response, next: NextFunction) { try { const result = await query(`SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.buyer_id = $1 AND oi.product_id = $2 AND o.status = 'completed' LIMIT 1`, [req.auth!.userId, req.params.id]); const existing = await query(`SELECT rating, comment FROM product_reviews WHERE product_id = $1 AND buyer_id = $2`, [req.params.id, req.auth!.userId]); res.json({ data: { eligible: result.rows.length > 0, existingReview: existing.rows[0] || null } }); } catch (error) { next(error); } }
export async function submitProductReview(req: Request, res: Response, next: NextFunction) { try { const { rating, comment } = req.body; if (!rating || rating < 1 || rating > 5) throw new HttpError(400, "Rating must be between 1 and 5"); const eligible = await query(`SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id WHERE o.buyer_id = $1 AND oi.product_id = $2 AND o.status = 'completed' LIMIT 1`, [req.auth!.userId, req.params.id]); if (eligible.rows.length === 0) throw new HttpError(403, "You must have a completed order for this product to leave a review."); await query(`INSERT INTO product_reviews (product_id, buyer_id, rating, comment) VALUES ($1, $2, $3, $4) ON CONFLICT (product_id, buyer_id) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, updated_at = now()`, [req.params.id, req.auth!.userId, rating, comment]); res.status(201).json({ message: "Review submitted" }); } catch (error) { next(error); } }
export async function replyToProductReview(req: Request, res: Response, next: NextFunction) { try { const { reply } = req.body; if (!reply) throw new HttpError(400, "Reply text is required"); const product = await query("SELECT supplier_id FROM products WHERE id = $1", [req.params.id]); if (product.rows.length === 0 || product.rows[0].supplier_id !== req.auth!.userId) { throw new HttpError(403, "Only the supplier of this product can reply to reviews"); } await query("UPDATE product_reviews SET supplier_reply = $1, supplier_replied_at = now() WHERE id = $2 AND product_id = $3", [reply, req.params.reviewId, req.params.id]); res.json({ message: "Reply saved" }); } catch (error) { next(error); } }
export async function deleteProductReview(req: Request, res: Response, next: NextFunction) { try { const result = await query("DELETE FROM product_reviews WHERE product_id = $1 AND buyer_id = $2 RETURNING id", [req.params.id, req.auth!.userId]); if (result.rows.length === 0) throw new HttpError(404, "Review not found"); res.status(204).send(); } catch (error) { next(error); } }
