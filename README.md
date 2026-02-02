# Claudy

A skill-based CLI assistant.

## Installation

```bash
pip install -e .
```

## Usage

```bash
# List available skills
claudy --help

# Install a GitHub App
claudy install-github-app
```

## Skills

- **install-github-app** — Interactive guide for installing a GitHub App on your account or organization.

## Adding Skills

Create a new module in `claudy/skills/` with a `register()` function that returns a dict:

```python
def register():
    return {
        "name": "my-skill",
        "description": "What my skill does",
        "run": run,
    }

def run(**kwargs):
    # skill logic here
    pass
```

Skills are auto-discovered at startup.
