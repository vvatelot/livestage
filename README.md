# LiveStage

PWA offline-first pour gérer un répertoire de chansons (format ChordPro), des setlists, et un mode scène type prompteur sur tablette.

## Stack

- **Next.js 15** + React + TypeScript
- **Serwist** (PWA / service worker)
- **Dexie.js** (IndexedDB offline-first)
- **Supabase** (auth, sync cloud)
- **ChordSheetJS** (rendu ChordPro)
- **Tailwind CSS** + shadcn/ui

## Démarrage

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Structure

```
livestage/
├── apps/web/          # Application Next.js PWA
└── supabase/          # Migrations + Edge Functions
```

## Fonctionnalités

- Bibliothèque de chansons (paroles + accords ChordPro)
- Setlists avec drag & drop
- Mode scène plein écran (prompteur live)
- Sync cloud Supabase
- Import Ultimate Guitar

## Interface

### Navigation

L'application se divise en trois zones principales, accessibles depuis l'en-tête :

| Section | Route | Description |
|---------|-------|-------------|
| **Accueil** | `/` | Vue d'ensemble et raccourcis |
| **Bibliothèque** | `/songs` | Liste, recherche, import et export des chansons |
| **Setlists** | `/setlists` | Création et gestion des setlists |
| **Mode scène** | `/live/[id]` | Prompteur plein écran (depuis une setlist) |
| **Compte** | `/auth` | Authentification Supabase |

Sur mobile, une barre de navigation fixe en bas donne accès à la bibliothèque et aux setlists. L'indicateur de sync (en-tête) signale l'état de synchronisation cloud.

### Bibliothèque (`/songs`)

- **Recherche** par titre ou artiste
- **Nouvelle chanson** → éditeur ChordPro
- **Importer** : bookmarklet Ultimate Guitar (recommandé, lit `UGAPP` / JSON embarqué), URL UG, HTML de page UG, ou texte ChordPro / JSON UG
- **Fichier .cho** : import direct (`.cho`, `.pro`, `.chordpro`, `.txt`)
- **Export** : téléchargement au format ChordPro (`.cho`)
- Clic sur une chanson → édition

### Éditeur de chanson (`/songs/new`, `/songs/[id]`)

