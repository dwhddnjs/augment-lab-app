# Expo용 WebGPU & Three.js

**React Native에서 3D 그래픽, 게임, GPU 연산, 또는 Three.js 기능이 필요할 때 이 스킬을 사용하세요.**

## 고정 버전 (검증된 조합)

```json
{
  "react-native-wgpu": "^0.4.1",
  "three": "0.172.0",
  "@react-three/fiber": "^9.4.0",
  "wgpu-matrix": "^3.0.2",
  "@types/three": "0.172.0"
}
```

**중요:** 이 버전들은 함께 테스트되었습니다. 버전이 맞지 않으면 타입 에러와 런타임 문제가 발생합니다.

## 설치

```bash
npm install react-native-wgpu@^0.4.1 three@0.172.0 @react-three/fiber@^9.4.0 wgpu-matrix@^3.0.2 @types/three@0.172.0 --legacy-peer-deps
```

**참고:** Expo canary 버전과의 피어 의존성 충돌로 인해 `--legacy-peer-deps`가 필요할 수 있습니다.

## Metro 설정

프로젝트 루트에 `metro.config.js` 만들기:

```js
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // 'three'를 webgpu 빌드로 강제 지정
  if (moduleName.startsWith("three")) {
    moduleName = "three/webgpu";
  }

  // React Native 버전 대신 표준 react-three/fiber 사용
  if (platform !== "web" && moduleName.startsWith("@react-three/fiber")) {
    return context.resolveRequest(
      {
        ...context,
        unstable_conditionNames: ["module"],
        mainFields: ["module"],
      },
      moduleName,
      platform
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
```

## 필수 라이브러리 파일

`src/lib/`에 아래 파일들을 만드세요:

### 1. make-webgpu-renderer.ts

```ts
import type { NativeCanvas } from "react-native-wgpu";
import * as THREE from "three/webgpu";

export class ReactNativeCanvas {
  constructor(private canvas: NativeCanvas) {}

  get width() { return this.canvas.width; }
  get height() { return this.canvas.height; }
  set width(width: number) { this.canvas.width = width; }
  set height(height: number) { this.canvas.height = height; }
  get clientWidth() { return this.canvas.width; }
  get clientHeight() { return this.canvas.height; }
  set clientWidth(width: number) { this.canvas.width = width; }
  set clientHeight(height: number) { this.canvas.height = height; }

  addEventListener(_type: string, _listener: EventListener) {}
  removeEventListener(_type: string, _listener: EventListener) {}
  dispatchEvent(_event: Event) {}
  setPointerCapture() {}
  releasePointerCapture() {}
}

export const makeWebGPURenderer = (
  context: GPUCanvasContext,
  { antialias = true }: { antialias?: boolean } = {}
) =>
  new THREE.WebGPURenderer({
    antialias,
    // @ts-expect-error
    canvas: new ReactNativeCanvas(context.canvas),
    context,
  });
```

### 2. fiber-canvas.tsx

