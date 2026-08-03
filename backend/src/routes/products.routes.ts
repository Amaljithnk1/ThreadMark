import { Router } from "express";
import { requireRole } from "../middleware/auth.middleware.js";
import { getProduct, listProducts, recordProductView, similarProducts } from "../controllers/products.controller.js";
const router = Router();
router.get("/", listProducts); router.get("/:id/similar", similarProducts); router.post("/:id/view", ...requireRole("buyer"), recordProductView); router.get("/:id", getProduct);
export default router;
