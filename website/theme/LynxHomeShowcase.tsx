import { withBase } from "@rspress/core/runtime";
import { IconArrowRight, IconCopy, IconGithub, IconSuccess, SvgWrapper } from "@rspress/core/theme-original";
import { useEffect, useState } from "react";
import { homePages, useHomePages } from "./useHomePages.js";

type Locale = "en" | "zh";
type Example = "threading-regressions" | "healthy-shop";
const repository = "https://github.com/lynx-community/lynx-doctor";
const mascot = "/lynx-mascot-simple.png";
const commands = [
  "npx lynx-doctor@latest",
  "npx lynx-doctor@latest --diff --agent-prompt",
  "npx lynx-doctor@latest install"
];

const copy = {
  en: {
    home: "Lynx Doctor overview",
    pages: ["Overview", "Find issues", "Work with an agent", "Get started"],
    pageNavigation: "Homepage sections",
    next: "Next",
    back: "Back to the top",
    title: ["A health check for", "your Lynx project."],
    intro: "Find threading, API, and build issues. Know what to fix next.",
    start: "Get started",
    docs: "Read the docs",
    reportTitle: ["Find the issue.", "See the exact line."],
    reportIntro: "A health score, the affected files, and a clear place to start.",
    rules: "Explore the rules",
    demo: "Example scan results",
    examples: ["Issues found", "All clear"],
    score: "Project health",
    issues: "3 errors found",
    passing: "All checks passed",
    findings: "Issues in this example",
    findingTitles: ["Background API in render code", "Unsupported useLayoutEffect", "Missing main-thread directive"],
    healthyTitle: "Looking good.",
    healthyText: "No issues found in this example.",
    sample: "Bundled example",
    agentTitle: ["Give your agent", "a clear starting point."],
    agentIntro: "Turn findings into a repair prompt, or call a local coding agent directly.",
    agentLink: "Set up your agent",
    prompt: "Repair prompt",
    promptSample: "Illustrative excerpt",
    file: "Where",
    fix: "What to change",
    fixText: "Move the background-only call into useEffect or an event handler.",
    verify: "How to check",
    quickTitle: ["One command.", "Start with your project."],
    quickIntro: "Run it from your project root.",
    commandLabel: "Choose a command",
    commandTabs: ["Scan", "Agent prompt", "Set up CI"],
    commandHints: [
      "Check source files and project configuration.",
      "Prepare a repair prompt for your changed files.",
      "Add a GitHub Actions workflow and a doctor script."
    ],
    prerequisite: "Node.js 22.12+",
    cli: "CLI reference",
    copy: "Copy command",
    copied: "Copied",
    copyFailed: "Copy manually",
    allExamples: "Examples",
    license: "Apache-2.0"
  },
  zh: {
    home: "Lynx Doctor 首页",
    pages: ["概览", "检查结果", "Agent 修复", "开始使用"],
    pageNavigation: "首页导航",
    next: "下一屏",
    back: "回到顶部",
    title: ["Lynx 项目的", "代码检查工具"],
    intro: "检查线程用法、API 调用和构建配置，并给出修改建议。",
    start: "开始使用",
    docs: "查看文档",
    reportTitle: ["快速定位", "代码问题"],
    reportIntro: "报告会标出有问题的文件和行号，并附上修改建议。",
    rules: "查看规则",
    demo: "示例检查报告",
    examples: ["发现问题", "检查通过"],
    score: "项目评分",
    issues: "发现 3 个错误",
    passing: "检查通过",
    findings: "发现的问题",
    findingTitles: ["渲染时调用了后台线程 API", "不支持 useLayoutEffect", "主线程回调缺少指令"],
    healthyTitle: "未发现问题",
    healthyText: "没有错误或警告。",
    sample: "示例项目",
    agentTitle: ["让 Agent", "帮你修复"],
    agentIntro: "把问题位置和修改建议整理成提示词，交给你常用的编程 Agent。",
    agentLink: "了解如何使用",
    prompt: "修复提示词",
    promptSample: "示例片段",
    file: "代码位置",
    fix: "修改建议",
    fixText: "把这处 API 调用移到 useEffect 或事件回调中。",
    verify: "修改后重新检查",
    quickTitle: ["在你的项目里", "跑一次检查"],
    quickIntro: "打开终端，在项目根目录运行：",
    commandLabel: "选择命令",
    commandTabs: ["检查项目", "生成提示词", "接入 CI"],
    commandHints: [
      "检查源代码和配置，查看问题位置与修改建议。",
      "只检查有改动的文件，并生成修复提示词。",
      "为项目添加 GitHub Actions 工作流和 doctor 脚本。"
    ],
    prerequisite: "需要 Node.js 22.12+",
    cli: "命令说明",
    copy: "复制命令",
    copied: "已复制",
    copyFailed: "请手动复制",
    allExamples: "示例项目",
    license: "Apache-2.0 许可证"
  }
} as const;

