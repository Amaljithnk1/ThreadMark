"use client";
import { SiteHeader } from "@/components/site-header";
import { CartPanel } from "@/components/cart-panel";
import Link from "next/link";
import { RequireRole } from "@/components/require-role";
export default function CartPage() { return <RequireRole role="buyer"><><SiteHeader/><main className="mx-auto max-w-4xl px-5 py-10 md:px-8"><p className="font-data text-xs uppercase tracking-[.14em] text-ochre">Order draft</p><h1 className="mt-2 font-display text-5xl">Your sourcing cart</h1><p className="mt-3 max-w-xl leading-7">Review quantities before entering shipping information. Pricing will be reviewed before you place the order.</p><div className="mt-8"><CartPanel/></div><div className="mt-6 flex justify-end"><Link href="/checkout" className="rounded-sm bg-indigo-dye px-5 py-3 font-semibold text-cotton">Continue to checkout</Link></div></main></RequireRole>; }
