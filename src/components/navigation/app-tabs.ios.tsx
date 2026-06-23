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
    <NativeTabs tintColor={colors.accent.default}>
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
          disabled 탭이라 tabPress가 isPrevented로 emit되고, 그 listener가
          모달을 띄운다. (onTabSelectionPrevented는 expo-router 내부에서
          덮어써져 unstable_nativeProps로 넘겨도 동작하지 않는다.) */}
      <NativeTabs.Trigger
        name="plus"
        role="search"
        disabled
        listeners={{
          tabPress: () => {
            router.push("/mode-select");
          },
        }}
      >
        <NativeTabs.Trigger.Label>{translate("plus")}</NativeTabs.Trigger.Label>
        {/* iOS=SF Symbol(plus), Android=Material Symbol(add). 색은 accent 강제. */}
        <NativeTabs.Trigger.Icon
          sf="plus"
          md="add"
          selectedColor={colors.accent.default}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