L'éditeur est un **éditeur texte ChordPro avec aperçu HTML en temps réel** — ce n'est pas un éditeur WYSIWYG (on ne peut pas cliquer dans l'aperçu pour modifier accords ou paroles).

| Zone | Rôle |
|------|------|
| **Titre / Artiste / Tonalité / Capo** | Métadonnées (champs séparés, auto-remplis depuis le texte ChordPro si vides) |
| **Textarea ChordPro** | Contenu principal (paroles + accords) |
| **Boutons ±** | Transposition d'**aperçu uniquement** (ne modifie pas le contenu sauvegardé) |
| **Masquer / Aperçu** | Affiche ou cache le panneau de rendu |
| **Aperçu** | Rendu HTML des accords au-dessus des paroles (ChordSheetJS) |
| **Imprimer** | Page d’impression dédiée puis boîte de dialogue système (transposition d’aperçu incluse) |

En édition, les modifications sont enregistrées automatiquement dans IndexedDB. Le bouton **Enregistrer** ramène à la bibliothèque.

**Impression** : depuis l’éditeur, l’en-tête de la chanson ou le mode scène. Pour un PDF, choisir « Enregistrer au format PDF » dans la boîte de dialogue d’impression du navigateur.

#### Syntaxe ChordPro

LiveStage stocke et affiche le format [ChordPro](https://www.chordpro.org/), parsé par ChordSheetJS.

**Directives** (métadonnées et structure) :

```chordpro
{title: Mon titre}
{artist: Mon artiste}
{key: G}
{capo: 3}
{comment: Intro — 4 mesures}
```

**Accords inline** — entre crochets, placés juste avant la syllabe :

```chordpro
Let it [Am]be, let it [C/G]be
```

**Sections** :

```chordpro
{start_of_verse}
Première ligne [G]avec accords
{end_of_verse}

{start_of_chorus}
Refrain [D]ici
{end_of_chorus}
```

**Exemple complet** :

```chordpro
{title: Swing Low Sweet Chariot}
{artist: Traditional}
{key: D}

{start_of_verse}
Swing [D]low, sweet [G]chari[D]ot
Comin' for to carry me [A7]home
{end_of_verse}

{start_of_chorus}
[D]Country roads, take me [A]home
To the [E]place I be[A]long
{end_of_chorus}
```

Directives supportées : métadonnées (`title`, `artist`, `key`, `capo`, `subtitle`…), sections (`start_of_verse`, `start_of_chorus`, `start_of_tab`…), commentaires (`comment`), diagrammes d'accords (`define`, `chord`). Voir la [spec ChordPro](https://www.chordpro.org/chordpro/chordpro-file-format-specification/) et les [directives ChordSheetJS](https://github.com/martijnversluis/ChordSheetJS#supported-chordpro-directives).

### Setlists (`/setlists`)

- **Nouvelle setlist** : nom + date optionnelle
- **Détail** (`/setlists/[id]`) : ajout de chansons, réorganisation par glisser-déposer, suppression
- **Dupliquer / Supprimer** depuis la liste
- **Imprimer** : feuille A4 (titre, date, chansons et sections)
- **Mode scène** : lance le prompteur sur la setlist

Les chansons d'une setlist sont pré-chargées pour un usage offline.

### Mode scène (`/live/[id]`)

Prompteur plein écran optimisé tablette :

- **Navigation** : flèches clavier, swipe gauche/droite, boutons bas de page
- **Contrôles** (barre supérieure, masqués après 3 s) : taille de police, mode sombre/clair, verrouillage
- **Auto-scroll** : défilement automatique ; la vitesse est enregistrée par chanson
- **Transposition** : par chanson, en session (ne modifie pas la source)
- **Wake lock** : empêche la mise en veille de l'écran
- **Échap** ou bouton ✕ : retour à la setlist

### Installation PWA

Installez LiveStage sur tablette pour une utilisation offline sur scène :

- **iOS** : Partager → Sur l'écran d'accueil
- **Android** : Installer l'application

## Déploiement

### Option 1 — Docker Compose (recommandé)

Le plus simple pour un VPS ou un serveur local.

**Prérequis** : Docker + Docker Compose, projet Supabase configuré (voir migration SQL).

```bash
# 1. Configurer les variables
cp .env.docker.example .env.docker
# Éditer .env.docker avec vos clés Supabase

# 2. Build et lancement
pnpm docker:build
pnpm docker:up

# L'app est accessible sur http://localhost:3000 (ou le PORT défini)
```

Commandes utiles :

```bash
pnpm docker:logs    # voir les logs
pnpm docker:down    # arrêter
```

> **Important** : les variables `NEXT_PUBLIC_*` sont intégrées au build. Si vous changez l'URL ou la clé Supabase, relancez `pnpm docker:build`.

Sans Supabase, l'app fonctionne quand même en mode local (IndexedDB), mais sans sync cloud.

### Option 2 — Vercel / Netlify

1. Connecter le dépôt Git
2. **Root directory** : `apps/web`
3. **Build command** : `cd ../.. && pnpm install && pnpm build`
4. **Output** : géré automatiquement par Next.js
5. Variables d'environnement : `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Adapté si vous voulez un déploiement zero-ops sans gérer un serveur.

### Option 3 — VPS manuel (sans Docker)

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
# Renseigner les clés Supabase
pnpm build
pnpm start
```

Utiliser un reverse proxy (Caddy, Nginx, Traefik) avec HTTPS devant le port 3000.

### Supabase

Le backend Supabase reste **cloud** (supabase.com) dans tous les cas. Exécutez les migrations dans le **SQL Editor** Supabase (dans l’ordre) avant la première connexion :

1. [`supabase/migrations/20250520000000_initial_schema.sql`](supabase/migrations/20250520000000_initial_schema.sql)
2. [`supabase/migrations/20250520140000_fix_rls_user_id.sql`](supabase/migrations/20250520140000_fix_rls_user_id.sql) — corrige les erreurs RLS (`new row violates row-level security policy`)
3. [`supabase/migrations/20250520150000_add_youtube_url.sql`](supabase/migrations/20250520150000_add_youtube_url.sql) — champ vidéo YouTube par chanson

La sync cloud ne fonctionne qu’**après connexion** sur `/auth`. Les erreurs RLS dans les logs signifient en général : migration manquante, session expirée, ou sync tentée sans être connecté.

```bash
supabase login
supabase link --project-ref <votre-ref>
supabase db push
supabase functions deploy import-ultimate-guitar
```

Si `uuid_generate_v4() does not exist` : les migrations utilisent `gen_random_uuid()` (compatible Supabase cloud). Relancez `supabase db push` après mise à jour du dépôt.
