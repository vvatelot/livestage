import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "./client";

export interface AuthContext {
  user: User;
  session: Session;
}

/**
 * Session réellement valide pour PostgREST.
 * getUser() valide le JWT côté serveur (pas seulement le cache local).
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = createClient();
  if (!supabase) return null;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const {
    data: { session: initial },
  } = await supabase.auth.getSession();

  let session = initial;

  if (session) {
    const expiresAt = session.expires_at ?? 0;
    const now = Math.floor(Date.now() / 1000);
    if (expiresAt <= now + 60) {
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data.session) {
        return null;
      }
      session = data.session;
    }
  }

  if (!session?.access_token) {
    return null;
  }

  return { user, session };
}
