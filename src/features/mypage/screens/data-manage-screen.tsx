/**
 * DataManageScreen — 데이터 백업/복원/초기화.
 *
 * 앱을 지우면 로컬 데이터(빌드 + 테마·언어 설정)가 함께 사라지므로 .alab 파일로
 * 내보내고 되돌릴 수 있게 한다. 마이페이지와 같은 `@expo/ui/swift-ui` List 룩.
 */
import { Host, List, Section, Text } from "@expo/ui/swift-ui";
import {
  background,
  listStyle,
  scrollContentBackground,
} from "@expo/ui/swift-ui/modifiers";
import { useState } from "react";
import { Alert } from "react-native";

import { useTheme } from "@/hooks/use-theme";
import { countBuilds } from "@/lib/backup-format";
import {
  applyBackup,
  exportBackup,
  pickBackupFile,
  resetAllData,
} from "@/lib/backup";
import { useTranslation } from "@/lib/i18n";
import * as Sharing from "expo-sharing";

import { SettingsRow } from "../components/settings-row";

const t = {
  ko: {
    backupSection: "백업 · 복원",
    backupFooter:
      "백업 파일(.alab)에는 저장된 빌드와 테마·언어 설정이 담깁니다. 앱을 지우기 전에 백업해 두면 재설치 후 그대로 되돌릴 수 있어요.",
    backup: "백업",
    backupDesc: "지금 데이터를 .alab 파일로 내보냅니다",
    restore: "복원",
    restoreDesc: "백업 파일을 불러와 현재 데이터를 덮어씁니다",

    resetSection: "초기화",
    resetFooter: "되돌릴 수 없습니다. 지우기 전에 백업을 먼저 권합니다.",
    reset: "초기화",
    resetDesc: "저장된 빌드와 설정을 모두 지웁니다",

    restoreConfirmTitle: "데이터를 복원할까요?",
    restoreConfirmBody:
      "백업 파일의 빌드 {n}개로 교체됩니다. 지금 기기에 있는 데이터는 사라집니다.",
    restoreOk: "복원",
    restoreDone: "복원했습니다",
    restoreFail: "복원하지 못했습니다",
    restoreFailBody: "증강연구소 백업 파일(.alab)이 맞는지 확인해 주세요.",

    backupFail: "백업하지 못했습니다",
    backupFailBody: "잠시 후 다시 시도해 주세요.",

    resetConfirmTitle: "모든 데이터를 삭제할까요?",
    resetConfirmBody:
      "저장된 빌드와 테마·언어 설정이 모두 지워집니다. 되돌릴 수 없어요.",
    resetOk: "삭제",
    resetDone: "삭제했습니다",

    cancel: "취소",
    ok: "확인",
  },
  en: {
    backupSection: "Backup & Restore",
    backupFooter:
      "A backup file (.alab) holds your saved builds and theme/language settings. Back up before deleting the app to restore everything after reinstalling.",
    backup: "Back Up",
    backupDesc: "Export your current data as an .alab file",
    restore: "Restore",
    restoreDesc: "Load a backup file and overwrite current data",

    resetSection: "Erase",
    resetFooter: "This can't be undone. Back up first.",
    reset: "Erase",
    resetDesc: "Deletes all saved builds and settings",

    restoreConfirmTitle: "Restore data?",
    restoreConfirmBody:
      "{n} build(s) from the backup will replace what's on this device.",
    restoreOk: "Restore",
    restoreDone: "Restored",
    restoreFail: "Couldn't restore",
    restoreFailBody: "Make sure the file is an Augment Lab backup (.alab).",

    backupFail: "Couldn't back up",
    backupFailBody: "Please try again in a moment.",

    resetConfirmTitle: "Erase all data?",
    resetConfirmBody:
      "Saved builds and theme/language settings will be deleted. This can't be undone.",
    resetOk: "Erase",
    resetDone: "Erased",

    cancel: "Cancel",
    ok: "OK",
  },
};

export default function DataManageScreen() {
  const translate = useTranslation(t);
  const { colors, mode } = useTheme();
  // 파일 선택·공유 시트가 떠 있는 동안 다른 행을 누르지 못하게 막는다.
  const [busy, setBusy] = useState(false);
  const rowBg = colors.surface.raised;

  const handleRestore = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const file = await pickBackupFile();
      if (!file) return; // 사용자가 취소 — 아무것도 바꾸지 않는다.
      Alert.alert(
        translate("restoreConfirmTitle"),
        translate("restoreConfirmBody").replace("{n}", String(countBuilds(file))),
        [
          { text: translate("cancel"), style: "cancel" },
          {
            text: translate("restoreOk"),
            style: "destructive",
            onPress: () => {
              applyBackup(file)
                .then(() => Alert.alert(translate("restoreDone")))
                .catch(() =>
                  Alert.alert(
                    translate("restoreFail"),
                    translate("restoreFailBody")
                  )
                );
            },
          },
        ]
      );
    } catch {
      // 파싱 실패(우리 파일이 아니거나 손상) — 저장소는 그대로다.
      Alert.alert(translate("restoreFail"), translate("restoreFailBody"));
    } finally {
      setBusy(false);
    }
  };

  const handleBackup = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const uri = await exportBackup();
      await Sharing.shareAsync(uri, {
        // .alab은 등록된 UTI가 없으므로 일반 데이터로 넘긴다("파일에 저장"이 뜬다).
        UTI: "public.data",
        mimeType: "application/octet-stream",
      });
    } catch {
      Alert.alert(translate("backupFail"), translate("backupFailBody"));
    } finally {
      setBusy(false);
    }
  };

  const handleReset = () => {
    if (busy) return;
    Alert.alert(translate("resetConfirmTitle"), translate("resetConfirmBody"), [
      { text: translate("cancel"), style: "cancel" },
      {
        text: translate("resetOk"),
        style: "destructive",
        onPress: () => {
          resetAllData()
            .then(() => Alert.alert(translate("resetDone")))
            .catch(() => {});
        },
      },
    ]);
  };

  return (
    // key={mode} — 마이페이지와 같은 이유(런타임 테마 변경 시 Host remount).
    <Host key={mode} style={{ flex: 1 }} colorScheme={mode}>
      <List
        modifiers={[
          listStyle("insetGrouped"),
          scrollContentBackground("hidden"),
          background(colors.surface.base),
        ]}
      >
        <Section
          title={translate("backupSection")}
          footer={<Text>{translate("backupFooter")}</Text>}
        >
          <SettingsRow
            label={translate("backup")}
            description={translate("backupDesc")}
            icon="square.and.arrow.up"
            iconColor={colors.accent.default}
            onPress={handleBackup}
            rowBackgroundColor={rowBg}
          />
          <SettingsRow
            label={translate("restore")}
            description={translate("restoreDesc")}
            icon="square.and.arrow.down"
            iconColor={colors.accent.default}
            onPress={handleRestore}
            rowBackgroundColor={rowBg}
          />
        </Section>
        <Section
          title={translate("resetSection")}
          footer={<Text>{translate("resetFooter")}</Text>}
        >
          <SettingsRow
            label={translate("reset")}
            description={translate("resetDesc")}
            icon="trash"
            iconColor={colors.status.danger.default}
            labelColor={colors.status.danger.default}
            onPress={handleReset}
            rowBackgroundColor={rowBg}
          />
        </Section>
      </List>
    </Host>
  );
}
