"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type Result = { error?: string };

export async function sendRequest(username: string): Promise<Result> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Inicia sesión." };
  const { data: target } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username.trim())
    .maybeSingle();
  if (!target) return { error: "No existe ese usuario." };
  if (target.id === auth.user.id) return { error: "No puedes agregarte a ti mismo." };
  const { error } = await supabase
    .from("friendships")
    .insert({ requester: auth.user.id, addressee: target.id });
  if (error) return { error: error.code === "23505" ? "Ya existe una solicitud." : error.message };
  revalidatePath("/friends");
  return {};
}

export async function respondRequest(requester: string, accept: boolean): Promise<Result> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Inicia sesión." };
  const query = accept
    ? supabase.from("friendships").update({ status: "accepted" })
    : supabase.from("friendships").delete();
  const { error } = await query.eq("requester", requester).eq("addressee", auth.user.id);
  if (error) return { error: error.message };
  revalidatePath("/friends");
  return {};
}
