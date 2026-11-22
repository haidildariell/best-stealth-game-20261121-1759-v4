# The Lantern Archive — a stealth heist by lamplight

[![Competition](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![Rank](https://make.fun/badge/best-stealth-game-20261121-1759/haidildariell/best-stealth-game-20261121-1759-v4/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![Reward](https://make.fun/badge/best-stealth-game-20261121-1759/haidildariell/best-stealth-game-20261121-1759-v4/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

Bounty: https://make.fun/bounty/best-stealth-game-20261121-1759

An original 2D top-down stealth game for make.fun's **"Make the best stealth game"** bounty ($50, top 10 paid). You are a relic thief working three floors of a lantern-lit archive at night. Steal each floor's relic, take what loot you dare, and leave unseen.

## What makes it a stealth game, not a maze with guards

- **Light is the stealth system.** Wardens' vision cones are real-time raycasts blocked by shelves, pillars and walls — and lamplight extends them. Caught in a lantern's glow you are seen at full range; standing in darkness shrinks a cone to almost nothing.
- **Sound is the second system.** Running is loud, walking carries, sneaking is silent. Creaking floorboards broadcast a visible sound ring that pulls wardens off patrol — and a thrown **Chime Pebble** weaponises that, ringing at a point of your choosing.
- **Three limited gadgets:** Chime Pebble (lure), Lantern Snuff (eight seconds of darkness where you need it), Shadow Dash (a silent burst past a sweeping cone).
- **Layered threats:** patrol wardens with a readable UNAWARE → SUSPICIOUS → ALERT suspicion state machine, plus rotating CCTV cameras on Floors II–III whose cones feed a shared alarm.
- **A complete campaign:** three floors (Reading Room, Creaking Gallery, Relic Vault), learnable patrols, optional loot, a relic per floor, and a final GHOST / SHADOW / DETECTED ranking with full run statistics.
- **Everything procedural, everything offline:** canvas-rendered art and Web Audio–synthesized footsteps, creaks, chimes, heartbeats and ambience. No libraries, no network, no build step.

## Controls

WASD / arrows move · SHIFT sneak · mouse aim · **1** Chime Pebble · **2** Lantern Snuff · **3** / Space Shadow Dash · **R** restart floor

## Structure

`game/src/` is split by responsibility: `engine.js` (state, input, loop), `raycast.js` (line-of-sight & cone geometry), `guards.js` (warden AI and suspicion), `gadgets.js` (the three tools), `levels.js` (the three floors), `renderer.js` (lamplight rendering, cones, sound rings), `hud.js` (detection banner, title & victory screens), `audio.js` (procedural Web Audio). `main.ts` validates the screenshots and writes the dossier with the kit's `buildDossier`.

## License

MIT — see `LICENSE`.
