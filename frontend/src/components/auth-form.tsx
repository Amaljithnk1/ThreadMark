"use client";
import Link from "next/link";
import { useState } from "react";
import { z } from "zod";
import { api } from "@/lib/api";
import { useAuthStore, type SessionUser } from "@/stores/auth-store";
import { useGoogleLogin } from "@react-oauth/google";

const formSchema = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email address"), password: z.string().min(8, "Use at least 8 characters").max(128), role: z.enum(["buyer", "supplier"]).optional(), username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscores only").optional() });
type Mode = "login" | "register";
export function AuthForm({ mode: initialMode }: { mode: Mode }) { 
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState(""); 
  const [role, setRole] = useState<"buyer" | "supplier">("buyer"); 
  const [username, setUsername] = useState(""); 
  const [error, setError] = useState(""); 
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false); 
  const [showPassword, setShowPassword] = useState(false); 
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const setUser = useAuthStore((state) => state.setUser);
  const isRegister = mode === "register";

  async function handleGoogleSuccess(credentialResponse: any) {
    const token = credentialResponse.access_token || credentialResponse.credential;
    if (!token) return;
    setError("");
    setFieldErrors({});
    setBusy(true);
    try {
      const result = await api<any>(`/auth/google`, { method: "POST", body: JSON.stringify({ token }) });
      if (result.status === "signup_required") {
        if (!isRegister) {
          setMode("register");
        }
        setGoogleToken(token);
      } else {
        setUser(result.user);
        const destination = result.user.role === "buyer" ? "/buyer" : `/${result.user.role}`;
        window.location.assign(destination);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: React.FormEvent) { 
    event.preventDefault(); 
    setError(""); 
    setFieldErrors({});
    
    if (googleToken) {
      const parsed = z.object({ role: z.enum(["buyer", "supplier"]), username: z.string().min(3, "Must be at least 3 characters").max(30).regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscores only").optional() }).safeParse({ role, ...(role === 'buyer' ? { username } : {}) });
      if (!parsed.success) {
        const errors: Record<string, string> = {};
        parsed.error.issues.forEach(issue => { if (issue.path[0]) errors[issue.path[0].toString()] = issue.message; });
        setFieldErrors(errors);
        return;
      }
      setBusy(true);
      try {
        const result = await api<{ user: SessionUser }>(`/auth/google-register`, { method: "POST", body: JSON.stringify({ token: googleToken, ...parsed.data }) });
        setUser(result.user);
        window.location.assign(`/onboarding/${result.user.role}`);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Something went wrong.");
      } finally {
        setBusy(false);
      }
      return;
    }

    const parsed = formSchema.safeParse({ email, password, ...(isRegister ? { role } : {}), ...(isRegister && role === 'buyer' ? { username } : {}) }); 
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.issues.forEach(issue => { if (issue.path[0]) errors[issue.path[0].toString()] = issue.message; });
      setFieldErrors(errors);
      return;
    } 
    setBusy(true); 
    try { 
      const result = await api<{ user: SessionUser }>(`/auth/${isRegister ? "register" : "login"}`, { method: "POST", body: JSON.stringify(parsed.data) }); 
      setUser(result.user); 
      const destination = isRegister ? `/onboarding/${result.user.role}` : (result.user.role === "buyer" ? "/buyer" : `/${result.user.role}`); 
      window.location.assign(destination); 
    } catch (cause) { 
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again."); 
    } finally { 
      setBusy(false); 
    } 
  }

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: () => setError("Google sign-in failed"),
  });

  if (googleToken) {
    return (
      <form onSubmit={submit} className="space-y-5" noValidate>
        <div className="rounded-sm border-l-4 border-indigo-dye bg-indigo-dye/10 p-4">
          <p className="text-sm text-indigo-dye font-semibold">Google Account connected!</p>
          <p className="text-sm mt-1">Just one final step to set up your marketplace profile.</p>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">I am joining as a</legend>
          <div className="grid grid-cols-2 gap-3">
            {(["buyer", "supplier"] as const).map((item) => <label key={item} className={`cursor-pointer rounded-sm border p-3 ${role === item ? "border-indigo-dye bg-indigo-dye/10" : "border-loom bg-[#f7f1e7]"}`}><input className="sr-only" type="radio" checked={role === item} onChange={() => setRole(item)} /><span className="block font-semibold capitalize">{item}</span><span className="mt-1 block text-xs">{item === "buyer" ? "Source fabrics for your business" : "Manage products and orders"}</span></label>)}
          </div>
        </fieldset>
        {role === "buyer" && <div><label htmlFor="username" className="mb-1.5 block text-sm font-semibold">Pick a unique Username</label><input id="username" value={username} onChange={(event) => setUsername(event.target.value)} className={`w-full rounded-sm border px-3 py-2.5 ${fieldErrors.username ? 'border-danger bg-danger/5' : 'border-loom bg-[#f7f1e7]'}`} required />{fieldErrors.username && <span className="text-danger text-sm mt-1 block">{fieldErrors.username}</span>}</div>}
        {error && <p role="alert" className="rounded-sm border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p>}
        <button disabled={busy} className="w-full rounded-sm bg-indigo-dye px-4 py-3 font-semibold text-cotton disabled:cursor-wait disabled:opacity-70">{busy ? "Creating account…" : "Complete Setup"}</button>
        <button type="button" onClick={() => setGoogleToken(null)} className="w-full text-sm underline text-walnut/60">Cancel</button>
      </form>
    );
  }

  return <form onSubmit={submit} className="space-y-5" noValidate>
    <div className="space-y-3">
      <button 
        type="button" 
        onClick={() => googleLogin()}
        className="flex w-full items-center justify-center gap-3 rounded-sm border border-loom bg-[#f7f1e7] px-4 py-3 font-semibold text-walnut transition-colors hover:bg-loom/20"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
        {isRegister ? "Sign up with Google" : "Sign in with Google"}
      </button>
      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-loom"></div>
        <span className="mx-4 flex-shrink-0 text-xs font-semibold uppercase text-walnut/60">Or</span>
        <div className="flex-grow border-t border-loom"></div>
      </div>
    </div>
    {isRegister && role === "buyer" && <div><label htmlFor="username" className="mb-1.5 block text-sm font-semibold">Username</label><input id="username" value={username} onChange={(event) => setUsername(event.target.value)} className={`w-full rounded-sm border px-3 py-2.5 ${fieldErrors.username ? 'border-danger bg-danger/5' : 'border-loom bg-[#f7f1e7]'}`} required />{fieldErrors.username && <span className="text-danger text-sm mt-1 block">{fieldErrors.username}</span>}</div>}<div><label htmlFor="email" className="mb-1.5 block text-sm font-semibold">Work email</label><input id="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className={`w-full rounded-sm border px-3 py-2.5 ${fieldErrors.email ? 'border-danger bg-danger/5' : 'border-loom bg-[#f7f1e7]'}`} placeholder="you@company.com" required />{fieldErrors.email && <span className="text-danger text-sm mt-1 block">{fieldErrors.email}</span>}</div><div><label htmlFor="password" className="mb-1.5 block text-sm font-semibold">Password</label><div className="relative"><input id="password" type={showPassword ? "text" : "password"} autoComplete={isRegister ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} className={`w-full rounded-sm border px-3 py-2.5 pr-10 ${fieldErrors.password ? 'border-danger bg-danger/5' : 'border-loom bg-[#f7f1e7]'}`} placeholder="At least 8 characters" required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-walnut/60 hover:text-indigo-dye bg-transparent shadow-none hover:shadow-none hover:-translate-y-1/2 active:-translate-y-1/2 active:shadow-none border-none" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}</button></div>{fieldErrors.password && <span className="text-danger text-sm mt-1 block">{fieldErrors.password}</span>}</div>{isRegister && <fieldset><legend className="mb-2 text-sm font-semibold">I am joining as a</legend><div className="grid grid-cols-2 gap-3">{(["buyer", "supplier"] as const).map((item) => <label key={item} className={`cursor-pointer rounded-sm border p-3 ${role === item ? "border-indigo-dye bg-indigo-dye/10" : "border-loom bg-[#f7f1e7]"}`}><input className="sr-only" type="radio" checked={role === item} onChange={() => setRole(item)} /><span className="block font-semibold capitalize">{item}</span><span className="mt-1 block text-xs">{item === "buyer" ? "Source fabrics for your business" : "Manage products and orders"}</span></label>)}</div></fieldset>}{error && <p role="alert" className="rounded-sm border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p>}<button disabled={busy} className="w-full rounded-sm bg-indigo-dye px-4 py-3 font-semibold text-cotton disabled:cursor-wait disabled:opacity-70">{busy ? "Please wait…" : isRegister ? "Create account" : "Sign in"}</button><p className="text-center text-sm">{isRegister ? "Already have an account?" : "New to ThreadMark?"} <Link className="font-semibold text-indigo-dye underline" href={isRegister ? "/login" : "/register"}>{isRegister ? "Sign in" : "Create an account"}</Link></p></form>; 
}
