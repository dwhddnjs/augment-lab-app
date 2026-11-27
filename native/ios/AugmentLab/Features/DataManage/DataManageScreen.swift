import AugmentCore
import SwiftUI
import UIKit

private let L = L10n(
    ko: [
        "backupSection": "백업 · 복원",
        "backupFooter": "백업 파일(.alab)에는 저장된 빌드와 테마·언어 설정이 담깁니다. 앱을 지우기 전에 백업해 두면 재설치 후 그대로 되돌릴 수 있어요.",
        "backup": "백업",
        "backupDesc": "지금 데이터를 .alab 파일로 내보냅니다",
        "restore": "복원",
        "restoreDesc": "백업 파일을 불러와 현재 데이터를 덮어씁니다",
        "resetSection": "초기화",
        "resetFooter": "되돌릴 수 없습니다. 지우기 전에 백업을 먼저 권합니다.",
        "reset": "초기화",
        "resetDesc": "저장된 빌드와 설정을 모두 지웁니다",
        "restoreConfirmTitle": "데이터를 복원할까요?",
        "restoreConfirmBody": "백업 파일의 빌드 {n}개로 교체됩니다. 지금 기기에 있는 데이터는 사라집니다.",
        "restoreOk": "복원",
        "restoreDone": "복원했습니다",
        "restoreFail": "복원하지 못했습니다",
        "restoreFailBody": "증강연구소 백업 파일(.alab)이 맞는지 확인해 주세요.",
        "backupFail": "백업하지 못했습니다",
        "backupFailBody": "잠시 후 다시 시도해 주세요.",
        "resetConfirmTitle": "모든 데이터를 삭제할까요?",
        "resetConfirmBody": "저장된 빌드와 테마·언어 설정이 모두 지워집니다. 되돌릴 수 없어요.",
        "resetOk": "삭제",
        "resetDone": "삭제했습니다",
        "cancel": "취소",
        "ok": "확인",
    ],
    en: [
        "backupSection": "Backup & Restore",
        "backupFooter": "A backup file (.alab) holds your saved builds and theme/language settings. Back up before deleting the app to restore everything after reinstalling.",
        "backup": "Back Up",
        "backupDesc": "Export your current data as an .alab file",
        "restore": "Restore",
        "restoreDesc": "Load a backup file and overwrite current data",
        "resetSection": "Erase",
        "resetFooter": "This can't be undone. Back up first.",
        "reset": "Erase",
        "resetDesc": "Deletes all saved builds and settings",
        "restoreConfirmTitle": "Restore data?",
        "restoreConfirmBody": "{n} build(s) from the backup will replace what's on this device.",
        "restoreOk": "Restore",
        "restoreDone": "Restored",
        "restoreFail": "Couldn't restore",
        "restoreFailBody": "Make sure the file is an Augment Lab backup (.alab).",
        "backupFail": "Couldn't back up",
        "backupFailBody": "Please try again in a moment.",
        "resetConfirmTitle": "Erase all data?",
        "resetConfirmBody": "Saved builds and theme/language settings will be deleted. This can't be undone.",
        "resetOk": "Erase",
        "resetDone": "Erased",
        "cancel": "Cancel",
        "ok": "OK",
    ]
)

/// 데이터 백업·복원·초기화 (RN `data-manage-screen.tsx`). spec mypage.md §2, storage.md §3.
struct DataManageScreen: View {
    @Environment(AppSettings.self) private var settings
    @Environment(BuildStore.self) private var builds
    @Environment(\.palette) private var palette

    /// 파일 선택기·공유 시트·복원 확인이 떠 있는 동안 다른 행을 막는다. RN과 달리 복원은 적용이 끝날 때까지 막는다.
    @State private var busy = false
    @State private var importing = false
    @State private var dialog: Dialog?

    private enum Dialog {
        case restoreConfirm(BackupFile)
        case resetConfirm
        case message(title: String, body: String?)
    }

    /// 루트와 같은 위치를 가리킨다(빌드 = 앱 지원 폴더 파일, 설정 = UserDefaults).
    private var storage: BackupStorage {
        BackupStorage(buildFile: FileKeyValueStore(), settingsStore: UserDefaultsStore(), builds: builds, settings: settings)
    }

