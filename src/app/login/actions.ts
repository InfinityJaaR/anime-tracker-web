"use server";

import { redirect } from "next/navigation";
import { safeNext } from "@/lib/safe-next";
import { createClient } from "@/lib/supabase/server";

export interface AuthState {
  error?: string;
  info?: string;
}

export async function signIn(_: AuthState, form: FormData): Promise<AuthState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(form.get("email") ?? ""),
    password: String(form.get("password") ?? ""),
  });
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "Confirma tu correo antes de entrar (revisa tu bandeja de entrada)." };
    }
    if (error.code === "invalid_credentials") {
      return { error: "Correo o contraseña incorrectos. Si aún no tienes cuenta, crea una." };
    }
    return { error: "No se pudo iniciar sesión. Intenta de nuevo en un momento." };
  }
  redirect(safeNext(form.get("next")));
}

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  const username = String(form.get("username") ?? "").trim();
  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
    return { error: "El nombre de usuario debe tener de 3 a 24 caracteres: letras, números o guion bajo (_)." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: String(form.get("email") ?? ""),
    password: String(form.get("password") ?? ""),
    options: { data: { username } },
  });
  if (error) {
    if (error.code === "user_already_exists") return { error: "Ya existe una cuenta con ese correo. Inicia sesión." };
    if (error.code === "weak_password") return { error: "La contraseña es muy débil. Usa al menos 6 caracteres." };
    if (/duplicate|unique|profiles_username/i.test(error.message)) {
      return { error: "Ese nombre de usuario ya está en uso. Elige otro." };
    }
    return { error: "No se pudo crear la cuenta. Intenta de nuevo en un momento." };
  }
  if (!data.session) {
    return { info: "Cuenta creada. Te enviamos un correo: ábrelo y pulsa el enlace para activarla." };
  }
  redirect(safeNext(form.get("next")));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
