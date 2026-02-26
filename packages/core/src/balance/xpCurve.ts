/** XP required to reach each level (index = level number, value = total XP needed) */
const XP_CURVE: number[] = [0]; // level 0 placeholder

for (let i = 1; i <= 100; i++) {
  // Formula: 10 * level^1.5 rounded up
  XP_CURVE.push(Math.ceil(10 * Math.pow(i, 1.5)));
}

export function xpRequiredForLevel(level: number): number {
  if (level < 1) return 0;
  if (level >= XP_CURVE.length) return XP_CURVE[XP_CURVE.length - 1];
  return XP_CURVE[level];
}

export { XP_CURVE };
