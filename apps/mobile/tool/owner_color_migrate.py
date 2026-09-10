from pathlib import Path
import re

LIB = Path(__file__).resolve().parents[1] / "lib"
ROOT = LIB / "features" / "owner"

REPL = [
    ("Colors.grey.shade700", "AppTheme.textMuted"),
    ("Colors.grey.shade600", "AppTheme.textMuted"),
    ("Colors.grey.shade800", "AppTheme.textMuted"),
    ("Colors.grey.shade400", "AppTheme.textMuted"),
    ("Colors.grey.shade200", "AppTheme.borderSubtle"),
    ("Colors.grey", "AppTheme.textMuted"),
    ("Colors.black54", "AppTheme.textMuted"),
    ("Colors.green.shade700", "AppTheme.openStatus"),
    ("Colors.green.shade800", "AppTheme.openStatus"),
    ("Colors.green.shade50", "AppTheme.openStatusBg"),
    ("Colors.orange.shade900", "AppSemanticColors.warning"),
    ("Colors.orange.shade800", "AppSemanticColors.warning"),
    ("Colors.orange.shade50", "AppSemanticColors.warning.withValues(alpha: 0.12)"),
    ("Colors.orange.shade200", "AppSemanticColors.warning"),
    ("Colors.blue.shade50", "AppTheme.primaryTint"),
    ("Colors.blue.shade700", "AppSemanticColors.info"),
    ("Colors.red.shade700", "AppTheme.error"),
    ("const TextStyle(color: Colors.red)", "TextStyle(color: AppTheme.error)"),
    ("TextStyle(color: Colors.red)", "TextStyle(color: AppTheme.error)"),
    ("Colors.red", "AppTheme.error"),
]


def ensure_import(text: str, path: Path) -> str:
    if "app_theme.dart" in text:
        return text
    depth = len(path.relative_to(LIB).parts) - 1
    imp = "../" * depth + "core/theme/app_theme.dart"
    line = f"import '{imp}';\n"
    m = re.search(r"(import .+;\n)+", text)
    if m:
        return text[: m.end()] + line + text[m.end() :]
    return line + text


for p in sorted(ROOT.rglob("*.dart")):
    t = p.read_text(encoding="utf-8")
    orig = t
    for a, b in REPL:
        t = t.replace(a, b)
    if "AppTheme." in t or "AppSemanticColors." in t:
        t = ensure_import(t, p)
    if t != orig:
        p.write_text(t, encoding="utf-8")
        print("updated", p.relative_to(LIB))
