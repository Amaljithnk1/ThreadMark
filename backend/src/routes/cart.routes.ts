import { Router } from "express";
import { addCartItem, checkout, getCart, removeCartItem, updateCartItem } from "../controllers/cart.controller.js";
import { requireRole } from "../middleware/auth.middleware.js";
const router = Router(); router.use(...requireRole("buyer")); router.get("/", getCart); router.post("/items", addCartItem); router.patch("/items/:itemId", updateCartItem); router.delete("/items/:itemId", removeCartItem); router.post("/checkout", checkout); export default router;
