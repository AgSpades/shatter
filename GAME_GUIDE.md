# 🎭 SHATTER - Game Introduction Guide

## 📖 Story Overview

Welcome to **Nivara**, a dystopian city where everyone wears masks—not for celebration, but by law.

Long ago, a catastrophic event called **"The Shatter"** caused people to lose control of their emotions. Rage, fear, and jealousy became weapons that could physically harm others. To restore order, the rulers created **Emotion Masks**—devices that suppress feelings and keep people "safe"... but empty.

You are **Aryn**, a mask technician who discovers a cracked mask that changes everything. When you wear it, you can **feel again** for the first time. But this gift reveals a terrible truth: **The disaster never ended—it was hidden.**

Now you must descend into the depths of Nivara to uncover what lies beneath the masks.

---

## 🎮 Controls

### Basic Movement

- **Arrow Keys (←/→)**: Move left/right
- **Spacebar**: Jump (Press again in mid-air for **Double Jump**)
- **Shift**: **Dash** - Quick burst of speed (650ms cooldown)

### Advanced Mechanics

- **Variable Jump Height**: Release spacebar early for shorter jumps
- **Jump Cutting**: Release jump button while rising to fall faster

### System Controls

- **E**: Skip narration scenes
- **ESC**: Pause menu (Resume / Restart / Main Menu / Quit)

---

## 🎯 Game Objectives

### Primary Goal

Ascend through **"The Larva Disposal Pit"** - a massive vertical level spanning 80 floors - to reach the exit at the top.

### Secondary Objectives

1. **Collect all Gems** (Golden coins scattered throughout the level)
2. **Activate Checkpoints** (Green glowing circles that save your progress)
3. **Obtain the Shadow Mask** (Grants stealth abilities and HP regeneration)
4. **Survive the hazards and enemies** blocking your path

---

## 🕹️ Gameplay Mechanics

### Health System

- **Starting HP**: 10/10
- **Damage Sources**:
  - Red hazard zones (instant kill zones): -1 HP
  - Enemy enforcers: -1 HP
  - Timed hazards (pulsing red zones): -1 HP
- **Invulnerability**: 500ms after taking damage (prevents spam damage)
- **Death**: Respawn at last activated checkpoint
- **Healing**: Shadow Mask provides passive regeneration (0.5 HP/second)

### Checkpoints

- **Green glowing circles** that pulse rhythmically
- **Auto-save** your progress when activated
- Turn **white** when activated with a flash effect
- **4 Checkpoints** scattered throughout the level at strategic rest points

### The Shadow Mask (Grey Mask)

- **Location**: Found at approximately 50% height (Grid Y=54)
- **Abilities**:
  - **Stealth Mode**: Become invisible to enforcers when in shadow zones
  - **HP Regeneration**: Heal 0.5 HP per second (activates every 1 second)
  - **Visual Indicator**: Shows "MASK: ACTIVE" in UI when mask is equipped

### Shadow Zones

- **Dark rectangular areas** marked with 'S' in the level
- Only useful **after obtaining the Shadow Mask**
- Hide inside these zones to avoid enforcer detection
- Player gets a dark glow effect when in shadow

### Enemies: Enforcers

- **Red humanoid guards** that patrol specific paths
- **Patrol Patterns**:
  - Horizontal patrols (left/right)
  - Vertical patrols (up/down)
  - Wait at endpoints before turning around
- **Detection System**:
  - **Directional vision**: Only detect what's ahead of them
  - **Detection range**: ~4 tiles (256 pixels) forward
  - **Alert indicator**: Red "!" appears when they spot you
  - **300ms delay** between detection and damage
- **Counter**: Use Shadow Mask + Shadow Zones to avoid them

### Hazards

- **Static Red Zones**: Always active, instant damage on contact
- **Timed Hazards**: Pulse on/off with visual fade (alpha 1.0 → 0.2)
  - Watch timing patterns to safely navigate
  - Some start delayed for pattern variety

### Collectibles: Gems

