export const STATUSES = [
  { value: "watching", label: "Viendo" },
  { value: "plan_to_watch", label: "Plan de ver" },
  { value: "on_hold", label: "Pausado" },
  { value: "dropped", label: "Abandonado" },
  { value: "completed", label: "Completado" },
] as const;

export type ListStatus = (typeof STATUSES)[number]["value"];

export const isStatus = (v: unknown): v is ListStatus =>
  STATUSES.some((s) => s.value === v);

export interface ListEntry {
  mal_id: number;
  status: ListStatus;
  score: number | null;
  progress: number;
  title: string;
  image: string | null;
  genres: string[];
}
