import { z } from "zod";

export const roles = ["buyer", "supplier", "admin"] as const;
export const roleSchema = z.enum(roles);
export type Role = z.infer<typeof roleSchema>;

const passwordSchema = z.string().min(8, "Use at least 8 characters").max(128);
export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: passwordSchema,
  role: z.enum(["buyer", "supplier"]),
  username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
});
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password").max(128),
});
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const shippingInfoSchema = z.object({
  recipient: z.string().trim().min(2, "Enter the recipient name").max(120),
  addressLine1: z.string().trim().min(5, "Enter a complete address").max(250),
  city: z.string().trim().min(2, "Enter the city").max(100),
  state: z.string().trim().min(2, "Enter the state").max(100),
  postalCode: z.string().trim().min(3, "Enter the postal code").max(20),
  country: z.string().trim().min(2, "Enter the country").max(80),
});
export type ShippingInfo = z.infer<typeof shippingInfoSchema>;

const stringList = z.array(z.string().trim().min(1).max(100));
export const buyerProfileSchema = z.object({
  businessType: z.string().trim().min(2).max(120),
  industry: z.string().trim().min(2).max(120),
  productCategoriesInterest: stringList.min(1),
  preferredFabricTypes: stringList.min(1),
  typicalOrderQuantity: z.string().trim().regex(/^[\d\s\-,]+$/, "Enter numbers and hyphens only (e.g. 100-500)").max(100),
  budgetRange: z.string().trim().regex(/^[\d\s\-.,$₹€£]+$/, "Enter a numeric budget range (e.g. 50-100)").max(100),
  additionalPreferences: z.string().trim().max(2000).optional(),
});
export const supplierProfileSchema = z.object({
  businessName: z.string().trim().min(2).max(180),
  businessType: z.string().trim().min(2).max(120),
  contactInfo: z.object({ email: z.string().email().optional(), phone: z.string().trim().max(40).optional().refine(val => !val || (/^\+?[0-9\s\-()]+$/.test(val) && val.replace(/[^0-9]/g, '').length >= 10), "Enter a valid phone number (min 10 digits)") }).default({}),
  businessAddress: z.string().trim().min(5).max(500),
  operatingHours: z.string().trim().regex(/\d/, "Enter valid operating hours (e.g. 9 AM - 5 PM)").max(300),
  productCategories: stringList.min(1),
  fabricTypesOffered: stringList.min(1),
  moq: z.coerce.number().int().min(1),
});
export type BuyerProfileInput = z.infer<typeof buyerProfileSchema>;
export type SupplierProfileInput = z.infer<typeof supplierProfileSchema>;

export const supplierProductSchema = z.object({
  name: z.string().trim().min(2).max(180),
  category: z.string().trim().min(2).max(100),
  description: z.string().trim().min(10).max(5000),
  colors: stringList.default([]),
  specifications: z.record(z.unknown()).default({}),
  gsm: z.coerce.number().positive().optional(),
  composition: z.string().trim().max(150).optional(),
  weaveType: z.string().trim().max(100).optional(),
  width: z.string().trim().max(100).optional(),
  shrinkageRate: z.string().trim().max(100).optional(),
  colorfastnessRating: z.string().trim().max(100).optional(),
  stockQty: z.coerce.number().int().min(0),
  stockType: z.enum(["ready_stock", "made_to_order"]),
  leadTimeDays: z.coerce.number().int().min(0).optional(),
  certifications: stringList.default([]),
  price: z.coerce.number().nonnegative(),
  images: z.array(z.string().url()).min(1, "Add at least one product image"),
  sustainabilityTags: stringList.default([]),
  priceTiers: z.array(z.object({ minQty: z.coerce.number().int().min(1), pricePerUnit: z.coerce.number().nonnegative() })).default([]),
});
export type SupplierProductInput = z.infer<typeof supplierProductSchema>;

export const rfqRequestSchema = z.object({
  productId: z.string().uuid().optional(),
  customSpec: z.record(z.unknown()).optional(),
  quantity: z.coerce.number().int().min(1).max(1_000_000),
  targetPrice: z.coerce.number().nonnegative().optional(),
  neededByDate: z.string().date().optional(),
}).refine((value) => value.productId || value.customSpec, { message: "Choose a listed product or describe your custom fabric specification" });
export type RfqRequestInput = z.infer<typeof rfqRequestSchema>;

export const sampleRequestSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(20),
  shippingInfo: z.record(z.unknown()),
});
export type SampleRequestInput = z.infer<typeof sampleRequestSchema>;

export const rfqQuoteSchema = z.object({
  quotedPrice: z.coerce.number().nonnegative(),
  quotedLeadTimeDays: z.coerce.number().int().nonnegative(),
  notes: z.string().trim().max(2000).optional(),
  shippingInfo: shippingInfoSchema.optional(),
});
export type RfqQuoteInput = z.infer<typeof rfqQuoteSchema>;