- **Golden rotating coins** that bob up and down
- **Total**: Multiple gems distributed throughout all 80 floors
- **Collection reward**:
  - Pleasant "coin pickup" sound
  - Visual flash effect
  - Score tracking in UI
  - 100% completion achievement feel

---

## 🗺️ Level Structure

The **Larva Disposal Pit** is divided into sections:

### 🔰 Tutorial Zone (Floors 1-15)

- **Learn the basics**: Movement, jumping, collecting gems
- **First Checkpoint** at Floor 16
- **Hazards**: Simple red zones, basic platforms
- **Goal**: Master movement controls

### ⚡ Grinder Zone (Floors 16-32)

- **Increased difficulty**: Timed hazards, narrow platforms
- **Checkpoint 2** at Floor 31
- **Hazards**: Pulsing timed zones, moving platforms
- **Challenge**: Timing and precision

### 🔥 Sanctuary Zone (Floors 33-53)

- **Enemy introduction**: First enforcers appear
- **Checkpoint 3** at Floor 48
- **Key item**: Shadow Mask at Floor 54
- **Challenge**: Enemy avoidance, stealth introduction

### 👁️ Stealth Gauntlet (Floors 54-77)

- **Heavy enforcer presence**: Multiple patrols
- **Checkpoint 4** at Floor 76
- **Shadow zones** become essential for survival
- **Challenge**: Master stealth mechanics, timing between patrols

### 🏆 Final Ascent (Floors 78-79)

- **Exit portal** at Floor 78
- Final gem collection opportunity
- Victory awaits!

---

## 💡 Tips & Strategies

### Movement Tips

1. **Master the Dash**: Use dash to:
   - Cross large gaps (dash gives 800 speed burst)
   - Escape immediate danger
   - Reach distant platforms
2. **Jump Management**:
   - Save your double jump for emergencies
   - Practice variable jump heights for precision
   - Remember: touching ground resets both dash and double jump

3. **Momentum Control**:
   - Dash disables gravity for 200ms
   - Use this to change direction mid-air
   - Dash velocity dampens to 20% after completion

### Combat/Survival Tips

1. **Enforcer Patterns**:
   - Watch their patrol loops (they wait at endpoints)
   - Note their facing direction (they only see forward)
   - Use the "!" warning as a 300ms escape window

2. **Shadow Mask Strategy**:
   - Always activate shadow zones when enforcers are near
   - Use the passive healing to recover from mistakes
   - Shadow masking is REQUIRED in upper floors

3. **Hazard Navigation**:
   - Timed hazards have predictable patterns
   - Count the rhythm: "1-2-3-OFF, 1-2-OFF"
   - Dash through at the right moment

### Progression Tips

1. **Checkpoint Priority**:
   - Always activate checkpoints immediately
   - They auto-save your progress
   - Don't risk skipping them for gems

2. **Gem Collection**:
   - Gems don't affect progression, only completion
   - Risky gems can be collected on return trips
   - Some gems require precise platforming

3. **Resource Management**:
   - Your only resource is HP
   - After getting Shadow Mask, heal in safe zones
   - Don't rush into danger at low HP

---

## 🎨 Visual Guide

### Color Coding

- **Green Glow** = Checkpoints (safety)
- **Red Zones** = Hazards (danger)
- **Grey Rectangles** = Shadow Zones (stealth)
- **Red Humanoids** = Enforcers (enemies)
- **Golden Coins** = Gems (collectibles)
- **White Portal** = Exit (victory)

### UI Elements

- **Top Left Corner**:
  - HP: Current/Max health (color-coded: red/orange/green)
  - GEMS: Collected/Total count
  - MASK: Status indicator (appears after collection)

---

## 🎯 How to Win

### Short Playthrough Path (Speed Run)

1. Start → Navigate Tutorial Zone → Checkpoint 1 ✓
2. Ascend Grinder Zone → Checkpoint 2 ✓
3. Enter Sanctuary Zone → Checkpoint 3 ✓
4. **Critical**: Obtain Shadow Mask at Floor 54
5. Use stealth through Stealth Gauntlet → Checkpoint 4 ✓
6. Final ascent → Exit portal → **Victory!**

