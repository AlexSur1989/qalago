"""One-off migration: replace common hardcoded UI colors with AppTheme tokens."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "lib"
SKIP = {
    "app_theme.dart",
}
OVERLAY_MARKERS = (
    "barrierColor",
    "Colors.black54",
    "Colors.black26",
    "Colors.transparent",
    "LinearGradient",
    "RadialGradient",
    "withValues(alpha: 0.72)",
    "withValues(alpha: 0.05)",
    "Google",
    "google",
)

HEX_TO_TOKEN = {
    "0xFF8A919F": "AppTheme.textMuted",
    "0xFF7B8291": "AppTheme.textMuted",
    "0xFF6F7683": "AppTheme.textMuted",
    "0xFF6F7684": "AppTheme.textMuted",
    "0xFF596171": "AppTheme.textMuted",
    "0xFF596170": "AppTheme.textMuted",
    "0xFF687080": "AppTheme.textMuted",
    "0xFF7A8190": "AppTheme.textMuted",
    "0xFF808896": "AppTheme.textMuted",
    "0xFF9AA1AD": "AppTheme.textMuted",
    "0xFFF5F7FA": "AppTheme.background",
    "0xFFF0F2F5": "AppTheme.background",
    "0xFFF7FAFC": "AppTheme.surfaceSubtle",
    "0xFFE8EBF0": "AppTheme.borderSubtle",
    "0xFFE4E8EE": "AppTheme.borderSubtle",
    "0xFFEAF8FC": "AppTheme.primaryTint",
    "0xFFE9F8FC": "AppTheme.primaryTint",
    "0xFFD6ECF3": "AppTheme.primaryTintBorder",
    "0xFFE8F8EE": "AppTheme.openStatusBg",
    "0xFFFCEFEE": "AppTheme.closedStatusBg",
    "0xFF1B7F4A": "AppTheme.openStatus",
    "0xFFC0392B": "AppTheme.closedStatus",
    "0xFFB7791F": "AppTheme.warning",
}

IMPORT = "import '../../../core/theme/app_theme.dart';"
IMPORT2 = "import '../../core/theme/app_theme.dart';"
IMPORT3 = "import '../../../../core/theme/app_theme.dart';"


def needs_app_theme(text: str) -> bool:
    return "AppTheme." in text and "app_theme.dart" not in text


def add_import(content: str, path: Path) -> str:
    if "app_theme.dart" in content:
        return content
    depth = len(path.relative_to(ROOT).parts) - 1
    rel = "../" * depth + "core/theme/app_theme.dart"
    imp = f"import '{rel}';\n"
    # after first import block
    m = re.search(r"(import .+;\n)+", content)
    if m:
        insert_at = m.end()
        return content[:insert_at] + imp + content[insert_at:]
    return imp + content


def migrate_file(path: Path) -> bool:
    if path.name in SKIP:
        return False
    if "ads/widgets" in str(path).replace("\\", "/"):
        return False
    if "owner/utils/analytics_export" in str(path).replace("\\", "/"):
        return False
    text = path.read_text(encoding="utf-8")
    original = text
    lines = text.splitlines(keepends=True)
    out: list[str] = []
    for line in lines:
        skip_line = any(m in line for m in OVERLAY_MARKERS)
        if not skip_line:
            for hexv, token in HEX_TO_TOKEN.items():
                line = line.replace(f"Color({hexv})", token)
                line = line.replace(f"const Color({hexv})", token)
            # Text/surface blacks and whites (not shadows on same line as alpha shadow)
            if "shadowColor" not in line and "BoxShadow" not in line:
                if re.search(r"\bColors\.black87\b", line):
                    line = line.replace("Colors.black87", "AppTheme.textDark")
                if re.search(r"color:\s*Colors\.black\b", line):
                    line = line.replace("Colors.black", "AppTheme.textDark")
                if re.search(r"style: TextStyle\(color: Colors\.black", line):
                    line = line.replace("Colors.black", "AppTheme.textDark")
            if "fillColor: Colors.white" in line:
                line = line.replace("Colors.white", "AppTheme.light.colorScheme.surface")
            if re.search(r"\bcolor: Colors\.white\b", line) and "gradient" not in line.lower():
                if "Icon(" in line or "Text(" in line or "child:" in line:
                    pass  # might be on dark overlay — keep if near white text on hero
                elif "decoration:" in line or "backgroundColor:" in line or "Card" in line:
                    line = line.replace("Colors.white", "AppTheme.light.colorScheme.surface")
        out.append(line)
    text = "".join(out)
    # scaffold backgrounds
    text = text.replace(
        "backgroundColor: const Color(0xFFF5F7FA)",
        "// uses theme scaffoldBackgroundColor",
    )
    text = re.sub(
        r"backgroundColor:\s*AppTheme\.background,\s*\n\s*// uses theme",
        "",
        text,
    )
    text = text.replace("backgroundColor: AppTheme.background,", "")
    if needs_app_theme(text):
        text = add_import(text, path)
    if text != original:
        path.write_text(text, encoding="utf-8")
        return True
    return False


def main() -> None:
    changed = 0
    for p in sorted(ROOT.rglob("*.dart")):
        if migrate_file(p):
            changed += 1
            print("updated", p.relative_to(ROOT))
    print("files changed:", changed)


if __name__ == "__main__":
    main()