    var body: some View {
        let t = L.t(settings.locale)
        List {
            Section {
                SettingsRow(t("backup"), description: t("backupDesc"), icon: "square.and.arrow.up",
                            iconColor: palette.accent.default, rowBackground: palette.surface.raised) { backup(t) }
                SettingsRow(t("restore"), description: t("restoreDesc"), icon: "square.and.arrow.down",
                            iconColor: palette.accent.default, rowBackground: palette.surface.raised) {
                    guard !busy else { return }
                    busy = true
                    importing = true
                }
            } header: {
                Text(t("backupSection"))
            } footer: {
                Text(t("backupFooter"))
            }
            Section {
                SettingsRow(t("reset"), description: t("resetDesc"), icon: "trash", iconColor: palette.status.danger,
                            labelColor: palette.status.danger, rowBackground: palette.surface.raised) {
                    guard !busy else { return }
                    dialog = .resetConfirm
                }
            } header: {
                Text(t("resetSection"))
            } footer: {
                Text(t("resetFooter"))
            }
        }
        .listStyle(.insetGrouped)
        .scrollContentBackground(.hidden)
        .background(palette.surface.base)
        // 형식 필터 없음(RN과 같음 — .alab은 등록된 형식이 없다)
        .fileImporter(isPresented: $importing, allowedContentTypes: [.item], allowsMultipleSelection: false) { result in
            pickedFile(result.map { $0.first }, t)
        } onCancellation: {
            busy = false
        }
        .alert(alertTitle(t), isPresented: Binding { dialog != nil } set: { if !$0 { dialog = nil } }, presenting: dialog) { d in
            switch d {
            case .restoreConfirm(let file):
                Button(t("cancel"), role: .cancel) { busy = false }
                Button(t("restoreOk"), role: .destructive) { apply(file, t) }
            case .resetConfirm:
                Button(t("cancel"), role: .cancel) {}
                Button(t("resetOk"), role: .destructive) { reset(t) }
            case .message:
                Button(t("ok")) {}
            }
        } message: { d in
            switch d {
            case .restoreConfirm(let file):
                Text(t("restoreConfirmBody").replacingOccurrences(of: "{n}", with: String(Builds.parse(file.data[BuildStore.key]).count)))
            case .resetConfirm:
                Text(t("resetConfirmBody"))
            case .message(_, let body):
                if let body { Text(body) }
            }
        }
    }

    /// 알림 버튼 동작 뒤에 SwiftUI가 바인딩을 false로 돌려 방금 넣은 다음 알림을 지운다 → 한 박자 늦춰 띄운다.
    private func show(_ d: Dialog) {
        Task { dialog = d }
    }

    private func alertTitle(_ t: (String) -> String) -> String {
        switch dialog {
        case .restoreConfirm: t("restoreConfirmTitle")
        case .resetConfirm: t("resetConfirmTitle")
        case .message(let title, _): title
        case nil: ""
        }
    }

    /// 캐시 폴더에 `augment-lab-YYYY-MM-DD.alab`을 쓰고(같은 이름은 덮어씀) 공유 시트를 띄운다.
    private func backup(_ t: @escaping (String) -> String) {
        guard !busy else { return }
        busy = true
        do {
            let url = URL.cachesDirectory.appending(path: Backup.fileName(Date()))
            try storage.exportText().write(to: url, atomically: true, encoding: .utf8)
            presentShareSheet(url) { busy = false }
        } catch {
            busy = false
            show(.message(title: t("backupFail"), body: t("backupFailBody")))
        }
    }

    private func pickedFile(_ result: Result<URL?, Error>, _ t: (String) -> String) {
        do {
            guard let url = try result.get() else { busy = false; return }
            let scoped = url.startAccessingSecurityScopedResource()
            defer { if scoped { url.stopAccessingSecurityScopedResource() } }
            // 우리 파일이 아니거나 손상 → 실패 알림만, 저장소는 그대로(RN과 같이 코드와 무관하게 한 문구)
            show(.restoreConfirm(try Backup.parse(String(contentsOf: url, encoding: .utf8))))
        } catch {
            busy = false
            show(.message(title: t("restoreFail"), body: t("restoreFailBody")))
        }
    }

    private func apply(_ file: BackupFile, _ t: (String) -> String) {
        defer { busy = false }
        do {
            try storage.apply(file)
            show(.message(title: t("restoreDone"), body: nil))
        } catch {
            show(.message(title: t("restoreFail"), body: t("restoreFailBody")))
        }
    }

    private func reset(_ t: (String) -> String) {
        // RN도 초기화 실패는 조용히 넘긴다
        guard (try? storage.reset()) != nil else { return }
        show(.message(title: t("resetDone"), body: nil))
    }

    /// RN `Sharing.shareAsync`처럼 UIKit 공유 시트를 띄우고 닫히면 알린다. 파일 URL이라 "파일에 저장"이 뜬다.
    private func presentShareSheet(_ url: URL, onDismiss: @escaping () -> Void) {
        let scene = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }.first { $0.activationState == .foregroundActive }
        guard var top = scene?.keyWindow?.rootViewController else { return onDismiss() }
        while let next = top.presentedViewController { top = next }
        let sheet = UIActivityViewController(activityItems: [url], applicationActivities: nil)
        sheet.completionWithItemsHandler = { _, _, _, _ in onDismiss() }
        sheet.popoverPresentationController?.sourceView = top.view
        top.present(sheet, animated: true)
    }
}
