"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { COMPANY_NAME, th } from "@/lib/i18n";

export default function LoginPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: "staff" },
        },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      setError(null);
      alert(th.accountCreated);
      setIsSignUp(false);
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white">
            CA
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{COMPANY_NAME}</h1>
          <p className="mt-1 text-sm text-slate-500">{th.appName}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {isSignUp ? th.signUpPrompt : th.signInPrompt}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                {th.fullName}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder={th.yourName}
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{th.email}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder={th.emailPlaceholder}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">{th.password}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSignUp ? th.createAccount : th.signIn}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {isSignUp ? th.alreadyHaveAccount : th.firstTimeHere}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="font-medium text-blue-600 hover:underline"
          >
            {isSignUp ? th.signIn : th.createAccount}
          </button>
        </p>

        <p className="mt-4 text-center text-xs text-slate-400">{th.homeScreenTip}</p>
      </div>
    </div>
  );
}
