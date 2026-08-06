import type {NextFunction,Request,Response} from "express";
import {z} from "zod";
import {converse,embed,warmModel} from "../services/huggingface.service.js";
import {query} from "../config/db.js";
import {HttpError} from "../utils/http-error.js";
const pendingItemSchema=z.object({productId:z.string().uuid(),productName:z.string(),quantity:z.number().nullable()});
const messageSchema=z.object({messages:z.array(z.object({role:z.enum(["user","assistant"]),content:z.string().trim().min(1).max(3000)})).min(1).max(12),productId:z.string().uuid().optional(),pendingAction:z.array(pendingItemSchema).optional()});
function sanitizeAssistantOutput(value:string){
  return value
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,"[private supplier contact removed]")
    .replace(/(?:\+?\d[\d\s().-]{7,}\d)/g,"[private supplier contact removed]");
}
const publicSupplierFields="Public supplier fields are business name, product categories, fabrics offered, MOQ, and verified status. Never disclose supplier contact information, business address, operating hours, email, or phone number.";
export async function warm(_req:Request,res:Response){res.json(await warmModel());}
function parseCartItems(text:string):{quantity:number,name:string}[]{
  const items:{quantity:number,name:string}[]=[];
  const re=/(\d+)\s*(?:m|metres?|meters?)?\s+(?:of\s+)?([a-z][a-z\s]*?)(?=(?:\d|,|\band\b|$|\s+to\s+cart|\s+in\s+cart))/gi;
  let m;while((m=re.exec(text))){const name=m[2].trim();if(name)items.push({quantity:Number(m[1]),name});}
  return items;
}
export async function chat(req:Request,res:Response,next:NextFunction){try{const input=messageSchema.parse(req.body);if(input.pendingAction?.length){
  const latestMsg=input.messages[input.messages.length-1]?.content.trim()??"";
  if(/^(yes|yeah|yep|yup|confirm|correct|sure|ok|okay|do it|add it|go ahead)\b/i.test(latestMsg)&&input.pendingAction.every(p=>p.quantity)){
    res.json({data:{message:"Confirmed.",actions:input.pendingAction.map(p=>({type:"add_to_cart",productId:p.productId,productName:p.productName,quantity:p.quantity as number}))}});
    return;
  }
  if(input.pendingAction.length===1&&!input.pendingAction[0].quantity){
    const num=Number(latestMsg.replace(/[^\d.]/g,""));
    if(num>0){
      res.json({data:{message:`Add ${num}m of ${input.pendingAction[0].productName} to cart — reply "yes" to confirm.`,actions:[],pendingAction:[{...input.pendingAction[0],quantity:num}]}});
      return;
    }
  }
}let grounding="";let productRecord:Record<string,unknown>|null=null;if(input.productId){const result=await query(`SELECT p.name,p.category,p.description,p.gsm,p.composition,p.weave_type,p.width,p.shrinkage_rate,p.colorfastness_rating,p.certifications,p.stock_type,p.lead_time_days,p.stock_qty,p.price,sp.business_name,sp.product_categories,sp.fabric_types_offered,sp.moq,sp.verification_status FROM products p JOIN supplier_profiles sp ON sp.user_id=p.supplier_id WHERE p.id=$1 AND p.status='available' AND sp.status='approved'`,[input.productId]);productRecord=(result.rows[0]??null) as Record<string,unknown>|null;grounding=`Product record (answer only from this record): ${JSON.stringify(productRecord??{})}`;}const latest=input.messages[input.messages.length-1]?.content??"";const productQuestion=latest.toLowerCase();let deterministicAnswer:string|null=null;if(productRecord){const facts:[RegExp,string,unknown][]=[[/gsm|weight/,"GSM",productRecord.gsm],[/composition|made of|material/,"Composition",productRecord.composition],[/weave/,"Weave",productRecord.weave_type],[/certification|certified|oeko|gots|iso/,"Certifications",Array.isArray(productRecord.certifications)?productRecord.certifications.join(", "):productRecord.certifications],[/stock type|ready stock|made to order/,"Stock type",productRecord.stock_type],[/lead time|how long|dispatch/,"Lead time",productRecord.lead_time_days?`${productRecord.lead_time_days} days`:"Ready stock"],[/available|stock quantity|how much stock/,"Available stock",productRecord.stock_qty]];const match=facts.find(([pattern])=>pattern.test(productQuestion));if(match)deterministicAnswer=`${match[1]}: ${match[2]??"Not specified"}.`;}const noGroundingRule=input.productId?"":"You have not been given any product or supplier data for this question. Do not name, describe, or invent any specific supplier, product, price, MOQ, or verification status. Instead say you can search the marketplace for that, and suggest the buyer use the search bar or ask about a specific product page.";const system=`You are ThreadMark's B2B textile marketplace assistant. Be concise and truthful. ${publicSupplierFields} ${grounding} ${noGroundingRule} You CANNOT edit, update, or modify products. If a user asks to set, change, or update product data, firmly state that you do not have permission to edit products. When a buyer asks to add a product to cart, identify product and quantity and state that a visible confirmation is required; do not silently claim a cart was updated. Do not invent unavailable product facts. Only state factual claims (GSM, composition, weave, certifications, stock, lead time, price) that appear verbatim in the product record provided to you. If asked something not present in that record, say plainly that the detail isn't listed rather than estimating or using general fabric knowledge.`;const result:any=deterministicAnswer?null:await converse(system,input.messages);const rawContent=deterministicAnswer??result?.choices?.[0]?.message?.content??result?.generated_text??"I could not prepare an answer. Please try again.";const content=sanitizeAssistantOutput(rawContent);if(/(?:add|put)\b.*\bcart\b/i.test(latest) || /How many metres|reply "yes" to confirm/i.test(input.messages[input.messages.length-2]?.content??"")){
  if(req.auth?.role!=="buyer"){res.json({data:{message:req.auth?"Only buyer accounts can add items to a cart.":"Sign in as a buyer to add items to your cart.",actions:[]}});return;}
  const parsed=parseCartItems(latest);
  if(parsed.length){
    const resolved:{productId:string;productName:string;quantity:number}[]=[];
    const unresolved:string[]=[];
    for(const item of parsed){
      const searchTerm = item.name.replace(/\s+from\s+/i, ' % ');
      const product=await query<{id:string;name:string}>(`SELECT p.id,p.name FROM products p JOIN supplier_profiles sp ON sp.user_id=p.supplier_id WHERE p.status='available' AND sp.status='approved' AND concat(p.name, ' ', sp.business_name, ' ', p.name) ILIKE $1 ORDER BY p.name ASC LIMIT 1`,[`%${searchTerm}%`]);
      if(product.rows[0])resolved.push({productId:product.rows[0].id,productName:product.rows[0].name,quantity:item.quantity});
      else unresolved.push(item.name);
    }
    if(!resolved.length){res.json({data:{message:`I couldn't find ${unresolved.join(", ")} in the marketplace.`,actions:[]}});return;}
    const list=resolved.map(r=>`${r.quantity}m of ${r.productName}`).join(", ");
    const note=unresolved.length?` (couldn't find: ${unresolved.join(", ")})`:"";
    res.json({data:{message:`Add ${list} to cart${note} — reply "yes" to confirm.`,actions:[],pendingAction:resolved}});
    return;
  }
  const addNoQtyMatch=/(?:add|put)\s+(?:the\s+)?(.+?)\s+(?:to|in)\s+(?:my\s+)?cart[.!?]?$/i.exec(latest);
  if(addNoQtyMatch){
    const searchTerm = addNoQtyMatch[1].trim().replace(/\s+from\s+/i, ' % ');
    const product=await query<{id:string;name:string}>(`SELECT p.id,p.name FROM products p JOIN supplier_profiles sp ON sp.user_id=p.supplier_id WHERE p.status='available' AND sp.status='approved' AND concat(p.name, ' ', sp.business_name, ' ', p.name) ILIKE $1 ORDER BY p.name ASC LIMIT 1`,[`%${searchTerm}%`]);
    if(product.rows[0]){
      res.json({data:{message:`How many metres of ${product.rows[0].name} would you like to add?`,actions:[],pendingAction:[{productId:product.rows[0].id,productName:product.rows[0].name,quantity:null}]}});
      return;
    }
    res.json({data:{message:`I couldn't find ${addNoQtyMatch[1].trim()} in the marketplace.`,actions:[]}});
    return;
  }
}
let actions:any[]=[];if(/compare/i.test(latest)){const matches=await query<{id:string;name:string}>("SELECT p.id,p.name FROM products p JOIN supplier_profiles sp ON sp.user_id=p.supplier_id WHERE p.status='available' AND sp.status='approved' AND $1 ILIKE '%'||p.name||'%'",[latest]);if(matches.rows.length>=2)actions.push({type:'compare',productIds:matches.rows.slice(0,4).map(m=>m.id)});}if(req.auth?.role==="buyer"){await query("INSERT INTO ai_conversations (buyer_id,messages) VALUES ($1,$2)",[req.auth.userId,JSON.stringify([...input.messages,{role:"assistant",content}])]);}res.json({data:{message:content,actions}});}catch(error){next(error);}}

