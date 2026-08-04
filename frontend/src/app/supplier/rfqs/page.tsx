"use client";import {BackLink} from "@/components/back-link";
import {useEffect,useState} from "react";
import {SiteHeader} from "@/components/site-header";
import {api} from "@/lib/api";
import {RequireRole} from "@/components/require-role";
import {usePendingAction} from "@/hooks/use-pending-action";

type Quote={id:string;quoted_price:number|string;quoted_lead_time_days:number;notes:string|null;status:string;proposed_by:string;parent_quote_id:string|null;created_at:string};
type Rfq={id:string;product_name:string|null;custom_spec:Record<string,unknown>|null;quantity:number;target_price:number|string|null;needed_by_date:string|null;status:string;created_at:string;quotes:Quote[]};

function CounterForm({rfqId,quoteId,onSuccess}:{rfqId:string,quoteId:string,onSuccess:()=>void}){
  const [price,setPrice]=useState('');
  const [leadTime,setLeadTime]=useState('');
  const [notes,setNotes]=useState('');
  const {run: submit, isPending: submitting} = usePendingAction();
  const [error,setError]=useState('');

  async function handleCounter(e:React.FormEvent){
    e.preventDefault();
    setError('');
    try {
      await submit(quoteId, async () => {
        await api(`/rfqs/${rfqId}/quotes/${quoteId}/counter`,{method:'POST',body:JSON.stringify({quotedPrice:Number(price),quotedLeadTimeDays:Number(leadTime),notes})});
        onSuccess();
      });
    } catch(cause) {
      setError(cause instanceof Error?cause.message:'Counter failed.')
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 grid gap-4 border-t border-loom pt-4 sm:grid-cols-3">
      {error&&<p className="col-span-3 text-sm text-danger">{error}</p>}
      <label><span className="mb-1 block text-sm font-semibold">Counter ₹/m</span><input value={price} onChange={e=>setPrice(e.target.value)} type="number" min="0" required className="w-full border border-loom bg-[#f7f1e7] p-2.5"/></label>
      <label><span className="mb-1 block text-sm font-semibold">Lead time (days)</span><input value={leadTime} onChange={e=>setLeadTime(e.target.value)} type="number" min="0" required className="w-full border border-loom bg-[#f7f1e7] p-2.5"/></label>
      <label><span className="mb-1 block text-sm font-semibold">Notes</span><input value={notes} onChange={e=>setNotes(e.target.value)} className="w-full border border-loom bg-[#f7f1e7] p-2.5"/></label>
      <div className="sm:col-span-3 flex gap-3">
        <button disabled={submitting(quoteId)} className="rounded-sm bg-indigo-dye px-4 py-2 font-semibold text-cotton disabled:opacity-60">Send counter</button>
      </div>
    </form>
  )
}

export default function SupplierRfqs(){
  const {run, isPending} = usePendingAction();
  const [rfqs,setRfqs]=useState<Rfq[]>([]);
  const [notice,setNotice]=useState('');
  const [quoteFor,setQuoteFor]=useState<string|null>(null);
  const [countering,setCountering]=useState<string|null>(null);
  const [price,setPrice]=useState('');
  const [leadTime,setLeadTime]=useState('');
  const [notes,setNotes]=useState('');

  async function load(){
    try{
      const r=await api<{data:Rfq[]}>('/rfqs/supplier');
      setRfqs(r.data);
    }catch(cause){
      setNotice(cause instanceof Error?cause.message:'RFQs could not be loaded.')
    }
  }

  useEffect(()=>{
    const id=window.setTimeout(()=>void load(),0);
    return()=>window.clearTimeout(id)
  },[]);

  async function sendQuote(e:React.FormEvent){
    e.preventDefault();
    if(!quoteFor)return;
    try{
      await api(`/rfqs/${quoteFor}/quotes`,{method:'POST',body:JSON.stringify({quotedPrice:Number(price),quotedLeadTimeDays:Number(leadTime),notes})});
      setQuoteFor(null);
      void load();
      setNotice('Structured quote sent. The buyer can accept or reject it in the marketplace.')
    }catch(cause){
      setNotice(cause instanceof Error?cause.message:'Quote could not be sent.')
    }
  }

  async function reject(id:string){
    try{
      await api(`/rfqs/${id}/reject`,{method:'POST'});
      void load();
      setNotice('RFQ rejected. No personal contact information was shared.')
    }catch(cause){
      setNotice(cause instanceof Error?cause.message:'RFQ could not be rejected.')
    }
  }

  async function decide(quoteId:string,decision:'accepted'|'rejected'){
    try{
      const r=await api<{data:{orderId?:string}}>('/rfqs/quotes/'+quoteId+'/decision',{method:'POST',body:JSON.stringify({decision})});
      await load();
      setNotice(decision==='accepted'?`Quote accepted. Order ${r.data.orderId??''} was created.`:'Quote rejected.')
    }catch(cause){
      setNotice(cause instanceof Error?cause.message:'Quote decision failed.')
    }
  }

  return (
    <RequireRole role="supplier">
      <>
        <SiteHeader/>
        <main className="mx-auto max-w-6xl px-5 py-10 md:px-8"><BackLink href="/supplier"/>
          <p className="font-data text-xs uppercase tracking-[.14em] text-ochre">Supplier negotiation desk</p>
          <h1 className="mt-2 font-display text-5xl">RFQ inbox</h1>
          <p className="mt-3 max-w-2xl leading-7">Respond with pricing, lead time, and notes through the marketplace. Buyer and supplier personal contact details remain private.</p>
          {notice&&<p role="status" className="mt-5 border border-ochre/40 bg-ochre/10 p-3 text-sm">{notice}</p>}
          <div className="mt-8 space-y-5">
            {rfqs.length?rfqs.map(rfq=>(
              <article key={rfq.id} className="border border-loom bg-[#f7f1e7] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-data text-xs uppercase tracking-[.13em] text-ochre">{rfq.product_name?'Catalogue RFQ':'Custom fabric specification'}</p>
                    <h2 className="mt-2 font-display text-2xl">{rfq.product_name??String(rfq.custom_spec?.description??'Custom requirement')}</h2>
                  </div>
                  <span className="font-data text-xs uppercase">{rfq.status}</span>
                </div>
                <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                  <div><dt className="text-walnut/70">Quantity</dt><dd className="mt-1 font-data">{rfq.quantity} m</dd></div>
                  <div><dt className="text-walnut/70">Target price</dt><dd className="mt-1 font-data">{rfq.target_price?`₹${rfq.target_price}/m`:'Not specified'}</dd></div>
                  <div><dt className="text-walnut/70">Needed by</dt><dd className="mt-1 font-data">{rfq.needed_by_date??'Flexible'}</dd></div>
                </dl>
                
                {rfq.status==='open' && (!rfq.quotes || rfq.quotes.length === 0) && quoteFor !== rfq.id && (
                  <div className="mt-5 flex gap-3">
                    <button onClick={()=>setQuoteFor(rfq.id)} className="rounded-sm bg-indigo-dye px-4 py-2.5 font-semibold text-cotton">Send quote</button>
                    <button disabled={isPending(rfq.id)} onClick={()=>void run(rfq.id, ()=>reject(rfq.id))} className="rounded-sm border border-danger px-4 py-2.5 font-semibold text-danger disabled:opacity-50">Reject</button>
                  </div>
                )}
                {quoteFor===rfq.id && (
                  <form onSubmit={sendQuote} className="mt-5 grid gap-4 border-t border-loom pt-5 sm:grid-cols-3">
                    <label><span className="mb-1 block text-sm font-semibold">Quoted ₹/m</span><input value={price} onChange={e=>setPrice(e.target.value)} type="number" min="0" required className="w-full border border-loom bg-cotton p-2.5"/></label>
                    <label><span className="mb-1 block text-sm font-semibold">Lead time (days)</span><input value={leadTime} onChange={e=>setLeadTime(e.target.value)} type="number" min="0" required className="w-full border border-loom bg-cotton p-2.5"/></label>
                    <label><span className="mb-1 block text-sm font-semibold">Notes</span><input value={notes} onChange={e=>setNotes(e.target.value)} className="w-full border border-loom bg-cotton p-2.5"/></label>
                    <div className="sm:col-span-3 flex gap-3">
                      <button className="rounded-sm bg-indigo-dye px-4 py-2.5 font-semibold text-cotton">Send structured quote</button>
                      <button type="button" onClick={()=>setQuoteFor(null)} className="rounded-sm border border-loom px-4 py-2.5 font-semibold">Cancel</button>
                    </div>
                  </form>
                )}

                {rfq.quotes && rfq.quotes.length > 0 && (
                  <div className="mt-5 grid gap-4 border-t border-loom pt-5">
                    {rfq.quotes.sort((a,b)=>new Date(a.created_at).getTime()-new Date(b.created_at).getTime()).map((quote,idx,arr)=>{
                      const isLeaf = idx === arr.length - 1;
                      const isActiveLeaf = isLeaf && quote.status === 'pending';
                      const isMine = quote.proposed_by === 'supplier';
                      
                      return (
                        <section key={quote.id} className={`border border-loom bg-cotton p-4 ${isActiveLeaf ? 'ring-2 ring-ochre' : 'opacity-70'}`}>
                          <p className="font-data text-xs uppercase tracking-[.13em] text-ochre">{isMine?'Your offer':'Buyer counter-offer'} · {quote.status}</p>
                          <p className="mt-3 font-data text-2xl">₹{quote.quoted_price}/m</p>
                          <p className="mt-1 text-sm">Lead time: {quote.quoted_lead_time_days} days</p>
                          {quote.notes&&<p className="mt-3 border-t border-loom pt-3 text-sm">{quote.notes}</p>}
                          
                          {isActiveLeaf && !isMine && countering !== quote.id && (
                            <div className="mt-4 flex gap-3">
                              <button disabled={isPending(quote.id)} onClick={()=>void run(quote.id, ()=>decide(quote.id,'accepted'))} className="rounded-sm bg-indigo-dye px-3 py-2 font-semibold text-cotton disabled:opacity-50">Accept to order</button>
                              <button disabled={isPending(quote.id)} onClick={()=>void run(quote.id, ()=>decide(quote.id,'rejected'))} className="rounded-sm border border-danger px-3 py-2 font-semibold text-danger disabled:opacity-50">Reject</button>
                              <button onClick={()=>setCountering(quote.id)} className="rounded-sm border border-indigo-dye px-3 py-2 font-semibold text-indigo-dye">Counter offer</button>
                            </div>
                          )}
                          {isActiveLeaf && !isMine && countering === quote.id && (
                            <div className="mt-4">
                              <div className="flex justify-between">
                                <p className="font-semibold">Countering offer</p>
                                <button onClick={()=>setCountering(null)} className="text-sm underline">Cancel</button>
                              </div>
                              <CounterForm rfqId={rfq.id} quoteId={quote.id} onSuccess={()=>{setCountering(null);void load();}} />
                            </div>
                          )}
                          {isActiveLeaf && isMine && (
                            <p className="mt-4 text-sm font-semibold text-ochre">Waiting on buyer response...</p>
                          )}
                        </section>
                      )
                    })}
                  </div>
                )}
              </article>
            )):<div className="border border-loom bg-[#f7f1e7] p-8">No open RFQs are available for your catalogue.</div>}
          </div>
        </main>
      </>
    </RequireRole>
  )
}