**Estimated Time**: 15-25 minutes (skilled player)

### 100% Completion Path

- Collect **ALL gems** throughout the level
- Activate **ALL 4 checkpoints**
- Obtain **Shadow Mask**
- Reach the exit with minimal deaths

**Estimated Time**: 30-45 minutes

### First-Time Player Path

1. **Take it slow** - Learn each zone's hazards
2. **Save frequently** - Hit every checkpoint
3. **Practice movement** - Get comfortable with dash and double jump
4. **Watch patterns** - Observe enforcers before moving
5. **Don't rush** - There's no time limit!

**Estimated Time**: 45-90 minutes

---

## 🐛 Known Mechanics to Master

### Advanced Techniques

1. **Dash Jumping**: Dash → Jump at end = extended horizontal distance
2. **Double Jump Dash**: Double jump → Dash = maximum air mobility
3. **Jump Canceling**: Release jump early to land on precise platforms
4. **Enforcer Baiting**: Trigger detection, then dash away to safety

### Frame-Perfect Tricks (Optional)

- Dash has 200ms active time → exploit the momentum
- Invulnerability lasts 500ms → can tank damage strategically
- Checkpoints save immediately → quick-save before risky sections

---

## 🏆 Judge/Reviewer Notes

### What Makes This Game Unique

1. **Narrative Integration**: Story narration sets atmospheric tone
2. **Precision Platforming**: Tight controls with dash/double jump mechanics
3. **Stealth Elements**: Shadow Mask creates strategic gameplay layer
4. **Progressive Difficulty**: 80-floor vertical design with clear zones
5. **Environmental Storytelling**: Dystopian industrial aesthetic

### Technical Highlights

- **Phaser 3** game engine with TypeScript
- **Parallax backgrounds** with 4 layers
- **Procedural sound effects** (coin collection uses Web Audio API)
- **Smart enemy AI** with directional detection
- **Auto-save system** via localStorage
- **Pause menu** with full game state management

### Design Philosophy

- **Challenging but fair**: Checkpoints prevent frustration
- **Risk vs Reward**: Gems are optional but satisfying
- **Player agency**: Shadow Mask choice (stealth vs combat avoidance)
- **Metroidvania inspiration**: Vertical exploration, ability gates

---

## 🎬 Quick Start Checklist

For judges/new players trying the game:

✅ **First 2 Minutes**:

- Watch opening narration (or press 'E' to skip)
- Learn basic movement (arrows + spacebar)
- Collect first gem
- Practice double jump

✅ **First 10 Minutes**:

- Reach Checkpoint 1
- Master dash mechanic (Shift key)
- Understand hazard damage
- Experience first enforcer

✅ **First 20 Minutes**:

- Obtain Shadow Mask
- Use stealth mechanics
- Activate multiple checkpoints
- Get comfortable with platforming rhythm

---

## 🔊 Audio Design

- **Title Music**: Atmospheric ambient track (loops)
- **Location Music**: "Woods" ambient theme (loops at 0.3 volume)
- **Sound Effects**:
  - Procedural coin collection (C6 → E6 pitch)
  - Damage hit feedback
  - Checkpoint activation

**Pro Tip**: Music fades smoothly between scenes for immersion!

---

## 📝 Final Notes

**Shatter** is a vertical-platforming metroidvania that challenges players to ascend through an oppressive industrial pit while mastering movement mechanics and stealth systems. The game balances precise platforming with strategic enemy avoidance, rewarding patient players who learn patrol patterns and checkpoint locations.

**Difficulty**: Medium-Hard (Fair checkpointing prevents excessive frustration)
**Playtime**: 30-60 minutes (first playthrough), 15 minutes (speed run)
**Replayability**: High (gem collection, speed running, mastery challenges)

Good luck, and remember: **Feel again. Fight back. Shatter the lie.** 🎭
