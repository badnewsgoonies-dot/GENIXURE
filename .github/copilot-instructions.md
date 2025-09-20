# Copilot Instructions for HeIsComing

## Project Overview
HeIsComing is a browser-based game simulation featuring a complex battle system with items, weapons, and effects. The project has undergone a major architectural transformation from hard-coded effects to a fully data-driven effect system. The core simulation engine (`heic_sim.js`) processes battles between fighters equipped with items that have various effects, stats, and triggers.

## Current Project State (Sept 2025)

### ✅ **Completed Major Migration**
- **377 items and weapons** have been successfully migrated from hard-coded JavaScript effects to a standardized JSON-based effect system
- All effects now use a consistent `actions` array format with standardized triggers
- The simulator fully supports the new effect system with **124 unique action types**
- Migration validation was completed against in-game screenshots to ensure 100% accuracy

### 🔧 **Recent Major Changes**
1. **Effect System Overhaul**: Complete migration from legacy hard-coded effects to data-driven JSON effects
2. **Simulator Engine Update**: Enhanced `heic_sim.js` with full support for new effect system
3. **Trigger System**: Implemented event-to-trigger mapping (e.g., `onWounded` → `wounded`)
4. **Data Loading**: Added Node.js compatibility for simulator testing and validation
5. **UI Improvements**: Added optional summary display and real-time HP tracking in battle logs

## Architecture & Core Components

### **Data Layer**
- **`details.json`**: Complete item/weapon database with effects, stats, tags, and metadata
  - Contains 377 entries with full effect definitions
  - Standardized format: `{ "trigger": "battleStart", "actions": [{"type": "deal_damage", "value": 3}] }`
  - Supports tiered values (base/gold/diamond) and complex conditions
- **`stats_overrides.json`**: Legacy stat overrides (may need cleanup)

### **Simulation Engine (`heic_sim.js`)**
- **Fighter Class**: Represents combatants with HP, armor, attack, speed, items, and statuses
  - Automatically applies item stats during construction
  - Supports complex status effects (poison, thorns, regen, etc.)
  - Tracks battle statistics and summaries
- **Effect System**: Data-driven effect processing with 124 action types
  - `runEffects(event, self, other, log, extra)`: Core effect processor
  - `EFFECT_ACTIONS`: Maps action types to handler functions
  - Supports all trigger types: `battleStart`, `wounded`, `hit`, `turnStart`, etc.
- **Battle Logic**: Complete turn-based combat system
  - Speed-based turn order with `pickOrder(L, R)`
  - Strike system with armor/HP damage calculation
  - Status effect ticks and countdown systems
  - Real-time HP tracking in battle logs

### **Effect Action Types (124 total)**
Categories include:
- **Damage**: `deal_damage`, `deal_damage_multiple_times`, `deal_damage_to_self`, etc.
- **Healing**: `heal`, `heal_percentage`, `heal_to_full`, etc.
- **Stats**: `gain_attack`, `gain_armor`, `gain_speed`, `lose_health`, etc.
- **Status Effects**: `apply_poison`, `apply_thorns`, `apply_regen`, etc.
- **Conditional**: `heal_if_wounded`, `double_damage_if_exposed`, etc.
- **Advanced**: `transform_item`, `copy_enemy_weapon`, `gain_random_effect`, etc.

### **Trigger System**
Standardized triggers that activate effects:
- **Battle Phase**: `battleStart`, `preBattle`, `turnStart`, `turnEnd`
- **Combat Events**: `hit`, `wounded`, `exposed`, `kill`, `damaged`
- **Status Changes**: `gainArmor`, `gainSpeed`, `heal`, `poisonTick`
- **Special**: `symphony`, `bombTrigger`, `strikeSkipped`

### **Testing & Validation**
- **Migration Scripts**: Various validation and analysis tools
- **Action Type Analysis**: `analyze_action_types.js` for effect auditing
- **Simulator Testing**: Node.js compatible for automated testing
- **Screenshot Validation**: Effects verified against in-game behavior

## Developer Workflows

### **Effect Development**
1. **Adding New Effects**: Edit `details.json` with new effect definitions
2. **New Action Types**: Add handler to `EFFECT_ACTIONS` in `heic_sim.js`
3. **Testing**: Use Node.js simulator for rapid iteration
4. **Validation**: Cross-reference with game screenshots/behavior

### **Simulator Usage**
```javascript
const { simulate } = require('./heic_sim.js');

// Basic simulation
const result = simulate(
  { items: ['items/cherry_bomb', 'weapons/bee_stinger'] }, 
  { items: ['items/belt_of_gluttony'] },
  { seed: 123, maxTurns: 50, includeSummary: false }
);

// Result includes: { result, rounds, log, summary? }
```

