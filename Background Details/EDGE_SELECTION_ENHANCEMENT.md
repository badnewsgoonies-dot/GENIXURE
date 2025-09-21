# Random Build Button - Edge Selection Enhancement

## Summary of Changes Made

### 🎯 **Objective**
Enhanced the random build button to also select a random edge alongside items and weapons.

### 🔧 **Changes Implemented**

1. **Modified `randomizeSide()` function** in `index.html` (lines ~1280-1310):
   - Added edge filtering logic: `const edges = DATA_ARR.filter(...)`
   - Added random edge selection when edges are available
   - Updates the edge dropdown, effect text, and icon automatically
   - Uses the same filtering logic as `populateEdges()` to exclude "_used" and "_darkened" edges

2. **Updated tooltip text** for both random buttons:
   - `randBuildBtn`: Now mentions "random items, a random weapon, and a random edge"
   - `randEnemyBtn`: Now mentions "items, weapon, and edge"

### 🎮 **Functionality**
- **Random Build button** (🎲 Random Build): Randomizes player side with edge
- **Random Enemy button** (🎲 Random Enemy): Randomizes opponent side with edge
- Both buttons now select from 16 available edges in the upgrades bucket
- Respects existing edge filtering logic (no "_used" or "_darkened" variants)

### 🧪 **Testing**
- Created `test_edge_selection.js` to verify edge filtering and selection
- Confirmed 16 available edges are properly filtered
- Random selection works correctly across multiple test runs
- Server tested at `http://localhost:5500`

### ✅ **Benefits**
- More complete randomization experience
- Consistent with existing code patterns
- Maintains UI synchronization (dropdown, icon, effect text)
- Works for both player and opponent randomization
- Leverages existing `updateTotals()` call for stat calculations

### 📝 **Technical Details**
- Uses same edge filtering logic as `populateEdges()` function
- Properly updates all UI elements: select dropdown, effect text, icon
- Maintains existing code structure and error handling
- No breaking changes to existing functionality