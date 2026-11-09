import type { Metadata } from "next";
import { IdentifyClient } from "@/components/identify-client";

export const metadata: Metadata = { title: "Identificar un anime" };

export default function IdentifyPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">¿No sabes qué anime es?</h1>
      <p className="text-muted">Encuéntralo con una captura de pantalla o describiendo lo que recuerdas.</p>
      <IdentifyClient />
    </div>
  );
}
