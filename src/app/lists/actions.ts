"use server";

import { revalidatePath } from "next/cache";
import { isStatus } from "@/lib/lists";
import { createClient } from "@/lib/supabase/server";

export interface SaveInput {
  mal_id: number;
  status: string;
  score: number | null;
  progress: number;
  title: string;
  image: string | null;
  genres: string[];
}

export async function saveEntry(input: SaveInput): Promise<{ error?: string }> {
  if (!isStatus(input.status)) return { error: "Estado inválido." };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Inicia sesión para guardar." };

  const score = input.score && input.score >= 1 && input.score <= 10 ? Math.round(input.score) : null;
  const { error } = await supabase.from("list_entries").upsert({
    user_id: data.user.id,
    mal_id: input.mal_id,
    status: input.status,
    score,
    progress: Math.max(0, Math.floor(input.progress) || 0),
    title: input.title,
    image: input.image,
    genres: input.genres,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };
  revalidatePath("/lists");
  return {};
}

export async function removeEntry(malId: number): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Inicia sesión." };
  const { error } = await supabase
    .from("list_entries")
    .delete()
    .eq("user_id", data.user.id)
    .eq("mal_id", malId);
  if (error) return { error: error.message };
  revalidatePath("/lists");
  return {};
}
