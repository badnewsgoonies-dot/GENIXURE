# He Is Coming — Loadout Builder (v5)

Entry point

1. **Build the data**: `npm run build`
2. **Start server**: `python -m http.server 5500`
3. **Open**: http://localhost:5500

## Build System

This project uses a build system to merge base item data with stat overrides:

- **`npm run build`** - Generates `compiled_details.json` from `details.json` + `stats_overrides.json`
- See [`BUILD_SYSTEM.md`](./BUILD_SYSTEM.md) for detailed documentation

## Development

### Entry point
- Open `index.html` — this is the single supported entry.

### Running locally
- **Recommended**: Run `npm run build` first, then serve the folder
  - Python: `python -m http.server 5500`
  - Node: `npx serve -l 5500`
- Opening via `file://` also works with automatic fallback to runtime data merging

### Data Files
- `details.json` - Base item database (source of truth)
- `stats_overrides.json` - Stat customizations
- `compiled_details.json` - Generated merged file (git ignored)

## Notes
- Weapons are normalized directly in `index.html`: any entry whose key starts with `weapons/` is forced into the `weapons` bucket, and a few known miscategorized weapon entries are corrected explicitly. No separate manifest is required.
- The frontend automatically loads the compiled data file when available, with graceful fallback to runtime merging.

