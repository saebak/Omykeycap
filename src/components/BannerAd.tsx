import { TossAds } from "@apps-in-toss/web-framework";
import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ *
 * 하단 배너 광고 — 토스 인앱 광고(IAA)
 * · 개발/브라우저 등 미지원 환경에선 안내 영역(AD)만 노출돼요.
 * · 실제 광고는 토스앱 5.241.0 이상(샌드박스/실기기)에서만 표시돼요.
 * ------------------------------------------------------------------ */
// 배너 광고 그룹 ID — 개발/샌드박스는 테스트 ID, 출시 빌드(npm run build)만 실제 ID를 써요.
// (실제 광고 ID로 테스트하면 정책 위반이라 dev에서는 절대 실제 ID를 호출하지 않아요.)
const AD_GROUP_ID = import.meta.env.PROD
  ? "ait.v2.live.55fca38f2e184049" // 출시용 실제 광고 그룹 ID
  : "ait-ad-test-banner-id"; // 개발/테스트용

// TossAds SDK 초기화는 앱 전체에서 딱 한 번만 수행해요(문서 권장).
type AdsInitState = "idle" | "initializing" | "ready" | "unsupported";
let adsInitState: AdsInitState = "idle";
const adsReadyWaiters: Array<(ok: boolean) => void> = [];

function flushAdsWaiters(ok: boolean) {
  for (const w of adsReadyWaiters.splice(0)) w(ok);
}

function ensureAdsInitialized(onReady: (ok: boolean) => void) {
  if (adsInitState === "ready") return onReady(true);
  if (adsInitState === "unsupported") return onReady(false);
  adsReadyWaiters.push(onReady);
  if (adsInitState === "initializing") return;

  try {
    const supported =
      typeof TossAds?.initialize?.isSupported === "function" &&
      TossAds.initialize.isSupported();
    if (!supported) {
      adsInitState = "unsupported";
      flushAdsWaiters(false);
      return;
    }
    adsInitState = "initializing";
    TossAds.initialize({
      callbacks: {
        onInitialized: () => {
          adsInitState = "ready";
          flushAdsWaiters(true);
        },
        onInitializationFailed: (error) => {
          console.error("[ads] 초기화 실패:", error);
          adsInitState = "unsupported";
          flushAdsWaiters(false);
        },
      },
    });
  } catch (error) {
    console.error("[ads] 초기화 예외:", error);
    adsInitState = "unsupported";
    flushAdsWaiters(false);
  }
}

export function BannerAd() {
  const slotRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"pending" | "ad" | "fallback">(
    "pending",
  );

  useEffect(() => {
    let cancelled = false;
    let attached: { destroy?: () => void } | undefined;

    ensureAdsInitialized((ok) => {
      if (cancelled) return;
      if (!ok || slotRef.current == null) {
        setStatus("fallback");
        return;
      }
      try {
        attached = TossAds.attachBanner(AD_GROUP_ID, slotRef.current, {
          theme: "auto",
          tone: "blackAndWhite",
          variant: "expanded",
          callbacks: {
            onAdRendered: () => {
              console.log("[ads] 광고 렌더링 완료");
              setStatus("ad");
            },
            onAdImpression: () => console.log("[ads] 광고 노출"),
            onAdViewable: () =>
              console.log("[ads] 광고 노출 기록됨(수익 발생 시점)"),
            onAdClicked: () => console.log("[ads] 광고 클릭"),
            onNoFill: () => {
              console.warn("[ads] 표시할 광고 없음(no-fill)");
              setStatus("fallback");
            },
            onAdFailedToRender: (payload) => {
              console.error("[ads] 광고 렌더링 실패:", payload?.error?.message);
              setStatus("fallback");
            },
          },
        });
      } catch (error) {
        console.error("[ads] attachBanner 예외:", error);
        setStatus("fallback");
      }
    });

    return () => {
      cancelled = true;
      try {
        attached?.destroy?.();
      } catch {
        /* noop */
      }
    };
  }, []);

  return (
    <div className="kc-adbanner">
      {/* SDK가 광고를 부착할 컨테이너 (내부는 비워둬야 해요) */}
      <div
        ref={slotRef}
        className="kc-adslot"
        style={{ display: status === "fallback" ? "none" : "block" }}
      />
      {status !== "ad" && (
        <div className="kc-adfallback">
          <span className="kc-adtag">AD</span>
          <span>광고 배너 영역</span>
        </div>
      )}
    </div>
  );
}
