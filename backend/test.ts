import { z } from "zod";

const commaString=z.union([z.string(),z.array(z.string()).transform(arr=>arr.join(", "))]).optional().catch(undefined);
const numericString=z.union([z.string(),z.number()]).transform(String).refine(v=>!isNaN(Number(v))).optional().catch(undefined);
const extractedFormSchema=z.object({name:z.string().optional().catch(undefined),category:z.string().optional().catch(undefined),description:z.string().optional().catch(undefined),gsm:numericString,composition:z.string().optional().catch(undefined),weaveType:z.string().optional().catch(undefined),width:numericString,shrinkageRate:numericString,colorfastnessRating:numericString,colors:commaString,stockQty:numericString,stockType:z.enum(["ready_stock","made_to_order"]).optional().catch(undefined),leadTimeDays:numericString,price:numericString,certifications:commaString,sustainabilityTags:commaString,tiers:z.string().regex(/^\s*\d+\s*:\s*\d+(?:\s*,\s*\d+\s*:\s*\d+)*\s*$/).optional().catch(undefined)}).strip();

const rawJson = `{
  "form": {
    "name": "Hemp Canvas Duck",
    "category": "Home textiles",
    "description": "Heavyweight hemp canvas with a tight duck weave, naturally durable and low-impact to grow — ideal for bags, upholstery, and workwear.",
    "gsm": 340,
    "composition": "100% hemp",
    "weaveType": "Duck weave",
    "width": 140,
    "shrinkageRate": "2%",
    "colorfastnessRating": "4/5",
    "colors": "natural, olive, charcoal",
    "stockQty": 400,
    "stockType": "ready_stock",
    "leadTimeDays": 10,
    "price": 265,
    "tiers": "80:245, 200:225",
    "certifications": "OEKO-TEX",
    "sustainabilityTags": "organic"
  },
  "message": "Drafted!"
}`;

let parsed: any = {};
try { parsed = JSON.parse(rawJson); } catch(e) { console.error("Parse error", e); }
const safeForm = extractedFormSchema.safeParse(parsed.form || {});
console.log("Safe Form Success:", safeForm.success);
if (safeForm.success) {
  console.log("Valid Form keys:", Object.keys(safeForm.data));
  console.log("Valid Form data:", safeForm.data);
} else {
  console.log("Errors:", safeForm.error);
}
