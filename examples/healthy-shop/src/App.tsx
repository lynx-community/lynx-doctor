import { lazy, Suspense, useEffect, useState } from "@lynx-js/react";
import type { MainThread } from "@lynx-js/types";
import "./styles.css";

const PromoRail = lazy(() => import("./PromoRail.js").then((module) => ({ default: module.PromoRail })));

const products = [
  { id: "runner", title: "Runner Jacket", price: "$128" },
  { id: "trail", title: "Trail Pack", price: "$84" },
  { id: "studio", title: "Studio Tee", price: "$36" }
];

interface AnalyticsModule {
  track?: (eventName: string, payload?: Record<string, unknown>) => void;
}

function trackScreenView(screenName: string) {
  "background only";
  const analytics = lynx.getJSModule("Analytics") as AnalyticsModule | undefined;
  analytics?.track?.("screen_view", { screenName });
}

function handleHeroTap(event: MainThread.TouchEvent) {
  "main thread";
  event.currentTarget.setStyleProperty("opacity", "0.92");
}

export function App() {
  const [selectedId, setSelectedId] = useState(products[0]?.id ?? "runner");

  useEffect(() => {
    trackScreenView("healthy-shop");
  }, []);

  return (
    <scroll-view className="page" scroll-orientation="vertical">
      <view className="hero" main-thread:bindtap={handleHeroTap}>
        <text className="eyebrow">Weekend Edit</text>
        <text className="headline">Built for fast Lynx storefronts.</text>
      </view>

      <Suspense fallback={<text className="loading">Loading offers...</text>}>
        <PromoRail />
      </Suspense>

      <view className="productList">
        {products.map((product) => (
          <view
            className={selectedId === product.id ? "product productActive" : "product"}
            key={product.id}
            bindtap={() => setSelectedId(product.id)}
          >
            <text className="productTitle">{product.title}</text>
            <text className="productPrice">{product.price}</text>
          </view>
        ))}
      </view>
    </scroll-view>
  );
}