const naturalSearchSchema=z.object({query:z.string().trim().min(3).max(500)});
export async function naturalSearch(req:Request,res:Response,next:NextFunction){try{const input=naturalSearchSchema.parse(req.body);const instruction=`Extract textile marketplace filters from this buyer request. Return a JSON object with ONLY the explicitly mentioned constraints. Allowed keys: search, category, gsmMin(number), gsmMax(number), composition, weaveType, stockType, certification. CRITICAL: Do NOT invent or guess any values. If a constraint is not explicitly requested, OMIT the key entirely. Do NOT put conversational words (like "set", "filter", "apply", "show", "gsm") into the "search" key; only use "search" for actual product keywords. Example 1: "show organic" -> {"search":"organic"}. Example 2: "cotton 200 gsm" -> {"composition":"cotton","gsmMin":200,"gsmMax":200}. Example 3: "set gsm 110" -> {"gsmMin":110,"gsmMax":110}. Request: ${input.query}`;const result:any=await converse("You are a precise JSON extraction service.",[{role:"user",content:instruction}]);const raw=result?.choices?.[0]?.message?.content??"{}";const matched=raw.match(/\{[\s\S]*\}/);let filters:Record<string,unknown>={};try{filters=JSON.parse(matched?.[0]??"{}")}catch{}res.json({data:{filters}});}catch(error){next(error)}}
export async function recommendations(req:Request,res:Response,next:NextFunction){try{const buyerId=req.auth!.userId;const profile=await query<any>("SELECT business_type,industry,product_categories_interest,preferred_fabric_types,typical_order_quantity,budget_range,additional_preferences FROM buyer_profiles WHERE user_id=$1",[buyerId]);const views=await query<any>(`SELECT p.name,p.category,p.description,p.composition,p.weave_type FROM product_views v JOIN products p ON p.id=v.product_id WHERE v.buyer_id=$1 ORDER BY v.timestamp DESC LIMIT 12`,[buyerId]);const source=`Buyer preferences: ${JSON.stringify(profile.rows[0]??{})}. Browsing history: ${JSON.stringify(views.rows)}`;const vector=`[${(await embed(source)).join(",")}]`;const products=await query(`SELECT p.id,p.name,p.category,p.composition,p.gsm,p.price,p.images,p.stock_type,sp.business_name,sp.verification_status FROM products p JOIN supplier_profiles sp ON sp.user_id=p.supplier_id WHERE p.status='available' AND sp.status='approved' AND p.embedding IS NOT NULL ORDER BY p.embedding <=> $1::vector LIMIT 8`,[vector]);res.json({data:products.rows});}catch(error){next(error)}}
const comparisonSchema=z.object({productIds:z.array(z.string().uuid()).min(2).max(4)});
export async function compareProducts(req:Request,res:Response,next:NextFunction){try{const input=comparisonSchema.parse(req.body);const result=await query(`SELECT p.id,p.name,p.category,p.gsm,p.composition,p.weave_type,p.width,p.shrinkage_rate,p.colorfastness_rating,p.stock_qty,p.stock_type,p.lead_time_days,p.certifications,p.price,p.sustainability_tags,sp.business_name,sp.verification_status FROM products p JOIN supplier_profiles sp ON sp.user_id=p.supplier_id WHERE p.id=ANY($1::uuid[]) AND p.status='available' AND sp.status='approved'`,[input.productIds]);if(result.rows.length!==input.productIds.length)throw new HttpError(404,"One or more selected products are unavailable for comparison");await query("INSERT INTO comparison_events (buyer_id,product_ids) VALUES ($1,$2)",[req.auth?.userId||null,input.productIds]);res.json({data:{products:result.rows,fields:["gsm","composition","weave_type","width","shrinkage_rate","colorfastness_rating","stock_qty","stock_type","lead_time_days","certifications","price","sustainability_tags"]}});}catch(error){next(error)}}
const useCaseSchema=z.object({description:z.string().trim().min(5).max(1000)});
export async function useCaseMatch(req:Request,res:Response,next:NextFunction){try{const input=useCaseSchema.parse(req.body);const vector=`[${(await embed(input.description)).join(",")}]`;const matches=await query(`SELECT p.id,p.name,p.category,p.description,p.gsm,p.composition,p.weave_type,p.stock_type,p.lead_time_days,p.certifications,p.price,p.images,p.sustainability_tags,sp.business_name,sp.verification_status FROM products p JOIN supplier_profiles sp ON sp.user_id=p.supplier_id WHERE p.status='available' AND sp.status='approved' AND p.embedding IS NOT NULL ORDER BY p.embedding <=> $1::vector LIMIT 8`,[vector]);res.json({data:{query:input.description,matches:matches.rows,method:"hugging-face-embedding-use-case-match"}});}catch(error){next(error)}}

