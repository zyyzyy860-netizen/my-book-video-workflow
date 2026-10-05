# Bookflow Studio

一套由创作者自己掌控的图书短视频工作流：先核实书和观点，再写稿、审稿、逐句配画面，最后处理配音、字幕和成片检查。它不是“输入书名就自动编一条广告”，每个事实、镜头和素材来源都留有记录，减少文案与画面脱节。

## 快速开始

需要 Node.js 20 或更新版本；不需要安装第三方 npm 包。

```powershell
npm test
npm run bookflow -- init episodes/my-first-book
```

在新建目录中补全 `brief.json`、`script.md`、`storyboard.csv` 和 `captions.csv`，然后运行：

```powershell
npm run bookflow -- check episodes/my-first-book
npm run bookflow -- status episodes/my-first-book
npm run bookflow -- export-srt episodes/my-first-book
```

`check` 验证书目信息、逐句文案映射、镜头字段、字幕文本与时间码；`--release` 额外要求素材、配音和最终视频都已存在：

```powershell
npm run bookflow -- check episodes/my-first-book --release
```

## 制作原则

- 每条口播先有可核查的来源，再进入稿件；读者感受和剧情概述要分开写。
- 先提交完整文案供创作者审阅；获批后才进入素材与剪辑阶段。
- 每个镜头必须对应一个口播段，并记录画面意图、素材来源、屏幕文字和运动方式。
- 默认抖音竖屏 9:16；手机优先，字幕字号、对比度和安全区在预览中验收。
- 画面走克制的高级编辑风：干净底色、清晰层级、少而准的色彩；动效服务信息，不用无意义推拉填空。
- 引文只作短句并注明版本/位置；不能把整段受版权保护的文本当带货文案。
- 公开发布前逐条核验价格、销量、奖项、作者经历等事实型卖点和素材授权。

具体人工审稿流程见 [`docs/workflow.md`](docs/workflow.md)，分镜/字幕表字段见 [`docs/project-format.md`](docs/project-format.md)。

## GitHub 与隐私

本仓库只放可复用的工作流和代码。`episodes/`、配音、原始素材、账号凭证默认不纳入 Git。上传公开仓库前先确认图书封面、截图、音乐、字体及第三方素材的授权；本项目暂不附许可证，待作者选择公开/私有及授权方式后再补。
