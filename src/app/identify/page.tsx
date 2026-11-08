import type { Metadata } from "next";
import { IdentifyClient } from "@/components/identify-client";

export const metadata: Metadata = { title: "Identificar anime" };

export default function IdentifyPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Identificar anime</h1>
      <IdentifyClient />
    </div>
  );
}
