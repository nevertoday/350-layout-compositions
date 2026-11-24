// 互动版：把 interactive/dist 里打好的单文件网页原样输出成 /<id>/play/index.html（只有中文，不套外框）。哪几种有，见 atlas.js 的 playPages。
import { readFileSync } from "node:fs";
import { playPages } from "../../../data/atlas.js";

export const getStaticPaths = () => playPages.map((p) => ({ params: { id: p.id }, props: { file: p.file } }));
export const GET = ({ props }) => new Response(readFileSync(props.file), { headers: { "Content-Type": "text/html; charset=utf-8" } });
