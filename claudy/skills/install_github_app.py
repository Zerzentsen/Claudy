"""Skill: install-github-app

Guides users through installing a GitHub App on their account or organization.
"""

import json
import subprocess
import urllib.parse
import webbrowser


GITHUB_APPS_URL = "https://github.com/settings/apps"
GITHUB_APP_INSTALL_TEMPLATE = "https://github.com/apps/{slug}/installations/new"


def register():
    """Register this skill with the registry."""
    return {
        "name": "install-github-app",
        "description": "Guide through installing a GitHub App on your account or organization",
        "run": run,
    }


def _prompt(message, default=None):
    """Prompt the user for input."""
    suffix = f" [{default}]" if default else ""
    value = input(f"{message}{suffix}: ").strip()
    return value or default


def _confirm(message):
    """Ask a yes/no question."""
    answer = input(f"{message} (y/n): ").strip().lower()
    return answer in ("y", "yes")


def _gh_cli_available():
    """Check if the GitHub CLI (gh) is available and authenticated."""
    try:
        result = subprocess.run(
            ["gh", "auth", "status"],
            capture_output=True,
            text=True,
            timeout=10,
        )
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


def _list_installations_via_gh():
    """List current GitHub App installations using gh CLI."""
    try:
        result = subprocess.run(
            ["gh", "api", "/user/installations", "--jq", ".installations[] | .app_slug"],
            capture_output=True,
            text=True,
            timeout=15,
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip().split("\n")
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass
    return []


def _open_url(url):
    """Open a URL in the user's default browser."""
    try:
        webbrowser.open(url)
        return True
    except Exception:
        return False


def run(**kwargs):
    """Run the install-github-app skill interactively."""
    print()
    print("=== Install a GitHub App ===")
    print()
    print("This will guide you through installing a GitHub App on your")
    print("GitHub account or organization.")
    print()

    # Step 1: Check for gh CLI
    has_gh = _gh_cli_available()
    if has_gh:
        print("[✓] GitHub CLI (gh) detected and authenticated.")
        existing = _list_installations_via_gh()
        if existing:
            print(f"    Currently installed apps: {', '.join(existing)}")
        print()
    else:
        print("[i] GitHub CLI (gh) not found or not authenticated.")
        print("    Install it from https://cli.github.com for a smoother experience.")
        print()

    # Step 2: Get the app slug or URL
    print("You can install a GitHub App by providing either:")
    print("  1. The app slug (e.g. 'my-cool-app')")
    print("  2. A full installation URL")
    print()

    app_input = _prompt("Enter the app slug or installation URL")
    if not app_input:
        print("No app specified. Aborting.")
        return {"success": False, "reason": "no-input"}

    # Determine the installation URL
    if app_input.startswith("http://") or app_input.startswith("https://"):
        install_url = app_input
        slug = _extract_slug_from_url(app_input)
    else:
        slug = app_input.strip("/")
        install_url = GITHUB_APP_INSTALL_TEMPLATE.format(slug=slug)

    print()
    print(f"App slug: {slug or '(from URL)'}")
    print(f"Install URL: {install_url}")
    print()

    # Step 3: Optional - select target (account vs org)
    target = _prompt("Install on a specific org? Leave blank for your personal account", default="")
    if target:
        separator = "&" if "?" in install_url else "?"
        install_url += f"{separator}target_id={urllib.parse.quote(target)}"
        print(f"Targeting organization: {target}")
        print()

    # Step 4: Optional - select repositories
    if _confirm("Do you want to limit the app to specific repositories?"):
        repos = _prompt("Enter repository names (comma-separated)")
        if repos:
            print(f"Note: You'll select repositories on the GitHub page.")
            print(f"Requested repos: {repos}")
            print()

    # Step 5: Open the browser
    print("Ready to open GitHub to complete the installation.")
    print()

    if _confirm("Open the installation page in your browser?"):
        if _open_url(install_url):
            print()
            print(f"Opened: {install_url}")
        else:
            print()
            print(f"Could not open browser. Visit this URL manually:")
            print(f"  {install_url}")
    else:
        print()
        print(f"To install manually, visit:")
        print(f"  {install_url}")

    print()
    print("After installing on GitHub, the app will have access to the")
    print("repositories you selected. You can manage installations at:")
    print(f"  {GITHUB_APPS_URL}")
    print()

    # Step 6: Verify installation if gh is available
    if has_gh and slug:
        if _confirm("Want to verify the installation was successful?"):
            print("Checking...")
            installations = _list_installations_via_gh()
            if slug in installations:
                print(f"[✓] '{slug}' is installed!")
                return {"success": True, "slug": slug, "verified": True}
            else:
                print(f"[!] '{slug}' not found in your installations yet.")
                print("    It may take a moment to appear, or you may not have")
                print("    completed the installation on GitHub.")
                return {"success": True, "slug": slug, "verified": False}

    return {"success": True, "slug": slug}


def _extract_slug_from_url(url):
    """Try to extract the app slug from a GitHub App URL."""
    parsed = urllib.parse.urlparse(url)
    parts = parsed.path.strip("/").split("/")
    # Handle URLs like github.com/apps/<slug>
    if "apps" in parts:
        idx = parts.index("apps")
        if idx + 1 < len(parts):
            return parts[idx + 1]
    return None
