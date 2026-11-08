"use client";

import { useState, useTransition } from "react";
import { respondRequest, sendRequest } from "@/app/friends/actions";

export function AddFriendForm() {
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await sendRequest(name);
          setMsg(res.error ?? "Solicitud enviada");
          if (!res.error) setName("");
        });
      }}
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre de usuario"
        required
        className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <button disabled={pending} className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg disabled:opacity-60">
        Agregar
      </button>
      {msg && <p className="self-center text-xs text-muted">{msg}</p>}
    </form>
  );
}

export function RequestButtons({ requester }: { requester: string }) {
  const [pending, start] = useTransition();
  return (
    <span className="flex gap-2">
      <button disabled={pending} onClick={() => start(() => void respondRequest(requester, true))} className="rounded-md bg-accent px-3 py-1 text-xs text-accent-fg">
        Aceptar
      </button>
      <button disabled={pending} onClick={() => start(() => void respondRequest(requester, false))} className="rounded-md border border-border px-3 py-1 text-xs">
        Rechazar
      </button>
    </span>
  );
}
