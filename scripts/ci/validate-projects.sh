#!/usr/bin/env bash
set -euo pipefail

projects_dir="${1:-projects}"
app_name="${2:-}"

if [ ! -d "$projects_dir" ]; then
  echo "Projects directory is missing: $projects_dir" >&2
  exit 1
fi

prefix_args=()
if [ -n "$app_name" ]; then
  prefix_args=( -name "$app_name.*" -o -name "$app_name.app" )
fi

count_entries() {
  if [ -n "$app_name" ]; then
    find "$projects_dir" -mindepth 1 -maxdepth 1 \( "${prefix_args[@]}" \) "$@" | wc -l | tr -d ' '
  else
    find "$projects_dir" -mindepth 1 -maxdepth 1 "$@" | wc -l | tr -d ' '
  fi
}

msi_count=$(count_entries -type f -name '*.msi')
deb_count=$(count_entries -type f -name '*.deb')
dmg_count=$(count_entries -type f -name '*.dmg')
app_count=$(count_entries -type d -name '*.app')
invalid_count=$(find "$projects_dir" -mindepth 1 -maxdepth 1 \
  ! -name '.gitkeep' ! -name '*.msi' ! -name '*.deb' ! -name '*.dmg' ! -name '*.app' | wc -l | tr -d ' ')

printf 'Projects validation summary:\n'
printf '  application filter: %s\n' "${app_name:-all}"
printf '  .msi files: %s\n' "$msi_count"
printf '  .deb files: %s\n' "$deb_count"
printf '  .dmg files: %s\n' "$dmg_count"
printf '  .app bundles: %s\n' "$app_count"
printf '  unexpected entries: %s\n' "$invalid_count"
find "$projects_dir" -maxdepth 6 -print | sort

if [ "$msi_count" -lt 1 ]; then
  echo "Required Windows .msi installer is missing from $projects_dir." >&2
  exit 1
fi

if [ "$deb_count" -lt 1 ]; then
  echo "Required Linux .deb installer is missing from $projects_dir." >&2
  exit 1
fi

if [ "$dmg_count" -lt 1 ]; then
  echo "Required macOS .dmg disk image is missing from $projects_dir." >&2
  exit 1
fi

if [ "$app_count" -lt 1 ]; then
  echo "Required macOS .app bundle is missing from $projects_dir." >&2
  exit 1
fi

if [ "$invalid_count" -ne 0 ]; then
  echo "Projects directory contains entries that are not final generated installers." >&2
  exit 1
fi
