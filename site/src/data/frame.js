// 外框：顶上栏目标签、右边工具。页面只说自己在哪个栏目（Site.astro 的 tab），外框按表画出来：
//   TABS  这个站自己的栏目：path 是站内地址（不带语言前缀），href 是站外地址（新标签页打开，带 ↗）。
import { REPO_URL } from "./atlas.js";

export const VIP = "https://vip.xiaoxiaodong.ai";
export const ZIP_URL = `${REPO_URL}/releases/latest/download/350-layout-compositions-images.zip`;

export const TABS = [
  { key: "atlas", label: "frame.tab.atlas", path: "" },
  { key: "about", label: "frame.tab.about", path: "about/" },
  { key: "repo", label: "frame.tab.repo", href: REPO_URL },
];

// 外观的三档，和 xxd 的 XxdTheme.set({ theme }) 一一对应
export const THEMES = [
  { value: "light", label: "frame.theme.light" },
  { value: "dark", label: "frame.theme.dark" },
  { value: "system", label: "frame.theme.system" },
];