const semanticSearchSchema=z.object({query:z.string().trim().min(3).max(1000)});
export async function semanticSearch(req:Request,res:Response,next:NextFunction){try{const input=semanticSearchSchema.parse(req.body);const vector=`[${(await embed(input.query)).join(",")}]`;const products=await query(`SELECT p.id,p.name,p.category,p.description,p.gsm,p.composition,p.weave_type,p.stock_type,p.lead_time_days,p.certifications,p.price,p.images,p.sustainability_tags,sp.business_name,sp.verification_status FROM products p JOIN supplier_profiles sp ON sp.user_id=p.supplier_id WHERE p.status='available' AND sp.status='approved' AND p.embedding IS NOT NULL ORDER BY p.embedding <=> $1::vector LIMIT 12`,[vector]);res.json({data:{query:input.query,products:products.rows,method:"pgvector-semantic-search"}});}catch(error){next(error)}}

const onboardingPromptSchema=z.object({kind:z.enum(["buyer","supplier"]),fieldLabel:z.string().trim().min(1).max(200),priorAnswers:z.record(z.string()).optional()});
export async function onboardingPrompt(req:Request,res:Response,next:NextFunction){try{const input=onboardingPromptSchema.parse(req.body);const system=`You are ThreadMark's onboarding assistant for a ${input.kind} on a B2B textile marketplace. Ask exactly one short, natural, friendly question to collect this specific piece of information: "${input.fieldLabel}". Do not ask for anything else. Do not add extra commentary. Reply with only the question, one sentence.`;const context=input.priorAnswers&&Object.keys(input.priorAnswers).length?`Answers collected so far: ${JSON.stringify(input.priorAnswers)}.`:"";const result:any=await converse(system,[{role:"user",content:context||"Ask the question now."}]);const question=result?.choices?.[0]?.message?.content?.trim();res.json({data:{question:question||input.fieldLabel}});}catch(error){next(error)}}