```tsx
import * as THREE from "three/webgpu";
import React, { useEffect, useRef } from "react";
import type { ReconcilerRoot, RootState } from "@react-three/fiber";
import {
  extend,
  createRoot,
  unmountComponentAtNode,
  events,
} from "@react-three/fiber";
import type { ViewProps } from "react-native";
import { PixelRatio } from "react-native";
import { Canvas, type CanvasRef } from "react-native-wgpu";

import {
  makeWebGPURenderer,
  ReactNativeCanvas,
} from "@/lib/make-webgpu-renderer";

// R3F를 위한 THREE 네임스페이스 확장 - 사용하는 컴포넌트를 모두 추가하세요
extend({
  AmbientLight: THREE.AmbientLight,
  DirectionalLight: THREE.DirectionalLight,
  PointLight: THREE.PointLight,
  SpotLight: THREE.SpotLight,
  Mesh: THREE.Mesh,
  Group: THREE.Group,
  Points: THREE.Points,
  BoxGeometry: THREE.BoxGeometry,
  SphereGeometry: THREE.SphereGeometry,
  CylinderGeometry: THREE.CylinderGeometry,
  ConeGeometry: THREE.ConeGeometry,
  DodecahedronGeometry: THREE.DodecahedronGeometry,
  BufferGeometry: THREE.BufferGeometry,
  BufferAttribute: THREE.BufferAttribute,
  MeshStandardMaterial: THREE.MeshStandardMaterial,
  MeshBasicMaterial: THREE.MeshBasicMaterial,
  PointsMaterial: THREE.PointsMaterial,
  PerspectiveCamera: THREE.PerspectiveCamera,
  Scene: THREE.Scene,
});

interface FiberCanvasProps {
  children: React.ReactNode;
  style?: ViewProps["style"];
  camera?: THREE.PerspectiveCamera;
  scene?: THREE.Scene;
}

export const FiberCanvas = ({
  children,
  style,
  scene,
  camera,
}: FiberCanvasProps) => {
  const root = useRef<ReconcilerRoot<OffscreenCanvas>>(null!);
  const canvasRef = useRef<CanvasRef>(null);

  useEffect(() => {
    const context = canvasRef.current!.getContext("webgpu")!;
    const renderer = makeWebGPURenderer(context);

    // @ts-expect-error - ReactNativeCanvas wraps native canvas
    const canvas = new ReactNativeCanvas(context.canvas) as HTMLCanvasElement;
    canvas.width = canvas.clientWidth * PixelRatio.get();
    canvas.height = canvas.clientHeight * PixelRatio.get();
    const size = {
      top: 0,
      left: 0,
      width: canvas.clientWidth,
      height: canvas.clientHeight,
    };

    if (!root.current) {
      root.current = createRoot(canvas);
    }
    root.current.configure({
      size,
      events,
      scene,
      camera,
      gl: renderer,
      frameloop: "always",
      dpr: 1,
      onCreated: async (state: RootState) => {
        // @ts-expect-error - WebGPU renderer has init method
        await state.gl.init();
        const renderFrame = state.gl.render.bind(state.gl);
        state.gl.render = (s: THREE.Scene, c: THREE.Camera) => {
          renderFrame(s, c);
          context?.present();
        };
      },
    });
    root.current.render(children);
    return () => {
      if (canvas != null) {
        unmountComponentAtNode(canvas!);
      }
    };
  });

  return <Canvas ref={canvasRef} style={style} />;
};
```

## 기본 3D 씬

```tsx
import * as THREE from "three/webgpu";
import { View } from "react-native";
import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { FiberCanvas } from "@/lib/fiber-canvas";

function RotatingBox() {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    ref.current.rotation.x += delta;
    ref.current.rotation.y += delta * 0.5;
  });

  return (
    <mesh ref={ref}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="hotpink" />
    </mesh>
  );
}

function Scene() {
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 2, 5);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <RotatingBox />
    </>
  );
}

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <FiberCanvas style={{ flex: 1 }}>
        <Scene />
      </FiberCanvas>
    </View>
  );
}
```

## 지연 로딩 (권장)

더 나은 로딩을 위해 React.lazy로 Three.js 코드 분리하기:

```tsx
import React, { Suspense } from "react";
import { ActivityIndicator, View } from "react-native";

const Scene = React.lazy(() => import("@/components/scene"));

export default function Page() {
  return (
    <View style={{ flex: 1 }}>
      <Suspense fallback={<ActivityIndicator size="large" />}>
        <Scene />
      </Suspense>
    </View>
  );
}
```

## 자주 쓰는 지오메트리

```tsx
// 박스
<mesh>
  <boxGeometry args={[너비, 높이, 깊이]} />
  <meshStandardMaterial color="red" />
</mesh>

// 구체
<mesh>
  <sphereGeometry args={[반지름, 너비세그먼트, 높이세그먼트]} />
  <meshStandardMaterial color="blue" />
</mesh>

// 원기둥
<mesh>
  <cylinderGeometry args={[상단반지름, 하단반지름, 높이, 세그먼트]} />
  <meshStandardMaterial color="green" />
</mesh>

// 원뿔
<mesh>
  <coneGeometry args={[반지름, 높이, 세그먼트]} />
  <meshStandardMaterial color="yellow" />
</mesh>
```

## 조명

```tsx
// 주변광 (모든 곳에 균일한 빛)
<ambientLight intensity={0.5} />

// 방향광 (태양광 같은)
<directionalLight position={[10, 10, 5]} intensity={1} />

// 점광 (전구)
<pointLight position={[0, 5, 0]} intensity={2} distance={10} />

// 스폿광 (손전등)
<spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={2} />
```

## useFrame으로 애니메이션

```tsx
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three/webgpu";

function AnimatedMesh() {
  const ref = useRef<THREE.Mesh>(null!);

  // 매 프레임 실행 - delta는 지난 프레임 이후 시간
  useFrame((state, delta) => {
    // 회전
    ref.current.rotation.y += delta;

    // 위치 진동
    ref.current.position.y = Math.sin(state.clock.elapsedTime) * 2;
  });

  return (
    <mesh ref={ref}>
      <boxGeometry />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}
```

