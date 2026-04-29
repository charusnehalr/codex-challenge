"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, KarigaiLogo, Modal } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { useAuthModalStore } from "@/store/auth-modal.store";

export function AuthModal() {
  const router = useRouter();
  const { open, mode, closeModal, setMode } = useAuthModalStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    closeModal();
    router.push("/app/dashboard");
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

    closeModal();
    router.push("/app/dashboard");
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
        <Input
          label="Password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
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
