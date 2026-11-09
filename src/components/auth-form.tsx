"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import { signIn, signUp, type AuthState } from "@/app/login/actions";

const initial: AuthState = {};
const input =
  "w-full rounded-md border border-border bg-surface px-3 py-2.5 text-base outline-none focus:border-accent sm:text-sm";

type Mode = "in" | "up";

const COPY = {
  in: { title: "Iniciar sesión", submit: "Iniciar sesión", pending: "Iniciando sesión…", toggle: "Soy nuevo: crear una cuenta gratis" },
  up: { title: "Crear cuenta", submit: "Crear cuenta", pending: "Creando cuenta…", toggle: "Ya tengo cuenta: iniciar sesión" },
};

/** Mensajes de validación en español (los del navegador salen en su idioma). */
function spanishValidity(e: FormEvent<HTMLInputElement>) {
  const el = e.currentTarget;
  const v = el.validity;
  if (v.valueMissing) el.setCustomValidity("Completa este campo.");
  else if (v.typeMismatch) el.setCustomValidity("Escribe un correo válido, por ejemplo nombre@correo.com.");
  else if (v.tooShort) el.setCustomValidity(`Usa al menos ${el.minLength} caracteres.`);
  else if (v.patternMismatch) el.setCustomValidity("Usa de 3 a 24 caracteres: letras, números o guion bajo (_).");
  else el.setCustomValidity("");
}
const clearValidity = (e: FormEvent<HTMLInputElement>) => e.currentTarget.setCustomValidity("");

export function AuthForm({ initialMode = "in", next }: { initialMode?: Mode; next: string }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  // `key` remonta el formulario al cambiar de modo: cada modo tiene su propio estado
  // y un error de registro no se queda pegado en "Iniciar sesión".
  const toggle = () => {
    const nextMode = mode === "in" ? "up" : "in";
    setMode(nextMode);
    // Refleja el modo en la URL para poder compartir o recargar /login?mode=signup.
    const url = new URL(window.location.href);
    if (nextMode === "up") url.searchParams.set("mode", "signup");
    else url.searchParams.delete("mode");
    window.history.replaceState(null, "", url);
  };
  return <ModeForm key={mode} mode={mode} next={next} onToggle={toggle} />;
}

function ModeForm({ mode, next, onToggle }: { mode: Mode; next: string; onToggle: () => void }) {
  const [state, action, pending] = useActionState(mode === "in" ? signIn : signUp, initial);
  const t = COPY[mode];

  return (
    <form action={action} className="space-y-3 rounded-lg border border-border bg-surface p-6">
      <h1 className="text-xl font-bold">{t.title}</h1>
      {mode === "up" && (
        <p className="text-sm text-muted">Gratis. Guarda tus listas, mira tus estadísticas y compara con tus amigos.</p>
      )}
      <input type="hidden" name="next" value={next} />
      {mode === "up" && (
        <div className="space-y-1">
          <label htmlFor="username" className="text-sm font-medium">Nombre de usuario</label>
          <input
            id="username"
            name="username"
            required
            minLength={3}
            maxLength={24}
            pattern="[A-Za-z0-9_]{3,24}"
            autoComplete="username"
            aria-describedby="username-help"
            onInvalid={spanishValidity}
            onInput={clearValidity}
            className={input}
          />
          <p id="username-help" className="text-xs text-muted">
            De 3 a 24 letras, números o _. Tus amigos te encontrarán por este nombre.
          </p>
        </div>
      )}
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">Correo electrónico</label>
        <input id="email" name="email" type="email" required autoComplete="email" onInvalid={spanishValidity} onInput={clearValidity} className={input} />
      </div>
      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={6}
          required
          aria-describedby={mode === "up" ? "password-help" : undefined}
          onInvalid={spanishValidity}
          onInput={clearValidity}
          className={input}
          autoComplete={mode === "in" ? "current-password" : "new-password"}
        />
        {mode === "up" && <p id="password-help" className="text-xs text-muted">Mínimo 6 caracteres.</p>}
      </div>
      {state.error && <p role="alert" className="text-sm text-red-500">{state.error}</p>}
      {state.info && <p role="status" className="text-sm text-accent">{state.info}</p>}
      {mode === "up" && (
        <p className="text-xs text-muted">
          Al crear tu cuenta aceptas cómo tratamos tus datos, explicado en{" "}
          <Link href="/privacidad" className="text-accent underline">Privacidad y términos</Link>.
        </p>
      )}
      <button
        disabled={pending}
        className="min-h-11 w-full rounded-md bg-accent px-4 text-sm font-medium text-accent-fg disabled:opacity-60"
      >
        {pending ? t.pending : t.submit}
      </button>
      <button
        type="button"
        onClick={onToggle}
        className="min-h-11 w-full rounded-md border border-border text-center text-sm font-medium hover:border-accent"
      >
        {t.toggle}
      </button>
    </form>
  );
}
