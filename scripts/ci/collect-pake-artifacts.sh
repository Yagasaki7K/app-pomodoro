#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 --kind <windows|linux|macos> --search-root <path> --output-dir <path>"
}

kind=""
search_root=""
output_dir=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --kind)
      kind="${2:-}"
      shift 2
      ;;
    --search-root)
      search_root="${2:-}"
      shift 2
      ;;
    --output-dir)
      output_dir="${2:-}"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [ -z "$kind" ] || [ -z "$search_root" ] || [ -z "$output_dir" ]; then
  usage >&2
  exit 2
fi

if [ ! -d "$search_root" ]; then
  echo "Search root does not exist: $search_root" >&2
  exit 1
fi

mkdir -p "$output_dir"

case "$kind" in
  windows)
    patterns=("*.msi")
    require_app=false
    ;;
  linux)
    patterns=("*.deb")
    require_app=false
    ;;
  macos)
    patterns=("*.dmg")
    require_app=true
    ;;
  *)
    echo "Unsupported artifact kind: $kind" >&2
    exit 2
    ;;
esac

search_root_abs=$(cd "$search_root" && pwd -P)
output_dir_abs=$(mkdir -p "$output_dir" && cd "$output_dir" && pwd -P)

should_prune=(
  "$search_root_abs/.git"
  "$search_root_abs/node_modules"
  "$search_root_abs/projects"
  "$search_root_abs/artifacts"
  "$output_dir_abs"
)

find_prune_args=()
for path_to_prune in "${should_prune[@]}"; do
  find_prune_args+=( -path "$path_to_prune" -o )
done
unset 'find_prune_args[${#find_prune_args[@]}-1]'

echo "Searching for fresh Pake outputs under: $search_root_abs"
find "$search_root_abs" -maxdepth 8 \
  \( "${find_prune_args[@]}" \) -prune \
  -o -print | sort

file_count=0
for pattern in "${patterns[@]}"; do
  while IFS= read -r -d '' file; do
    cp -f "$file" "$output_dir_abs/"
    echo "Collected file: $file -> $output_dir_abs/$(basename "$file")"
    file_count=$((file_count + 1))
  done < <(find "$search_root_abs" -maxdepth 8 \
    \( "${find_prune_args[@]}" \) -prune \
    -o -type f -name "$pattern" -print0)
done

app_count=0
if [ "$require_app" = true ]; then
  while IFS= read -r -d '' app; do
    destination="$output_dir_abs/$(basename "$app")"
    rm -rf "$destination"
    cp -R "$app" "$destination"
    echo "Collected app bundle: $app -> $destination"
    app_count=$((app_count + 1))
  done < <(find "$search_root_abs" -maxdepth 8 \
    \( "${find_prune_args[@]}" \) -prune \
    -o -type d -name '*.app' -print0)
fi

if [ "$file_count" -eq 0 ]; then
  echo "No required installer files were found for kind: $kind" >&2
  exit 1
fi

if [ "$require_app" = true ] && [ "$app_count" -eq 0 ]; then
  echo "No macOS .app bundle was found. The installed Pake version did not leave a collectible .app bundle." >&2
  exit 1
fi

echo "Collected artifact summary for $kind: files=$file_count apps=$app_count"
find "$output_dir_abs" -maxdepth 6 -print | sort
