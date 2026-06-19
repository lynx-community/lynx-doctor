import { lazy } from "@lynx-js/react";
import "./styles.css";

const AccountPanel = lazy(() =>
  import("./AccountPanel.js").then((module) => ({ default: module.AccountPanel })),
);

interface SettingsGlobalProps {
  theme?: string;
  region?: string;
}

export function App() {
  const globalProps = lynx.__globalProps as SettingsGlobalProps | undefined;
  const globalTheme = globalProps?.theme ?? "light";
  const region = globalProps?.region ?? "global";

  return (
    <scroll-view className={globalTheme === "dark" ? "page pageDark" : "page"} scroll-orientation="vertical">
      <text className="eyebrow">Settings</text>
      <text className="headline">Region: {region}</text>
      <AccountPanel />
    </scroll-view>
  );
}
