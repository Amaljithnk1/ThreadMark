"use client";

import { useEffect, useState, FormEvent } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

type Review = {
  id: string;
  rating: number;
  comment: string;
  buyer_name: string;
  verified_purchase: boolean;
  created_at: string;
  supplier_reply: string | null;
  supplier_replied_at: string | null;
};

export function ProductReviews({ productId, supplierId }: { productId: string, supplierId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [eligible, setEligible] = useState(false);
  const [existingReview, setExistingReview] = useState<{rating: number, comment: string} | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const user = useAuthStore(state => state.user);
  const isSupplier = user?.role === 'supplier' && user?.id === supplierId;

  async function load() {
    try {
      const [r, e] = await Promise.all([
        api<{ data: Review[] }>(`/products/${productId}/reviews`).catch(() => ({ data: [] })),
        api<{ data: { eligible: boolean, existingReview: any } }>(`/products/${productId}/reviews/eligibility`).catch(() => ({ data: { eligible: false, existingReview: null } }))
      ]);
      setReviews(r.data);
      setEligible(e.data.eligible);
      if (e.data.existingReview) {
        setExistingReview(e.data.existingReview);
        setRating(e.data.existingReview.rating);
        setComment(e.data.existingReview.comment);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [productId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api(`/products/${productId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating, comment })
      });
      setShowForm(false);
      void load(); 
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not submit review");
    } finally {
      setSubmitting(false);
    }
  }
  
  async function handleReplySubmit(reviewId: string) {
    if (!replyText.trim()) return;
    try {
      await api(`/products/${productId}/reviews/${reviewId}/reply`, {
        method: "POST",
        body: JSON.stringify({ reply: replyText })
      });
      setReplyingTo(null);
      setReplyText("");
      void load();
    } catch (err) {
      alert("Failed to submit reply");
    }
  }

  if (loading) return <div className="mt-16 text-center text-sm text-walnut/50">Loading reviews...</div>;

  const avgRating = reviews.length > 0 ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1) : "—";

  return (
    <section className="mt-20">
      {/* Header Block */}
      <div className="border border-loom bg-[#f7f1e7] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
        <div className="text-center md:text-left">
          <p className="font-data text-xs uppercase tracking-[.14em] text-ochre mb-2">Community Trust</p>
          <h2 className="font-display text-4xl text-indigo-dye">Verified Reviews</h2>
          <p className="mt-2 text-sm text-walnut/70">Authentic feedback from buyers who sourced this material.</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <div className="text-center">
            <p className="font-data text-6xl text-indigo-dye leading-none">{avgRating}</p>
            <div className="flex gap-1 text-ochre mt-3 justify-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg key={i} className={`h-4 w-4 ${i < Math.round(Number(avgRating)) ? 'fill-current' : 'fill-loom'}`} viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-xs text-walnut/60 mt-2 font-medium">{reviews.length} total review(s)</p>
          </div>
          
          <div className="h-20 w-px bg-loom/60 hidden md:block"></div>
          
          <div className="flex flex-col items-center justify-center md:items-start max-w-[240px] text-center md:text-left h-full">
            {eligible ? (
              <>
                <button 
                  onClick={() => setShowForm(!showForm)} 
                  className="bg-indigo-dye text-cotton px-6 py-3 font-semibold hover:bg-indigo-dye/90 w-full transition-colors"
                >
                  {existingReview ? "Edit your review" : "Write a review"}
                </button>
                <p className="text-[11px] mt-3 text-walnut/60 leading-relaxed">
                  Your purchase is verified. Thank you for contributing to ThreadMark.
                </p>
              </>
            ) : (
              <p className="text-xs text-walnut/60 leading-relaxed italic">
                ThreadMark restricts reviews to verified buyers who have completed an order for this specific material.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-8 border border-loom bg-white p-8 shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display text-3xl text-indigo-dye">{existingReview ? "Update your review" : "Write a review"}</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-2xl text-walnut/40 hover:text-indigo-dye transition-colors">&times;</button>
          </div>
          <div className="grid md:grid-cols-[200px_1fr] gap-8">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-indigo-dye mb-3">Rating</label>
              <select 
                value={rating} 
                onChange={e => setRating(Number(e.target.value))}
                className="w-full border border-loom bg-[#f7f1e7] px-4 py-3 text-sm focus:border-indigo-dye focus:outline-none transition-colors"
              >
                {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Stars</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-indigo-dye mb-3">Your experience</label>
              <textarea 
                required
                rows={4}
                maxLength={500}
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Tell us about the fabric quality, delivery, and your sourcing experience."
                className="w-full resize-none border border-loom bg-[#f7f1e7] px-4 py-3 text-sm focus:border-indigo-dye focus:outline-none transition-colors"
              />
              <div className="mt-2 flex justify-between items-center">
                <span className="text-xs text-walnut/50 font-mono">{comment.length}/500</span>
                <button 
                  disabled={submitting}
                  className="bg-indigo-dye px-8 py-3 font-semibold text-cotton disabled:opacity-50 hover:bg-indigo-dye/90 transition-colors"
                >
                  {submitting ? 'Saving...' : 'Save review'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="mt-8 space-y-6">
        {reviews.length > 0 ? (
          reviews.map(review => (
            <article key={review.id} className="border border-loom bg-white p-6 md:p-8 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-dye/10 text-lg font-display text-indigo-dye">
                    {review.buyer_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-indigo-dye">{review.buyer_name}</span>
                      {review.verified_purchase && (
                        <span className="inline-flex items-center gap-1 border border-success/30 bg-success/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                          Verified Purchase
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 text-ochre">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'fill-loom'}`} viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </div>
                </div>
                <time className="font-data text-xs text-walnut/50">
                  {new Date(review.created_at).toLocaleDateString()}
                </time>
              </div>
              
              <p className="mt-5 text-sm leading-relaxed text-walnut/90 max-w-4xl">
                {review.comment}
              </p>
              
              {/* Supplier Reply Section */}
              {review.supplier_reply && replyingTo !== review.id ? (
                <div className="mt-6 border border-indigo-dye/10 bg-[#f7f1e7] p-5">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-dye flex items-center gap-2">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                      Supplier Response
                    </span>
                    <div className="flex items-center gap-4">
                      <time className="font-data text-xs text-indigo-dye/50">
                        {new Date(review.supplier_replied_at!).toLocaleDateString()}
                      </time>
                      {isSupplier && (
                        <button onClick={() => {
                          setReplyingTo(review.id);
                          setReplyText(review.supplier_reply!);
                        }} className="text-xs font-semibold text-indigo-dye hover:underline">
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-indigo-dye max-w-4xl">{review.supplier_reply}</p>
                </div>
              ) : (
                isSupplier && (
                  <div className="mt-6 border-t border-loom/40 pt-5">
                    {replyingTo === review.id ? (
                      <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                        <textarea 
                          className="w-full resize-none border border-loom bg-[#f7f1e7] p-4 text-sm shadow-sm focus:border-indigo-dye focus:outline-none focus:ring-1 focus:ring-indigo-dye/20 transition-all"
                          rows={3}
                          maxLength={500}
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          placeholder="Write a public response to this review..."
                        />
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          <span className="text-xs text-walnut/50 font-mono">{replyText.length}/500</span>
                          <div className="flex gap-3 w-full sm:w-auto">
                            <button onClick={() => setReplyingTo(null)} className="flex-1 sm:flex-none border border-loom text-indigo-dye px-6 py-2.5 text-xs font-semibold hover:bg-loom/20 transition-colors">
                              Cancel
                            </button>
                            <button onClick={() => handleReplySubmit(review.id)} className="flex-1 sm:flex-none bg-indigo-dye px-6 py-2.5 text-xs font-semibold text-cotton hover:bg-indigo-dye/90 transition-colors">
                              {review.supplier_reply ? "Update Response" : "Post Response"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => {
                        setReplyingTo(review.id);
                        setReplyText(review.supplier_reply || "");
                      }} className="text-xs font-semibold text-indigo-dye hover:underline flex items-center gap-1.5 transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        {review.supplier_reply ? "Edit your response" : "Reply to buyer"}
                      </button>
                    )}
                  </div>
                )
              )}
            </article>
          ))
        ) : (
          <div className="flex flex-col h-[240px] items-center justify-center border border-dashed border-loom bg-white/50">
            <svg className="w-12 h-12 text-loom/80 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <p className="text-sm font-medium text-indigo-dye">No reviews yet</p>
            <p className="text-xs text-walnut/60 mt-1">Check back after buyers complete their orders.</p>
          </div>
        )}
      </div>
    </section>
  );
}
