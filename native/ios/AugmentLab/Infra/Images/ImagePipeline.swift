import SDWebImageSwiftUI

/// SDWebImage 전역 설정. spec/storage.md §4(이미지 캐시).
/// 기본 캐시(`Library/Caches/com.hackemist.SDImageCache/default/`)를 그대로 써서 RN(expo-image)이 받아 둔 파일과 이어지게 한다.
enum ImagePipeline {
    /// 앱 시작 때 한 번. `PrewarmService`가 만들어질 때 부른다(여러 번 불러도 한 번만 적용).
    static func configure() { _ = applied }

    private static let applied: Void = {
        // RN은 1주 만료라 주마다 아이콘을 다시 받았다. 음수 = 만료 없음.
        SDImageCache.shared.config.maxDiskAge = -1
    }()
}
