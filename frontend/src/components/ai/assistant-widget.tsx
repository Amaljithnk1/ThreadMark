"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAIStore } from "@/stores/ai-store";
import { useAuthStore } from "@/stores/auth-store";

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => SpeechRecognition;
    SpeechRecognition?: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  onresult: (event: { results: { [i: number]: { [i: number]: { transcript: string } } } }) => void;
  onerror: () => void;
}

export function AssistantWidget() {
  const router = useRouter();
  const { messages, isThinking, isOpen, setOpen, add, setThinking, clear } = useAIStore();
  const [text, setText] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [muted, setMuted] = useState(false);
  const [pendingAction, setPendingAction] = useState<{productId:string;productName:string;quantity:number|null}[] | null>(null);
  const feed = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api("/ai/warm", { method: "POST" }).catch(() => undefined);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => { api("/ai/warm", { method: "POST" }).catch(() => undefined); }, 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (feed.current) {
      feed.current.scrollTo({ top: feed.current.scrollHeight });
    }
  }, [messages, isThinking]);

  async function send(value = text) {
    const trimmed = value.trim();
    if (!trimmed || isThinking) return;
    setText("");
    add({ role: "user", content: trimmed });
    setThinking(true);
    try {
      // Semantic search
      if (/^(?:semantic|similar to|inspiration)\b/i.test(trimmed)) {
        const semantic = await api<{ data: { products: { name: string; composition: string; gsm: number | string; price: number | string }[] } }>(
          "/ai/semantic-search",
          { method: "POST", body: JSON.stringify({ query: trimmed.replace(/^(?:semantic|similar to|inspiration)\s*:?\s*/i, "") }) }
        );
        const results = semantic.data.products
          .slice(0, 4)
          .map((item) => `${item.name} — ${item.composition}, ${item.gsm} GSM, ₹${item.price}/m`)
          .join("\n");
        add({ role: "assistant", content: results ? `Semantic matches:\n${results}` : "I could not find semantic matches." });
        return;
      }

      // Use-case match
      if (/(?:fabric|material).*(?:for|used for)|(?:for).*(?:cushion|uniform|outdoor|curtain|upholstery|apparel)/i.test(trimmed)) {
        const match = await api<{ data: { matches: { name: string; composition: string; gsm: number | string; price: number | string }[] } }>(
          "/ai/use-case-match",
          { method: "POST", body: JSON.stringify({ description: trimmed }) }
        );
        const suggestions = match.data.matches
          .slice(0, 3)
          .map((item) => `${item.name} — ${item.composition}, ${item.gsm} GSM, ₹${item.price}/m`)
          .join("\n");
        add({ role: "assistant", content: suggestions ? `Embedding-matched materials for your use case:\n${suggestions}` : "I could not find a matching material lot." });
        return;
      }

      // Navigation
      const navMatch = trimmed.match(/^(?:(?:go to|open|take me to|view|go)\s+)?(back|previous page|dashboard|cart|marketplace|home|ready stock|sustainable sourcing|login|login page|register|signup|profile|orders|rfqs)\b/i);
      if (navMatch) {
        const dest = navMatch[1].toLowerCase();
        
        if (dest === "back" || dest === "previous page") {
          add({ role: "assistant", content: "Going back to the previous page." });
          router.back();
          return;
        }

        let path = `/${dest}`;
        if (dest === "home") path = "/";
        else if (dest === "ready stock") path = "/marketplace?stockType=ready_stock";
        else if (dest === "sustainable sourcing") path = "/marketplace?sustainabilityTag=deadstock";
        else if (dest === "login" || dest === "login page") path = "/login";
        else if (dest === "register" || dest === "signup") path = "/register";
        else if (dest === "dashboard") {
          const role = useAuthStore.getState().user?.role;
          if (role) {
            path = `/${role}`;
          } else {
            add({ role: "assistant", content: "You need to log in to view a dashboard." });
            return;
          }
        }
        else if (dest === "profile" || dest === "orders" || dest === "rfqs") {
          const role = useAuthStore.getState().user?.role;
          if (role) {
            path = `/${role}/${dest}`;
          } else {
            add({ role: "assistant", content: `You need to log in to view your ${dest}.` });
            return;
          }
        }
        
        add({ role: "assistant", content: `Taking you to ${dest}.` });
        router.push(path);
        return;
      }

      // Actions
      if (/^(?:log out|logout|sign out)\b/i.test(trimmed)) {
        add({ role: "assistant", content: "Logging you out." });
        try {
          await api("/auth/logout", { method: "POST" });
        } finally {
          useAuthStore.getState().clear();
          window.location.assign("/");
        }
        return;
      }

      // Natural search → redirect to marketplace
      if (/^(search|find|show( me)?|looking for)\b/i.test(trimmed) || /\b(buy|need|want|source|looking to buy)\b.*\b(fabric|cotton|wool|linen|silk|denim|polyester|material)\b/i.test(trimmed)) {
        const search = await api<{ data: { filters: Record<string, unknown> } }>(
          "/ai/natural-search",
          { method: "POST", body: JSON.stringify({ query: trimmed }) }
        );
        sessionStorage.setItem("threadmark-ai-filters", JSON.stringify(search.data.filters));
        add({ role: "assistant", content: "I translated your request into marketplace filters and opened matching material lots." });
        router.push("/marketplace");
        return;
      }

      // General chat
      const result = await api<{ data: { message: string; actions?: { type: string; productId?: string; productName?: string; quantity?: number; productIds?: string[] }[] | null; pendingAction?: {productId:string;productName:string;quantity:number|null}[] | null } }>(
        "/ai/chat",
        {
          method: "POST",
          body: JSON.stringify({
            messages: [...messages, { role: "user", content: trimmed }],
            productId: sessionStorage.getItem("threadmark-ai-product-id") ?? undefined,
            pendingAction: pendingAction ?? undefined,
          }),
        }
      );

      let reply = result.data.message;
      setPendingAction(result.data.pendingAction ?? null);

      if (result.data.actions?.length) {
        const outcomes:string[]=[];
        for(const a of result.data.actions){
          if(a.type==='compare'&&a.productIds?.length){sessionStorage.setItem("threadmark-compare-products",JSON.stringify(a.productIds));window.location.assign("/compare");}
          else if(a.type==='add_to_cart'&&a.productId&&a.quantity){
            try{
              await api("/cart/items",{method:"POST",body:JSON.stringify({productId:a.productId,quantity:a.quantity})});
              outcomes.push(`Added ${a.quantity}m of ${a.productName}.`);
            }catch(cause){
              outcomes.push(`Could not add ${a.productName}: ${cause instanceof Error?cause.message:"cart update failed"}`);
            }
          }
        }
        if(outcomes.length) reply += `\n\n${outcomes.join(" ")}`;
        setPendingAction(null);
      }

      add({ role: "assistant", content: reply });
      if ("speechSynthesis" in window && !muted) {
        window.speechSynthesis.cancel(); // stop any previous utterance before starting a new one
        const utterance = new SpeechSynthesisUtterance(reply);
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      add({ role: "assistant", content: "I am temporarily unavailable. Browse and filters remain available while I reconnect." });
    } finally {
      setThinking(false);
    }
  }

  function listen() {
    const Recognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceError("Voice input is not supported in this browser.");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => setText(event.results[0][0].transcript);
    recognition.onerror = () => setVoiceError("I could not hear that. Try again or type your request.");
    recognition.start();
  }

  return (
    <>
      <button
        onClick={() => setOpen(!isOpen)}
        className="swatch-tag fixed bottom-5 right-5 z-40 border border-indigo-dye bg-indigo-dye px-4 py-3 text-sm font-semibold text-cotton shadow-lg"
      >
        Ask ThreadMark AI
      </button>

      {isOpen && (
        <section
          aria-label="ThreadMark AI assistant"
          className="swatch-tag fixed bottom-20 right-5 z-40 flex h-[min(600px,calc(100vh-110px))] w-[min(400px,calc(100vw-40px))] flex-col border border-loom bg-cotton shadow-2xl"
        >
          <header className="flex items-start justify-between border-b border-loom px-5 py-4">
            <div>
              <p className="font-data text-[10px] uppercase tracking-[.14em] text-ochre">Marketplace assistant</p>
              <h2 className="font-display text-2xl">Ask about fabric.</h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="text-xs font-semibold text-indigo-dye transition-opacity hover:opacity-80"
                onClick={() => {
                  window.speechSynthesis?.cancel();
                  clear();
                  setPendingAction(null);
                }}
                title="Start a new conversation"
              >
                New chat
              </button>
              <button
                type="button"
                className="mt-1 text-indigo-dye transition-opacity hover:opacity-80"
                title={muted ? "Unmute voice" : "Mute voice"}
                aria-label={muted ? "Unmute voice" : "Mute voice"}
                onClick={() => {
                  window.speechSynthesis.cancel();
                  setMuted(m => !m);
                }}
              >
              {muted ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
              )}
            </button>
            </div>
          </header>

          <div ref={feed} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-[90%] rounded-sm p-3 text-sm leading-6 ${
                  message.role === "assistant"
                    ? "swatch-tag swatch-notch border border-loom bg-[#f7f1e7]"
                    : "ml-auto bg-indigo-dye text-cotton"
                }`}
              >
                {message.content}
              </div>
            ))}
            {isThinking && (
              <div className="swatch-tag swatch-notch max-w-[90%] border border-loom bg-[#f7f1e7] p-3 text-sm">
                Thinking…
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); void send(); }}
            className="border-t border-loom p-3"
          >
            <label className="sr-only" htmlFor="ai-message">Ask ThreadMark AI</label>
            <div className="flex gap-2">
              <input
                id="ai-message"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. lightweight cotton under ₹500/m"
                className="min-w-0 flex-1 border border-loom bg-[#f7f1e7] px-3 py-2 text-sm"
              />
              <button type="button" onClick={listen} className="border border-indigo-dye px-3 text-indigo-dye" aria-label="Speak your request">
                Mic
              </button>
              <button className="bg-indigo-dye px-3 text-sm font-semibold text-cotton">Send</button>
            </div>
            {voiceError && <p role="alert" className="mt-2 text-xs text-danger">{voiceError}</p>}
          </form>
        </section>
      )}
    </>
  );
}
