# Human review — stop and escalate

Escalate to **Human Decisions** (do not commit) for:

| Red flag | Rule |
| --- | --- |
| **New vendored / inlined third-party trees** | Do not copy another repo into `lib/vendor` (or elsewhere). Use package dependencies. Existing `lib/vendor/fontkit`, `png-js`, `jpeg-exif` are grandfathered — do not grow them by pasting upstream. |
| **Binary blobs** | No new binaries, PDFs as fixtures beyond existing patterns, or opaque archives without explicit human approval of that path. |
| **≥ 10,000-line files** | Do not add or grow files to 10k+ lines. Grandfathered: rollup output under `js/`, current oversized visual specs under `tests/visual/pdfmake/`. Prefer new small unit/visual cases over extending 10k+ spec files. |
| **Secrets** | None in the tree or chat. |

Large hand-written modules under `lib/` (hundreds–low thousands of lines): avoid needless growth; splitting is preferred when cohesion allows. If unsure, escalate.

When escalating: path(s), size/type, why, and alternatives (npm dep, generate, submodule, smaller test).
