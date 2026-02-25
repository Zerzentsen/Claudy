# Guide : Configurer le serveur MCP Google Workspace

Ce guide vous accompagne pas-à-pas pour connecter Claude à Google Docs, Sheets, Slides, Drive, Gmail, Calendar, etc.

Serveur utilisé : [`taylorwilsdon/google_workspace_mcp`](https://github.com/taylorwilsdon/google_workspace_mcp)

---

## Prérequis

- Python 3.10+ installé
- `uv` installé ([guide d'installation](https://docs.astral.sh/uv/getting-started/installation/))
- Un compte Google
- Claude Desktop ou Claude Code installé

### Installer uv (si pas encore fait)

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

---

## Etape 1 : Creer un projet Google Cloud

1. Aller sur [console.cloud.google.com](https://console.cloud.google.com/)
2. Cliquer sur le selecteur de projet (en haut) > **Nouveau projet**
3. Nom : par exemple `MCP Workspace`
4. Cliquer **Creer**
5. Selectionner le projet une fois cree

---

## Etape 2 : Activer les APIs

Aller dans **APIs et services** > **Bibliotheque** et activer les APIs suivantes :

| API | Lien rapide |
|-----|------------|
| Google Drive API | [Activer](https://console.cloud.google.com/apis/library/drive.googleapis.com) |
| Google Docs API | [Activer](https://console.cloud.google.com/apis/library/docs.googleapis.com) |
| Google Sheets API | [Activer](https://console.cloud.google.com/apis/library/sheets.googleapis.com) |
| Google Slides API | [Activer](https://console.cloud.google.com/apis/library/slides.googleapis.com) |
| Gmail API | [Activer](https://console.cloud.google.com/apis/library/gmail.googleapis.com) |
| Google Calendar API | [Activer](https://console.cloud.google.com/apis/library/calendar-json.googleapis.com) |

> Activez uniquement les APIs dont vous avez besoin. Docs + Sheets + Slides + Drive suffisent pour commencer.

---

## Etape 3 : Configurer l'ecran de consentement OAuth

1. Aller dans **APIs et services** > **Ecran de consentement OAuth**
2. Choisir **Externe** (sauf si vous etes sur Google Workspace, auquel cas choisissez **Interne**)
3. Remplir :
   - **Nom de l'application** : `MCP Workspace` (ou ce que vous voulez)
   - **Adresse e-mail d'assistance** : votre email
   - **Coordonnees du developpeur** : votre email
4. Cliquer **Enregistrer et continuer**
5. Page **Champs d'application** : cliquer **Enregistrer et continuer** (pas besoin d'ajouter manuellement)
6. Page **Utilisateurs test** : **ajouter votre adresse Gmail** comme utilisateur test
7. Cliquer **Enregistrer et continuer**

> **Important** : tant que l'app est en mode "Test", les tokens expirent tous les 7 jours. C'est normal pour commencer.

---

## Etape 4 : Creer les identifiants OAuth

1. Aller dans **APIs et services** > **Identifiants**
2. Cliquer **+ Creer des identifiants** > **ID client OAuth**
3. Type d'application : **Application Web**
4. Nom : `MCP Workspace Client`
5. Dans **URI de redirection autorises**, ajouter :
   ```
   https://developers.google.com/oauthplayground
   ```
6. Cliquer **Creer**
7. **Copier** le **Client ID** et le **Client Secret** (vous en aurez besoin juste apres)

> **Important** : le type doit etre **Application Web** (pas "Application de bureau"), sinon le OAuth Playground ne fonctionnera pas a l'etape suivante.

---

## Etape 5 : Obtenir le Refresh Token

Le serveur MCP a besoin d'un **refresh token** pour acceder a votre compte Google. Voici comment l'obtenir via le **Google OAuth Playground** :

1. Aller sur [OAuth 2.0 Playground](https://developers.google.com/oauthplayground)
2. Cliquer sur l'engrenage **Settings** (en haut a droite)
3. Cocher **"Use your own OAuth credentials"**
4. Entrer votre **Client ID** et **Client Secret** (ceux de l'etape 4)
5. Dans **Step 1** (panneau de gauche), selectionner les scopes des APIs que vous avez activees :

| Service | Scope a selectionner |
|---------|---------------------|
| Google Drive API v3 | `https://www.googleapis.com/auth/drive` |
| Google Docs API v1 | `https://www.googleapis.com/auth/documents` |
| Google Sheets API v4 | `https://www.googleapis.com/auth/spreadsheets` |
| Google Slides API v1 | `https://www.googleapis.com/auth/presentations` |
| Gmail API v1 | `https://mail.google.com/` |
| Google Calendar API v3 | `https://www.googleapis.com/auth/calendar` |

6. Cliquer **"Authorize APIs"** → se connecter avec votre compte Google → autoriser
7. Dans **Step 2**, cliquer **"Exchange authorization code for tokens"**
8. **Copier le Refresh token** affiche (il commence par `1//`)

> Selectionnez uniquement les scopes des APIs que vous avez activees a l'etape 2.

---

## Etape 6 : Configurer le serveur MCP

### Option A : Claude Desktop

Ouvrir le fichier de configuration de Claude Desktop :

- **macOS** : `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows** : `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux** : `~/.config/Claude/claude_desktop_config.json`

Ajouter :

```json
{
  "mcpServers": {
    "google_workspace": {
      "command": "uvx",
      "args": ["--from", "google-workspace-mcp", "google-workspace-worker"],
      "env": {
        "GOOGLE_WORKSPACE_CLIENT_ID": "VOTRE_CLIENT_ID.apps.googleusercontent.com",
        "GOOGLE_WORKSPACE_CLIENT_SECRET": "VOTRE_CLIENT_SECRET",
        "GOOGLE_WORKSPACE_REFRESH_TOKEN": "1//VOTRE_REFRESH_TOKEN"
      }
    }
  }
}
```

> **Note Windows** : le nom de l'executable peut etre `google-workspace-worker.exe` au lieu de `google-workspace-worker`.

### Option B : Claude Code (fichier .mcp.json a la racine du projet)

Creer un fichier `.mcp.json` :

```json
{
  "mcpServers": {
    "google_workspace": {
      "command": "uvx",
      "args": ["--from", "google-workspace-mcp", "google-workspace-worker"],
      "env": {
        "GOOGLE_WORKSPACE_CLIENT_ID": "VOTRE_CLIENT_ID.apps.googleusercontent.com",
        "GOOGLE_WORKSPACE_CLIENT_SECRET": "VOTRE_CLIENT_SECRET",
        "GOOGLE_WORKSPACE_REFRESH_TOKEN": "1//VOTRE_REFRESH_TOKEN"
      }
    }
  }
}
```

> **Ne commitez jamais vos secrets !** Ajoutez `.mcp.json` a votre `.gitignore`.

---

## Etape 7 : Premiere connexion

1. Redemarrer Claude Desktop (ou relancer Claude Code)
2. Le serveur MCP Google Workspace devrait apparaitre comme connecte
3. Testez avec un des prompts ci-dessous

---

## Etape 8 : Tester

Exemples de prompts a essayer :

```
"Cree un Google Doc intitule 'Compte-rendu Reunion' avec un template de CR"
```

```
"Cree un Google Sheet avec les colonnes : Date, Description, Montant, Categorie"
```

```
"Liste mes 5 derniers fichiers Google Drive"
```

```
"Cree une presentation Google Slides de 5 slides sur [votre sujet]"
```

---

## Options avancees

### Limiter les services actifs

Si vous ne voulez que Docs, Sheets et Drive :

```json
{
  "args": ["google-workspace-mcp", "--tools", "docs", "sheets", "drive"]
}
```

### Mode lecture seule

```json
{
  "args": ["google-workspace-mcp", "--read-only"]
}
```

### Niveaux d'outils

- `core` : outils essentiels uniquement
- `extended` : outils supplementaires
- `complete` : tous les outils disponibles

---

## Depannage

| Probleme | Solution |
|----------|----------|
| Token expire tous les 7 jours | Normal en mode "Test". Publiez l'app OAuth pour des tokens permanents |
| "GOOGLE_WORKSPACE_CLIENT_ID n'est pas configure" | Verifiez que les variables d'env s'appellent bien `GOOGLE_WORKSPACE_CLIENT_ID` et `GOOGLE_WORKSPACE_CLIENT_SECRET` (pas `GOOGLE_OAUTH_...`) |
| "GOOGLE_WORKSPACE_REFRESH_TOKEN is required" | Vous devez generer un refresh token via le [OAuth Playground](https://developers.google.com/oauthplayground) (voir etape 5) et l'ajouter dans `env` |
| "Access denied" sur un service | Verifiez que l'API est activee dans Google Cloud Console |
| Erreur OAuth "redirect_uri_mismatch" | Votre client OAuth doit etre de type **Application Web** avec `https://developers.google.com/oauthplayground` dans les URI de redirection autorises |
| Le serveur ne demarre pas | Verifiez que `uv` est installe : `uv --version` |
| "Server disconnected" dans Claude Desktop | L'executable s'appelle `google-workspace-worker`, pas `google-workspace-mcp`. Utilisez `"args": ["--from", "google-workspace-mcp", "google-workspace-worker"]` |
| "No executable found" avec uvx | Lancez `uvx --from google-workspace-mcp google-workspace-worker` manuellement pour voir l'erreur. Sur Windows, ajoutez `.exe` au nom |
| "Module not found" | Lancez `uvx google-workspace-mcp` manuellement pour voir l'erreur |

---

## Liens utiles

- [Repo du serveur](https://github.com/taylorwilsdon/google_workspace_mcp)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Documentation MCP](https://modelcontextprotocol.io/)
