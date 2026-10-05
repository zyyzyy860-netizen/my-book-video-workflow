#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const FILES = {
  "brief.json": JSON.stringify({
    bookTitle: "",
    author: "",
    edition: "",
    audience: "",
    platform: "Douyin",
    format: { width: 1080, height: 1920, fps: 30 },
    targetSeconds: 60,
    scriptStatus: "draft",
  }, null, 2) + "\n",
  "sources.md": "# 资料与事实依据\n\n| ID | 来源标题 | URL / 文件 | 日期 | 支持的事实或稿件段 | 状态 |\n| --- | --- | --- | --- | --- | --- |\n| SRC01 | 待填写 | 待填写 | YYYY-MM-DD | 待填写 | 待核验 |\n",
  "script.md": "# 《书名》\n\n先完成书目信息核验，再写原创口播。每个 S 段对应一个镜头，审核通过后把 brief.json 的 scriptStatus 改成 approved。\n\n## S01\n待写口播\n",
  "storyboard.csv": "scene_id,script_ref,narration,visual_description,asset_path,asset_origin,on_screen_text,motion_or_transition,duration_sec\nS01,S01,待写口播,待填写,assets/S01.png,待填写,无,待填写,5\n",
  "claims.csv": "claim_id,claim_text,source_id,source_title,source_url,checked_by,status\nCL01,待填写,SRC01,待填写,待填写,待填写,待核验\n",
  "captions.csv": "scene_id,start_sec,end_sec,zh_text,en_text\nS01,0,5,待写口播,\n",
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  const source = text.replace(/^\uFEFF/u, "");

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (char === '"') {
      if (inQuotes && source[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && source[i + 1] === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (inQuotes) throw new Error("CSV has an unclosed quoted field");
  row.push(cell);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  if (!rows.length) return { headers: [], records: [] };

  const headers = rows[0].map((value) => value.trim());
  const records = rows.slice(1).map((values, index) => {
    if (values.length !== headers.length) {
      throw new Error(`CSV row ${index + 2} has ${values.length} cells; expected ${headers.length}`);
    }
    return Object.fromEntries(headers.map((header, column) => [header, values[column].trim()]));
  });
  return { headers, records };
}

function readCsv(filePath, expectedHeaders, issues) {
  if (!fs.existsSync(filePath)) {
    issues.push(`缺少 ${path.basename(filePath)}`);
    return [];
  }
  try {
    const parsed = parseCsv(fs.readFileSync(filePath, "utf8"));
    const missing = expectedHeaders.filter((header) => !parsed.headers.includes(header));
    if (missing.length) issues.push(`${path.basename(filePath)} 缺少列：${missing.join("、")}`);
    return parsed.records;
  } catch (error) {
    issues.push(`${path.basename(filePath)} 无法读取：${error.message}`);
    return [];
  }
}

function readScript(filePath, issues) {
  if (!fs.existsSync(filePath)) {
    issues.push("缺少 script.md");
    return new Map();
  }
  const content = fs.readFileSync(filePath, "utf8");
  const matches = [...content.matchAll(/^##\s+(S\d{2})\s*\r?\n([\s\S]*?)(?=^##\s+S\d{2}\s*$|\s*$)/gmu)];
  const segments = new Map();
  for (const match of matches) {
    const narration = match[2].split("\n").map((line) => line.trim()).filter((line) => line && !line.startsWith("<!--")).join("");
    if (!narration || /待写|待填写|TODO/iu.test(narration)) {
      issues.push(`${match[1]} 口播还是占位内容`);
    } else if (segments.has(match[1])) {
      issues.push(`${match[1]} 在 script.md 中重复`);
    } else {
      segments.set(match[1], narration);
    }
  }
  if (!segments.size) issues.push("script.md 尚无 S01、S02…口播段");
  return segments;
}

function isInside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== "" && !relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative);
}

function checkEpisode(episodeDir, { release = false } = {}) {
  const dir = path.resolve(episodeDir);
  const issues = [];
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    return { ok: false, issues: [`找不到项目目录：${dir}`] };
  }

  let brief;
  try {
    brief = JSON.parse(fs.readFileSync(path.join(dir, "brief.json"), "utf8"));
  } catch {
    issues.push("brief.json 缺失或不是有效 JSON");
    brief = {};
  }
  for (const field of ["bookTitle", "author", "edition", "audience", "platform"]) {
    if (!String(brief[field] ?? "").trim()) issues.push(`brief.json 缺少 ${field}`);
  }
  const width = Number(brief.format?.width);
  const height = Number(brief.format?.height);
  if (!width || !height || Math.abs(width / height - 9 / 16) > 0.002) {
    issues.push("目标画幅应为 9:16；请填写 format.width 与 format.height");
  }
  const targetSeconds = Number(brief.targetSeconds);
  if (!Number.isFinite(targetSeconds) || targetSeconds < 10 || targetSeconds > 180) {
    issues.push("targetSeconds 应在 10–180 秒之间");
  }

  const segments = readScript(path.join(dir, "script.md"), issues);
  const scriptPath = path.join(dir, "script.md");
  if (brief.bookTitle && fs.existsSync(scriptPath)) {
    const script = fs.readFileSync(scriptPath, "utf8");
    const titleLine = script.split(/\r?\n/u).find((line) => line.startsWith("# "))?.slice(2).trim();
    if (titleLine !== `《${brief.bookTitle}》` && titleLine !== brief.bookTitle) {
      issues.push("script.md 首行书名必须与 brief.json 的 bookTitle 一致");
    }
  }
  const storyboard = readCsv(path.join(dir, "storyboard.csv"), [
    "scene_id", "script_ref", "narration", "visual_description", "asset_path", "asset_origin", "on_screen_text", "motion_or_transition", "duration_sec",
  ], issues);
  const sceneIds = new Set();
  const references = new Set();
  let durationTotal = 0;
  for (const [index, scene] of storyboard.entries()) {
    const rowLabel = `storyboard.csv 第 ${index + 2} 行`;
    if (!/^S\d{2}$/u.test(scene.scene_id)) issues.push(`${rowLabel} scene_id 格式应为 S01、S02…`);
    if (sceneIds.has(scene.scene_id)) issues.push(`${rowLabel} scene_id 重复：${scene.scene_id}`);
    sceneIds.add(scene.scene_id);
    if (!segments.has(scene.script_ref)) issues.push(`${rowLabel} 找不到 script_ref ${scene.script_ref}`);
    else if (scene.narration !== segments.get(scene.script_ref)) issues.push(`${rowLabel} narration 与 ${scene.script_ref} 口播不完全一致`);
    for (const field of ["visual_description", "asset_path", "asset_origin", "on_screen_text", "motion_or_transition"]) {
      if (!scene[field] || /待填|TODO/iu.test(scene[field])) issues.push(`${rowLabel} 缺少 ${field}`);
    }
    const seconds = Number(scene.duration_sec);
    if (!Number.isFinite(seconds) || seconds <= 0) issues.push(`${rowLabel} duration_sec 必须是正数`);
    else durationTotal += seconds;
    if (scene.asset_path) {
      const assetPath = path.resolve(dir, scene.asset_path);
      if (!isInside(dir, assetPath)) issues.push(`${rowLabel} asset_path 必须保持在项目目录内`);
      else if (release && !fs.existsSync(assetPath)) issues.push(`${rowLabel} 素材不存在：${scene.asset_path}`);
      else if (release && fs.statSync(assetPath).size === 0) issues.push(`${rowLabel} 素材文件为空：${scene.asset_path}`);
    }
    if (scene.script_ref) references.add(scene.script_ref);
  }
  if (!storyboard.length) issues.push("storyboard.csv 尚无镜头行");
  for (const id of segments.keys()) if (!references.has(id)) issues.push(`${id} 尚未映射到 storyboard 镜头`);
  if (targetSeconds && durationTotal && Math.abs(durationTotal - targetSeconds) > Math.max(5, targetSeconds * 0.2)) {
    issues.push(`镜头时长合计 ${durationTotal}s，与目标 ${targetSeconds}s 相差过大`);
  }

  const claims = readCsv(path.join(dir, "claims.csv"), ["claim_id", "claim_text", "source_id", "source_title", "source_url", "checked_by", "status"], issues);
  if (!claims.length) issues.push("claims.csv 至少需要一条经核验的事实记录");
  for (const [index, claim] of claims.entries()) {
    const rowLabel = `claims.csv 第 ${index + 2} 行`;
    for (const field of ["claim_text", "source_id", "source_title", "source_url", "checked_by", "status"]) {
      if (!claim[field] || /待填|TODO/iu.test(claim[field])) issues.push(`${rowLabel} 缺少 ${field}`);
    }
    if (claim.status && claim.status !== "verified") issues.push(`${rowLabel} 状态须为 verified 才能进入发布检查`);
  }

  const captions = readCsv(path.join(dir, "captions.csv"), ["scene_id", "start_sec", "end_sec", "zh_text", "en_text"], issues);
  const captionIds = new Set();
  let lastCaptionEnd = -1;
  for (const [index, caption] of captions.entries()) {
    const rowLabel = `captions.csv 第 ${index + 2} 行`;
    const scene = storyboard.find((item) => item.scene_id === caption.scene_id);
    if (!scene) issues.push(`${rowLabel} 找不到镜头 ${caption.scene_id}`);
    else if (caption.zh_text !== scene.narration) issues.push(`${rowLabel} 中文字幕必须与对应口播逐字一致`);
    const start = Number(caption.start_sec);
    const end = Number(caption.end_sec);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) {
      issues.push(`${rowLabel} 时间码无效`);
    } else {
      if (start < lastCaptionEnd - 0.001) issues.push(`${rowLabel} 与上一条字幕重叠`);
      lastCaptionEnd = end;
    }
    if (captionIds.has(caption.scene_id)) issues.push(`${rowLabel} 镜头字幕重复`);
    captionIds.add(caption.scene_id);
  }
  for (const scene of storyboard) if (!captionIds.has(scene.scene_id)) issues.push(`${scene.scene_id} 缺少字幕时间码`);

  const sourcesPath = path.join(dir, "sources.md");
  if (!fs.existsSync(sourcesPath)) issues.push("缺少 sources.md");
  else if (/待填写|TODO/iu.test(fs.readFileSync(sourcesPath, "utf8"))) issues.push("sources.md 仍有未填写的来源占位内容");
  if (release && brief.scriptStatus !== "approved") issues.push("发布检查要求 brief.json 的 scriptStatus 为 approved");
  if (release && !fs.existsSync(path.join(dir, "captions.srt"))) issues.push("发布检查缺少 captions.srt；先运行 bookflow export-srt");
  if (release && !fs.existsSync(path.join(dir, "audio", "voiceover.mp3"))) issues.push("发布检查缺少 audio/voiceover.mp3");
  if (release && !fs.existsSync(path.join(dir, "renders", "final.mp4"))) issues.push("发布检查缺少 renders/final.mp4");

  return { ok: issues.length === 0, issues, sceneCount: storyboard.length, durationSeconds: durationTotal };
}

