// levels.js — the three floors of the Lantern Archive. Every floor is a
// different problem: the Reading Room teaches light and shadow, the Creaking
// Gallery makes the floor itself betray you, and the Relic Vault layers a
// sweeping camera over a sentry ring. Patrol paths are fixed and learnable.

function room() {
  // Border walls of the 1280x800 archive floor.
  return [
    { x: 0, y: 0, w: 1280, h: 24 }, { x: 0, y: 776, w: 1280, h: 24 },
    { x: 0, y: 0, w: 24, h: 800 }, { x: 1256, y: 0, w: 24, h: 800 },
  ];
}

export const LEVELS = [
  {
    name: 'Floor I — The Reading Room',
    sub: 'Learn the lantern light. Take the Ember Codex.',
    floor: '#332619', floorAlt: '#2b1f14',
    start: { x: 640, y: 700 },
    walls: room().concat([
      { x: 300, y: 180, w: 180, h: 36 }, { x: 300, y: 420, w: 180, h: 36 },
      { x: 800, y: 180, w: 180, h: 36 }, { x: 800, y: 420, w: 180, h: 36 },
      { x: 620, y: 330, w: 40, h: 120 },
    ]),
    lanterns: [
      { x: 640, y: 140, r: 195 }, { x: 220, y: 600, r: 175 },
      { x: 1060, y: 600, r: 175 }, { x: 640, y: 645, r: 185 },
    ],
    creaks: [{ x: 545, y: 285, w: 190, h: 64 }],
    guards: [
      { name: 'Warden Pell', path: [[240, 300], [1040, 300]], speed: 58 },
      { name: 'Warden Ivo', path: [[1105, 200], [1105, 590]], speed: 52 },
    ],
    cameras: [],
    loot: [
      { x: 250, y: 118, v: 40, label: 'Brass Astrolabe' },
      { x: 1032, y: 118, v: 40, label: 'Jeweled Snuffbox' },
      { x: 640, y: 520, v: 60, label: 'Silver Lectern Bell' },
      { x: 148, y: 385, v: 30, label: 'Ivory Dice of the Abbot' },
    ],
    relic: { x: 640, y: 88, label: 'The Ember Codex' },
    exit: { x: 600, y: 748, w: 80, h: 28 },
  },
  {
    name: 'Floor II — The Creaking Gallery',
    sub: 'The floorboards sing. Cross them sneaking, or not at all.',
    floor: '#2e2430', floorAlt: '#261d28',
    start: { x: 130, y: 690 },
    walls: room().concat([
      { x: 420, y: 110, w: 32, h: 250 }, { x: 420, y: 440, w: 32, h: 250 },
      { x: 840, y: 110, w: 32, h: 250 }, { x: 840, y: 440, w: 32, h: 250 },
      { x: 120, y: 300, w: 130, h: 30 }, { x: 1030, y: 300, w: 130, h: 30 },
    ]),
    lanterns: [
      { x: 230, y: 195, r: 165 }, { x: 640, y: 625, r: 185 },
      { x: 1050, y: 195, r: 165 }, { x: 640, y: 150, r: 155 },
    ],
    creaks: [
      { x: 110, y: 355, w: 230, h: 95 }, { x: 525, y: 355, w: 230, h: 95 },
      { x: 945, y: 355, w: 230, h: 95 },
    ],
    guards: [
      { name: 'Warden Sef', path: [[140, 630], [370, 630], [370, 170], [140, 170]], speed: 54 },
      { name: 'Warden Mara', path: [[520, 205], [762, 205], [762, 600], [520, 600]], speed: 60 },
      { name: 'Warden Odo', path: [[905, 630], [1140, 630], [1140, 170], [905, 170]], speed: 54 },
    ],
    cameras: [
      { x: 640, y: 46, base: Math.PI / 2, sweep: 0.85, speed: 0.55, range: 250 },
    ],
    loot: [
      { x: 185, y: 118, v: 40, label: 'Gilded Moth Brooch' },
      { x: 640, y: 405, v: 70, label: 'The Singing Floorboard' },
      { x: 1098, y: 118, v: 40, label: 'Opal Rosary' },
      { x: 480, y: 712, v: 30, label: 'Copper Choir Key' },
      { x: 800, y: 712, v: 30, label: 'Vellum Star Chart' },
    ],
    relic: { x: 1148, y: 700, label: 'Choir Bell of St. Sable' },
    exit: { x: 28, y: 360, w: 28, h: 80 },
  },
  {
    name: 'Floor III — The Relic Vault',
    sub: 'A sentry ring, two glass eyes, and the First Lantern.',
    floor: '#232c26', floorAlt: '#1c241f',
    start: { x: 140, y: 140 },
    walls: room().concat([
      { x: 440, y: 240, w: 150, h: 28 }, { x: 690, y: 240, w: 150, h: 28 },
      { x: 440, y: 540, w: 150, h: 28 }, { x: 690, y: 540, w: 150, h: 28 },
      { x: 440, y: 240, w: 28, h: 150 }, { x: 440, y: 440, w: 28, h: 128 },
      { x: 812, y: 240, w: 28, h: 150 }, { x: 812, y: 440, w: 28, h: 128 },
      { x: 200, y: 200, w: 36, h: 36 }, { x: 1044, y: 200, w: 36, h: 36 },
      { x: 200, y: 564, w: 36, h: 36 }, { x: 1044, y: 564, w: 36, h: 36 },
    ]),
    lanterns: [
      { x: 640, y: 292, r: 200 }, { x: 180, y: 118, r: 150 },
      { x: 1100, y: 118, r: 150 }, { x: 180, y: 690, r: 150 }, { x: 1100, y: 690, r: 150 },
    ],
    creaks: [{ x: 560, y: 596, w: 160, h: 58 }],
    guards: [
      { name: 'Vault Sentry', path: [[380, 180], [900, 180], [900, 622], [380, 622]], speed: 62 },
      { name: 'Inner Keeper', path: [[520, 404], [760, 404]], speed: 46 },
      { name: 'Warden Vale', path: [[150, 404], [1130, 404]], speed: 50 },
    ],
    cameras: [
      { x: 640, y: 46, base: Math.PI / 2, sweep: 1.0, speed: 0.45, range: 260 },
      { x: 1234, y: 404, base: Math.PI, sweep: 0.7, speed: 0.6, range: 230 },
    ],
    loot: [
      { x: 640, y: 330, v: 80, label: 'Censer of the First Keeper' },
      { x: 152, y: 152, v: 40, label: 'Emerald Cipher Wheel' },
      { x: 1128, y: 152, v: 40, label: 'Golden Hourglass' },
      { x: 152, y: 652, v: 40, label: 'Onyx Reliquary' },
      { x: 1128, y: 652, v: 40, label: 'Pearl Astrolabe' },
      { x: 640, y: 706, v: 50, label: 'Sunken Bell of the Vault' },
    ],
    relic: { x: 640, y: 418, label: 'The First Lantern' },
    exit: { x: 600, y: 748, w: 80, h: 28 },
  },
];
