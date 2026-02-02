"""Skill registry for discovering and running skills."""

import importlib
import pkgutil

import claudy.skills as skills_package


class SkillRegistry:
    """Discovers and manages available skills."""

    def __init__(self):
        self._skills = {}
        self._discover_skills()

    def _discover_skills(self):
        """Auto-discover skill modules under claudy/skills/."""
        for importer, module_name, is_pkg in pkgutil.iter_modules(skills_package.__path__):
            if module_name.startswith("_"):
                continue
            module = importlib.import_module(f"claudy.skills.{module_name}")
            if hasattr(module, "register"):
                skill = module.register()
                self._skills[skill["name"]] = skill

    def list_skills(self):
        """Return list of all registered skill names."""
        return list(self._skills.keys())

    def get_skill(self, name):
        """Get a skill by name, or None if not found."""
        return self._skills.get(name)

    def run_skill(self, name, **kwargs):
        """Run a skill by name. Raises KeyError if skill not found."""
        skill = self._skills.get(name)
        if skill is None:
            available = ", ".join(self.list_skills()) or "(none)"
            raise KeyError(f"Unknown skill: {name}. Available skills: {available}")
        return skill["run"](**kwargs)
