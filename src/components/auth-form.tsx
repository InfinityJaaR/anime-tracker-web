"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "@/app/login/actions";

const initial: AuthState = {};

export function AuthForm() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [state, action, pending] = useActionState(mode === "in" ? signIn : signUp, initial);
  const input =
    "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <form action={action} className="space-y-3 rounded-lg border border-border bg-surface p-6">
      <h1 className="text-xl font-bold">{mode === "in" ? "Iniciar sesión" : "Crear cuenta"}</h1>
      {mode === "up" && (
        <input name="username" placeholder="Usuario" required className={input} autoComplete="username" />
      )}
      <input name="email" type="email" placeholder="Correo" required className={input} autoComplete="email" />
      <input
        name="password"
        type="password"
        placeholder="Contraseña (mín. 6)"
        minLength={6}
        required
        className={input}
        autoComplete={mode === "in" ? "current-password" : "new-password"}
      />
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state.info && <p className="text-sm text-accent">{state.info}</p>}
      <button
        disabled={pending}
        className="w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg disabled:opacity-60"
      >
        {pending ? "Enviando…" : mode === "in" ? "Entrar" : "Registrarme"}
      </button>
      <button
        type="button"
        onClick={() => setMode(mode === "in" ? "up" : "in")}
        className="w-full text-center text-sm text-muted underline"
      >
        {mode === "in" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Entra"}
      </button>
    </form>
  );
}
