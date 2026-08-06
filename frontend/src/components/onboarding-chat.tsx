"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {api} from "@/lib/api";
import {buyerProfileSchema,supplierProfileSchema} from "@threadmark/shared";

type Kind = "buyer"|"supplier";

export function OnboardingChat({kind}:{kind:Kind}) {
  const [notice,setNotice]=useState("");
  const [error,setError]=useState("");
  const [saving,setSaving]=useState(false);
  const router=useRouter();

  useEffect(()=>{
    const eventName = kind === 'buyer' ? 'threadmark-ai-fill-buyer-profile-form' : 'threadmark-ai-fill-profile-form';
    const handle=(e:any)=>{
      if(e.detail?.action==="fill"&&e.detail?.data){
        const data=e.detail.data;
        setTimeout(()=>{
          const update=(name:string,val:any)=>{
            if(val!==undefined){
              const el=document.querySelector(`[name="${name}"]`) as HTMLInputElement|HTMLTextAreaElement|null;
              if(el)el.value=Array.isArray(val)?val.join(", "):val;
            }
          };
          if (kind === 'buyer') {
            update('businessType',data.businessType);
            update('industry',data.industry);
            update('categories',data.productCategoriesInterest);
            update('fabrics',data.preferredFabricTypes);
            update('quantity',data.typicalOrderQuantity);
            update('budget',data.budgetRange);
            update('preferences',data.additionalPreferences);
          } else {
            update('businessName',data.businessName);
            update('businessType',data.businessType);
            update('email',data.email);
            update('phone',data.phone);
            update('businessAddress',data.businessAddress);
            update('operatingHours',data.operatingHours);
            update('categories',data.productCategories);
            update('fabrics',data.fabricTypesOffered);
            update('moq',data.moq);
          }
          setNotice("AI populated the form. Please review before saving.");
        },50);
      }
    };
    window.addEventListener(eventName,handle);
    return ()=>window.removeEventListener(eventName,handle)
  },[kind]);

  async function save(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    const data=new FormData(e.currentTarget);
    const split=(key:string)=>String(data.get(key)??'').split(',').map(v=>v.trim()).filter(Boolean);
    try{
      const payload = kind === 'buyer' ? buyerProfileSchema.safeParse({
        businessType:data.get('businessType'),
        industry:data.get('industry'),
        productCategoriesInterest:split('categories'),
        preferredFabricTypes:split('fabrics'),
        typicalOrderQuantity:data.get('quantity'),
        budgetRange:data.get('budget'),
        additionalPreferences:data.get('preferences')
      }) : supplierProfileSchema.safeParse({
        businessName:data.get('businessName'),
        businessType:data.get('businessType'),
        contactInfo:{email:data.get('email') || undefined,phone:data.get('phone') || undefined},
        businessAddress:data.get('businessAddress'),
        operatingHours:data.get('operatingHours'),
        productCategories:split('categories'),
        fabricTypesOffered:split('fabrics'),
        moq:data.get('moq')
      });
      if(!payload.success) throw new Error(payload.error.issues[0]?.message??'Check your answers.');
      await api(kind==='buyer'?'/profiles/buyer':'/profiles/supplier',{method:'PUT',body:JSON.stringify(payload.data)});
      router.push(kind==='buyer'?'/buyer':'/supplier');
    }catch(cause){
      setError(cause instanceof Error?cause.message:'Profile could not be saved.');
    }finally{
      setSaving(false);
    }
  }

  return (
    <main className="woven-grid grid min-h-screen place-items-center p-5">
      <section className="swatch-tag w-full max-w-4xl border border-loom bg-cotton p-7 shadow-[8px_8px_0_#29335C] sm:p-10">
        <p className="font-data text-xs uppercase tracking-[.15em] text-ochre">{kind} onboarding</p>
        <h1 className="mt-3 font-display text-4xl">Let&apos;s set up your {kind==='buyer'?'sourcing desk':'trade profile'}.</h1>
        
        <div className="mt-5 border border-indigo-dye/40 bg-indigo-dye/10 p-4 text-sm leading-6">
          <strong>Pro tip:</strong> Don&apos;t want to type? Open the <strong>ThreadMark AI Assistant</strong> on the right and describe your business (or paste your website description). The AI will extract your details and auto-fill this form for you!
        </div>

        {notice && <p role="status" className="mt-4 border border-ochre/40 bg-ochre/10 p-3 text-sm font-semibold">{notice}</p>}
        {error && <p role="alert" className="mt-4 border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p>}

        <form onSubmit={save} className="mt-8 grid gap-5 md:grid-cols-2">
          {kind === 'buyer' ? (
            <>
              <label><span className="mb-1 block text-sm font-semibold">Business type</span><input name="businessType" required className="w-full border border-loom bg-[#f7f1e7] p-3" placeholder="e.g. Boutique Retailer"/></label>
              <label><span className="mb-1 block text-sm font-semibold">Industry</span><input name="industry" required className="w-full border border-loom bg-[#f7f1e7] p-3" placeholder="e.g. Women's Fashion"/></label>
              <label><span className="mb-1 block text-sm font-semibold">Product categories of interest</span><input name="categories" required className="w-full border border-loom bg-[#f7f1e7] p-3" placeholder="e.g. Dresses, Blouses"/></label>
              <label><span className="mb-1 block text-sm font-semibold">Preferred fabric types</span><input name="fabrics" required className="w-full border border-loom bg-[#f7f1e7] p-3" placeholder="e.g. Cotton, Linen"/></label>
              <label><span className="mb-1 block text-sm font-semibold">Typical order quantity</span><input name="quantity" placeholder="e.g. 100-500" required className="w-full border border-loom bg-[#f7f1e7] p-3"/></label>
              <label><span className="mb-1 block text-sm font-semibold">Budget range</span><input name="budget" placeholder="e.g. 50-100" required className="w-full border border-loom bg-[#f7f1e7] p-3"/></label>
              <label className="md:col-span-2"><span className="mb-1 block text-sm font-semibold">Additional preferences</span><textarea name="preferences" className="min-h-24 w-full border border-loom bg-[#f7f1e7] p-3" placeholder="e.g. Eco-friendly dyes preferred"/></label>
            </>
          ) : (
            <>
              <label className="md:col-span-2"><span className="mb-1 block text-sm font-semibold">Business Name</span><input name="businessName" required className="w-full border border-loom bg-[#f7f1e7] p-3" placeholder="e.g. Global Textiles Inc."/></label>
              <label><span className="mb-1 block text-sm font-semibold">Business type</span><input name="businessType" required className="w-full border border-loom bg-[#f7f1e7] p-3" placeholder="e.g. Fabric Mill"/></label>
              <label><span className="mb-1 block text-sm font-semibold">Contact Email</span><input name="email" type="email" className="w-full border border-loom bg-[#f7f1e7] p-3" placeholder="e.g. contact@mill.com"/></label>
              <label><span className="mb-1 block text-sm font-semibold">Contact Phone</span><input name="phone" className="w-full border border-loom bg-[#f7f1e7] p-3" placeholder="e.g. 9876543210 (min 10 digits)"/></label>
              <label><span className="mb-1 block text-sm font-semibold">Business Address</span><input name="businessAddress" required className="w-full border border-loom bg-[#f7f1e7] p-3" placeholder="e.g. 124 Industrial Park, Mumbai"/></label>
              <label><span className="mb-1 block text-sm font-semibold">Operating Hours</span><input name="operatingHours" required className="w-full border border-loom bg-[#f7f1e7] p-3" placeholder="e.g. 9 AM - 6 PM"/></label>
              <label><span className="mb-1 block text-sm font-semibold">Product categories offered</span><input name="categories" required className="w-full border border-loom bg-[#f7f1e7] p-3" placeholder="e.g. Shirting, Upholstery"/></label>
              <label><span className="mb-1 block text-sm font-semibold">Fabric types offered</span><input name="fabrics" required className="w-full border border-loom bg-[#f7f1e7] p-3" placeholder="e.g. Cotton Poplin, Canvas"/></label>
              <label><span className="mb-1 block text-sm font-semibold">Minimum Order Quantity (MOQ)</span><input name="moq" type="number" required className="w-full border border-loom bg-[#f7f1e7] p-3" placeholder="e.g. 50"/></label>
            </>
          )}
          <div className="md:col-span-2 mt-4">
            <button disabled={saving} className="rounded-sm bg-indigo-dye px-5 py-3 font-semibold text-cotton disabled:opacity-70 w-full sm:w-auto">
              {saving?'Saving...':'Complete Setup'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