function srtTimestamp(seconds) {
  const milliseconds = Math.round(Number(seconds) * 1000);
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  const wholeSeconds = Math.floor((milliseconds % 60_000) / 1000);
  const remainder = milliseconds % 1000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(wholeSeconds).padStart(2, "0")},${String(remainder).padStart(3, "0")}`;
}

function exportSrt(episodeDir) {
  const dir = path.resolve(episodeDir);
  const issues = [];
  const captions = readCsv(path.join(dir, "captions.csv"), ["scene_id", "start_sec", "end_sec", "zh_text", "en_text"], issues);
  if (!captions.length) issues.push("没有可导出的字幕");
  let previousEnd = -1;
  for (const [index, cue] of captions.entries()) {
    const start = Number(cue.start_sec);
    const end = Number(cue.end_sec);
    if (!cue.zh_text || !Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) {
      issues.push(`字幕第 ${index + 2} 行的文本或时间码无效`);
    }
    if (start < previousEnd - 0.001) issues.push(`字幕第 ${index + 2} 行与上一条重叠`);
    previousEnd = end;
  }
  if (issues.length) return { ok: false, issues };
  const content = captions.map((cue, index) => {
    const text = cue.en_text ? `${cue.zh_text}\n${cue.en_text}` : cue.zh_text;
    return `${index + 1}\n${srtTimestamp(cue.start_sec)} --> ${srtTimestamp(cue.end_sec)}\n${text}`;
  }).join("\n\n") + "\n";
  const output = path.join(dir, "captions.srt");
  fs.writeFileSync(output, content, "utf8");
  return { ok: true, output, cueCount: captions.length };
}

function initEpisode(episodeDir) {
  const dir = path.resolve(episodeDir);
  if (fs.existsSync(dir)) throw new Error(`目录已存在，为避免覆盖内容而停止：${dir}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(path.join(dir, "assets"), { recursive: true });
  fs.mkdirSync(path.join(dir, "audio"), { recursive: true });
  fs.mkdirSync(path.join(dir, "renders"), { recursive: true });
  for (const [name, content] of Object.entries(FILES)) fs.writeFileSync(path.join(dir, name), content, "utf8");
  return dir;
}

