"use client";

import { useEffect, useState, FormEvent } from "react";
import { api } from "@/lib/api";

type Review = {
  id: string;
  rating: number;
  comment: string;
  buyer_name: string;
  verified_purchase: boolean;
  created_at: string;
};

export function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [eligible, setEligible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    try {
      const [r, e] = await Promise.all([
        api<{ data: Review[] }>(`/products/${productId}/reviews`).catch(() => ({ data: [] })),
        api<{ data: { eligible: boolean } }>(`/products/${productId}/reviews/eligibility`).catch(() => ({ data: { eligible: false } }))
      ]);
      setReviews(r.data);
      setEligible(e.data.eligible);
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
    setNotice("");
    try {
      await api(`/products/${productId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating, comment })
      });
      setComment("");
      setRating(5);
      setNotice("Review submitted successfully!");
      void load(); // reload reviews
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not submit review");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="mt-12 text-sm text-walnut/70">Loading reviews...</div>;

  return (
    <section className="mt-16 border-t border-loom pt-12">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-data text-xs uppercase tracking-[.14em] text-ochre">Community trust</p>
          <h2 className="mt-2 font-display text-4xl">Verified Reviews</h2>
        </div>
        <div className="text-right">
          <p className="font-data text-3xl">{reviews.length > 0 ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1) : "—"} <span className="text-sm font-normal text-walnut/70">out of 5</span></p>
          <p className="text-xs text-walnut/70">{reviews.length} total review(s)</p>
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_2fr]">
        <div>
          {eligible ? (
            <form onSubmit={handleSubmit} className="border border-loom bg-[#f7f1e7] p-5">
              <h3 className="font-display text-2xl mb-4">Leave a review</h3>
              {notice && (
                <p className={`mb-4 text-sm ${notice.includes('successfully') ? 'text-success' : 'text-danger'}`}>
                  {notice}
                </p>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Rating (1-5)</label>
                  <select 
                    value={rating} 
                    onChange={e => setRating(Number(e.target.value))}
                    className="w-full border border-loom bg-transparent px-3 py-2 text-sm focus:border-indigo-dye focus:outline-none"
                  >
                    {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Your review</label>
                  <textarea 
                    required
                    rows={4}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Tell us about the fabric quality, delivery, and experience."
                    className="w-full resize-none border border-loom bg-transparent px-3 py-2 text-sm focus:border-indigo-dye focus:outline-none"
                  />
                </div>
                <button 
                  disabled={submitting}
                  className="w-full bg-indigo-dye py-2.5 font-semibold text-cotton disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit review'}
                </button>
              </div>
            </form>
          ) : (
            <div className="border border-loom/40 bg-loom/10 p-5 text-sm leading-6 text-walnut/70">
              <h3 className="font-semibold text-walnut mb-2">Review criteria</h3>
              <p>ThreadMark restricts reviews to verified buyers who have successfully completed an order for this specific material.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {reviews.length > 0 ? (
            reviews.map(review => (
              <article key={review.id} className="border-b border-loom/40 pb-6 last:border-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1 text-ochre">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'fill-loom'}`} viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="font-semibold">{review.buyer_name}</span>
                    {review.verified_purchase && (
                      <span className="inline-flex items-center gap-1 border border-success/30 bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-success">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>
                  <time className="font-data text-xs text-walnut/50">
                    {new Date(review.created_at).toLocaleDateString()}
                  </time>
                </div>
                <p className="mt-4 text-sm leading-6 text-walnut/90">{review.comment}</p>
              </article>
            ))
          ) : (
            <p className="text-sm text-walnut/70">No reviews yet. Check back after buyers complete their orders.</p>
          )}
        </div>
      </div>
    </section>
  );
}
