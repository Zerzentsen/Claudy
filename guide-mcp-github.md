# Guide : Configurer le serveur MCP GitHub

Ce guide vous accompagne pour connecter Claude a l'API GitHub : gerer vos repos, PRs, issues, branches, Actions, etc.

Serveur utilise : [`github/github-mcp-server`](https://github.com/github/github-mcp-server) (officiel, maintenu par GitHub)

---

## Prérequis

- Un compte GitHub
- Claude Desktop ou Claude Code installe
- **Option locale** : Docker installe ([guide](https://docs.docker.com/get-docker/))
- **Option remote** : rien de plus (recommande)

---

## Option A : Mode Remote (recommande)

C'est le plus simple. Pas besoin de Docker ni de token. GitHub heberge le serveur pour vous.

### Configuration Claude Desktop

Ajouter dans votre fichier de config Claude Desktop :

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    }
  }
}
```

### Premiere connexion

1. Redemarrer Claude Desktop
2. Une fenetre de navigateur s'ouvre pour vous connecter a GitHub
3. Autorisez l'acces
4. C'est pret !

> Le mode remote gere automatiquement les permissions. Si un outil necessite un scope supplementaire, Claude vous demandera de l'autoriser.

---

## Option B : Mode Local (Docker + Token)

Utile si vous voulez un controle total ou si le mode remote n'est pas disponible.

### Etape 1 : Creer un Personal Access Token (PAT)

1. Aller sur [github.com/settings/tokens](https://github.com/settings/tokens)
2. Cliquer **Generate new token** > **Fine-grained** (recommande) ou **Classic**

**Pour un token Classic**, cocher au minimum :
- `repo` (acces complet aux repos prives)
- `read:org` (lecture des organisations)
- `read:packages` (lecture des packages)

**Pour un token Fine-grained**, selectionner :
- Les repos cibles
- Permissions : Contents (R/W), Issues (R/W), Pull Requests (R/W), Metadata (Read)

3. Copier le token genere

### Etape 2 : Configurer le serveur

#### Claude Desktop

```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_votre_token_ici"
      }
    }
  }
}
```

#### Claude Code (.mcp.json)

```json
{
  "mcpServers": {
    "github": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
        "ghcr.io/github/github-mcp-server"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_votre_token_ici"
      }
    }
  }
}
```

> **Ne commitez jamais vos tokens !** Ajoutez `.mcp.json` a votre `.gitignore`.

### Etape 3 : Premiere connexion

1. Redemarrer Claude Desktop / relancer Claude Code
2. Le conteneur Docker se lance automatiquement
3. Testez avec un prompt (voir ci-dessous)

---

## Ce que vous pouvez faire

### Repositories

```
"Cree un nouveau repo prive nomme 'mon-projet' avec un README"
```

```
"Liste les branches du repo Zerzentsen/Claudy"
```

```
"Montre-moi le contenu du fichier README.md dans mon repo"
```

### Pull Requests

```
"Cree une PR du branch 'feature/login' vers 'main' dans mon-projet"
```

```
"Montre-moi le diff de la PR #42"
```

```
"Liste les PRs ouvertes sur mon repo"
```

### Issues

```
"Cree une issue 'Bug: le bouton ne fonctionne pas' avec le label 'bug'"
```

```
"Liste les issues ouvertes assignees a moi"
```

### Actions (CI/CD)

```
"Montre-moi le statut des derniers workflows du repo"
```

### Recherche

```
"Cherche les fichiers contenant 'TODO' dans mon repo"
```

```
"Cherche les repos publics sur le sujet 'mcp server python'"
```

---

## Options avancees

### Limiter les outils actifs (toolsets)

Par defaut : `repos`, `issues`, `pull_requests`, `users`, `context`.

Pour activer uniquement certains groupes :

**Mode local :**
```json
{
  "args": [
    "run", "-i", "--rm",
    "-e", "GITHUB_PERSONAL_ACCESS_TOKEN",
    "-e", "GITHUB_TOOLSETS=repos,issues",
    "ghcr.io/github/github-mcp-server"
  ]
}
```

**Mode remote (header HTTP) :**
Le header `X-MCP-Toolsets: repos,issues` peut etre configure selon le client.

### Mode lecture seule

**Local :**
```json
{
  "env": {
    "GITHUB_READ_ONLY": "true"
  }
}
```

### Toolsets disponibles

| Toolset | Description |
|---------|------------|
| `repos` | Operations sur les repos (fichiers, branches, commits, tags) |
| `issues` | Gestion des issues |
| `pull_requests` | Gestion des PRs et reviews |
| `users` | Info utilisateur, notifications |
| `actions` | GitHub Actions / workflows |
| `code_security` | Alertes de securite du code |
| `secret_protection` | Alertes de secrets exposes |
| `projects` | GitHub Projects (tableaux de bord) |

---

## Depannage

| Probleme | Solution |
|----------|----------|
| "Docker not found" | Installez Docker Desktop et assurez-vous qu'il tourne |
| "401 Unauthorized" | Verifiez votre token PAT et ses permissions |
| "Rate limit exceeded" | L'API GitHub a des limites. Attendez ou utilisez un token avec plus de quota |
| Pas d'acces a un repo d'organisation | Activez le SSO pour votre token si l'org utilise SAML |
| Trop d'outils charges | Limitez avec `GITHUB_TOOLSETS` |

---

## Liens utiles

- [Repo officiel du serveur](https://github.com/github/github-mcp-server)
- [Documentation GitHub MCP](https://docs.github.com/en/copilot/how-tos/provide-context/use-mcp)
- [Guide pratique (blog GitHub)](https://github.blog/ai-and-ml/generative-ai/a-practical-guide-on-how-to-use-the-github-mcp-server/)
- [Gerer vos tokens](https://github.com/settings/tokens)
