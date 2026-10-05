---
name: bookflow
description: Guides Codex through research-led book short-video production, using Bookflow episode files and checks. Use when a creator wants to plan, produce, or review a book video with this repository.
---

# Bookflow Studio

Use this skill for a real book-video episode or when the creator asks to demonstrate this workflow. Start by reading the repository's `AGENTS.md` and `docs/workflow.md`; use `docs/project-format.md` when filling or troubleshooting episode files.

## Run an episode

Work inside the episode folder the creator selects. If none exists, ask which book they want to cover or whether they want a recommendation; do not silently choose a product to promote. Use `npm run bookflow -- init <episode-folder>` for a new episode and preserve any existing files.

Guide the creator through these deliverables, using the CLI where it applies:

1. Confirm the exact title, author, edition, and intended audience. Research factual details from appropriate public sources; save URLs and what each source supports in `sources.md` and `claims.csv`.
2. Draft original narration in `script.md`. Separate sourced facts from interpretation and personal experience. If the creator provides a reference video, analyze its structure, pace, and approximate length; do not reuse its lines. If the reference cannot be accessed, say so and make the limitation clear.
3. Show the complete script and wait for explicit approval before preparing production media. Keep one stable segment ID per spoken beat. A request to write or revise a script alone ends at this review gate.
4. After script approval, build `storyboard.csv`, matching each spoken segment exactly and specifying a relevant visual, provenance/rights, on-screen copy, motion, and duration. Show the storyboard and wait for approval before sourcing or generating production assets.
5. After storyboard approval, use only media tools actually available in the current environment. Record asset origin and rights. Prepare the voice track and exact Chinese captions; optional English should remain readable on a phone. Export SRT with `npm run bookflow -- export-srt <episode-folder>`.
6. Assemble and preview the video only if a suitable editor or renderer is available. Do not claim that this repository's CLI generates images, speech, or a video: it prepares episode files, checks structure/alignment, and exports subtitles.
7. Run `npm test` and `npm run bookflow -- check <episode-folder> --release` for a release candidate. Explain what the automated checks can and cannot establish. The creator must still review factual accuracy, rights, mobile readability, and the rendered video.

For a video that introduces Bookflow Studio itself, describe only features present in this repository and verified by running them. Distinguish the Codex-guided workflow from the CLI's concrete functions; never present planned or tool-dependent media generation as already automated by the code.

Keep episode assets and private work outside the public repository. Do not commit credentials, raw voice, account data, unlicensed covers, music, screenshots, or customer media.