## 파티클 시스템

```tsx
import * as THREE from "three/webgpu";
import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";

function Particles({ count = 500 }) {
  const ref = useRef<THREE.Points>(null!);
  const positions = useRef<Float32Array>(new Float32Array(count * 3));

  useEffect(() => {
    for (let i = 0; i < count; i++) {
      positions.current[i * 3] = (Math.random() - 0.5) * 50;
      positions.current[i * 3 + 1] = (Math.random() - 0.5) * 50;
      positions.current[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
  }, [count]);

  useFrame((_, delta) => {
    for (let i = 0; i < count; i++) {
      positions.current[i * 3 + 1] -= delta * 2;
      if (positions.current[i * 3 + 1] < -25) {
        positions.current[i * 3 + 1] = 25;
      }
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions.current, 3]}
        />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={0.2} sizeAttenuation />
    </points>
  );
}
```

## 터치 컨트롤 (궤도)

전체 `orbit-controls.tsx` 구현은 lib 파일을 참고하세요. 사용법:

```tsx
import { View } from "react-native";
import { FiberCanvas } from "@/lib/fiber-canvas";
import useControls from "@/lib/orbit-controls";

function Scene() {
  const [OrbitControls, events] = useControls();

  return (
    <View style={{ flex: 1 }} {...events}>
      <FiberCanvas style={{ flex: 1 }}>
        <OrbitControls />
        {/* 3D 콘텐츠 */}
      </FiberCanvas>
    </View>
  );
}
```

## 자주 겪는 문제 & 해결책

### 1. "X는 THREE 네임스페이스에 없습니다"

**문제:** `AmbientLight is not part of the THREE namespace` 같은 에러

**해결:** fiber-canvas.tsx의 `extend()` 호출에 누락된 컴포넌트를 추가하세요:

```tsx
extend({
  AmbientLight: THREE.AmbientLight,
  // 누락된 컴포넌트 추가...
});
```

### 2. Three.js TypeScript 에러

**문제:** three.js와 R3F 간의 타입 불일치

**해결:** 필요한 곳에 `@ts-expect-error` 주석 사용:

```tsx
// @ts-expect-error - WebGPU renderer types don't match
await state.gl.init();
```

### 3. 빈 화면

**문제:** 캔버스는 렌더링되지만 아무것도 보이지 않음

**해결:**

1. 카메라 위치가 올바르고 씬을 바라보는지 확인
2. 조명 추가 (조명 없이는 오브젝트가 검게 보임)
3. `extend()`에 사용하는 모든 컴포넌트가 포함되었는지 확인

### 4. 성능 문제

**문제:** 낮은 프레임레이트 또는 끊김

**해결:**

- 지오메트리 폴리곤 수 줄이기
- 정적 데이터에 `useMemo` 사용
- 파티클 수 줄이기
- 동일한 오브젝트가 많은 경우 `instancedMesh` 사용

### 5. 피어 의존성 에러

**문제:** npm install이 ERESOLVE 에러로 실패

**해결:** `--legacy-peer-deps` 사용:

```bash
npm install <패키지들> --legacy-peer-deps
```

## 빌드

WebGPU는 커스텀 빌드가 필요합니다:

```bash
npx expo prebuild
npx expo run:ios
```

**참고:** WebGPU는 Expo Go에서 작동하지 않습니다.

## 파일 구조

```
src/
├── app/
│   └── index.tsx           # 지연 로딩이 있는 진입점
├── components/
│   ├── scene.tsx           # 메인 3D 씬
│   └── game.tsx            # 게임 로직
└── lib/
    ├── fiber-canvas.tsx    # R3F 캔버스 래퍼
    ├── make-webgpu-renderer.ts  # WebGPU 렌더러
    └── orbit-controls.tsx  # 터치 컨트롤
```

## 결정 트리

```
3D 그래픽이 필요한가?
├── 단순한 형태 → mesh + geometry + material
├── 애니메이션 오브젝트 → useFrame + refs
├── 많은 오브젝트 → instancedMesh
├── 파티클 → Points + BufferGeometry
│
인터랙션이 필요한가?
├── 카메라 궤도 → useControls 훅
├── 오브젝트 터치 → mesh의 onClick
├── 제스처 → react-native-gesture-handler
│
성능이 중요한가?
├── 정적 지오메트리 → useMemo
├── 많은 인스턴스 → InstancedMesh
└── 복잡한 씬 → LOD (Level of Detail)
```
