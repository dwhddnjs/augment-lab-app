// Native fallback — runtime uses app-tabs.ios.tsx or app-tabs.android.tsx
import { useRouter } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";

import { useTheme } from "@/hooks/use-theme";
import { useTranslation } from "@/lib/i18n";

const t = {
  ko: {
    home: "메인",
    community: "커뮤니티",
    mypage: "마이페이지",
    plus: "추가",
  },
  en: { home: "Home", community: "Community", mypage: "My Page", plus: "Add" },
};

export default function AppTabs() {
  const { colors } = useTheme();
  const translate = useTranslation(t);
  const router = useRouter();

  return (
    <NativeTabs
      tintColor={colors.accent.default}
      unstable_nativeProps={{
        // plus는 disabled(preventNativeSelection)라 눌러도 탭이 전환되지 않는다
        // → 현재 탭 선택이 유지되고 빈 plus 화면이 뜨지 않는다. 막힌 선택은
        // onTabSelectionPrevented로 통지되며, 유일한 disabled 탭이 plus이므로
        // 이 이벤트 = plus 눌림 → 모달을 띄운다.
        onTabSelectionPrevented: () => {
          router.push("/select-champion-modal");
        },
      }}
    >
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Label>{translate("home")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house" />
      </NativeTabs.Trigger>

      {/* <NativeTabs.Trigger name="(community)">
        <NativeTabs.Trigger.Label>
          {translate("community")}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.2" />
      </NativeTabs.Trigger> */}

      <NativeTabs.Trigger name="(mypage)">
        <NativeTabs.Trigger.Label>
          {translate("mypage")}
        </NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle" />
      </NativeTabs.Trigger>

      {/* disabled → 탭 전환을 막아 현재 탭 유지(빈 화면 방지). 누르면
          NativeTabs의 onTabSelectionPrevented가 모달을 띄운다. */}
      <NativeTabs.Trigger name="plus" role="search" disabled>
        <NativeTabs.Trigger.Label>{translate("plus")}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="plus" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
