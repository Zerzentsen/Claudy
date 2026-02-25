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
3. Type d'application : **Application de bureau**
4. Nom : `MCP Desktop Client`
5. Cliquer **Creer**
6. **Copier** le **Client ID** et le **Client Secret** (vous en aurez besoin juste apres)

---

## Etape 5 : Configurer le serveur MCP

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
      "args": ["google-workspace-mcp"],
      "env": {
        "GOOGLE_OAUTH_CLIENT_ID": "VOTRE_CLIENT_ID.apps.googleusercontent.com",
        "GOOGLE_OAUTH_CLIENT_SECRET": "VOTRE_CLIENT_SECRET"
      }
    }
  }
}
```

### Option B : Claude Code (fichier .mcp.json a la racine du projet)

Creer un fichier `.mcp.json` :

```json
{
  "mcpServers": {
    "google_workspace": {
      "command": "uvx",
      "args": ["google-workspace-mcp"],
      "env": {
        "GOOGLE_OAUTH_CLIENT_ID": "VOTRE_CLIENT_ID.apps.googleusercontent.com",
        "GOOGLE_OAUTH_CLIENT_SECRET": "VOTRE_CLIENT_SECRET"
      }
    }
  }
}
```

> **Ne commitez jamais vos secrets !** Ajoutez `.mcp.json` a votre `.gitignore`.

---

## Etape 6 : Premiere connexion

1. Redemarrer Claude Desktop (ou relancer Claude Code)
2. La premiere fois, une fenetre de navigateur s'ouvre
3. Connectez-vous avec votre compte Google
4. Autorisez l'acces aux services demandes
5. Le token est sauvegarde localement — pas besoin de recommencer a chaque fois

---

## Etape 7 : Tester

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
| "Access denied" sur un service | Verifiez que l'API est activee dans Google Cloud Console |
| Erreur OAuth "redirect_uri_mismatch" | Assurez-vous d'avoir choisi "Application de bureau" comme type |
| Le serveur ne demarre pas | Verifiez que `uv` est installe : `uv --version` |
| "Module not found" | Lancez `uvx google-workspace-mcp` manuellement pour voir l'erreur |

---

## Liens utiles

- [Repo du serveur](https://github.com/taylorwilsdon/google_workspace_mcp)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Documentation MCP](https://modelcontextprotocol.io/)
