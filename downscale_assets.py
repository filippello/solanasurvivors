#!/usr/bin/env python3
"""
Downscale hi-res asset frames into game-resolution sprites/spritesheets.

Usage:
    python downscale_assets.py                  # process all sprites
    python downscale_assets.py player           # process only "player"
    python downscale_assets.py --resampling nearest   # use NEAREST instead of LANCZOS
"""

import argparse
import os
import sys

from PIL import Image

ROOT = os.path.dirname(__file__)

# ─── Sprite definitions ──────────────────────────────────────────────
# src:        folder with individual frame PNGs (relative to project root)
# dst:        output path (relative to project root)
# frame_size: target width & height in pixels per frame
# layout:     "strip" = horizontal spritesheet, "single" = one image
# frames:     ordered list of frame basenames (without .png)

SPRITES = {
    "player": {
        "src": "assets-src/player",
        "dst": "apps/web/public/assets/player/player.png",
        "frame_size": 32,
        "layout": "strip",
        "frames": [
            "idle_0", "idle_1", "idle_2", "idle_3",
            "walk_0", "walk_1", "walk_2", "walk_3",
        ],
    },
    # ── Enemies ───────────────────────────────────────────────
    "enemy-swarm": {
        "src": "assets-src/enemy-swarm",
        "dst": "apps/web/public/assets/enemies/swarm.png",
        "frame_size": 24,
        "layout": "single",
        "frames": ["default"],
    },
    "enemy-fast": {
        "src": "assets-src/enemy-fast",
        "dst": "apps/web/public/assets/enemies/fast.png",
        "frame_size": 20,
        "layout": "single",
        "frames": ["default"],
    },
    "enemy-tank": {
        "src": "assets-src/enemy-tank",
        "dst": "apps/web/public/assets/enemies/tank.png",
        "frame_size": 36,
        "layout": "single",
        "frames": ["default"],
    },
    "enemy-ranged": {
        "src": "assets-src/enemy-ranged",
        "dst": "apps/web/public/assets/enemies/ranged.png",
        "frame_size": 24,
        "layout": "single",
        "frames": ["default"],
    },
    "enemy-exploder": {
        "src": "assets-src/enemy-exploder",
        "dst": "apps/web/public/assets/enemies/exploder.png",
        "frame_size": 28,
        "layout": "single",
        "frames": ["default"],
    },
    "enemy-elite": {
        "src": "assets-src/enemy-elite",
        "dst": "apps/web/public/assets/enemies/elite.png",
        "frame_size": 32,
        "layout": "single",
        "frames": ["default"],
    },
    "enemy-boss": {
        "src": "assets-src/enemy-boss",
        "dst": "apps/web/public/assets/enemies/boss.png",
        "frame_size": 80,
        "layout": "single",
        "frames": ["default"],
    },
    # ── Add more sprites here as needed ───────────────────────
}

RESAMPLING_METHODS = {
    "lanczos": Image.LANCZOS,
    "nearest": Image.NEAREST,
    "bilinear": Image.BILINEAR,
    "bicubic": Image.BICUBIC,
}


def process_sprite(name, cfg, resampling):
    src_dir = os.path.join(ROOT, cfg["src"])
    dst_path = os.path.join(ROOT, cfg["dst"])
    size = cfg["frame_size"]
    layout = cfg["layout"]
    frames_names = cfg["frames"]

    if not os.path.isdir(src_dir):
        print(f"  SKIP {name}: source folder not found ({src_dir})")
        return False

    # Load and validate frames
    frames = []
    missing = []
    for fname in frames_names:
        path = os.path.join(src_dir, f"{fname}.png")
        if not os.path.isfile(path):
            missing.append(fname)
            continue
        img = Image.open(path).convert("RGBA")
        if img.width != img.height:
            print(f"  WARN {name}/{fname}.png is not square ({img.width}x{img.height}), will stretch")
        frames.append(img)

    if missing:
        print(f"  WARN {name}: missing frames: {', '.join(missing)}")

    if not frames:
        print(f"  SKIP {name}: no source frames found")
        return False

    # Downscale each frame
    scaled = [f.resize((size, size), resampling) for f in frames]

    # Assemble output
    if layout == "strip":
        sheet = Image.new("RGBA", (size * len(scaled), size), (0, 0, 0, 0))
        for i, frame in enumerate(scaled):
            sheet.paste(frame, (i * size, 0))
        out = sheet
    else:  # single
        out = scaled[0]

    os.makedirs(os.path.dirname(dst_path), exist_ok=True)
    out.save(dst_path)
    print(f"  {name}: {dst_path} ({out.width}x{out.height})")
    return True


def main():
    parser = argparse.ArgumentParser(description="Downscale hi-res assets to game resolution")
    parser.add_argument("sprites", nargs="*", help="Sprite names to process (default: all)")
    parser.add_argument(
        "--resampling",
        choices=list(RESAMPLING_METHODS.keys()),
        default="lanczos",
        help="Resampling filter (default: lanczos)",
    )
    args = parser.parse_args()

    resampling = RESAMPLING_METHODS[args.resampling]
    targets = args.sprites or list(SPRITES.keys())

    unknown = [t for t in targets if t not in SPRITES]
    if unknown:
        print(f"Error: unknown sprite(s): {', '.join(unknown)}")
        print(f"Available: {', '.join(SPRITES.keys())}")
        sys.exit(1)

    print(f"Downscaling assets (resampling={args.resampling})...")
    ok = 0
    for name in targets:
        if process_sprite(name, SPRITES[name], resampling):
            ok += 1

    print(f"\nDone: {ok}/{len(targets)} sprites processed.")


if __name__ == "__main__":
    main()
