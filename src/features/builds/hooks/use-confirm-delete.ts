/**
 * 빌드 카드 길게 누르기 → 삭제 확인. 홈 캐러셀과 내 빌드 그리드가 함께 쓴다.
 * 스토어가 즉시 emit 하므로 구독 중인 목록이 바로 갱신된다(수동 상태 갱신 불필요).
 */
import { Alert } from "react-native";

import { removeBuild, type SavedBuild } from "@/lib/build-storage";
import { useTranslation } from "@/lib/i18n";

const t = {
  ko: { deleteConfirm: "빌드를 삭제할까요?", deleteOk: "삭제", cancel: "취소" },
  en: { deleteConfirm: "Delete this build?", deleteOk: "Delete", cancel: "Cancel" },
};

export function useConfirmDelete() {
  const translate = useTranslation(t);
  return (build: SavedBuild) =>
    Alert.alert(translate("deleteConfirm"), "", [
      { text: translate("cancel"), style: "cancel" },
      {
        text: translate("deleteOk"),
        style: "destructive",
        onPress: () => {
          removeBuild(build.id).catch(() => {});
        },
      },
    ]);
}
