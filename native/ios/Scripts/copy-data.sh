#!/bin/sh
# 번들 JSON(RN과 공용)을 앱 번들 Data/로 복사한다. 목록: Scripts/data-files.xcfilelist
set -eu
dest="${TARGET_BUILD_DIR}/${UNLOCALIZED_RESOURCES_FOLDER_PATH}/Data"
mkdir -p "$dest"
grep -v '^#' "${SRCROOT}/Scripts/data-files.xcfilelist" | while read -r f; do
  [ -n "$f" ] || continue
  cp "$(printf '%s' "$f" | sed "s#\$(SRCROOT)#${SRCROOT}#")" "$dest/"
done
