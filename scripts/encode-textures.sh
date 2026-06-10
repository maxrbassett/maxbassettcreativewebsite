#!/usr/bin/env bash
# ============================================================
#  encode-textures.sh — convert source PBR maps to KTX2 (Basis)
#
#  KTX2/Basis textures download ~3x smaller than JPG AND stay
#  GPU-compressed in VRAM. Source JPG/PNG maps live next to their
#  .ktx2 output (the app loads only the .ktx2; sources are kept for
#  re-encoding). See EXPLORE_TEXTURES.md for the full pipeline.
#
#  Usage:  ./scripts/encode-textures.sh
#  Requires: toktx (auto-downloaded to scripts/.tool if missing).
#
#  To add a texture, drop the source map in public/textures/<set>/
#  and add a line to the MANIFEST below as:  <path-without-ext>|<type>
#  type = color  (sRGB albedo/diffuse)
#         normal (tangent-space normal map, ETC1S normal mode)
#         linear (roughness/metal/ao/height — non-color data)
# ============================================================
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$(pwd)"
TOOLDIR="$ROOT/scripts/.tool"
KTX_VER="4.4.2"

# ---- Source maps to encode (extensionless path | type) ----
MANIFEST=(
  "public/textures/stone_tiles_02/diff_1k|color"
  "public/textures/stone_tiles_02/nor_gl_1k|normal"
  "public/textures/stone_tiles_02/rough_1k|linear"
  "public/textures/marble_01/diff_1k|color"
  "public/textures/marble_01/nor_gl_1k|normal"
  "public/textures/marble_01/rough_1k|linear"
  "public/textures/grass_medium_01/diff_1k|color"
  "public/textures/grass_medium_01/nor_gl_1k|normal"
  "public/textures/grass_medium_01/rough_1k|linear"
  "public/textures/dirt_floor/diff_1k|color"
  "public/textures/dirt_floor/nor_gl_1k|normal"
  "public/textures/dirt_floor/rough_1k|linear"
)

# ---- Resolve toktx (PATH → cached → download Khronos release) ----
resolve_toktx() {
  if command -v toktx >/dev/null 2>&1; then TOKTX="toktx"; return; fi
  if [ -x "$TOOLDIR/bin/toktx" ]; then TOKTX="$TOOLDIR/bin/toktx"; return; fi
  echo "toktx not found — downloading KTX-Software $KTX_VER…"
  local arch; arch="$(uname -m)"
  local asset="KTX-Software-${KTX_VER}-Darwin-${arch}.pkg"
  local url="https://github.com/KhronosGroup/KTX-Software/releases/download/v${KTX_VER}/${asset}"
  local tmp; tmp="$(mktemp -d)"
  curl -sL --max-time 120 -o "$tmp/ktx.pkg" "$url"
  pkgutil --expand-full "$tmp/ktx.pkg" "$tmp/exp" >/dev/null
  mkdir -p "$TOOLDIR/bin" "$TOOLDIR/lib"
  cp "$(find "$tmp/exp" -name toktx -type f | head -1)" "$TOOLDIR/bin/toktx"
  cp "$(find "$tmp/exp" -name 'libktx.*.dylib' | head -1)" "$TOOLDIR/lib/libktx.4.dylib"
  chmod +x "$TOOLDIR/bin/toktx"
  rm -rf "$tmp"
  TOKTX="$TOOLDIR/bin/toktx"
}

resolve_toktx
echo "Using: $($TOKTX --version 2>&1 | head -1)"

src_for() { # find the source file (jpg/png) for an extensionless path
  for ext in jpg jpeg png; do [ -f "$1.$ext" ] && { echo "$1.$ext"; return; }; done
  echo ""; }

for entry in "${MANIFEST[@]}"; do
  base="${entry%%|*}"; type="${entry##*|}"
  src="$(src_for "$base")"
  [ -z "$src" ] && { echo "SKIP (no source): $base"; continue; }
  out="$base.ktx2"
  case "$type" in
    color)  args=(--encode etc1s --clevel 4 --qlevel 200 --assign_oetf srgb) ;;
    normal) args=(--encode etc1s --normal_mode --clevel 4 --qlevel 200 --assign_oetf linear) ;;
    linear) args=(--encode etc1s --clevel 4 --qlevel 160 --assign_oetf linear) ;;
    *) echo "Unknown type '$type' for $base"; exit 1 ;;
  esac
  "$TOKTX" --t2 --genmipmap "${args[@]}" "$out" "$src"
  printf "  %-45s %s\n" "$(basename "$out")" "$(du -h "$out" | cut -f1)"
done
echo "Done."
