#!/usr/bin/env bash
set -euo pipefail

workspace=$(mktemp -d)
trap 'rm -rf "$workspace"' EXIT

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd -P)
fixture="$workspace/repo"
mkdir -p "$fixture/build/windows" "$fixture/build/linux" "$fixture/build/macos/Discord.app/Contents" "$fixture/projects" "$fixture/artifacts"

printf 'old installer' > "$fixture/projects/Discord.msi"
printf 'fresh msi' > "$fixture/build/windows/Discord.msi"
printf 'fresh deb' > "$fixture/build/linux/Discord.deb"
printf 'fresh dmg' > "$fixture/build/macos/Discord.dmg"
printf 'bundle' > "$fixture/build/macos/Discord.app/Contents/Info.plist"

"$repo_root/scripts/ci/collect-pake-artifacts.sh" --kind windows --search-root "$fixture" --output-dir "$fixture/artifacts/windows"
"$repo_root/scripts/ci/collect-pake-artifacts.sh" --kind linux --search-root "$fixture" --output-dir "$fixture/artifacts/linux"
"$repo_root/scripts/ci/collect-pake-artifacts.sh" --kind macos --search-root "$fixture" --output-dir "$fixture/artifacts/macos"

rm -rf "$fixture/projects/Discord.msi" "$fixture/projects/Discord.deb" "$fixture/projects/Discord.dmg" "$fixture/projects/Discord.app"
find "$fixture/artifacts" -type f \( -name '*.msi' -o -name '*.deb' -o -name '*.dmg' \) -exec cp -f {} "$fixture/projects/" \;
while IFS= read -r -d '' app; do
  rm -rf "$fixture/projects/$(basename "$app")"
  cp -R "$app" "$fixture/projects/"
done < <(find "$fixture/artifacts" -type d -name '*.app' -print0)

"$repo_root/scripts/ci/validate-projects.sh" "$fixture/projects" "Discord"

if [ ! -f "$fixture/projects/Discord.msi" ] || [ ! -f "$fixture/projects/Discord.deb" ] || [ ! -f "$fixture/projects/Discord.dmg" ] || [ ! -d "$fixture/projects/Discord.app" ]; then
  echo "Expected generated files did not reach projects." >&2
  exit 1
fi

if [ ! -f "$fixture/artifacts/windows/Discord.msi" ] || [ ! -f "$fixture/artifacts/linux/Discord.deb" ] || [ ! -f "$fixture/artifacts/macos/Discord.dmg" ] || [ ! -d "$fixture/artifacts/macos/Discord.app" ]; then
  echo "Expected temporary files did not remain in artifacts." >&2
  exit 1
fi

echo "Artifact flow verification passed."