// These are snapshots of the bundled examples, not a scan of the visitor's code.
const diagnostics = [
  { rule: "background-only-api", location: "src/App.tsx:16:21" },
  { rule: "avoid-use-layout-effect", location: "src/App.tsx:18:13" },
  { rule: "main-thread-handler-directive", location: "src/App.tsx:28:30" }
];

function Arrow() {
  return <SvgWrapper icon={IconArrowRight} width={18} height={18} />;
}

function CopyCommand({ command, locale }: { command: string; locale: Locale }) {
  const text = copy[locale];
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");
  useEffect(() => {
    if (status === "idle") return;
    const timer = window.setTimeout(() => setStatus("idle"), 3000);
    return () => window.clearTimeout(timer);
  }, [status]);

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(command);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  return (
    <button className="doctor-copy" type="button" aria-label={text.copy} onClick={copyCommand}>
      <SvgWrapper icon={status === "copied" ? IconSuccess : IconCopy} width={18} height={18} />
      <span role="status">{status === "copied" ? text.copied : status === "error" ? text.copyFailed : text.copy}</span>
    </button>
  );
}

export function LynxHomeShowcase({ locale = "en" }: { locale?: Locale }) {
  const text = copy[locale];
  const { containerRef, activePage, navigate } = useHomePages();
  const [example, setExample] = useState<Example>("threading-regressions");
  const [commandIndex, setCommandIndex] = useState(0);
  const healthy = example === "healthy-shop";
  const command = commands[commandIndex]!;
  const localLink = (path: string) => withBase(`${locale === "zh" ? "/zh" : ""}${path}`);
  const nextPage = (activePage + 1) % homePages.length;

  return (
    <main className="doctor-home" ref={containerRef} tabIndex={0} aria-label={text.home}>
      <section className="doctor-page doctor-hero" id="overview" data-home-page data-active={activePage === 0} aria-labelledby="doctor-title">
        <div className="doctor-hero__wash" aria-hidden="true" />
        <div className="doctor-page__content doctor-hero__content">
          <img className="doctor-hero__mascot" src={withBase(mascot)} alt="" width={128} height={128} fetchPriority="high" />
          <h1 id="doctor-title" tabIndex={-1}>{text.title[0]}<br />{text.title[1]}</h1>
          <p className="doctor-hero__description">{text.intro}</p>
          <div className="doctor-actions">
            <a className="doctor-button doctor-button--primary" href="#get-started" onClick={event => navigate(event, 3)}>{text.start}<Arrow /></a>
            <a className="doctor-button doctor-button--secondary" href={localLink("/guide/quickstart.html")}>{text.docs}</a>
          </div>
          <p className="doctor-hero__stack">ReactLynx <span>·</span> Lynx UI <span>·</span> Rspeedy</p>
        </div>
      </section>

      <section className="doctor-page doctor-diagnostics" id="diagnostics" data-home-page data-active={activePage === 1} aria-labelledby="doctor-report-title">
        <div className="doctor-page__content doctor-split">
          <div className="doctor-page__copy">
            <h2 id="doctor-report-title" tabIndex={-1}>{text.reportTitle[0]}<br />{text.reportTitle[1]}</h2>
            <p>{text.reportIntro}</p>
            <a className="doctor-text-link" href={localLink("/rules/")}>{text.rules}<Arrow /></a>
          </div>
          <figure className="doctor-report" aria-label={text.demo}>
            <div className="doctor-report__toolbar">
              <div className="doctor-window-dots" aria-hidden="true"><i /><i /><i /></div>
              <div className="doctor-report__switch" role="group" aria-label={text.demo}>
                {(["threading-regressions", "healthy-shop"] as const).map((item, index) => (
                  <button key={item} type="button" aria-pressed={example === item} aria-controls="doctor-results" onClick={() => setExample(item)}>{text.examples[index]}</button>
                ))}
              </div>
            </div>
            <div id="doctor-results" className={`doctor-report__body${healthy ? " doctor-report__body--healthy" : ""}`}>
              <div className="doctor-report__summary">
                <div className="doctor-score"><strong>{healthy ? "100" : "64"}</strong><span>/ 100</span></div>
                <div className="doctor-report__status"><span>{text.score}</span><strong role="status">{healthy ? text.passing : text.issues}</strong></div>
              </div>
              <div className="doctor-score__meter" aria-hidden="true"><span /></div>
              {healthy ? (
                <div className="doctor-healthy"><SvgWrapper icon={IconSuccess} width={40} height={40} /><strong>{text.healthyTitle}</strong><p>{text.healthyText}</p></div>
              ) : (
                <ul className="doctor-findings" aria-label={text.findings}>
                  {diagnostics.map((diagnostic, index) => (
                    <li key={diagnostic.rule} title={`reactlynx/${diagnostic.rule}`}>
                      <span className="doctor-findings__mark" aria-hidden="true">!</span>
                      <div><strong>{text.findingTitles[index]}</strong><code>{diagnostic.location}</code></div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <figcaption>{text.sample}<span aria-hidden="true">·</span><code>{example}</code></figcaption>
          </figure>
        </div>
      </section>

      <section className="doctor-page doctor-agent" id="agent-workflow" data-home-page data-active={activePage === 2} aria-labelledby="doctor-features-title">
        <div className="doctor-page__content doctor-split doctor-split--agent">
          <div className="doctor-page__copy">
            <h2 id="doctor-features-title" tabIndex={-1}>{text.agentTitle[0]}<br />{text.agentTitle[1]}</h2>
            <p>{text.agentIntro}</p>
            <a className="doctor-text-link" href={localLink("/guide/agent-workflow.html")}>{text.agentLink}<Arrow /></a>
          </div>
          <div className="doctor-prompt-wrap"><figure className="doctor-prompt">
            <div className="doctor-prompt__header"><img src={withBase(mascot)} alt="" width={44} height={44} /><strong>{text.prompt}</strong><span>{text.promptSample}</span></div>
            <dl>
              <div><dt>{text.file}</dt><dd><code>src/App.tsx:16:21</code></dd></div>
              <div><dt>{text.fix}</dt><dd>{text.fixText}</dd></div>
              <div><dt>{text.verify}</dt><dd><code>npx lynx-doctor@latest</code></dd></div>
            </dl>
            <figcaption><span aria-hidden="true">↗</span><code>--agent-prompt</code></figcaption>
          </figure></div>
        </div>
      </section>

      <section className="doctor-page doctor-quickstart" id="get-started" data-home-page data-active={activePage === 3} aria-labelledby="doctor-quickstart-title">
        <div className="doctor-page__content doctor-quickstart__content">
          <h2 id="doctor-quickstart-title" tabIndex={-1}><span id="doctor-closing-title" />{text.quickTitle[0]}<br />{text.quickTitle[1]}</h2>
          <p className="doctor-quickstart__intro">{text.quickIntro}</p>
          <div className="doctor-install">
            <div className="doctor-install__tabs" role="group" aria-label={text.commandLabel}>
              {text.commandTabs.map((label, index) => (
                <button key={label} type="button" aria-pressed={commandIndex === index} aria-controls="doctor-install-command" onClick={() => setCommandIndex(index)}>{label}</button>
              ))}
            </div>
            <div className="doctor-install__body" id="doctor-install-command">
              <p>{text.commandHints[commandIndex]}</p>
              <div className="doctor-install__command"><span aria-hidden="true">$</span><code>{command}</code><CopyCommand key={command} command={command} locale={locale} /></div>
              <div className="doctor-install__meta"><span>{text.prerequisite}</span><a href={localLink("/reference/cli.html")}>{text.cli}<Arrow /></a></div>
            </div>
          </div>
          <footer className="doctor-footer">
            <a href={repository} target="_blank" rel="noreferrer"><SvgWrapper icon={IconGithub} width={17} height={17} />GitHub</a>
            <a href={localLink("/examples/")}>{text.allExamples}</a>
            <a href={`${repository}/blob/main/LICENSE`} target="_blank" rel="noreferrer">{text.license}</a>
          </footer>
        </div>
      </section>

      <nav className="doctor-page-nav" aria-label={text.pageNavigation}>
        {homePages.map((id, index) => (
          <a key={id} href={`#${id}`} aria-label={`${index + 1}. ${text.pages[index]}`} aria-current={activePage === index ? "step" : undefined} onClick={event => navigate(event, index)}><span>{text.pages[index]}</span><i aria-hidden="true" /></a>
        ))}
      </nav>
      <div className="doctor-page-position" aria-hidden="true"><strong>0{activePage + 1}</strong><span>/ 04</span></div>
      <a className={`doctor-next-page${nextPage === 0 ? " doctor-next-page--top" : ""}`} href={`#${homePages[nextPage]}`} aria-label={nextPage === 0 ? text.back : `${text.next}: ${text.pages[nextPage]}`} onClick={event => navigate(event, nextPage)}>
        <span>{nextPage === 0 ? text.back : text.next}</span><Arrow />
      </a>
    </main>
  );
}
