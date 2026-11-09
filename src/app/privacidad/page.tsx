import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacidad y términos" };

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "Qué es AnimeTracker",
    body: [
      "AnimeTracker es una aplicación gratuita para organizar el anime que ves. No tiene planes de pago, publicidad ni compras dentro de la app.",
    ],
  },
  {
    title: "Qué datos guardamos",
    body: [
      "Al crear tu cuenta guardamos tu correo, tu nombre de usuario y tu contraseña (cifrada por nuestro proveedor de autenticación, Supabase).",
      "Guardamos los animes que añades a tus listas: estado, nota y episodio.",
      "Tu nombre de usuario es visible para quien te busque para agregarte como amigo. Tus listas solo las ven tú y los amigos que aceptes.",
      "No vendemos ni compartimos tus datos con anunciantes. Usamos tu correo solo para la cuenta (confirmación y acceso).",
    ],
  },
  {
    title: "Servicios externos",
    body: [
      "La información de cada anime (títulos, imágenes, sinopsis) viene de MyAnimeList a través del servicio Tenrai. Las búsquedas que haces se envían a ese servicio.",
      "“Traducir al español” envía la sinopsis (texto público, nunca tus datos) al traductor gratuito MyMemory.",
      "“Buscar por imagen” envía la imagen que elijas al servicio trace.moe para compararla con episodios. No la guardamos; revisa las condiciones de trace.moe antes de subir imágenes personales.",
    ],
  },
  {
    title: "Tu clave de API en el agente de IA",
    body: [
      "La clave que escribes pasa por nuestro servidor solo para reenviar tu descripción al proveedor que elijas (Anthropic, OpenAI o Google). No la guardamos ni la registramos en el servidor.",
      "Ese proveedor recibe tu descripción y tu clave, y cobra el uso a tu cuenta con él según sus propias condiciones.",
      "Si marcas “Recordar la clave en este navegador”, se guarda sin cifrar en el almacenamiento de tu navegador. Desmárcala o borra los datos del sitio para eliminarla.",
    ],
  },
  {
    title: "Borrar tu cuenta",
    body: [
      "Puedes quitar cualquier anime de tus listas en cualquier momento. Para borrar tu cuenta y todos sus datos, contacta a quien administra esta instalación de AnimeTracker.",
    ],
  },
  {
    title: "Términos de uso",
    body: [
      "Usa la app de forma razonable: no intentes acceder a cuentas ajenas ni sobrecargar el servicio. La app se ofrece tal cual, sin garantías, y puede cambiar o dejar de estar disponible.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Privacidad y términos</h1>
      {SECTIONS.map((s) => (
        <section key={s.title} className="space-y-2">
          <h2 className="text-lg font-semibold">{s.title}</h2>
          {s.body.map((p) => (
            <p key={p} className="text-sm leading-relaxed text-muted">{p}</p>
          ))}
        </section>
      ))}
      <Link href="/login?mode=signup" className="inline-block rounded-md bg-accent px-5 py-3 text-sm font-semibold text-accent-fg">
        Crear cuenta gratis
      </Link>
    </article>
  );
}
