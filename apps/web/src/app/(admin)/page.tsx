import Link from "next/link";
import { Music, ListMusic, Play, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl font-bold tracking-tight">LiveStage</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Gérez votre répertoire de chansons, créez des setlists et performez en live
          avec un prompteur optimisé tablette — en ligne ou hors ligne.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <Music className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Bibliothèque</CardTitle>
            <CardDescription>
              Gérez vos chansons au format ChordPro avec paroles et accords de guitare.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/songs">Voir la bibliothèque</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <ListMusic className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Setlists</CardTitle>
            <CardDescription>
              Créez et organisez vos setlists pour vos concerts et répétitions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/setlists">Gérer les setlists</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Play className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Mode scène</CardTitle>
            <CardDescription>
              Prompteur plein écran optimisé tablette avec navigation, transposition et auto-scroll.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/setlists">Lancer une setlist</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <Download className="h-8 w-8 text-primary mb-2" />
          <CardTitle>Installation PWA</CardTitle>
          <CardDescription>
            Installez LiveStage sur votre tablette pour une utilisation offline sur scène.
            Sur iOS : Partager → Sur l&apos;écran d&apos;accueil. Sur Android : Installer l&apos;application.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
