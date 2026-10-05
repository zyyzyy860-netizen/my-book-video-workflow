# Bookflow Studio — Agent operating guide

This is an original, creator-owned workflow. Do not copy code, templates, narration, or visual assets from the separate `work/book-video` checkout. Use this repository's files as the source of truth.

## Episode workflow

1. Ask for a book or permission to recommend options. Verify the exact title, author, edition, and source identity before research.
2. Research from permitted public sources. Keep a source ledger in the episode folder and mark which sentence each source supports. Separate verified facts, interpretation, and personal opinion. Never invent sales numbers, awards, quotes, or reading experiences.
3. Draft an original short-form script using the reader's problem or curiosity as the hook. Do not paraphrase a source creator's script line-by-line. Keep short-form ad claims truthful and avoid unsupported guarantees.
4. Save a copy-ready script in `script.md` and validate it. Show the complete draft to the creator and wait for approval before generating or sourcing production assets.
5. Build one storyboard row for each spoken segment. `script_ref` and `narration` must match the approved script exactly. Every visual must explain or emotionally reinforce that exact line. Record source/rights and planned motion.
6. Create/source media only after storyboard approval. Preserve evidence and rights notes. Do not scrape private accounts or use unlicensed music, covers, or screenshots.
7. Add the final voice track and subtitle cue table. Chinese captions follow the approved spoken text exactly; English is optional and should not crowd a mobile screen.
8. Preview the actual composition on a phone-sized canvas. Check crop, readability, scene relevance, subtitle timing, voice continuity, sound, and rights. Render only after review; never replace the last good render before the new one passes.
9. Run `npm test`, `bookflow check <episode> --release`, and inspect the exported video before delivery.

## Visual baseline

Default target is 1080×1920, 9:16, 30 fps. Use an editorial, premium palette (warm white, graphite, one restrained accent), strong mobile-safe type, and generous but purposeful spacing. Avoid tiny mockups, clipped evidence, repetitive card layouts, default slide-deck transitions, and decorative motion that obscures a book or claim. Vary motion intentionally by narrative beat; do not rely on a repeated slow push-in.

## Privacy and delivery

Episode files are local/private and ignored by Git by default. Never commit `.env`, API keys, private notes, raw voice tracks, or unlicensed materials. A GitHub push or repository visibility change requires the user's explicit target and visibility choice. If a source or right is unclear, flag it instead of assuming permission.
