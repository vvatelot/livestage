"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  clearSyncQueue,
  dedupeSyncQueue,
  getPendingSyncCount,
} from "@/lib/db/repository";
import { syncWithSupabase } from "@/lib/db/sync";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [pendingSync, setPendingSync] = useState(0);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    if (!supabase) return;

    const syncEmail = () => {
      void supabase.auth.getUser().then(({ data }) => {
        setUserEmail(data.user?.email ?? null);
      });
    };

    syncEmail();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => syncEmail());

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    void getPendingSyncCount().then(setPendingSync);
  }, [userEmail, message]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    if (!supabase) return;

    setLoading(true);
    setMessage("");

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(error.message);
      } else {
        await syncWithSupabase();
        setUserEmail(email);
        setMessage("Connecté !");
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Compte créé. Vérifiez votre email si la confirmation est activée.");
      }
    }

    setLoading(false);
  }

  async function handleLogout() {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut({ scope: "local" });
    setUserEmail(null);
    setMessage("Déconnecté.");
  }

  if (!isSupabaseConfigured()) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Sync cloud</CardTitle>
          <CardDescription>
            Supabase n&apos;est pas configuré. L&apos;application fonctionne en mode local uniquement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Copiez <code>.env.example</code> vers <code>.env.local</code> et renseignez vos clés Supabase.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Retour</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (userEmail) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Compte</CardTitle>
          <CardDescription>Connecté en tant que {userEmail}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            className="w-full"
            onClick={async () => {
              setLoading(true);
              await syncWithSupabase();
              setMessage("Synchronisation terminée.");
              setLoading(false);
            }}
            disabled={loading}
          >
            {loading ? "Sync..." : "Synchroniser maintenant"}
          </Button>
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            Se déconnecter
          </Button>
          {pendingSync > 0 && (
            <p className="text-sm text-muted-foreground">
              File de synchronisation locale : {pendingSync} entrée
              {pendingSync > 1 ? "s" : ""}.
            </p>
          )}
          <Button
            variant="outline"
            className="w-full"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              const remaining = await dedupeSyncQueue();
              setPendingSync(remaining);
              setMessage(
                remaining > 0
                  ? `File nettoyée : ${remaining} modification(s) en attente.`
                  : "File de synchronisation vidée."
              );
              setLoading(false);
            }}
          >
            Nettoyer la file de sync
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            disabled={loading}
            onClick={async () => {
              if (
                !window.confirm(
                  "Supprimer toute la file ? Les chansons restent sur cet appareil, mais les changements non synchronisés ne partiront plus vers le cloud."
                )
              ) {
                return;
              }
              setLoading(true);
              await clearSyncQueue();
              setPendingSync(0);
              setMessage("File de synchronisation supprimée.");
              setLoading(false);
            }}
          >
            Vider complètement la file
          </Button>
          {message && <p className="text-sm text-muted-foreground">{message}</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{mode === "login" ? "Connexion" : "Inscription"}</CardTitle>
        <CardDescription>
          Connectez-vous pour synchroniser votre répertoire entre vos appareils.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "..." : mode === "login" ? "Se connecter" : "Créer un compte"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? "Créer un compte" : "Déjà un compte ? Se connecter"}
          </Button>
          {message && <p className="text-sm text-destructive">{message}</p>}
        </form>
      </CardContent>
    </Card>
  );
}
