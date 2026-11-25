#!/usr/bin/env bash
# 마이그레이션 작업 상태판.
#   bash docs/migration/status.sh            → 전체 상태 (완료 / 진행중 / 시작가능 / 대기)
#   bash docs/migration/status.sh diff <ID>  → 이 브랜치에서 <ID>의 owns 밖을 건드린 파일 (있으면 exit 1)
# 상태는 지금 체크아웃된 브랜치의 작업 파일 frontmatter 기준이다. 메인 워크트리(dev)에서 git pull 후 본다.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
dir=docs/migration
tasks() { ls "$dir"/ios/[I]-*.md "$dir"/android/[A]-*.md 2>/dev/null || true; }
field() { sed -n "s/^$2: //p" "$1" | head -1; }

if [ "${1:-}" = diff ]; then
  f=$(tasks | grep "/$2-" | head -1)
  [ -n "$f" ] || { echo "작업 $2 없음"; exit 1; }
  owns=$(field "$f" owns)
  case "$owns" in "("*) echo "$2 는 직렬 작업 — owns 검사 없음"; exit 0 ;; esac
  # 스텁 최초 생성은 허용한다 (stubs: "<경로> (→ ID), …")
  stubs=$(field "$f" stubs | sed 's/ ([^)]*)//g')
  [ -n "$stubs" ] && owns="$owns, $stubs"
  base=$(git merge-base dev HEAD)
  bad=0
  while IFS= read -r p; do
    [ -z "$p" ] || [ "$p" = "$f" ] && continue
    ok=0
    while IFS= read -r o; do
      o=$(echo "$o" | sed 's/^ *//;s/ *$//')
      [ -n "$o" ] && case "$p" in "$o"*) ok=1 ;; esac
    done <<< "$(echo "$owns" | tr ',' '\n')"
    [ $ok = 1 ] || { echo "owns 밖 변경: $p"; bad=1; }
  done <<< "$( (git -c core.quotepath=false diff --name-only "$base"; git -c core.quotepath=false ls-files --others --exclude-standard) | sort -u)"
  [ $bad = 0 ] && echo "$2: owns 밖 변경 없음"
  exit $bad
fi

active=$(git branch -a --list '*native/*' --format='%(refname:short)' | sed 's#.*native/##' | sort -u)
done_ids=" $(for f in $(tasks); do if [ "$(field "$f" status)" = done ]; then field "$f" id; fi; done | tr '\n' ' ') "
printf '%-7s %-8s %s\n' ID 상태 제목
for f in $(tasks); do
  id=$(field "$f" id); title=$(field "$f" title)
  if [[ "$done_ids" == *" $id "* ]]; then s=완료
  elif echo "$active" | grep -qx "$id"; then s=진행중
  else
    s=시작가능
    for d in $(field "$f" depends | tr ',' ' '); do [[ "$done_ids" == *" $d "* ]] || { s=대기; break; }; done
  fi
  printf '%-7s %-8s %s\n' "$id" "$s" "$title"
done
