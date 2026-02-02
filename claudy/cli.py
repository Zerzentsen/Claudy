"""Claudy CLI entry point."""

import sys

from claudy.registry import SkillRegistry


def main():
    registry = SkillRegistry()

    if len(sys.argv) < 2:
        print("Usage: claudy <skill-name> [options]")
        print()
        skills = registry.list_skills()
        if skills:
            print("Available skills:")
            for name in sorted(skills):
                skill = registry.get_skill(name)
                print(f"  {name:30s} {skill.get('description', '')}")
        else:
            print("No skills available.")
        sys.exit(1)

    skill_name = sys.argv[1]

    if skill_name in ("--help", "-h"):
        print("Usage: claudy <skill-name> [options]")
        print()
        skills = registry.list_skills()
        print("Available skills:")
        for name in sorted(skills):
            skill = registry.get_skill(name)
            print(f"  {name:30s} {skill.get('description', '')}")
        sys.exit(0)

    try:
        result = registry.run_skill(skill_name)
    except KeyError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    except KeyboardInterrupt:
        print("\nAborted.")
        sys.exit(130)


if __name__ == "__main__":
    main()
