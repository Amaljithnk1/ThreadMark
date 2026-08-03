"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { ProductCard, type ProductPreview } from "@/components/marketplace/product-card";
import { api } from "@/lib/api";

const categories = ["Apparel", "Home textiles", "Outdoor", "Uniforms", "Technical", "Deadstock"];

export default function Home() {
  const [products, setProducts] = useState<ProductPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      api<{ data: ProductPreview[] }>("/products?limit=8")
        .then((r) => setProducts(r.data))
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="woven-grid border-b border-loom"><div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-[1.25fr_.75fr] md:px-8 md:py-24"><div><p className="font-data text-xs uppercase tracking-[.16em] text-ochre">B2B fabric sourcing, made legible</p><h1 className="mt-5 max-w-3xl font-display text-5xl leading-[.95] tracking-tight md:text-7xl">Know the fabric<br/>before you buy it.</h1><p className="mt-6 max-w-xl text-lg leading-8">Compare verified specifications, source ready stock, and manage wholesale orders in one focused textile marketplace.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/marketplace" className="rounded-sm bg-indigo-dye px-5 py-3 font-semibold text-cotton">Explore fabrics</Link><Link href="/register" className="rounded-sm border border-indigo-dye px-5 py-3 font-semibold text-indigo-dye hover:bg-indigo-dye/10">List your fabrics</Link></div></div><aside className="swatch-tag swatch-notch self-end border border-loom bg-[#f7f1e7] p-6"><p className="font-data text-xs uppercase tracking-[.14em] text-ochre">Specify with confidence</p><dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5"><div><dt className="text-xs">Technical filters</dt><dd className="mt-1 font-data text-xl">GSM / weave</dd></div><div><dt className="text-xs">Trade options</dt><dd className="mt-1 font-data text-xl">RFQ / tiers</dd></div><div><dt className="text-xs">Source trust</dt><dd className="mt-1 font-data text-xl">Verified</dd></div><div><dt className="text-xs">Discovery</dt><dd className="mt-1 font-data text-xl">AI-assisted</dd></div></dl></aside></div></section>

        <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-data text-xs uppercase tracking-[.14em] text-ochre">Market selection</p>
              <h2 className="mt-2 font-display text-4xl">Featured fabric lots</h2>
            </div>
            <Link href="/marketplace" className="text-sm font-semibold text-indigo-dye underline">View marketplace</Link>
          </div>
          {loading && <p className="mt-8 text-sm">Loading featured fabric lots…</p>}
          {error && <p className="mt-8 border border-danger/40 bg-danger/10 p-3 text-sm text-danger">Featured products are unavailable right now. Browse the full marketplace instead.</p>}
          {!loading && !error && products.length > 0 && (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          )}
          {!loading && !error && products.length === 0 && (
            <p className="mt-8 border border-loom bg-[#f7f1e7] p-5 text-sm">No featured products yet — check back soon, or browse the full marketplace.</p>
          )}
        </section>

        <section className="border-y border-loom bg-indigo-dye text-cotton"><div className="mx-auto max-w-7xl px-5 py-10 md:px-8"><p className="font-data text-xs uppercase tracking-[.16em] text-cotton/70">Browse by sourcing need</p><div className="mt-5 flex flex-wrap gap-3">{categories.map((category) => <Link key={category} href={`/marketplace?category=${encodeURIComponent(category)}`} className="rounded-sm border border-cotton/50 px-4 py-2 text-sm hover:bg-cotton hover:text-indigo-dye">{category}</Link>)}</div></div></section>
      </main>
    </>
  );
}
