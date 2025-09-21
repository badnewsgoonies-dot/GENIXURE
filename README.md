He Is Coming — Loadout Builder (v5)

Entry point
- Open `index.html` — this is the single supported entry.

Running locally
- Serve the folder for best results (enables fetching `details.json`).
  - Python: `python -m http.server 8080`
  - Node: `npx serve -l 8080`
- Opening via `file://` also works because `details.js` embeds data; the app merges it with `details.json` when available.

Notes
- Weapons are normalized directly in `index.html`: any entry whose key starts with `weapons/` is forced into the `weapons` bucket, and a few known miscategorized weapon entries are corrected explicitly. No separate manifest is required.