### **Battle Log Format**
With recent UI improvements, each log entry includes real-time HP:
```
1. -- Turn 1 -- Fighter [PlayerHP: 15 | OpponentHP: 25]
2. ⚔️ Fighter hits Fighter for 3 [PlayerHP: 15 | OpponentHP: 22]
3. ::icon:items/cherry_bomb:: Fighter deals 1 damage (1/2) [PlayerHP: 15 | OpponentHP: 21]
```

### **Data Structure Examples**

**Item Definition (details.json)**:
```json
{
  "items/cherry_bomb": {
    "name": "Cherry Bomb",
    "slug": "cherry_bomb",
    "stats": { "armor": 0, "attack": 0, "health": 0, "speed": 0 },
    "tags": ["Bomb", "Fruit"],
    "effects": [
      {
        "trigger": "battleStart",
        "actions": [
          {
            "type": "deal_damage_multiple_times",
            "value": {
              "damage": 1,
              "times": 2,
              "gold_damage": 2,
              "diamond_damage": 4
            }
          }
        ]
      }
    ]
  }
}
```

**Effect Action Handler**:
```javascript
EFFECT_ACTIONS: {
  deal_damage_multiple_times: ({ self, other, log, value }) => {
    const damage = value?.damage || 1;
    const times = value?.times || 3;
    for (let i = 0; i < times; i++) {
      other.hp = Math.max(0, (other.hp || 0) - damage);
      log(`${self.name} deals ${damage} damage (${i+1}/${times})`);
    }
  }
}
```

## Key Files & Their Roles

### **Core System Files**
- **`heic_sim.js`**: Complete battle simulation engine with effect system
- **`details.json`**: Comprehensive item/weapon database (377 entries)
- **`index.html`**: Browser entry point (loads simulator for UI)

### **Legacy Files (Deprecated but Present)**
- **`heic_effects.js`**: Old hard-coded effect system (replaced by data-driven approach)
- **`stats_overrides.json`**: Legacy stat modifications

### **Development Tools**
- **`analyze_action_types.js`**: Enumerates all effect action types in use
- **Migration scripts**: Various validation and data transformation tools
- **Test files**: Simulator validation and effect testing

### **Assets & UI**
- **`/assets/`, `/icons/`**: Stat icons (armor, attack, health, speed)
- **`/items/`**: Individual item folders with assets
- **`/weapons/`, `/sets/`, `/upgrades/`**: Organized item categories

## Integration Points & APIs

### **Simulator API**
```javascript
simulate(leftBuild, rightBuild, options)
// Returns: { result: 'Victory'|'Defeat'|'Draw', rounds: number, log: string[], summary?: object }
```

**Options**:
- `maxTurns`: Battle round limit (default: 100)
- `seed`: Random seed for deterministic battles
- `includeSummary`: Include detailed battle statistics (default: true)

### **Effect System Integration**
- Effects are automatically loaded from `details.json`
- Trigger events are mapped to standardized names
- Action handlers are resolved from `EFFECT_ACTIONS`
- Conditions and tiered values are fully supported

### **Data Loading**
- Browser: Uses `window.HEIC_DETAILS` (loaded via script)
- Node.js: Automatically loads `details.json` using `require()`
- Fighter stats are calculated by combining base stats + item stats

## Common Development Tasks

### **Adding New Items**
1. Add entry to `details.json` with effects, stats, tags
2. Create item folder in `/items/` with assets
3. Test with simulator to verify behavior
4. Validate against game screenshots if available

### **Adding New Action Types**
1. Add handler function to `EFFECT_ACTIONS` in `heic_sim.js`
2. Follow existing patterns for parameters: `{ self, other, log, value, ...extra }`
3. Use `log()` function for battle messages
4. Test with various value configurations

### **Debugging Effects**
1. Use Node.js simulator for rapid testing
2. Check `details.json` for correct trigger names and action types
3. Verify effect conditions and value resolution
4. Compare battle logs with expected behavior

### **Performance & Compatibility**
- Simulator supports both browser and Node.js environments
- Data-driven approach eliminates need for code changes when adding items
- Battle logs include real-time HP tracking for easy debugging
- All 377 items are validated and working with zero "Unknown action" errors

## Project Status & Future Considerations

### **Current State: Production Ready**
- ✅ Complete effect migration (377 items)
- ✅ Simulator fully functional with new system
- ✅ All action types supported (124 unique)
- ✅ UI improvements completed
- ✅ Node.js compatibility for testing

### **Potential Future Enhancements**
- **Build System**: Consider adding bundling/minification for production
- **Type Safety**: TypeScript migration for better maintainability
- **Testing Framework**: Automated test suite for effect validation
- **Performance**: Optimize simulation speed for large-scale testing
- **Documentation**: API documentation for effect system

### **Development Notes**
- The project uses no external dependencies (fully self-contained)
- All effects are validated against screenshots from the actual game
- The simulator produces deterministic results when using seeds
- Battle logs are human-readable and include comprehensive state information

---

**Last Updated**: September 2025  
**Status**: Production Ready - Full Effect System Migration Complete
