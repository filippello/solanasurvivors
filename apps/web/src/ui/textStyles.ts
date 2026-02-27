/**
 * Centralized text styles for crisp rendering in pixel-art mode.
 *
 * "Press Start 2P" is a pixel font designed for 8px multiples.
 * It must NOT use bold (browser fakes it by smearing pixels).
 * We render the text canvas at high resolution so FIT scaling
 * downsamples rather than upsamples, keeping edges sharp.
 */

const FONT = '"Press Start 2P"';

// Render text at 4x so it stays crisp at any screen size.
// Phaser's FIT mode scales the 640×360 canvas up; without this,
// small text gets blurry from nearest-neighbor upscaling.
const RES = 4;

// -- Base factory ----------------------------------------------------------

export function textStyle(
  size: number,
  color = '#ffffff',
): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    fontSize: `${size}px`,
    color,
    fontFamily: FONT,
    resolution: RES,
  };
}

// -- Pre-built presets -----------------------------------------------------

/** Big title — "SOLANA SURVIVORS", "VICTORY!", "GAME OVER" */
export const TITLE = textStyle(16, '#ffffff');

/** Section header — "LEVEL UP!", "PAUSED", "COMMUNITY ARENA" */
export const HEADER = textStyle(12, '#ffdd44');

/** Button label — "START", "ARENA", etc. */
export const BUTTON = textStyle(8, '#ffffff');

/** Body / stats text */
export const BODY = textStyle(8, '#ffffff');

/** Small / secondary text */
export const SMALL = textStyle(8, '#aaaaaa');

/** Tiny caption / hint text */
export const TINY = textStyle(8, '#888888');

/** HUD numbers and labels */
export const HUD_LABEL = textStyle(8, '#ffffff');

/** Damage numbers (in-world, not HUD) */
export const DAMAGE = {
  fontSize: '8px',
  fontFamily: FONT,
  color: '#ffffff',
  stroke: '#000000',
  strokeThickness: 2,
  resolution: RES,
} as Phaser.Types.GameObjects.Text.TextStyle;
