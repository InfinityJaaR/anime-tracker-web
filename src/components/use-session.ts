"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface SessionUser {
  id: string;
  username: string;
  email: string;
}

type State = { status: "loading" } | { status: "out" } | { status: "in"; user: SessionUser };

/**
 * Sesión para la barra de navegación. La barra vive en el layout y no se remonta al
 * navegar, así que se vuelve a leer la sesión en cada cambio de ruta (el login y el
 * cierre de sesión ocurren en el servidor y el navegador no se entera por sí solo).
 */
export function useSession() {
  const pathname = usePathname();
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        const u = data.session?.user;
        if (!u) return !cancelled && setState({ status: "out" });
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", u.id)
          .maybeSingle();
        if (cancelled) return;
        setState({
          status: "in",
          user: {
            id: u.id,
            email: u.email ?? "",
            username: profile?.username ?? u.email?.split("@")[0] ?? "usuario",
          },
        });
      } catch {
        if (!cancelled) setState({ status: "out" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const signOut = useCallback(async () => {
    await createClient().auth.signOut();
    setState({ status: "out" });
    router.push("/login");
    router.refresh();
  }, [router]);

  return { state, signOut };
}
