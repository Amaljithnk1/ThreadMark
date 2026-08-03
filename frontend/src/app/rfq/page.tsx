import {Suspense} from "react";
import {RfqForm} from "@/components/rfq-form";
export default function RfqPage(){return <Suspense fallback={<main className="min-h-screen bg-cotton p-8">Loading quote request…</main>}><RfqForm/></Suspense>}
