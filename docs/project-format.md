# Episode folder format

`bookflow init <folder>` creates:

```text
episode/
├── brief.json         # book identity, viewer, platform, format
├── sources.md         # research ledger and claim evidence
├── script.md          # approved spoken segments, keyed S01…
├── claims.csv         # factual claims and verification sources
├── storyboard.csv     # one visual plan per spoken segment
├── captions.csv       # exact Chinese cues and optional English
├── assets/            # local media; keep out of public Git
├── audio/voiceover.mp3
└── renders/final.mp4
```

The starter episode is intentionally incomplete. `bookflow check` tells you what must be filled in; `--release` also checks that referenced media, voiceover, subtitle cues, and final render are present.

CSV uses UTF-8, a header row, comma separators, and standard double-quote escaping. Keep paths relative to the episode folder. Caption times use seconds with up to milliseconds precision.
