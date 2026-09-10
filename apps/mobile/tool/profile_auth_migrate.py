from owner_color_migrate import REPL, ensure_import, LIB
from pathlib import Path

for sub in ["features/profile", "features/auth", "features/business_onboarding", "features/favorites"]:
    for p in sorted((LIB / sub).rglob("*.dart")):
        t = p.read_text(encoding="utf-8")
        orig = t
        for a, b in REPL:
            t = t.replace(a, b)
        if "AppTheme." in t or "AppSemanticColors." in t:
            t = ensure_import(t, p)
        if t != orig:
            p.write_text(t, encoding="utf-8")
            print(p.relative_to(LIB))
