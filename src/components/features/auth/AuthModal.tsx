"use client";

import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button, Input, KarigaiLogo, Modal } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { useAuthModalStore } from "@/store/auth-modal.store";

export function AuthModal() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { open, mode, closeModal, setMode } = useAuthModalStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const result = isSignup
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    queryClient.clear();
    closeModal();
    router.push("/app/dashboard");
    router.refresh();
    setLoading(false);
  }

  async function continueAsDemo() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const result = await supabase.auth.signInWithPassword({
      email: "demo@karigai.app",
      password: "demo1234",
    });

    if (result.error) {
      setError(result.error.message);
      setLoading(false);
      return;
    }

    queryClient.clear();
    closeModal();
    router.push("/app/dashboard");
    router.refresh();
    setLoading(false);
  }

  return (
    <Modal open={open} onClose={closeModal} title={isSignup ? "Create account" : "Sign in"}>
      <div className="mb-6 flex justify-center">
        <KarigaiLogo size={20} tagline />
      </div>

      <form className="space-y-4" onSubmit={authenticate}>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <label className="block font-body text-sm text-ink">
          <span className="mb-2 block text-sm font-medium text-ink2">Password</span>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="h-11 w-full rounded-xl border border-l-2 border-hairline border-l-transparent bg-card px-4 pr-11 font-body text-sm text-ink outline-none transition-all duration-200 placeholder:text-muted focus:border-clay focus:border-l-clay focus:ring-2 focus:ring-clay/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-ink"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </label>
        <Button className="w-full" type="submit" loading={loading}>
          {isSignup ? "Create account" : "Sign in"}
        </Button>
        {error ? <p className="font-body text-xs text-alert">{error}</p> : null}
      </form>

      <button
        type="button"
        className="mt-4 w-full text-center font-body text-xs text-muted transition hover:text-ink"
        onClick={() => {
          setError(null);
          setMode(isSignup ? "login" : "signup");
        }}
      >
        {isSignup ? "Already have an account? Sign in" : "Don't have an account? Create one"}
      </button>

      {!isSignup ? (
        <>
          <div className="my-5 h-px bg-hairline" />
          <Button className="w-full" variant="ghost" onClick={continueAsDemo} loading={loading}>
            Continue as demo
          </Button>
        </>
      ) : null}
    </Modal>
  );
}
