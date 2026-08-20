# 오마이키캡 (clickme-key)

3D 키캡을 눌러 타건감을 즐기고, 직접 꾸며서 나만의 키캡 키링을 만드는 [Apps in Toss](https://apps-in-toss.toss.im/) 미니앱이에요.

- 6가지 스위치(축)마다 다른 타건음을 Web Audio API로 실시간 합성해요.
- CSS 3D(`preserve-3d`)로 키캡/스위치 하우징을 실제 입체로 그려요.
- 색상·마감(그라데이션/네온/메탈/홀로그램)·캐릭터 얼굴·이모지·직접 입력 글자로 키캡을 커스터마이징하고, 여러 조합을 프리셋으로 저장할 수 있어요.
- 누적 타건 수에 따라 새로운 축(스위치)이 순차적으로 해금돼요.

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| 프레임워크 | [Apps in Toss / Granite](https://developers-apps-in-toss.toss.im/bedrock/intro.md) (`@apps-in-toss/web-framework`) |
| UI | React 18 + TypeScript |
| 디자인 시스템 | [TDS Mobile](https://developers-apps-in-toss.toss.im/design/components.md) (`@toss/tds-mobile`, `@toss/tds-mobile-ait`) |
| 번들러 | Vite 6 |
| 사운드 | Web Audio API (오디오 파일 없이 파형을 직접 합성) |
| 저장소 | Apps in Toss `Storage`(사용자별) 우선, 실패 시 `localStorage` 폴백 |
| 광고 | Apps in Toss `TossAds` 배너 |
| 코드 품질 | ESLint(`typescript-eslint`, `eslint-plugin-react-hooks`) + Prettier |

## 프로젝트 구조

```
src/
  App.tsx                 # 메인 화면(축 선택, 3D 키캡, 콤보/해금 UI)
  main.tsx                # TDSMobileAITProvider로 감싸 렌더링
  App.css / index.css     # 스타일

  hooks/
    useAudioSettings.ts    # 음소거/햅틱 설정 + 설정을 반영한 재생 함수
    useUnlockSystem.ts     # 누적 타수/콤보/축 해금 시스템
    useStateRef.ts         # useState + useRef를 동기화해주는 범용 훅
    useDragScroll.ts        # 가로 목록 마우스 드래그 스크롤

  components/
    KeycapUnit.tsx          # 3D 키캡 유닛(드래그 회전 포함)
    CustomizerScreen.tsx    # 키캡 꾸미기 화면
    Box.tsx / Stem.tsx / CapFace.tsx  # 3D 프리미티브 & 시각 요소
    BannerAd.tsx             # TossAds 배너

  lib/
    switches.ts             # 축(스위치) 스펙 데이터
    sound.ts                 # 타건음 합성
    haptics.ts                # 햅틱 타입/트리거
    capStyle.ts               # 키캡 마감(질감) 렌더링, 커스텀 데이터 모델
    faceDesigns.ts             # 캐릭터 얼굴 데이터
    color.ts                    # 색상 유틸/팔레트
    keycapLayout.ts              # 키캡 치수, 배치(3구/4구/정사각형) 정의
    stickers.ts                   # 이모지 스티커 카테고리
    storage.ts                     # Toss Storage + localStorage 저장 계층
```

## 시작하기

```bash
npm install
npm run dev
```

개발 서버는 [Granite CLI](https://developers-apps-in-toss.toss.im/bedrock/reference/framework/시작하기/intro.md)로 구동되며, 토스 앱 없이 브라우저에서도 확인할 수 있어요(토스 전용 기능은 자동으로 폴백돼요).

## 스크립트

| 명령어 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 (`granite dev`) |
| `npm run build` | 웹 번들 + React Native(Android/iOS) 번들 + `.ait` 아티팩트 생성 (`ait build`) |
| `npm run deploy` | 빌드 산출물을 앱인토스 콘솔에 배포 (`ait deploy`) |
| `npm run lint` | ESLint 검사 |
| `npm run format` | Prettier로 코드 포맷 |

## 배포하기

앱인토스 배포 API 키는 [앱인토스 콘솔](https://apps-in-toss.toss.im/) > 워크스페이스 > API 키 > 콘솔 API 키 에서 발급받을 수 있어요. 이 키는 절대 저장소에 커밋하지 말고, `ait` CLI가 안내하는 방식(환경 변수 등)으로만 로컬에 보관해주세요.

```bash
npm run build
npm run deploy
```

## 유용한 링크

- [앱인토스 콘솔](https://apps-in-toss.toss.im/)
- [앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/)
- [앱인토스 개발자 커뮤니티](https://techchat-apps-in-toss.toss.im/)

AI를 사용하시는 경우 [여기](https://developers-apps-in-toss.toss.im/development/llms.html)를 확인해보세요.
