# HeIsComing Codebase Standardization Plan

## Current Inconsistencies Identified

### 1. Naming Convention Inconsistencies
- **Action Names**: Use snake_case (e.g., `add_armor`, `gain_stat`, `deal_damage`)
- **Method Names**: Use camelCase (e.g., `addArmor`, `addAtk`, `runEffects`)
- **Event Names**: Use camelCase with 'on' prefix (e.g., `onGainSpeed`, `onExposed`, `onWounded`)
- **Variable Names**: Use camelCase (e.g., `tomeCount`, `statValue`)

### 2. Legacy Code Issues
- Multiple "LEGACY" comments throughout codebase
- Backward compatibility code that may no longer be needed
- Duplicate action handlers marked as legacy
- Comments referencing "old system" vs "new system"

### 3. Method Name Inconsistencies in Fighter Class
- `addAtk` vs `addArmor` vs `heal` (inconsistent verb patterns)
- Property naming: `hp` vs `health`, `atk` vs `attack`

### 4. Effect System Terminology
- Mixed usage of "effects" vs "actions"
- Inconsistent parameter naming in effect handlers

## Standardization Strategy

### Phase 1: Establish Standards
1. **Action Names**: Keep snake_case (JSON compatibility, existing data)
2. **Method Names**: Standardize to camelCase
3. **Event Names**: Standardize to camelCase with 'on' prefix
4. **Variables**: Standardize to camelCase
5. **Properties**: Standardize abbreviated forms (hp, atk, etc.)

### Phase 2: Remove Legacy Code
1. Identify truly deprecated functionality
2. Remove or consolidate duplicate legacy actions
3. Update all legacy comments
4. Remove backward compatibility code where safe

### Phase 3: Method Consistency
1. Standardize Fighter class method names
2. Ensure consistent parameter patterns
3. Standardize log message formats

### Phase 4: Documentation
1. Update all comments to reflect current system
2. Add clear section headers
3. Remove migration-related comments

## Implementation Order
1. Legacy comment cleanup (safest, high impact)
2. Method name standardization
3. Variable name consistency
4. Remove deprecated functionality
5. Final validation with tests