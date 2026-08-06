import { z } from "zod";

const commaString = z.union([z.string(), z.array(z.string()).transform(arr => arr.join(", "))]).optional().catch(undefined);
const numericString = z.union([z.string(), z.number()]).transform(String).refine(v => !isNaN(Number(v))).optional().catch(undefined);

const extractedFormSchema = z.object({
  name: z.string().optional().catch(undefined),
  category: z.string().optional().catch(undefined),
  description: z.string().optional().catch(undefined),
  gsm: numericString,
  composition: z.string().optional().catch(undefined),
  weaveType: z.string().optional().catch(undefined),
  width: numericString,
  shrinkageRate: z.string().optional().catch(undefined),
  colorfastnessRating: z.string().optional().catch(undefined),
  colors: commaString,
  stockQty: numericString,
  stockType: z.enum(["ready_stock", "made_to_order"]).optional().catch(undefined),
  leadTimeDays: numericString,
  price: numericString,
  certifications: commaString,
  sustainabilityTags: commaString,
  tiers: z.string().regex(/^\s*\d+\s*:\s*\d+(?:\s*,\s*\d+\s*:\s*\d+)*\s*$/).optional().catch(undefined)
}).strip();

const rawForm = {
  "Product name": "Hemp Canvas Duck",
  "category": "Home textiles",
  "Product Name": "Hemp Canvas Duck",
  "ProductName": "Hemp Canvas Duck",
  "name": "Hemp Canvas Duck"
};

const normalizedForm: any = {};
for (const [k, v] of Object.entries(rawForm)) {
  const normK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normK === 'productname' || normK === 'name') normalizedForm.name = v;
  else normalizedForm[k] = v;
}

console.log("Normalized:", normalizedForm);
const safeForm = extractedFormSchema.safeParse(normalizedForm);
console.log("Safe Form Success:", safeForm.success);
console.log("Valid Form:", safeForm.data);
