He Is Coming — Loadout Builder (v5)

Entry point
- Open `index.html` — this is the only supported entry. The deprecated `_remote_index.html` has been removed.

Running locally
- Recommended: serve the folder to allow `fetch` of `details.json` and caching to work.
  - Python: `python -m http.server 8080`
  - Node (serve): `npx serve -l 8080`
- Opening via `file://` also works because `details.js` embeds data; the app will merge it with `details.json` when available.

Notes
- Weapons count in the Compendium is normalized using `weapons_manifest.js` so all weapons from the `weapons/` folder appear even if their buckets are missing in `details.json`.
- If you rename or add weapon folders, refresh the manifest accordingly.

