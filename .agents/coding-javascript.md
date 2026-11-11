# JavaScript (pdfkit fork)

- Feature work belongs in `lib/` (and tests). `js/` is rollup output — rebuild, don’t hand-patch.
- Preserve the RN fork invariants: dependency injection for fs/zlib/stream/Buffer, async-first APIs, font registry (no `__dirname` font loads), caller-provided standard fonts.
- Match existing module style (CommonJS in `lib/`, chainable document API). Run eslint/prettier rather than restyling for taste.
- Prefer extending existing mixins/`PDFDocument` flows over parallel document stacks.
- Unit tests for behavior/API and structure; visual tests when rendering changes. Prefer focused new specs over growing the giant `tests/visual/pdfmake/*` files.
- Do not re-vendor upstream foliojs/pdfkit or other libraries into the tree; depend or HD.
- Keep browser/Node demos under `examples/` and docs generators under `docs/` consistent with current patterns; not part of the RN app binary.
