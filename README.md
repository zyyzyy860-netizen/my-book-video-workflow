# Bookflow Studio

[![Quality checks](https://github.com/zyyzyy860-netizen/my-book-video-workflow/actions/workflows/quality.yml/badge.svg?branch=main)](https://github.com/zyyzyy860-netizen/my-book-video-workflow/actions/workflows/quality.yml)

一个面向创作者的开源图书短视频工作流：仓库提供 Codex 工作流 Skill、每期文件模板和本地校验 CLI。Codex 可按阶段协助选书调研、原创口播、分镜和制作；CLI 负责结构/对应关系校验与 SRT 导出。它本身不生成图片、配音或视频，关键内容由创作者确认，过程可复查。

## 5 分钟跑起来

需要 Git 和 Node.js 20+。当前 CLI 使用 Node 内置模块，无需安装 npm 依赖。

```powershell
git clone https://github.com/zyyzyy860-netizen/my-book-video-workflow.git
cd my-book-video-workflow
npm test
npm run bookflow -- init episodes/my-first-book
```

在 `episodes/my-first-book/` 里填写 `brief.json`、`sources.md`、`script.md`、`claims.csv`、`storyboard.csv` 和 `captions.csv`。可以先用仓库生成的占位模板，照着下面的顺序替换内容。

```powershell
npm run bookflow -- check episodes/my-first-book
npm run bookflow -- status episodes/my-first-book
npm run bookflow -- export-srt episodes/my-first-book
```

### 先跑一遍公开示例

仓库附带了一个不含书封、音频或第三方视频素材的示例项目。它用《Atomic Habits》演示书目信息、来源、口播、分镜和中英字幕怎样对应；示例脚本仍标记为 `draft`，不代表作者本人读过，也不能直接当成商品广告发布。

```powershell
npm run bookflow -- check examples/atomic-habits
npm run bookflow -- export-srt examples/atomic-habits
```

第二条命令会在示例目录生成 `captions.srt`。你可以打开 CSV 和 SRT 看字段如何配合，再运行 `init` 创建自己的项目。这个示例只覆盖到内容规划和字幕导出；录音、素材、剪辑和成片仍须自己完成并审核。

### 在 Codex 里用自然语言跑完整流程

将仓库中的 `skills/bookflow/` 文件夹复制到 Codex 的技能目录：Windows 通常是 `%USERPROFILE%\.codex\skills\bookflow`，macOS/Linux 通常是 `~/.codex/skills/bookflow`。若同名目录已存在，先检查并手动合并，不要直接覆盖。重启 Codex 后可以这样开始：

```text
$bookflow 帮我做一期《书名》的抖音图书视频。先核对版本和来源，逐阶段带我做；口播和分镜分别等我确认后再继续。
```

Skill 会按仓库约定引导阶段并生成/检查 episode 文件。图像、配音和视频合成要使用当前环境实际可用的工具；缺少工具或授权时会停在相应步骤，不会假称已经自动完成。

### 从书到成片

1. **选书与版本**：记下准确书名、作者、译者、出版社、版次/ISBN；封面和版本不确定就先不做商品镜头。
2. **建来源账本**：把出版社/作者/图书馆等来源放进 `sources.md`，在 `claims.csv` 里逐条记录每句事实由什么来源支持。读者评价只能作为兴趣线索，不直接复制成卖点。
3. **写原创口播**：先定一条观众能共鸣的问题，按短视频节奏写钩子、书中可核验的框架、自己的解释和诚实推荐。完成后让创作者审阅；通过后把 `scriptStatus` 改为 `approved`。
4. **逐句配镜头**：`storyboard.csv` 每个口播段对应一个镜头，口播文字必须逐字一致，并记录画面、素材来源/授权、屏幕文字和动效意图。
5. **录音、做字幕和素材**：按获批稿录制 `audio/voiceover.mp3`，把素材放在本地 `assets/`，为字幕填精确时间码。中文必须和口播一致；可选英文放第二行，但手机预览若拥挤就不启用。
6. **剪辑与质检**：可用 HyperFrames、CapCut 或其他剪辑器按分镜制作；预览手机画幅，逐镜检查相关性、裁切、字号、字幕时机、声音连续性和素材权利。
7. **发布前检查**：生成 SRT 并运行发布校验；最后亲自播放 `renders/final.mp4`，确认画面和口播没有错位后再发布。

```powershell
npm run bookflow -- export-srt episodes/my-first-book
npm run bookflow -- check episodes/my-first-book --release
```

`--release` 会要求脚本已获批、字幕 SRT、音频、镜头素材和 `renders/final.mp4` 都存在。CLI 负责可重复的结构与一致性检查；它不会代替事实核验、创作者审稿或剪辑器本身。

## 工作流细节

- [Codex Skill 入口](skills/bookflow/SKILL.md)
- [完整制作与审稿流程](docs/workflow.md)
- [项目文件和字段格式](docs/project-format.md)
- [协作者/AI 工作约定](AGENTS.md)

## 设计与编辑原则

- 事实、解读、个人体验分开；不编销量、奖项、读者反馈或亲身经历。
- 口播稿先审核，再开始做正式素材；每个画面要对应它正在讲的那句话。
- 默认面向抖音竖屏 9:16、手机优先；字幕清楚、居中、安全区内，不用细小截图填版面。
- 采用克制的编辑设计：石墨黑、暖白和一个低饱和强调色；动效跟信息节奏走，避免重复推拉、重叠和无意义留白。
- 引文只用必要短句，并记录版本和位置；禁止把受版权保护的长段原文改成带货稿。
- 公开发布前核验商品版本、价格、销量、奖项、作者经历、素材授权和音乐授权。

## 隐私、版权和开源

本项目采用 [MIT License](LICENSE)。公开仓库只含可复用的代码和模板。`episodes/` 下的具体项目默认忽略；不要提交 `.env`、API 密钥、原始人声、个人笔记、账号数据、未经许可的书封/截图/音乐/字体或客户素材。公开或分享某条具体视频时，另行核实该视频素材的授权；仓库许可证不会替第三方素材授予权利。
