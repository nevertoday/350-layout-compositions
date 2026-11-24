// 外框：和小小东会员站（vip.xiaoxiaodong.ai）同一套——左边一条图标导航、顶上栏目标签、右边工具。
// 两张表，页面只说自己在哪个栏目（Site.astro 的 tab），外框按表画出来：
//   RAIL  会员站的去处，访客看到的那几个，顺序和会员站一样；这个站是开源项目，所以「开源」是当前项。
//         icon 是会员站图标条上的那一笔（24 网格、1.5 线、斜接角），label 是界面文字的键。
//   TABS  这个站自己的栏目：path 是站内地址（不带语言前缀），href 是站外地址（新标签页打开，带 ↗）。
import { REPO_URL } from "./atlas.js";

export const VIP = "https://vip.xiaoxiaodong.ai";
export const ZIP_URL = `${REPO_URL}/releases/latest/download/350-layout-compositions-images.zip`;

export const RAIL = [
  { label: "frame.rail.home", href: `${VIP}/`, icon: '<path d="m4 10 8-6.5 8 6.5"/><path d="M6 8.5V20h4v-6h4v6h4V8.5"/>' },
  { label: "frame.rail.open", href: `${VIP}/open-source`, current: true, icon: '<path d="m8 6-5 6 5 6"/><path d="m16 6 5 6-5 6"/><path d="m14 4-4 16"/>' },
  { label: "frame.rail.skills", href: `${VIP}/skills`, icon: '<rect x="4.5" y="4.5" width="6" height="6"/><rect x="13.5" y="4.5" width="6" height="6"/><rect x="4.5" y="13.5" width="6" height="6"/><path d="M16.5 13.5v6m-3-3h6"/>' },
  { label: "frame.rail.tools", href: `${VIP}/tools`, icon: '<path d="M8.5 8V4.5h7V8"/><path d="M3.5 8h17v12h-17Z"/><path d="M3.5 12.5H10V15h4v-2.5h6.5"/>' },
  { label: "frame.rail.picks", href: `${VIP}/picks`, icon: '<path d="M3.5 8.5h17v4h-17Z"/><path d="M5 12.5v8h14v-8"/><path d="M12 8.5v12"/><path d="M12 8.5 8 4.5 6.5 6 9 8.5m3 0 4-4L17.5 6 15 8.5"/>' },
];

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
