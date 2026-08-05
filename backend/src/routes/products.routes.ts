import { Router } from "express";
import { requireRole } from "../middleware/auth.middleware.js";
import { getProduct, listProducts, recordProductView, similarProducts, getProductReviews, submitProductReview, checkReviewEligibility } from "../controllers/products.controller.js";
const router = Router();
router.get("/", listProducts); router.get("/:id/similar", similarProducts); router.post("/:id/view", requireRole("buyer"), recordProductView); router.get("/:id", getProduct);
router.get("/:id/reviews", getProductReviews); router.post("/:id/reviews", requireRole("buyer"), submitProductReview); router.get("/:id/reviews/eligibility", requireRole("buyer"), checkReviewEligibility);
export default router;
