import { defineConfig } from "@rspress/core";

const sharedSocialLinks = [
  {
    icon: "github" as const,
    mode: "link" as const,
    content: "https://github.com/lynx-community"
  }
];

const zhNav = [
  { text: "指南", link: "/zh/guide/quickstart" },
  { text: "示例", link: "/zh/examples/" },
  { text: "规则", link: "/zh/rules/" },
  { text: "参考", link: "/zh/reference/cli" }
];

const enNav = [
  { text: "Guide", link: "/guide/quickstart" },
  { text: "Examples", link: "/examples/" },
  { text: "Rules", link: "/rules/" },
  { text: "Reference", link: "/reference/cli" }
];

const zhSidebar = {
  "/zh/guide/": [
    {
      text: "指南",
      items: [
        { text: "快速开始", link: "/zh/guide/quickstart" },
        { text: "Agent 工作流", link: "/zh/guide/agent-workflow" },
        { text: "CI 设置", link: "/zh/guide/ci" },
        { text: "配置", link: "/zh/guide/configuration" }
      ]
    }
  ],
  "/zh/reference/": [
    {
      text: "参考",
      items: [
        { text: "CLI", link: "/zh/reference/cli" },
        { text: "Node API", link: "/zh/reference/api" }
      ]
    }
  ],
  "/zh/examples/": [
    {
      text: "示例",
      items: [{ text: "概览", link: "/zh/examples/" }]
    }
  ],
  "/zh/rules/": [
    {
      text: "规则",
      items: [
        { text: "概览", link: "/zh/rules/" },
        { text: "reactlynx", link: "/zh/rules/reactlynx" },
        { text: "lynx-ui", link: "/zh/rules/lynx-ui" },
        { text: "rspeedy", link: "/zh/rules/rspeedy" }
      ]
    }
  ]
};

const enSidebar = {
  "/guide/": [
    {
      text: "Guide",
      items: [
        { text: "Quickstart", link: "/guide/quickstart" },
        { text: "Agent Workflow", link: "/guide/agent-workflow" },
        { text: "CI Setup", link: "/guide/ci" },
        { text: "Configuration", link: "/guide/configuration" }
      ]
    }
  ],
  "/reference/": [
    {
      text: "Reference",
      items: [
        { text: "CLI", link: "/reference/cli" },
        { text: "Node API", link: "/reference/api" }
      ]
    }
  ],
  "/examples/": [
    {
      text: "Examples",
      items: [{ text: "Overview", link: "/examples/" }]
    }
  ],
  "/rules/": [
    {
      text: "Rules",
      items: [
        { text: "Overview", link: "/rules/" },
        { text: "reactlynx", link: "/rules/reactlynx" },
        { text: "lynx-ui", link: "/rules/lynx-ui" },
        { text: "rspeedy", link: "/rules/rspeedy" }
      ]
    }
  ]
};

const siteBase = process.env.RSPRESS_SITE_BASE ?? "/";

export default defineConfig({
  root: "docs",
  base: siteBase,
  title: "Lynx Doctor",
  logoText: "Lynx Doctor",
  description: "Scan Lynx projects, find Lynx-specific issues, and hand focused fixes to coding agents.",
  icon: "/lynx-mascot-simple.png",
  logo: {
    light: "/lynx-mascot-simple.png",
    dark: "/lynx-mascot-simple.png"
  },
  lang: "en",
  locales: [
    {
      lang: "en",
      label: "English",
      title: "Lynx Doctor",
      description: "Scan Lynx projects, find Lynx-specific issues, and hand focused fixes to coding agents."
    },
    {
      lang: "zh",
      label: "简体中文",
      title: "Lynx Doctor",
      description: "Lynx 项目的代码检查工具。定位代码问题，提供修改建议，也支持用编程 Agent 辅助修复。"
    }
  ],
  themeConfig: {
    enableContentAnimation: true,
    localeRedirect: "never",
    socialLinks: sharedSocialLinks,
    locales: [
      {
        lang: "en",
        label: "English",
        nav: enNav,
        sidebar: enSidebar
      },
      {
        lang: "zh",
        label: "简体中文",
        nav: zhNav,
        sidebar: zhSidebar
      }
    ]
  }
});
