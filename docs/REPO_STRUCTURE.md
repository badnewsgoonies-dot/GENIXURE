Repo Structure

- Root runtime
  - index.html, app.js, heic_sim.js, heic_effects.js, heic_sets.js, heic_sets.generated.js
  - details.js, details.json, stats_overrides.json
  - assets/, icons/, items/, weapons/, upgrades/, sets/
  - netlify.toml, package.json

- scripts/
  - build-details.mjs, merge_stats_overrides.js
  - audit_wiki.mjs, fetch_missing_from_wiki.mjs, coverage.mjs, unmatched.mjs
  - extra/ one-off utilities preserved for reference

- reports/
  - audit_wiki_report.json, audit_stats_report.json, audit_stats_mismatches.csv,
    set_audit_report.json, temp_all.txt, tmp_stats_cell.txt, stat_corrections_log.json

- build/
  - compiled_details.json, heic_sets.generated.json (deploy/build artifacts)

- docs/
  - BUILD_SYSTEM.md, migration_report.md, wiki_tags.md, trigger docs, etc.

- archive/
  - Background Details/ and older backup files

- tests/
  - test_normalized.js, test_triggers.js

Key Commands

- npm run gen:details      → build details.js from details.json
- npm run build            → merge base + overrides (scripts/merge_stats_overrides.js)
- npm run audit:wiki       → parse wiki_dump and update overrides + details
- npm run fetch:missing    → fetch missing item pages live and update overrides
- npm run coverage         → report matched vs unmatched items
- npm run unmatched        → list unmatched by bucket

