import * as ReactLynx from "@lynx-js/react";
import { useState } from "@lynx-js/react";
import "./styles.css";

const products = [
  { id: "runner", title: "Runner Jacket", price: "$128" },
  { id: "trail", title: "Trail Pack", price: "$84" }
];

interface AnalyticsModule {
  track?: (eventName: string) => void;
}

export function App() {
  const [count, setCount] = useState(1);
  const analytics = lynx.getJSModule("Analytics") as AnalyticsModule | undefined;

  ReactLynx.useLayoutEffect(() => {
    analytics?.track?.("cart_screen_measured");
  }, [analytics]);

  function handleHeroTap() {
    analytics?.track?.("hero_tap");
  }

  return (
    <scroll-view className="page" scroll-orientation="vertical">
      <view className="hero" main-thread:bindtap={handleHeroTap}>
        <text className="eyebrow">Checkout</text>
        <text className="headline">Review your Lynx order.</text>
      </view>

      <view className="cart">
        {products.map((product) => (
          <view className="cartRow" key={product.id}>
            <text className="productTitle">{product.title}</text>
            <text className="productPrice">{product.price}</text>
          </view>
        ))}
        <view className="quantity" bindtap={() => setCount(count + 1)}>
          <text>Quantity: {count}</text>
        </view>
      </view>
    </scroll-view>
  );
}
