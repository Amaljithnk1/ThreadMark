import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { ZodError } from "zod";
import authRoutes from "./routes/auth.routes.js";
import productsRoutes from "./routes/products.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import rfqRoutes from "./routes/rfq.routes.js";
import supplierProductRoutes from "./routes/supplier-products.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import ordersRoutes from "./routes/orders.routes.js";
import samplesRoutes from "./routes/samples.routes.js";
import profilesRoutes from "./routes/profiles.routes.js";
import uploadsRoutes from "./routes/uploads.routes.js";
import supplierDashboardRoutes from "./routes/supplier-dashboard.routes.js";
import { HttpError } from "./utils/http-error.js";

export function createApp() {
  const app = express();
  app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:3000", credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use("/api/products", productsRoutes);
  app.use("/api/cart", cartRoutes);
  app.use("/api/ai", aiRoutes);
  app.use("/api/rfqs", rfqRoutes);
  app.use("/api/supplier/products", supplierProductRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/orders", ordersRoutes);
  app.use("/api/samples", samplesRoutes);
  app.use("/api/profiles", profilesRoutes);
  app.use("/api/uploads", uploadsRoutes);
  app.use("/api/supplier/dashboard", supplierDashboardRoutes);
  app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, max: 100, standardHeaders: true, legacyHeaders: false }), authRoutes);
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.use((_req, _res, next) => next(new HttpError(404, "This API route does not exist")));
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    let status = 500;
    let message = "Something went wrong. Please try again.";
    
    if (error instanceof ZodError) {
      status = 400;
      message = error.issues[0]?.message ?? "Invalid request data.";
    } else if (error instanceof HttpError) {
      status = error.status;
      message = error.message;
    }
    
    if (status === 500) console.error(error);
    res.status(status).json({ error: { message } });
  });
  return app;
}
