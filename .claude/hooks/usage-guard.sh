#!/bin/bash
# 5시간 한도 95% 감지 → 세션당 1회 정지 지시를 주입한다 (docs/migration/README.md §4).
# 사용률은 ~/.claude/statusline-command.sh 가 "<pct> <epoch>" 형식으로 ~/.claude/state/five-hour-pct 에 쓴다.
# statusline 을 바꾸면 그 한 줄을 유지해야 이 훅이 동작한다.
input=$(cat)
event=$(printf '%s' "$input" | jq -r '.hook_event_name // "PostToolUse"')
sid=$(printf '%s' "$input" | jq -r '.session_id // "unknown"')
state="$HOME/.claude/state"
read -r pct ts < "$state/five-hour-pct" 2>/dev/null || exit 0
[ $(( $(date +%s) - ${ts:-0} )) -le 900 ] || exit 0   # 15분보다 오래된 값은 무시
marker="$state/usage-guard-$sid"

if awk -v p="$pct" 'BEGIN { exit !(p >= 95) }'; then
  [ -e "$marker" ] && exit 0
  touch "$marker"
  msg="[5시간 한도 ${pct}%] 새 단계를 시작하지 말 것. ① 지금 하던 체크리스트 한 줄까지만 끝낸다(못 끝내면 그대로 둔다) ② 작업 파일 '진행 기록'에 마친 줄·진행 중이던 줄과 상태·다음에 할 첫 행동·주의점을 적는다 ③ 커밋 'wip(<ID>): …' ④ git push -u origin native/<ID> ⑤ 사용자에게 '한도 95% — 기록·push 완료. 리셋 후 \"<ID> 이어서\". PR·리뷰가 필요하면 /ship' 이라고 알리고 멈춘다. (docs/migration/README.md §4) 마이그레이션 작업이 아니면 진행 상황만 요약하고 멈춘다."
  jq -n --arg e "$event" --arg m "$msg" \
    '{systemMessage: "5시간 한도 95% — 기록·push 후 멈춥니다", hookSpecificOutput: {hookEventName: $e, additionalContext: $m}}'
else
  rm -f "$marker"
  find "$state" -name 'usage-guard-*' -mtime +1 -delete 2>/dev/null
fi
exit 0