function usage() {
  return [
    "Bookflow Studio — 图书短视频工作流",
    "",
    "用法:",
    "  bookflow init <episode-folder>",
    "  bookflow check <episode-folder> [--release]",
    "  bookflow status <episode-folder>",
    "  bookflow export-srt <episode-folder>",
  ].join("\n");
}

function main(argv) {
  const [command, episodeArg, ...flags] = argv;
  if (!command || command === "--help" || command === "-h") {
    console.log(usage());
    return 0;
  }
  if (!episodeArg) {
    console.error(usage());
    return 2;
  }
  try {
    if (command === "init") {
      console.log(`已创建：${initEpisode(episodeArg)}`);
      console.log("下一步：填写 brief.json、sources.md、script.md、storyboard.csv 和 captions.csv，再运行 bookflow check。");
      return 0;
    }
    if (command === "check" || command === "status") {
      const result = checkEpisode(episodeArg, { release: flags.includes("--release") });
      if (command === "status") {
        console.log(`场景：${result.sceneCount ?? 0}；计划时长：${result.durationSeconds ?? 0}s；校验：${result.ok ? "通过" : "待处理"}`);
      }
      if (result.ok) console.log(`通过：${result.sceneCount} 个镜头，${result.durationSeconds}s`);
      else {
        console.error(`发现 ${result.issues.length} 项待处理：`);
        for (const issue of result.issues) console.error(`- ${issue}`);
      }
      return result.ok ? 0 : 1;
    }
    if (command === "export-srt") {
      const result = exportSrt(episodeArg);
      if (!result.ok) {
        console.error(result.issues.join("\n"));
        return 1;
      }
      console.log(`已导出 ${result.cueCount} 条字幕：${result.output}`);
      return 0;
    }
    console.error(`未知命令：${command}\n\n${usage()}`);
    return 2;
  } catch (error) {
    console.error(error.message);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.exitCode = main(process.argv.slice(2));
}

export { checkEpisode, exportSrt, initEpisode, parseCsv, srtTimestamp };
