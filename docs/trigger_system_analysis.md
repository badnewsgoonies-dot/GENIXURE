# Trigger System Analysis Report

## Current vs Wiki Specification Comparison

### ✅ **Correctly Implemented Triggers**
- `battleStart` ✅ Maps to "Battle start"
- `turnStart` ✅ Maps to "Turn start" 
- `wounded` ✅ Maps to "Wounded"
- `exposed` ✅ Maps to "Exposed" 
- `hit` ✅ Maps to "On hit"
- `symphony` ✅ Maps to "Symphony"

### ⚠️ **Missing Wiki Triggers**
The following official wiki triggers are **NOT** implemented:

1. **`first_turn`** - "First turn" (wiki specified)
2. **`turn_end`** - "Turn end" (wiki specified) 
3. **`next_boss`** - "Next boss" (wiki specified)
4. **`first_time`** - "First time" (wiki specified)
5. **`every_other_turn`** - "Every other turn" (wiki specified)
6. **`countdown`** - "Countdown" (wiki specified)

### 🔄 **Extra Simulator Triggers** (Not in Wiki)
These triggers exist in the simulator but are NOT in the official wiki:

- `preBattle` 
- `damaged`
- `kill` 
- `afterStrike`
- `heal`
- `gainArmor` 
- `gainSpeed`
- `gainStatus`
- `poisonTick`
- `strikeSkipped`
- `bombTrigger`
- `postCountdownTrigger`

### 🚨 **Critical Battle Order Issues**

#### 1. **Missing Turn End Processing**
```javascript
// CURRENT: Missing turnEnd trigger
turnEndTicks(actor, target, logWithHP);
runEffects('turnEnd', actor, target, logWithHP); // ❌ NOT IMPLEMENTED

// SHOULD BE: 
runEffects('turnEnd', actor, target, logWithHP); // ✅ NEEDED
```

#### 2. **Missing First Turn Logic** 
```javascript
// CURRENT: No first turn detection
runEffects('turnStart', actor, target, logWithHP);

// SHOULD BE:
if (actor.flags.firstTurn) {
  runEffects('first_turn', actor, target, logWithHP); // ✅ NEEDED
}
runEffects('turnStart', actor, target, logWithHP);
```

#### 3. **Incomplete Countdown System**
- Wiki specifies "Countdown" as a trigger tag
- Current system has `postCountdownTrigger` but no standard `countdown` trigger

### 📋 **Recommended Action Plan**

#### Phase 1: Add Missing Core Triggers
1. Add `first_turn` trigger detection and processing
2. Add `turn_end` trigger after turn processing  
3. Add `countdown` trigger for tome/countdown items
4. Add `every_other_turn` logic for applicable items

#### Phase 2: Battle Flow Corrections
1. Ensure proper trigger ordering per wiki specs
2. Add turn end processing phase
3. Implement first turn flag system
4. Add every-other-turn counter logic

#### Phase 3: Data-Driven Migration
1. Update trigger mapping in `eventToTriggerMap`
2. Add new trigger action types as needed
3. Update item effects in `details.json` to use correct triggers

### 🎯 **Priority Items to Fix**

**HIGH PRIORITY:**
- `turn_end` - Critical for proper battle flow
- `first_turn` - Many items depend on this
- `countdown` - Essential for tome mechanics

**MEDIUM PRIORITY:**  
- `every_other_turn` - Less common but needed for completeness
- `next_boss` - Campaign-specific trigger

**LOW PRIORITY:**
- Audit extra triggers to see if they should be removed or documented

### 📊 **Current Battle Flow vs Correct Flow**

**CURRENT:**
```
preBattle → battleStart → [Turn Loop: turnStartTicks → turnStart → strikes → turnEndTicks]
```

**SHOULD BE:**
```  
preBattle → battleStart → [Turn Loop: turnStartTicks → (first_turn) → turnStart → strikes → turnEndTicks → turn_end]
```

## Conclusion

The simulator has good coverage of basic triggers but is **missing several critical wiki-specified triggers** and has **incorrect battle flow ordering**. The battle system needs updates to match the official specification.