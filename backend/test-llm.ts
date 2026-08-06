import { converse } from "./src/lib/ai";
import { z } from "zod";

async function main() {
  const instruction = `Extract product form fields from this supplier conversation. Return a JSON object with two keys: "form" (the explicitly mentioned valid fields) and "message" (your conversational reply).
Allowed form keys: name (do NOT use "productName"), category, description, gsm, composition, weaveType, width, shrinkageRate (can include %), colorfastnessRating (can include /), colors, stockQty, stockType ("ready_stock" or "made_to_order"), leadTimeDays, price, certifications, sustainabilityTags, tiers (MUST be formatted as "minQty:price", e.g. "50:15").
CRITICAL RULES:
1. Do NOT invent or guess any values (e.g. do NOT output "Unknown").
2. ALWAYS extract fields mentioned in the latest message, even if the user is updating or overwriting a value they previously provided (e.g. if they previously set price to 100, and now say "add price 200", you MUST output {"price": "200"}).
3. The user is currently filling out a visual form in the UI. Do NOT ask them to provide missing information (like name, category, description) because they can type those directly into the UI themselves. Only ask for clarification if their specific request was ambiguous.
4. If the user provides incomplete or invalid data for a field (e.g. they say they want a bulk tier but don't provide BOTH the minimum quantity and the price, or provide a number for a text field), do NOT put it in "form". Instead, in your "message", explain the issue, provide a strict hint on the required format, and ask them to provide the missing part. Do NOT say you have "noted" or "added" a field if you are leaving it out of the "form" object!
5. If they are answering a previous clarification (e.g. "yeah its colorfastness" or "quantity is 50"), use the conversation history to map their answer to the correct field in "form", and acknowledge it in "message".
6. Always output exactly this format: {"form": {"key": "value"}, "message": "Your reply here."}`;

  const userMessage = "Product name Hemp Canvas Duck Category Home textiles Description Heavyweight hemp canvas with a tight duck weave, naturally durable and low-impact to grow — ideal for bags, upholstery, and workwear. GSM 340 Composition 100% hemp Weave type Duck weave Width 140 Shrinkage rate 2% Colorfastness 4/5 Available colors natural, olive, charcoal Available stock 400 Stock type Ready stock Lead time days 10 Price per metre 265 Bulk tiers 80:245, 200:225 Certifications OEKO-TEX Sustainability tags organic";

  const messages: any[] = [
    { role: "user", content: instruction },
    { role: "user", content: userMessage }
  ];

  console.log("Calling LLM...");
  const result: any = await converse("You are a precise JSON extraction service.", messages);
  const raw = result?.choices?.[0]?.message?.content ?? "{}";
  console.log("RAW LLM OUTPUT:", raw);
}

main().catch(console.error);
