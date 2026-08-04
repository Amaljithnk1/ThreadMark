"use client";
import { SiteHeader } from "@/components/site-header";
import { CheckoutForm } from "@/components/checkout-form";
import { RequireRole } from "@/components/require-role";
export default function CheckoutPage() { return <RequireRole role="buyer"><><SiteHeader/><main className="mx-auto max-w-6xl px-5 py-10 md:px-8"><p className="font-data text-xs uppercase tracking-[.14em] text-ochre">Checkout</p><h1 className="mt-2 font-display text-5xl">Place your order</h1><p className="mt-3 max-w-2xl leading-7">No payment is collected here. Your supplier receives the order after you confirm it.</p><div className="mt-8"><CheckoutForm/></div></main></></RequireRole>; }
