# Battle Start Item Effects – Data-Driven Summary

This sheet lists each item/weapon with a **Battle Start** trigger and its data‑driven effect you can encode in `details.json`. Use it as the authoritative checklist while wiring effects. Values marked **Gold/Diamond** indicate scaled tiers.

---

## How to read
- **Trigger**: always `battleStart` for this sheet.
- **Effect**: human‑readable summary.
- **Action hint**: name(s) of suggested engine action(s) to call.
- **Scaling**: base and tier multipliers when the wiki specifies them.

---

## Weapons

### Bloodlord’s Axe
- **Effect**: Enemy loses **5** HP; you restore **5** HP.
- **Action hint**: `life_drain(value: 5)`

### Dashmaster’s Dagger
- **Effect**: Gain additional strikes equal to your **Speed**.
- **Action hint**: `add_strikes_equal_to_speed()`

### Frozen Iceblade
- **Effect**: Gain **3** Freeze (**Gold 6**, **Diamond 12**).
- **Action hint**: `add_status('freeze', 3|6|12)`
- **Scaling**: ×2 Gold, ×4 Diamond.

### Fungal Rapier
- **Effect**: Gain **1** Poison.
- **Action hint**: `add_status('poison', 1)`

### Grilling Skewer
- **Effect**: Gain **+1** additional strike.
- **Action hint**: `add_strikes(1)`

### Ring Blades
- **Effect**: Steal **1** Attack from the enemy.
- **Action hint**: `steal_stat({ stat: 'attack', amount: 1 })`

### Slime Sword
- **Effect**: You gain **3** Acid; enemy gains **3** Acid.
- **Action hint**: `add_status('acid', 3)` and `add_status_to_enemy('acid', 3)`

### Wave Breaker
- **Effect**: Give the enemy **2 Riptide** for each point of **negative base Attack** you have.
- **Action hint**: `add_status_to_enemy_per_negative_base_stat({ stat: 'attack', status: 'riptide', perValue: 2 })`

---

## Standard Items

### Acid Mutation
- **Effect**: Gain **1** Acid; while you have Acid, temporarily gain Attack equal to Acid.
- **Action hint**: `add_status('acid', 1)` + existing temp‑ATK logic

### Arcane Bell
- **Effect**: Decrease **all countdowns by 1** (Symphony bonus applies as per item text).
- **Action hint**: `decrease_all_countdowns(1)`

### Arcane Gauntlet
- **Effect**: **Halve** all countdowns (round as per engine rule).
- **Action hint**: `halve_all_countdowns()`

### Basilisk Scale
- **Effect**: Gain **5** Armor and **5** Poison.
- **Action hint**: `gain_stat('armor', 5)`, `add_status('poison', 5)`

### Bramble Belt
- **Effect**: Gain **1** Thorns; enemy gains **+1** additional strike.
- **Action hint**: `add_status('thorns', 1)`, `add_strikes_to_enemy(1)`

### Clearspring Feather
- **Effect**: Transfer a **random status** from you to the enemy (**Base 1**, **Gold 2**, **Diamond 4** stacks).
- **Action hint**: `transfer_random_status({ amount: 1|2|4 })`

### Corroded Bone
- **Effect**: Convert **50% of enemy HP** into **your Armor**.
- **Action hint**: `convert_enemy_half_hp_to_armor()`

### Crimson Fang
- **Condition**: Only if **HP is full**.
- **Effect**: Take **5** damage; gain **+2** additional strikes.
- **Action hint**: `deal_damage(self, 5)`, `add_strikes(2)`

### Featherweight Helmet
- **Effect**: Spend **2** Armor → gain **+3 Speed** and **+1 Attack**.
- **Action hint**: `spend_armor(2)`, then `gain_stat('speed', 3)`, `gain_stat('attack', 1)`

### Frostbite Gauntlet
- **Effect**: Enemy gains **1** Freeze (**Gold 2**, **Diamond 4**).
- **Action hint**: `add_status_to_enemy('freeze', 1|2|4)`

### Lifeblood Armor
- **Effect**: Convert **50% of your current HP** into **Armor**.
- **Action hint**: `convert_health_to_armor(0.5)`

