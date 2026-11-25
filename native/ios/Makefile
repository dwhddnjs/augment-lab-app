# 워크트리마다 derivedData가 따로 잡힌다(저장소 루트의 .build/ios) → 여러 세션이 동시에 빌드해도 서로 막지 않는다.
DERIVED := ../../.build/ios

build:
	xcodebuild -project AugmentLab.xcodeproj -scheme AugmentLab -destination 'generic/platform=iOS Simulator' -derivedDataPath $(DERIVED) build -quiet

test:
	swift test --package-path AugmentCore

clean:
	rm -rf $(DERIVED) AugmentCore/.build

.PHONY: build test clean
