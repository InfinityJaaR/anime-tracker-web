"use server";

import { redirect } from "next/navigation";
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
  if (error) return { error: "Correo o contraseña incorrectos." };
  redirect("/lists");
}

export async function signUp(_: AuthState, form: FormData): Promise<AuthState> {
  const username = String(form.get("username") ?? "").trim();
  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
    return { error: "El usuario debe tener 3-24 caracteres (letras, números o _)." };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: String(form.get("email") ?? ""),
    password: String(form.get("password") ?? ""),
    options: { data: { username } },
  });
  if (error) return { error: error.message };
  if (!data.session) return { info: "Revisa tu correo para confirmar la cuenta." };
  redirect("/lists");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