### Lightspeed Potion
- **Effect**: Restore HP equal to your **Speed**.
- **Action hint**: `restore_health_equal_to_stat('speed')`

### Ore Heart
- **Effect**: Gain **3 Armor** for **each equipped Stone item**.
- **Action hint**: `gain_armor_per_tag({ tag: 'Stone', amount: 3 })`

### Rusty Ring
- **Effect**: Enemy gains **1** Acid (**Gold 2**, **Diamond 4**).
- **Action hint**: `add_status_to_enemy('acid', 1|2|4)`

### Saltcrusted Crown
- **Effect**: Gain **1** Riptide.
- **Action hint**: `add_status('riptide', 1)`

### Sapphire Ring
- **Effect**: Steal **2** Attack (**Gold 4**, **Diamond 8**) from enemy.
- **Action hint**: `steal_stat({ stat: 'attack', amount: 2|4|8 })`

### Slime Armor
- **Effect**: Gain **1** Acid (**Gold 2**, **Diamond 4**).
- **Action hint**: `add_status('acid', 1|2|4)`

### Slime Booster
- **Effect**: Convert **1 Acid → 2 Attack** (**Gold: 2 Acid → 4 Attack**, **Diamond: 3 Acid → 6 Attack**).
- **Action hint**: `convert_status_to_attack({ from: 'acid', stacksToUse: 1|2|3, amountPerStack: 2|4|6 })`

### Sour Lemon
- **Effect**: Gain **1** Acid (**Gold 2**, **Diamond 4**).
- **Action hint**: `add_status('acid', 1|2|4)`

### Spiritual Balance
- **Condition**: If **Speed == Attack**.
- **Effect**: Gain **+3** Attack.
- **Action hint**: `gain_stat('attack', 3)`

### Stormcloud Armor
- **Condition**: If **Speed > Armor**.
- **Effect**: **Stun enemy** for **2** turns (**Gold 3**, **Diamond 4**).
- **Action hint**: `stun_enemy_for_turns(2|3|4)`

### Weaver Armor
- **Condition**: If **base Armor = 0**.
- **Effect**: Gain Armor equal to **current HP**.
- **Action hint**: `gain_armor_equal_to_current_hp()`

### Weaver Shield
- **Condition**: If **base Armor = 0**.
- **Effect**: Gain **4 Armor** (**Gold 8**, **Diamond 16**).
- **Action hint**: `gain_stat('armor', 4|8|16)`

### Swiftstrike Belt
- **Effect**: Take **3/4/5** damage (Base/Gold/Diamond) and gain **+1/+2/+3** additional strikes.
- **Action hint**: `deal_damage(self, 3|4|5)`, `add_strikes(1|2|3)`

### Thorn Ring
- **Effect**: Take **5** damage; gain **10** Thorns.
- **Action hint**: `deal_damage(self, 5)`, `add_status('thorns', 10)`

### Kindling Bomb
- **Effect**: Deal **1** damage; your **next bomb** deals **+3** damage.
- **Action hint**: `deal_damage(1)`, `increase_next_bomb_damage(3)`

### Friendship Bracelet
- **Effect**: Enemy loses **1** Attack (you gain **+1 Attack**).
- **Action hint**: `steal_stat({ stat: 'attack', amount: 1 })`

---

## Cauldron Items

### Melon Bomb
- **Effect**: Decrease a **random status by 1**; deal **1** damage to enemy.
- **Action hint**: `decrease_random_status(1)`, `deal_damage(1)`

### Cherry Blade
- **Effect**: Deal **4** damage to enemy.
- **Action hint**: `deal_damage(4)`

### Explosive Roast
- **Effect**: Deal **1** damage **three times** (bomb‑style pings).
- **Action hint**: `deal_damage(1)` ×3

---

### Implementation checklist
- Add/verify each entry’s `effects` in `details.json`.
- If an action name here doesn’t exist yet, add the helper to `EFFECT_ACTIONS` as listed above.
- Keep tier scaling consistent (×2 Gold, ×4 Diamond) where specified on the wiki.
- Run a few sample battles and scrub the replay to verify opening‑frame changes (HP, Armor, statuses, additional strikes, etc.).

