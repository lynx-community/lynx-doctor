import { useEffect, useMemo, useRef, useState } from "react";

type Locale = "en" | "zh";

interface LynxTerminalDemoProps {
  locale?: Locale;
}

interface Diagnostic {
  severity: "error" | "warning";
  rule: string;
  location: string;
  message: Record<Locale, string>;
}

interface DemoCopy {
  tagline: string;
  scoreLabel: string;
  summary: string;
  agentTitle: string;
  agentIntro: string;
  agentAction: string;
}

interface AnimationState {
  typedCommand: string;
  isTyping: boolean;
  showIntro: boolean;
  visibleDiagnosticCount: number;
  score: number | null;
  showSummary: boolean;
  showAgentPrompt: boolean;
}

const COMMAND = "npx lynx-doctor@latest --agent-prompt";
const PERFECT_SCORE = 100;
const TARGET_SCORE = 72;
const SCORE_FRAME_COUNT = 24;
const TYPING_DELAY_MS = 24;
const START_DELAY_MS = 280;
const AFTER_COMMAND_DELAY_MS = 320;
const INTRO_DELAY_MS = 300;
const DIAGNOSTIC_MIN_DELAY_MS = 140;
const DIAGNOSTIC_MAX_DELAY_MS = 280;
const SCORE_DELAY_MS = 260;
const SUMMARY_DELAY_MS = 280;

const INITIAL_STATE: AnimationState = {
  typedCommand: "",
  isTyping: true,
  showIntro: false,
  visibleDiagnosticCount: 0,
  score: null,
  showSummary: false,
  showAgentPrompt: false
};

const COMPLETED_STATE: AnimationState = {
  typedCommand: COMMAND,
  isTyping: false,
  showIntro: true,
  visibleDiagnosticCount: 2,
  score: TARGET_SCORE,
  showSummary: true,
  showAgentPrompt: true
};

const copy: Record<Locale, DemoCopy> = {
  en: {
    tagline: "Scan complete: 2 issues need attention.",
    scoreLabel: "watch",
    summary: "2 issues across 2 files",
    agentTitle: "Agent prompt",
    agentIntro: "Fix these Lynx issues with a small patch.",
    agentAction: ""
  },
  zh: {
    tagline: "扫描完成：发现 2 个需要处理的问题。",
    scoreLabel: "watch",
    summary: "2 个问题，影响 2 个文件",
    agentTitle: "Agent 提示",
    agentIntro: "用小改动修复这两个 Lynx 问题。",
    agentAction: ""
  }
};

const diagnostics: Diagnostic[] = [
  {
    severity: "error",
    rule: "reactlynx/background-only-api",
    location: "src/pages/Home.tsx:42:18",
    message: {
      en: "Background-only API is called from render code.",
      zh: "render 路径里调用了 background-only API。"
    }
  },
  {
    severity: "error",
    rule: "reactlynx/avoid-use-layout-effect",
    location: "src/components/Measure.tsx:8:3",
    message: {
      en: "useLayoutEffect is not supported in Lynx.",
      zh: "Lynx 不支持 useLayoutEffect。"
    }
  }
];

const wait = (milliseconds: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      signal.removeEventListener("abort", handleAbort);
      resolve();
    }, milliseconds);

    const handleAbort = () => {
      window.clearTimeout(timeoutId);
      reject(signal.reason);
    };

    signal.addEventListener("abort", handleAbort, { once: true });
  });

const easeOutCubic = (progress: number) => 1 - Math.pow(1 - progress, 3);

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const getScoreBar = (score: number) => {
  const width = 24;
  const filledCount = Math.round((score / PERFECT_SCORE) * width);
  return {
    filled: "█".repeat(filledCount),
    empty: "░".repeat(width - filledCount)
  };
};

