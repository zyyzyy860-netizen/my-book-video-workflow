import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { checkEpisode, exportSrt, initEpisode, parseCsv, srtTimestamp } from "../src/cli.mjs";

function csvRow(values) {
  return values.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",");
}

function createValidEpisode() {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "bookflow-test-"));
  const dir = path.join(parent, "episode");
  initEpisode(dir);
  fs.writeFileSync(path.join(dir, "brief.json"), JSON.stringify({
    bookTitle: "把日子过明白",
    author: "林间",
    edition: "2025 年版",
    audience: "工作疲惫的年轻人",
    platform: "Douyin",
    format: { width: 1080, height: 1920, fps: 30 },
    targetSeconds: 10,
    scriptStatus: "approved",
  }));
  fs.writeFileSync(path.join(dir, "sources.md"), "# 资料来源\n\nSRC01｜出版社官方书目｜2025-01-01\n");
  fs.writeFileSync(path.join(dir, "script.md"), "# 《把日子过明白》\n\n## S01\n忙到最后，别把生活只剩下待办。\n\n## S02\n这本书提醒我们，先留一点时间给自己。\n");
  const sceneHeader = ["scene_id", "script_ref", "narration", "visual_description", "asset_path", "asset_origin", "on_screen_text", "motion_or_transition", "duration_sec"];
  const scenes = [
    ["S01", "S01", "忙到最后，别把生活只剩下待办。", "清晨桌面与未完成的清单", "assets/S01.png", "原创生成插画，prompt 见资产备注", "慢一点", "清单从画面边缘散开，切到书页", "5"],
    ["S02", "S02", "这本书提醒我们，先留一点时间给自己。", "暖光下翻阅书页，手部近景", "assets/S02.png", "用户授权拍摄素材", "给自己留白", "书页翻动匹配切，镜头停稳", "5"],
  ];
  fs.writeFileSync(path.join(dir, "storyboard.csv"), [sceneHeader.join(","), ...scenes.map(csvRow)].join("\n") + "\n");
  fs.writeFileSync(path.join(dir, "claims.csv"), [
    "claim_id,claim_text,source_id,source_title,source_url,checked_by,status",
    csvRow(["CL01", "书籍作者与版本信息", "SRC01", "出版社书目页", "https://example.com/book", "editor", "verified"]),
  ].join("\n") + "\n");
  fs.writeFileSync(path.join(dir, "captions.csv"), [
    "scene_id,start_sec,end_sec,zh_text,en_text",
    csvRow(["S01", "0", "5", scenes[0][2], ""]),
    csvRow(["S02", "5", "10", scenes[1][2], "A reminder to save time for yourself." ]),
  ].join("\n") + "\n");
  return { parent, dir, scenes };
}

test("CSV parser handles quoted commas, escaped quotes, and CRLF", () => {
  assert.deepEqual(parseCsv('id,text\r\n1,"hello, ""reader"""\r\n'), {
    headers: ["id", "text"],
    records: [{ id: "1", text: 'hello, "reader"' }],
  });
});

test("episode initializer refuses to overwrite an existing directory", () => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), "bookflow-init-test-"));
  const dir = path.join(parent, "existing");
  fs.mkdirSync(dir);
  fs.writeFileSync(path.join(dir, "keep.txt"), "keep");
  assert.throws(() => initEpisode(dir), /目录已存在/u);
  assert.equal(fs.readFileSync(path.join(dir, "keep.txt"), "utf8"), "keep");
});

test("complete episode passes content, scene alignment, and caption checks", () => {
  const episode = createValidEpisode();
  try {
    const result = checkEpisode(episode.dir);
    assert.equal(result.ok, true, result.issues.join("\n"));
    assert.equal(result.sceneCount, 2);
    assert.equal(result.durationSeconds, 10);
  } finally {
    fs.rmSync(episode.parent, { recursive: true, force: true });
  }
});

test("episode check catches mismatched visual script and overlapping captions", () => {
  const episode = createValidEpisode();
  try {
    const scenesText = fs.readFileSync(path.join(episode.dir, "storyboard.csv"), "utf8");
    fs.writeFileSync(path.join(episode.dir, "storyboard.csv"), scenesText.replace("清晨桌面与未完成的清单", "无关的海边风景"));
    const captions = fs.readFileSync(path.join(episode.dir, "captions.csv"), "utf8").replace('"5","10"', '"4","10"');
    fs.writeFileSync(path.join(episode.dir, "captions.csv"), captions);
    const result = checkEpisode(episode.dir);
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((issue) => issue.includes("字幕重叠")));
  } finally {
    fs.rmSync(episode.parent, { recursive: true, force: true });
  }
});

test("release check requires media, voiceover, and a final render", () => {
  const episode = createValidEpisode();
  try {
    fs.mkdirSync(path.join(episode.dir, "assets"), { recursive: true });
    for (const row of episode.scenes) fs.writeFileSync(path.join(episode.dir, row[4]), "asset");
    const result = checkEpisode(episode.dir, { release: true });
    assert.equal(result.ok, false);
    assert.ok(result.issues.some((issue) => issue.includes("voiceover.mp3")));
    assert.ok(result.issues.some((issue) => issue.includes("final.mp4")));
  } finally {
    fs.rmSync(episode.parent, { recursive: true, force: true });
  }
});

test("SRT export preserves Chinese and optional English captions", () => {
  const episode = createValidEpisode();
  try {
    const result = exportSrt(episode.dir);
    assert.equal(result.ok, true, result.issues?.join("\n"));
    const srt = fs.readFileSync(path.join(episode.dir, "captions.srt"), "utf8");
    assert.match(srt, /00:00:00,000 --> 00:00:05,000/u);
    assert.match(srt, /A reminder to save time for yourself\./u);
    assert.equal(srtTimestamp(61.259), "00:01:01,259");
  } finally {
    fs.rmSync(episode.parent, { recursive: true, force: true });
  }
});
