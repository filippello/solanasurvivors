/**
 * Centralized text styles for crisp rendering in pixel-art mode.
 *
 * Uses "Press Start 2P" (Google Fonts pixel font) and resolution: 2
 * so text is rendered at 2x internally, eliminating blur from FIT scaling.
 */

const FONT = '"Press Start 2P"';
const RES = 2;

// -- Base factory ----------------------------------------------------------

export function textStyle(
  size: number,
  color = '#ffffff',
  bold = false,
): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontSize: `${size}px`,
    color,
    fontFamily: FONT,
    fontStyle: bold ? 'bold' : 'normal',
    resolution: RES,
  };
}

// -- Pre-built presets -----------------------------------------------------

/** Big title — "SOLANA SURVIVORS", "VICTORY!", "GAME OVER" */
export const TITLE = textStyle(18, '#ffffff', true);

/** Section header — "LEVEL UP!", "PAUSED", "COMMUNITY ARENA" */
export const HEADER = textStyle(14, '#ffdd44', true);

/** Button label — "START", "ARENA", etc. */
export const BUTTON = textStyle(10, '#ffffff', true);

/** Body / stats text */
export const BODY = textStyle(8, '#ffffff');

/** Small / secondary text */
export const SMALL = textStyle(8, '#aaaaaa');

/** Tiny caption / hint text */
export const TINY = textStyle(7, '#888888');

/** HUD numbers and labels */
export const HUD_LABEL = textStyle(7, '#ffffff', true);

/** Damage numbers (in-world, not HUD) */
export const DAMAGE = {
  fontSize: '7px',
  fontFamily: FONT,
  fontStyle: 'bold',
  color: '#ffffff',
  stroke: '#000000',
  strokeThickness: 2,
  resolution: RES,
} as Phaser.Types.GameObjects.Text.TextStyle;
