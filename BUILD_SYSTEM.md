# Build System Documentation

## Overview

The project now uses a clean separation between base item data and stat customizations through a build system that generates a single, production-ready data file.

## Architecture

### Source Files

- **`details.json`** - The canonical base item database (kept pure, never modified by build process)
- **`stats_overrides.json`** - Stat customizations and overrides for specific items
- **`Random Tests/merge_stats_overrides.js`** - Build script that merges base + overrides

### Generated Files

- **`compiled_details.json`** - Final merged data file used in production (git ignored)

## Build Process

### Running the Build

```bash
npm run build
```

This executes the merge script which:

1. Loads the base `details.json` (unchanged)
2. Loads `stats_overrides.json` containing stat modifications
3. Merges overrides into a deep copy of base data
4. Writes the final merged result to `compiled_details.json`
5. Reports what was changed and any missing items

### Build Output Example

```
🔄 Building compiled_details.json from base + overrides...

✅ items/belt_of_gluttony:
   Original: {"armor":0,"attack":0,"health":4,"speed":0}
   Override: {"health":15}
   Final:    {"armor":0,"attack":0,"health":15,"speed":0}

📊 Build Summary:
   - Base items: 389
   - Stat overrides applied: 113 items
   - Missing items: 6

✅ Wrote compiled_details.json
```

## Frontend Integration

The frontend now intelligently loads data with fallback:

1. **Primary**: Attempts to load `compiled_details.json` (pre-merged, fast)
2. **Fallback**: If compiled file missing, loads `details.json` + `stats_overrides.json` and merges at runtime

### Browser Console Messages

- `✅ Loaded compiled_details.json (pre-merged stats)` - Using built version
- `⚠️ Falling back to runtime merge (run npm run build for better performance)` - Using fallback

## Development Workflow

### Adding New Items

1. Add entry to `details.json` with base stats and effects
2. Run `npm run build` to regenerate compiled file
3. Test changes in browser

### Modifying Item Stats

1. Add/modify entry in `stats_overrides.json`
2. Run `npm run build` to apply changes
3. Test in browser

### Production Deployment

1. Run `npm run build` before deploying
2. Deploy `compiled_details.json` (not the separate source files)
3. Only the merged file is needed in production

## File Management

### Version Control

- **Commit**: `details.json`, `stats_overrides.json`, build script
- **Ignore**: `compiled_details.json` (generated file, in .gitignore)

### File Roles

- `details.json` - Source of truth for base item data
- `stats_overrides.json` - Source of truth for stat customizations  
- `compiled_details.json` - Generated production file (do not edit manually)

## Benefits

1. **Clean Separation**: Base data vs customizations are clearly separated
2. **No Mutations**: Original `details.json` is never modified by the build process
3. **Performance**: Frontend loads single merged file instead of doing runtime merging
4. **Maintainability**: Easy to see what's been customized in `stats_overrides.json`
5. **Fallback**: System gracefully falls back to runtime merging if build wasn't run

## Troubleshooting

### Missing Items Warning

If you see warnings like `⚠️ items/xyz not found in details.json`, it means:

- The item key in `stats_overrides.json` doesn't match any item in `details.json`
- Check for typos or remove obsolete entries from the overrides file

### Frontend Not Loading Compiled Data

If you see the runtime merge warning, ensure you've run `npm run build` recently and the compiled file exists.

### Build Errors

If the build script fails:

1. Ensure both `details.json` and `stats_overrides.json` exist
2. Check that both files contain valid JSON
3. Verify the script path in `package.json` is correct

## Migration Notes

This system replaces the previous approach where:

- ❌ `details.json` was mutated directly by merge scripts
- ❌ Runtime merging was the only option
- ❌ No clear separation between base data and customizations

Now:

- ✅ Base data stays pure and unchanged
- ✅ Single source of truth for both base data and overrides
- ✅ Build-time optimization for better runtime performance
- ✅ Clear development workflow with proper file roles