export function LynxTerminalDemo({ locale = "en" }: LynxTerminalDemoProps) {
  const screenRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<AnimationState>(INITIAL_STATE);
  const text = copy[locale];

  useEffect(() => {
    const abortController = new AbortController();
    const { signal } = abortController;

    const update = (patch: Partial<AnimationState>) => {
      if (signal.aborted) return;
      setState((previous) => ({ ...previous, ...patch }));
    };

    if (prefersReducedMotion()) {
      setState(COMPLETED_STATE);
      return () => abortController.abort();
    }

    const run = async () => {
      setState(INITIAL_STATE);
      await wait(START_DELAY_MS, signal);

      for (let index = 0; index <= COMMAND.length; index += 1) {
        update({ typedCommand: COMMAND.slice(0, index) });
        await wait(TYPING_DELAY_MS, signal);
      }

      update({ isTyping: false });
      await wait(AFTER_COMMAND_DELAY_MS, signal);
      update({ showIntro: true });
      await wait(INTRO_DELAY_MS, signal);

      for (let index = 0; index < diagnostics.length; index += 1) {
        update({ visibleDiagnosticCount: index + 1 });
        const jitter =
          DIAGNOSTIC_MIN_DELAY_MS +
          Math.random() * (DIAGNOSTIC_MAX_DELAY_MS - DIAGNOSTIC_MIN_DELAY_MS);
        await wait(jitter, signal);
      }

      await wait(SCORE_DELAY_MS, signal);

      for (let frame = 0; frame <= SCORE_FRAME_COUNT; frame += 1) {
        update({ score: Math.round(easeOutCubic(frame / SCORE_FRAME_COUNT) * TARGET_SCORE) });
        await wait(28, signal);
      }

      await wait(SUMMARY_DELAY_MS, signal);
      update({ showSummary: true });
      await wait(SUMMARY_DELAY_MS, signal);
      update({ showAgentPrompt: true });
    };

    run().catch((error) => {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (!signal.aborted) throw error;
    });

    return () => abortController.abort();
  }, [locale]);

  useEffect(() => {
    const screen = screenRef.current;
    if (!screen) return;

    const frameId = window.requestAnimationFrame(() => {
      screen.scrollTop = screen.scrollHeight;
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [
    state.typedCommand,
    state.showIntro,
    state.visibleDiagnosticCount,
    state.score,
    state.showSummary,
    state.showAgentPrompt
  ]);

  const scoreBar = useMemo(
    () => (state.score === null ? null : getScoreBar(state.score)),
    [state.score]
  );

  return (
    <section className="lynx-demo-terminal" aria-label="Animated Lynx Doctor terminal">
      <div className="lynx-demo-terminal__chrome">
        <div className="lynx-demo-terminal__dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="lynx-demo-terminal__title">Terminal</div>
        <div className="lynx-demo-terminal__status-pill">agent-ready</div>
      </div>

      <div className="lynx-demo-terminal__tabs">
        <span className="lynx-demo-terminal__tab lynx-demo-terminal__tab--active">~</span>
        <span className="lynx-demo-terminal__tab">doctor</span>
      </div>

      <div ref={screenRef} className="lynx-demo-terminal__screen">
        <div className="lynx-demo-terminal__content">
          <div className="lynx-demo-terminal__line lynx-demo-terminal__command">
            <span className="lynx-demo-terminal__prompt">$</span>
            <span>{state.typedCommand}</span>
            {state.isTyping && <span className="lynx-demo-terminal__cursor" aria-hidden="true" />}
          </div>

          {state.showIntro && (
            <div className="lynx-demo-terminal__block lynx-demo-terminal__fade">
              <div className="lynx-demo-terminal__product">
                <span className="lynx-demo-terminal__mark" aria-hidden="true">
                  +
                </span>
                <span>lynx-doctor</span>
              </div>
              <div className="lynx-demo-terminal__muted">{text.tagline}</div>
            </div>
          )}

          {state.visibleDiagnosticCount > 0 && (
            <div className="lynx-demo-terminal__block">
              {diagnostics.slice(0, state.visibleDiagnosticCount).map((diagnostic) => (
                <div
                  key={diagnostic.rule}
                  className="lynx-demo-terminal__issue lynx-demo-terminal__fade"
                >
                  <div>
                    <span
                      className={`lynx-demo-terminal__severity lynx-demo-terminal__severity--${diagnostic.severity}`}
                    >
                      {diagnostic.severity.toUpperCase()}
                    </span>{" "}
                    <span>{diagnostic.rule}</span>
                  </div>
                  <div className="lynx-demo-terminal__muted">{diagnostic.location}</div>
                  <div>{diagnostic.message[locale]}</div>
                </div>
              ))}
            </div>
          )}

          {state.score !== null && scoreBar && (
            <div className="lynx-demo-terminal__block lynx-demo-terminal__score lynx-demo-terminal__fade">
              <div>
                <span className="lynx-demo-terminal__score-value">{state.score}</span>
                <span className="lynx-demo-terminal__muted"> / {PERFECT_SCORE}</span>{" "}
                <span className="lynx-demo-terminal__score-label">{text.scoreLabel}</span>
              </div>
              <div className="lynx-demo-terminal__bar">
                <span>{scoreBar.filled}</span>
                <span className="lynx-demo-terminal__bar-empty">{scoreBar.empty}</span>
              </div>
            </div>
          )}

          {state.showSummary && (
            <div className="lynx-demo-terminal__summary lynx-demo-terminal__fade">
              <span className="lynx-demo-terminal__severity lynx-demo-terminal__severity--error">
                {text.summary}
              </span>
            </div>
          )}

          {state.showAgentPrompt && (
            <div className="lynx-demo-terminal__agent lynx-demo-terminal__fade">
              <div className="lynx-demo-terminal__agent-title">---- {text.agentTitle} ----</div>
              <div>{text.agentIntro}</div>
              <div>1. {diagnostics[0]!.rule}</div>
              <div>2. {diagnostics[1]!.rule}</div>
              {text.agentAction && (
                <div className="lynx-demo-terminal__fix">{text.agentAction}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
