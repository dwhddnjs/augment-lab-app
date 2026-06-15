// plus 탭은 disabled(preventNativeSelection)라 절대 선택되지 않는다.
// 누르면 NativeTabs의 onTabSelectionPrevented가 모달을 띄우므로(app-tabs.*),
// 이 화면은 렌더되지 않는다. 라우트 등록을 위해서만 존재한다.
export default function PlusTab() {
  return null;
}
