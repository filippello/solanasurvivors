#!/usr/bin/env python3
"""
Generate all pixel-art assets for Solana Survivors.
16-bit style, top-down view, PNG with transparency.
"""

import os
from PIL import Image, ImageDraw

BASE = os.path.join(os.path.dirname(__file__), "apps", "web", "public", "assets")


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def darken(rgb, factor=0.6):
    return tuple(max(0, int(c * factor)) for c in rgb)


def lighten(rgb, factor=1.4):
    return tuple(min(255, int(c * factor)) for c in rgb)


def save(img, *path_parts):
    fp = os.path.join(BASE, *path_parts)
    os.makedirs(os.path.dirname(fp), exist_ok=True)
    img.save(fp)
    print(f"  Created {fp} ({img.width}x{img.height})")


# ─── Helpers ───────────────────────────────────────────────


def draw_pixel(draw, x, y, color, alpha=255):
    """Draw a single pixel with optional alpha."""
    if alpha < 255:
        color = color + (alpha,)
    draw.point((x, y), fill=color)


def fill_rect(draw, x, y, w, h, color):
    draw.rectangle([x, y, x + w - 1, y + h - 1], fill=color)


# ─── 1. PLAYER SPRITESHEET ────────────────────────────────


def generate_player():
    """1024x128 spritesheet: 8 frames of 128x128 (4 idle + 4 walk). Drawn at 32x32 then upscaled."""
    DRAW_W, DRAW_H = 32, 32
    W, H = 128, 128
    FRAMES = 8
    # Draw at 32x32 then upscale to 128x128
    small_img = Image.new("RGBA", (DRAW_W * FRAMES, DRAW_H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(small_img)
    img = small_img  # draw references use img, will upscale at end
    draw = ImageDraw.Draw(img)

    blue = hex_to_rgb("#3399ff")
    blue_light = hex_to_rgb("#66bbff")
    blue_dark = darken(blue)
    skin = hex_to_rgb("#ffcc99")
    cape_dark = hex_to_rgb("#2266cc")
    cape_mid = hex_to_rgb("#2277dd")
    white = (255, 255, 255)

    def draw_player_frame(ox, oy_offset=0, walk_phase=0):
        """Draw one player frame at offset ox. oy_offset for idle bob. walk_phase 0-3 for walk."""
        # Shadow
        for sx in range(12, 21):
            for sy in range(27 + oy_offset, 30 + oy_offset):
                if 13 <= sx <= 19 and sy == 28 + oy_offset:
                    draw.point((ox + sx, sy), fill=(0, 0, 0, 60))

        base_y = 4 + oy_offset

        # Cape / body back (large triangular cape)
        cape_points = [
            (ox + 16, base_y + 6),  # top center
            (ox + 9, base_y + 22),  # bottom left
            (ox + 23, base_y + 22),  # bottom right
        ]
        draw.polygon(cape_points, fill=cape_dark)
        # Cape highlight
        draw.line(
            [(ox + 16, base_y + 8), (ox + 14, base_y + 20)], fill=cape_mid, width=1
        )

        # Body / torso
        fill_rect(draw, ox + 13, base_y + 8, 6, 10, blue)
        # Body highlight left edge
        fill_rect(draw, ox + 13, base_y + 8, 1, 10, blue_light)
        # Body right shadow
        fill_rect(draw, ox + 18, base_y + 8, 1, 10, blue_dark)

        # Armor detail - belt
        fill_rect(draw, ox + 12, base_y + 15, 8, 2, darken(blue, 0.5))
        fill_rect(draw, ox + 15, base_y + 15, 2, 2, hex_to_rgb("#ffdd44"))  # buckle

        # Head
        fill_rect(draw, ox + 13, base_y + 2, 6, 6, skin)
        # Eyes
        draw.point((ox + 17, base_y + 4), fill=(40, 40, 80))
        draw.point((ox + 18, base_y + 4), fill=white)
        # Hair / hood
        fill_rect(draw, ox + 12, base_y + 1, 8, 3, blue_dark)
        fill_rect(draw, ox + 12, base_y + 2, 2, 4, blue_dark)  # side hair

        # Arms
        arm_swing = [0, 1, 0, -1][walk_phase] if walk_phase else 0
        # Left arm
        fill_rect(draw, ox + 11, base_y + 9 + arm_swing, 2, 6, blue)
        fill_rect(draw, ox + 11, base_y + 14 + arm_swing, 2, 2, skin)
        # Right arm (holding wand)
        fill_rect(draw, ox + 19, base_y + 9 - arm_swing, 2, 6, blue)
        fill_rect(draw, ox + 19, base_y + 14 - arm_swing, 2, 2, skin)
        # Wand
        fill_rect(draw, ox + 20, base_y + 8 - arm_swing, 2, 3, hex_to_rgb("#8B4513"))
        draw.point((ox + 21, base_y + 7 - arm_swing), fill=hex_to_rgb("#44aaff"))

        # Legs
        leg_offsets = [(0, 0), (0, 0), (0, 0), (0, 0)]
        if walk_phase == 1:
            leg_offsets = [(0, -1), (0, 1)]
        elif walk_phase == 3:
            leg_offsets = [(0, 1), (0, -1)]
        else:
            leg_offsets = [(0, 0), (0, 0)]

        # Left leg
        fill_rect(
            draw,
            ox + 13,
            base_y + 18 + leg_offsets[0][1],
            3,
            5,
            darken(blue, 0.7),
        )
        fill_rect(
            draw,
            ox + 13,
            base_y + 22 + leg_offsets[0][1],
            3,
            2,
            hex_to_rgb("#553322"),
        )  # boot
        # Right leg
        fill_rect(
            draw,
            ox + 16,
            base_y + 18 + leg_offsets[1][1],
            3,
            5,
            darken(blue, 0.7),
        )
        fill_rect(
            draw,
            ox + 16,
            base_y + 22 + leg_offsets[1][1],
            3,
            2,
            hex_to_rgb("#553322"),
        )  # boot

        # Outline - subtle border for contrast
        # We'll add key outline pixels
        for px in range(12, 22):
            if img.getpixel((ox + px, base_y + 1))[3] > 0:
                if base_y > 0 and img.getpixel((ox + px, base_y))[3] == 0:
                    draw.point((ox + px, base_y), fill=blue_light + (120,))

    # Idle frames 0-3: subtle breathing animation
    bobs = [0, 0, -1, -1]
    for i in range(4):
        draw_player_frame(i * DRAW_W, oy_offset=bobs[i], walk_phase=0)

    # Walk frames 4-7: walking cycle
    for i in range(4):
        draw_player_frame((i + 4) * DRAW_W, oy_offset=0, walk_phase=i)

    # Upscale from 256x32 to 1024x128 (nearest neighbor for pixel art)
    final_img = small_img.resize((W * FRAMES, H), Image.NEAREST)
    save(final_img, "player", "player.png")


# ─── 2. ENEMIES ───────────────────────────────────────────


def generate_swarm():
    """24x24 basic insect/slime enemy."""
    img = Image.new("RGBA", (24, 24), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    green = hex_to_rgb("#44cc44")
    green_l = hex_to_rgb("#66ee66")
    green_d = darken(green)

    # Body - blob shape
    body_pixels = [
        "        xxxxxx        ",
        "      xxxxxxxxxx      ",
        "     xxxxxxxxxxxx     ",
        "    xxxxXXxxxxxxxx    ",
        "   xxxxXXXxxxxxxxxx   ",
        "   xxxXXXxxxxxxxxxx   ",
        "   xxxxxxxxxxxxxx x   ",
        "    xxxxxxxxxxxx xx   ",
        "     xxxxxxxxxx  x   ",
        "      xxxxxxxx       ",
        "       xxxxxx        ",
        "        xxxx         ",
    ]
    for ry, row in enumerate(body_pixels):
        y = 6 + ry
        for rx, ch in enumerate(row):
            x = 1 + rx
            if x < 24:
                if ch == "x":
                    draw.point((x, y), fill=green)
                elif ch == "X":
                    draw.point((x, y), fill=green_l)

    # Simplified approach - draw a slime blob
    # Main body ellipse
    draw.ellipse([5, 7, 18, 19], fill=green, outline=green_l)
    # Highlight
    draw.ellipse([8, 9, 13, 14], fill=green_l)
    # Eyes
    draw.point((10, 11), fill=(20, 20, 20))
    draw.point((14, 11), fill=(20, 20, 20))
    # Dark bottom
    draw.arc([5, 12, 18, 20], 0, 180, fill=green_d, width=1)
    # Antennae / feelers
    draw.line([(9, 7), (7, 4)], fill=green_l, width=1)
    draw.line([(14, 7), (16, 4)], fill=green_l, width=1)
    # Antenna tips
    draw.point((7, 4), fill=(255, 255, 100))
    draw.point((16, 4), fill=(255, 255, 100))
    # Small legs
    draw.point((6, 18), fill=green_d)
    draw.point((8, 19), fill=green_d)
    draw.point((15, 19), fill=green_d)
    draw.point((17, 18), fill=green_d)

    save(img, "enemies", "swarm.png")


def generate_fast():
    """20x20 fast wasp-like enemy."""
    img = Image.new("RGBA", (20, 20), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    yellow = hex_to_rgb("#cccc44")
    yellow_l = lighten(yellow)
    yellow_d = darken(yellow)

    # Sleek elongated body pointing right (direction of movement)
    # Head
    draw.ellipse([12, 7, 17, 12], fill=yellow, outline=yellow_l)
    # Stinger front
    fill_rect(draw, 17, 9, 2, 2, yellow_l)
    draw.point((19, 10), fill=(255, 255, 200))
    # Eyes
    draw.point((15, 8), fill=(30, 30, 30))
    draw.point((15, 11), fill=(30, 30, 30))
    # Body
    draw.ellipse([5, 6, 14, 13], fill=yellow)
    # Stripes
    fill_rect(draw, 7, 7, 1, 6, yellow_d)
    fill_rect(draw, 9, 7, 1, 6, yellow_d)
    fill_rect(draw, 11, 7, 1, 6, yellow_d)
    # Tail
    draw.polygon([(5, 8), (5, 11), (1, 10)], fill=yellow_d)
    draw.point((1, 10), fill=yellow_l)
    # Wings (semi-transparent)
    draw.ellipse([7, 2, 13, 6], fill=yellow_l + (100,))
    draw.ellipse([7, 13, 13, 17], fill=yellow_l + (100,))
    # Wing detail lines
    draw.line([(8, 4), (12, 4)], fill=yellow_l + (150,))
    draw.line([(8, 15), (12, 15)], fill=yellow_l + (150,))

    save(img, "enemies", "fast.png")


def generate_tank():
    """36x36 heavy golem enemy."""
    img = Image.new("RGBA", (36, 36), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    red = hex_to_rgb("#cc4444")
    red_l = hex_to_rgb("#ee6666")
    red_d = darken(red)
    gray = hex_to_rgb("#888888")
    gray_d = hex_to_rgb("#555555")

    # Large body - armored golem
    # Main shell/body
    draw.ellipse([5, 5, 30, 30], fill=red, outline=red_d)
    # Armor plates
    draw.ellipse([8, 8, 27, 27], fill=red_d)
    draw.ellipse([11, 11, 24, 24], fill=red)
    # Central armor plate
    draw.rectangle([13, 13, 22, 22], fill=gray_d)
    draw.rectangle([14, 14, 21, 21], fill=gray)
    # Cross pattern on armor
    fill_rect(draw, 17, 13, 2, 10, gray_d)
    fill_rect(draw, 13, 17, 10, 2, gray_d)
    # Eyes (angry)
    fill_rect(draw, 13, 10, 4, 2, (255, 100, 100))
    fill_rect(draw, 20, 10, 4, 2, (255, 100, 100))
    # Eye glow
    draw.point((14, 10), fill=(255, 200, 200))
    draw.point((21, 10), fill=(255, 200, 200))
    # Spikes/horns
    draw.polygon([(8, 6), (10, 2), (12, 6)], fill=red_l)
    draw.polygon([(24, 6), (26, 2), (28, 6)], fill=red_l)
    # Fists/arms
    draw.ellipse([2, 14, 8, 22], fill=red_d, outline=red_l)
    draw.ellipse([28, 14, 34, 22], fill=red_d, outline=red_l)
    # Knuckle details
    draw.point((4, 17), fill=gray)
    draw.point((31, 17), fill=gray)
    # Feet/base
    fill_rect(draw, 11, 28, 5, 4, red_d)
    fill_rect(draw, 20, 28, 5, 4, red_d)
    # Foot highlights
    fill_rect(draw, 12, 28, 3, 1, red_l)
    fill_rect(draw, 21, 28, 3, 1, red_l)
    # Overall outline emphasis
    draw.ellipse([5, 5, 30, 30], outline=red_l)

    save(img, "enemies", "tank.png")


def generate_ranged():
    """24x24 ranged mage enemy."""
    img = Image.new("RGBA", (24, 24), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    purple = hex_to_rgb("#aa44cc")
    purple_l = hex_to_rgb("#cc66ee")
    purple_d = darken(purple)

    # Mage body - hooded figure top-down
    # Hood/head
    draw.ellipse([7, 3, 16, 12], fill=purple_d)
    draw.ellipse([8, 4, 15, 11], fill=purple)
    # Face shadow under hood
    fill_rect(draw, 9, 6, 6, 4, (30, 10, 40))
    # Glowing eyes
    draw.point((10, 7), fill=(255, 100, 255))
    draw.point((13, 7), fill=(255, 100, 255))
    # Eye glow effect
    draw.point((10, 8), fill=(200, 50, 200, 100))
    draw.point((13, 8), fill=(200, 50, 200, 100))
    # Robe body
    draw.polygon([(8, 10), (5, 20), (18, 20), (16, 10)], fill=purple_d)
    draw.polygon([(9, 10), (6, 19), (17, 19), (15, 10)], fill=purple)
    # Robe highlight
    draw.line([(12, 10), (11, 19)], fill=purple_l, width=1)
    # Staff (pointing right - shooting direction)
    draw.line([(16, 8), (22, 5)], fill=hex_to_rgb("#8B4513"), width=1)
    draw.line([(17, 9), (22, 6)], fill=hex_to_rgb("#6B3503"), width=1)
    # Staff orb
    draw.ellipse([20, 2, 23, 5], fill=(255, 100, 255))
    draw.point((21, 3), fill=(255, 200, 255))
    # Staff glow
    draw.ellipse([19, 1, 24, 6], fill=(255, 100, 255, 60))
    # Robe bottom
    fill_rect(draw, 6, 19, 12, 2, purple_d)
    # Shadow wisps
    draw.point((5, 21), fill=purple_d + (100,))
    draw.point((18, 21), fill=purple_d + (100,))

    save(img, "enemies", "ranged.png")


def generate_exploder():
    """28x28 bomb-like suicide enemy."""
    img = Image.new("RGBA", (28, 28), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    orange = hex_to_rgb("#cc8844")
    orange_l = hex_to_rgb("#ffaa66")
    orange_d = darken(orange)
    yellow = hex_to_rgb("#ffdd44")

    # Swollen body - about to explode
    # Main body
    draw.ellipse([4, 5, 23, 24], fill=orange)
    draw.ellipse([5, 6, 22, 23], fill=orange_l)
    # Inner glow - pulsing energy
    draw.ellipse([9, 10, 18, 19], fill=yellow + (180,))
    draw.ellipse([11, 12, 16, 17], fill=(255, 255, 200, 200))
    # Cracks/veins
    draw.line([(10, 8), (8, 5)], fill=yellow, width=1)
    draw.line([(17, 8), (20, 5)], fill=yellow, width=1)
    draw.line([(7, 15), (4, 14)], fill=yellow, width=1)
    draw.line([(20, 15), (23, 14)], fill=yellow, width=1)
    draw.line([(10, 21), (8, 24)], fill=yellow, width=1)
    draw.line([(17, 21), (19, 24)], fill=yellow, width=1)
    # Fuse on top
    draw.line([(14, 5), (14, 1)], fill=hex_to_rgb("#8B4513"), width=2)
    # Fuse spark
    draw.point((14, 0), fill=(255, 255, 100))
    draw.point((13, 0), fill=(255, 200, 50, 200))
    draw.point((15, 0), fill=(255, 200, 50, 200))
    draw.point((14, 1), fill=(255, 255, 200))
    # Angry eyes
    draw.point((10, 12), fill=(30, 0, 0))
    draw.point((17, 12), fill=(30, 0, 0))
    # Mouth - grimace
    draw.line([(11, 16), (16, 16)], fill=(30, 0, 0), width=1)
    draw.point((11, 15), fill=(30, 0, 0))
    draw.point((16, 15), fill=(30, 0, 0))
    # Surface bumps
    draw.point((7, 10), fill=orange_d)
    draw.point((19, 10), fill=orange_d)
    draw.point((8, 20), fill=orange_d)
    draw.point((18, 20), fill=orange_d)
    # Outline for contrast
    draw.ellipse([4, 5, 23, 24], outline=orange_l)

    save(img, "enemies", "exploder.png")


def generate_elite():
    """32x32 elite enemy with ethereal look."""
    img = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    white = (255, 255, 255)
    silver = hex_to_rgb("#ccccdd")
    silver_l = hex_to_rgb("#eeeeff")
    blue_glow = hex_to_rgb("#88aaff")
    gold = hex_to_rgb("#ffdd44")

    # Aura glow (outer)
    draw.ellipse([2, 2, 29, 29], fill=blue_glow + (40,))
    draw.ellipse([4, 4, 27, 27], fill=blue_glow + (60,))
    # Armored body
    draw.ellipse([7, 6, 24, 26], fill=silver)
    draw.ellipse([8, 7, 23, 25], fill=white)
    # Chest armor
    draw.rectangle([12, 10, 19, 20], fill=silver)
    draw.rectangle([13, 11, 18, 19], fill=silver_l)
    # Armor cross emblem
    fill_rect(draw, 15, 11, 2, 9, gold)
    fill_rect(draw, 13, 14, 6, 2, gold)
    # Helmet/head
    draw.ellipse([11, 3, 20, 12], fill=silver)
    draw.ellipse([12, 4, 19, 11], fill=silver_l)
    # Visor
    fill_rect(draw, 13, 7, 6, 2, (40, 40, 80))
    # Glowing eyes through visor
    draw.point((14, 7), fill=(100, 150, 255))
    draw.point((17, 7), fill=(100, 150, 255))
    # Helmet crest
    fill_rect(draw, 15, 2, 2, 4, gold)
    draw.point((15, 1), fill=gold)
    draw.point((16, 1), fill=gold)
    # Shoulder guards
    draw.ellipse([4, 10, 10, 16], fill=silver, outline=silver_l)
    draw.ellipse([21, 10, 27, 16], fill=silver, outline=silver_l)
    # Arms
    fill_rect(draw, 6, 15, 3, 6, silver)
    fill_rect(draw, 23, 15, 3, 6, silver)
    # Sword (right hand)
    draw.line([(25, 14), (30, 8)], fill=silver_l, width=2)
    draw.point((30, 7), fill=white)
    # Shield glow effect (left)
    draw.ellipse([3, 14, 8, 20], fill=blue_glow + (80,), outline=blue_glow + (140,))
    # Legs
    fill_rect(draw, 12, 22, 3, 5, silver)
    fill_rect(draw, 17, 22, 3, 5, silver)
    # Boots
    fill_rect(draw, 12, 26, 3, 2, (80, 80, 100))
    fill_rect(draw, 17, 26, 3, 2, (80, 80, 100))
    # Sparkle effects
    draw.point((5, 5), fill=white + (200,))
    draw.point((26, 5), fill=white + (200,))
    draw.point((3, 20), fill=white + (150,))
    draw.point((28, 20), fill=white + (150,))

    save(img, "enemies", "elite.png")


def generate_boss():
    """80x80 boss enemy - demonic dragon top-down."""
    img = Image.new("RGBA", (80, 80), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    crimson = hex_to_rgb("#dc143c")
    red_border = hex_to_rgb("#ff4444")
    dark_red = darken(crimson)
    very_dark = darken(crimson, 0.3)
    yellow = hex_to_rgb("#ffdd44")
    orange = hex_to_rgb("#ff8844")

    # Dark aura
    draw.ellipse([5, 5, 74, 74], fill=very_dark + (60,))
    draw.ellipse([8, 8, 71, 71], fill=very_dark + (80,))

    # Wings (spread out, top-down view)
    # Left wing
    wing_l = [
        (15, 25),
        (3, 15),
        (2, 20),
        (1, 30),
        (5, 40),
        (10, 45),
        (18, 40),
    ]
    draw.polygon(wing_l, fill=dark_red, outline=red_border)
    # Wing membrane lines
    draw.line([(5, 20), (15, 35)], fill=crimson, width=1)
    draw.line([(3, 25), (14, 37)], fill=crimson, width=1)
    draw.line([(4, 32), (12, 40)], fill=crimson, width=1)

    # Right wing
    wing_r = [
        (65, 25),
        (77, 15),
        (78, 20),
        (79, 30),
        (75, 40),
        (70, 45),
        (62, 40),
    ]
    draw.polygon(wing_r, fill=dark_red, outline=red_border)
    draw.line([(75, 20), (65, 35)], fill=crimson, width=1)
    draw.line([(77, 25), (66, 37)], fill=crimson, width=1)
    draw.line([(76, 32), (68, 40)], fill=crimson, width=1)

    # Main body
    draw.ellipse([20, 15, 60, 65], fill=crimson, outline=red_border)
    draw.ellipse([23, 18, 57, 62], fill=dark_red)
    # Body scales/plates
    draw.ellipse([28, 25, 52, 55], fill=crimson)
    # Central armor lines
    fill_rect(draw, 39, 20, 2, 40, dark_red)
    for row_y in range(25, 55, 5):
        w = min(10, 25 - abs(row_y - 40))
        if w > 0:
            fill_rect(draw, 40 - w, row_y, w * 2, 1, very_dark)

    # Head
    draw.ellipse([28, 8, 52, 30], fill=crimson, outline=red_border)
    draw.ellipse([30, 10, 50, 28], fill=dark_red)
    # Snout/jaw
    draw.ellipse([33, 5, 47, 16], fill=crimson, outline=red_border)

    # Horns
    draw.polygon([(30, 12), (22, 2), (26, 6), (32, 14)], fill=very_dark)
    draw.polygon([(50, 12), (58, 2), (54, 6), (48, 14)], fill=very_dark)
    draw.line([(22, 2), (24, 4)], fill=red_border, width=1)
    draw.line([(58, 2), (56, 4)], fill=red_border, width=1)

    # Eyes (glowing)
    draw.ellipse([33, 14, 38, 19], fill=(255, 50, 50))
    draw.ellipse([42, 14, 47, 19], fill=(255, 50, 50))
    # Eye glow
    draw.ellipse([34, 15, 37, 18], fill=yellow)
    draw.ellipse([43, 15, 46, 18], fill=yellow)
    # Pupils
    draw.point((36, 16), fill=(20, 0, 0))
    draw.point((44, 16), fill=(20, 0, 0))

    # Mouth
    draw.line([(36, 22), (44, 22)], fill=very_dark, width=2)
    # Teeth/fangs
    draw.point((37, 21), fill=(255, 255, 255))
    draw.point((39, 22), fill=(255, 255, 255))
    draw.point((41, 22), fill=(255, 255, 255))
    draw.point((43, 21), fill=(255, 255, 255))

    # Fire breath hint
    draw.ellipse([36, 23, 44, 26], fill=orange + (120,))

    # Tail
    tail_points = [(40, 62), (38, 68), (35, 73), (30, 76), (27, 77)]
    for i in range(len(tail_points) - 1):
        draw.line([tail_points[i], tail_points[i + 1]], fill=crimson, width=3)
    # Tail tip
    draw.polygon([(27, 77), (23, 79), (25, 75)], fill=red_border)

    # Claws / feet
    # Front left
    draw.ellipse([18, 42, 26, 50], fill=crimson, outline=red_border)
    draw.point((19, 44), fill=yellow)
    draw.point((19, 47), fill=yellow)
    draw.point((20, 49), fill=yellow)
    # Front right
    draw.ellipse([54, 42, 62, 50], fill=crimson, outline=red_border)
    draw.point((61, 44), fill=yellow)
    draw.point((61, 47), fill=yellow)
    draw.point((60, 49), fill=yellow)
    # Back left
    draw.ellipse([22, 55, 30, 63], fill=dark_red, outline=red_border)
    # Back right
    draw.ellipse([50, 55, 58, 63], fill=dark_red, outline=red_border)

    # Glowing energy spots on body
    for gx, gy in [(35, 35), (45, 35), (40, 45), (33, 42), (47, 42)]:
        draw.point((gx, gy), fill=orange + (180,))
        draw.point((gx + 1, gy), fill=orange + (100,))
        draw.point((gx, gy + 1), fill=orange + (100,))

    save(img, "enemies", "boss.png")


# ─── 3. PROJECTILES ───────────────────────────────────────


def generate_magic_bolt():
    """10x10 blue magic bolt."""
    img = Image.new("RGBA", (10, 10), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    blue = hex_to_rgb("#44aaff")
    blue_l = (150, 200, 255)
    white = (255, 255, 255)

    # Glow
    draw.ellipse([0, 0, 9, 9], fill=blue + (80,))
    # Core
    draw.ellipse([2, 2, 7, 7], fill=blue)
    # Bright center
    draw.ellipse([3, 3, 6, 6], fill=blue_l)
    draw.point((4, 4), fill=white)
    draw.point((5, 4), fill=white)
    # Trail hint (left side, moving right)
    draw.point((1, 4), fill=blue + (150,))
    draw.point((1, 5), fill=blue + (150,))
    draw.point((0, 5), fill=blue + (80,))

    save(img, "projectiles", "magic-bolt.png")


def generate_knife():
    """16x8 knife pointing right."""
    img = Image.new("RGBA", (16, 8), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    silver = hex_to_rgb("#cccccc")
    silver_l = hex_to_rgb("#eeeeee")
    silver_d = hex_to_rgb("#999999")
    brown = hex_to_rgb("#8B4513")

    # Handle (left side)
    fill_rect(draw, 0, 2, 5, 4, brown)
    fill_rect(draw, 1, 3, 3, 2, darken(brown, 0.8))
    # Guard
    fill_rect(draw, 5, 1, 1, 6, silver_d)
    # Blade
    draw.polygon([(6, 2), (15, 3), (15, 4), (6, 5)], fill=silver)
    # Blade edge highlight
    draw.line([(6, 2), (14, 3)], fill=silver_l, width=1)
    # Blade tip
    draw.point((15, 3), fill=silver_l)
    draw.point((15, 4), fill=silver_l)
    # Blade shadow
    draw.line([(7, 5), (14, 4)], fill=silver_d, width=1)

    save(img, "projectiles", "knife.png")


def generate_bomb():
    """12x12 classic bomb."""
    img = Image.new("RGBA", (12, 12), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    red = hex_to_rgb("#ff4444")
    dark = (30, 30, 30)
    gray = (80, 80, 80)

    # Fuse
    draw.line([(6, 1), (8, 0)], fill=hex_to_rgb("#8B4513"), width=1)
    # Spark
    draw.point((8, 0), fill=(255, 255, 100))
    draw.point((9, 0), fill=(255, 200, 50, 180))
    # Body
    draw.ellipse([2, 3, 9, 10], fill=dark)
    draw.ellipse([3, 4, 8, 9], fill=gray)
    # Highlight
    draw.point((4, 5), fill=(120, 120, 120))
    draw.point((5, 5), fill=(100, 100, 100))
    # Red glow (danger)
    draw.ellipse([1, 2, 10, 11], outline=red + (120,))

    save(img, "projectiles", "bomb.png")


def generate_drone_bullet():
    """10x10 cyan energy bullet."""
    img = Image.new("RGBA", (10, 10), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cyan = hex_to_rgb("#44ccff")
    cyan_l = (150, 240, 255)
    white = (255, 255, 255)

    # Glow
    draw.ellipse([0, 0, 9, 9], fill=cyan + (60,))
    # Core - slightly elongated for laser feel
    draw.ellipse([1, 2, 8, 7], fill=cyan)
    # Bright center
    draw.ellipse([3, 3, 6, 6], fill=cyan_l)
    draw.point((4, 4), fill=white)
    draw.point((5, 5), fill=white)
    # Trail
    draw.point((1, 4), fill=cyan + (140,))
    draw.point((0, 5), fill=cyan + (80,))

    save(img, "projectiles", "drone-bullet.png")


def generate_enemy_bullet():
    """10x10 hostile pink-red bullet."""
    img = Image.new("RGBA", (10, 10), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    pink = hex_to_rgb("#ff4466")
    pink_l = (255, 150, 170)
    dark = (100, 0, 20)

    # Glow
    draw.ellipse([0, 0, 9, 9], fill=pink + (60,))
    # Spiky shape for hostile feel
    # Core
    draw.ellipse([2, 2, 7, 7], fill=pink)
    draw.ellipse([3, 3, 6, 6], fill=pink_l)
    # Spikes
    draw.point((5, 0), fill=pink)
    draw.point((9, 5), fill=pink)
    draw.point((5, 9), fill=pink)
    draw.point((0, 5), fill=pink)
    # Center
    draw.point((4, 4), fill=(255, 220, 220))
    draw.point((5, 5), fill=(255, 220, 220))

    save(img, "projectiles", "enemy-bullet.png")


# ─── 4. EFFECTS ───────────────────────────────────────────


def generate_orbit_orb():
    """20x20 orange fire orb."""
    img = Image.new("RGBA", (20, 20), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    orange = hex_to_rgb("#ff8844")
    orange_l = hex_to_rgb("#ffaa66")
    yellow = hex_to_rgb("#ffdd44")
    white = (255, 255, 255)

    # Outer glow
    draw.ellipse([1, 1, 18, 18], fill=orange + (50,))
    draw.ellipse([3, 3, 16, 16], fill=orange + (100,))
    # Fire body
    draw.ellipse([5, 5, 14, 14], fill=orange)
    draw.ellipse([6, 6, 13, 13], fill=orange_l)
    # Hot center
    draw.ellipse([7, 7, 12, 12], fill=yellow)
    draw.ellipse([8, 8, 11, 11], fill=white + (230,))
    # Flame wisps
    draw.point((6, 4), fill=orange + (180,))
    draw.point((13, 4), fill=orange + (180,))
    draw.point((4, 8), fill=orange + (150,))
    draw.point((15, 8), fill=orange + (150,))
    draw.point((7, 15), fill=orange + (120,))
    draw.point((12, 15), fill=orange + (120,))

    save(img, "effects", "orbit-orb.png")


def generate_drone():
    """16x16 allied drone."""
    img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cyan = hex_to_rgb("#44ccff")
    cyan_l = hex_to_rgb("#88eeff")
    gray = hex_to_rgb("#888899")
    gray_d = hex_to_rgb("#555566")

    # Propeller blur (top-down, X shape)
    draw.line([(2, 2), (6, 6)], fill=cyan_l + (100,), width=1)
    draw.line([(13, 2), (9, 6)], fill=cyan_l + (100,), width=1)
    draw.line([(2, 13), (6, 9)], fill=cyan_l + (100,), width=1)
    draw.line([(13, 13), (9, 9)], fill=cyan_l + (100,), width=1)
    # Body
    draw.rectangle([5, 5, 10, 10], fill=gray, outline=gray_d)
    # Turret/eye
    draw.ellipse([6, 6, 9, 9], fill=cyan, outline=cyan_l)
    draw.point((7, 7), fill=(255, 255, 255))
    # Gun barrel (pointing right)
    fill_rect(draw, 11, 7, 3, 2, gray_d)
    draw.point((13, 7), fill=cyan + (200,))
    draw.point((13, 8), fill=cyan + (200,))
    # Arms to propellers
    draw.line([(5, 5), (3, 3)], fill=gray_d, width=1)
    draw.line([(10, 5), (12, 3)], fill=gray_d, width=1)
    draw.line([(5, 10), (3, 12)], fill=gray_d, width=1)
    draw.line([(10, 10), (12, 12)], fill=gray_d, width=1)
    # Prop hubs
    for px, py in [(2, 2), (13, 2), (2, 13), (13, 13)]:
        draw.point((px, py), fill=gray)
    # Small lights
    draw.point((5, 7), fill=(255, 100, 100, 200))
    draw.point((5, 8), fill=(100, 255, 100, 200))

    save(img, "effects", "drone.png")


def generate_explosion():
    """384x64 spritesheet: 6 frames of 64x64 explosion."""
    FW, FH = 64, 64
    FRAMES = 6
    img = Image.new("RGBA", (FW * FRAMES, FH), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    yellow = hex_to_rgb("#ffdd44")
    orange = hex_to_rgb("#ff6600")
    red = hex_to_rgb("#ff2200")
    dark_red = hex_to_rgb("#881100")
    gray = (100, 100, 100)
    dark_gray = (60, 60, 60)
    white = (255, 255, 255)

    cx, cy = 32, 32  # center of each frame

    # Frame 0: Initial flash - small bright center
    ox = 0
    draw.ellipse([ox + 24, 24, ox + 40, 40], fill=yellow + (200,))
    draw.ellipse([ox + 20, 20, ox + 44, 44], fill=white + (120,))
    draw.ellipse([ox + 27, 27, ox + 37, 37], fill=white + (250,))

    # Frame 1: Expanding fire
    ox = FW
    draw.ellipse([ox + 12, 12, ox + 52, 52], fill=orange + (180,))
    draw.ellipse([ox + 16, 16, ox + 48, 48], fill=orange)
    draw.ellipse([ox + 22, 22, ox + 42, 42], fill=yellow)
    draw.ellipse([ox + 27, 27, ox + 37, 37], fill=white + (220,))
    # Flame tongues
    for angle_x, angle_y in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        sx, sy = ox + 32 + angle_x * 18, 32 + angle_y * 18
        draw.ellipse([sx - 4, sy - 4, sx + 4, sy + 4], fill=orange + (150,))

    # Frame 2: Maximum size, peak explosion
    ox = FW * 2
    draw.ellipse([ox + 4, 4, ox + 60, 60], fill=red + (100,))
    draw.ellipse([ox + 8, 8, ox + 56, 56], fill=orange + (180,))
    draw.ellipse([ox + 14, 14, ox + 50, 50], fill=orange)
    draw.ellipse([ox + 20, 20, ox + 44, 44], fill=yellow + (220,))
    draw.ellipse([ox + 26, 26, ox + 38, 38], fill=white + (180,))
    # Debris particles
    for dx, dy in [(-22, -8), (20, -12), (-15, 18), (18, 15), (-8, -20), (10, 22)]:
        px, py = ox + 32 + dx, 32 + dy
        draw.ellipse([px - 2, py - 2, px + 2, py + 2], fill=orange + (200,))

    # Frame 3: Starting to dissipate, more smoke
    ox = FW * 3
    draw.ellipse([ox + 6, 6, ox + 58, 58], fill=dark_red + (80,))
    draw.ellipse([ox + 10, 10, ox + 54, 54], fill=orange + (120,))
    draw.ellipse([ox + 16, 16, ox + 48, 48], fill=gray + (100,))
    draw.ellipse([ox + 22, 22, ox + 42, 42], fill=orange + (150,))
    draw.ellipse([ox + 28, 28, ox + 36, 36], fill=yellow + (100,))
    # Smoke puffs
    for dx, dy in [(-16, -10), (14, -14), (-12, 16), (16, 12)]:
        px, py = ox + 32 + dx, 32 + dy
        draw.ellipse([px - 5, py - 5, px + 5, py + 5], fill=gray + (80,))

    # Frame 4: Almost faded, mostly smoke
    ox = FW * 4
    draw.ellipse([ox + 8, 8, ox + 56, 56], fill=dark_gray + (60,))
    draw.ellipse([ox + 14, 14, ox + 50, 50], fill=gray + (70,))
    draw.ellipse([ox + 20, 20, ox + 44, 44], fill=gray + (50,))
    # Lingering embers
    for dx, dy in [(-10, -6), (8, -10), (-6, 12), (10, 8)]:
        px, py = ox + 32 + dx, 32 + dy
        draw.point((px, py), fill=orange + (100,))

    # Frame 5: Last remnants, nearly transparent
    ox = FW * 5
    draw.ellipse([ox + 16, 16, ox + 48, 48], fill=dark_gray + (30,))
    draw.ellipse([ox + 22, 22, ox + 42, 42], fill=gray + (25,))
    # Final wisps
    draw.point((ox + 28, 24), fill=gray + (40,))
    draw.point((ox + 36, 38), fill=gray + (30,))

    save(img, "effects", "explosion.png")


def generate_xp_gem():
    """12x12 diamond-shaped XP gem."""
    img = Image.new("RGBA", (12, 12), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    green_cyan = hex_to_rgb("#44ddaa")
    light = lighten(green_cyan)
    dark = darken(green_cyan)
    white = (255, 255, 255)

    # Diamond shape
    diamond = [(6, 0), (11, 6), (6, 11), (1, 6)]
    # Outer glow
    diamond_glow = [(6, -1), (12, 6), (6, 12), (0, 6)]
    draw.polygon(diamond_glow, fill=green_cyan + (40,))
    # Main shape
    draw.polygon(diamond, fill=green_cyan, outline=light)
    # Facets - left side darker, right side lighter
    draw.polygon([(6, 0), (1, 6), (6, 6)], fill=light)
    draw.polygon([(6, 0), (11, 6), (6, 6)], fill=green_cyan)
    draw.polygon([(1, 6), (6, 11), (6, 6)], fill=dark)
    draw.polygon([(11, 6), (6, 11), (6, 6)], fill=green_cyan)
    # Sparkle
    draw.point((4, 3), fill=white)
    draw.point((3, 4), fill=white + (180,))
    # Outline
    draw.polygon(diamond, outline=light)

    save(img, "effects", "xp-gem.png")


# ─── 5. WORLD ─────────────────────────────────────────────


def generate_ground_tile():
    """64x64 seamless dark ground tile."""
    bg = hex_to_rgb("#1a1a2e")
    border = hex_to_rgb("#2a2a4e")
    detail = hex_to_rgb("#222240")
    accent = hex_to_rgb("#252545")

    img = Image.new("RGBA", (64, 64), bg + (255,))
    draw = ImageDraw.Draw(img)

    # Subtle stone/grid texture
    # Border lines (seamless - draw on both edges so they tile)
    for i in range(64):
        # Horizontal border at top and bottom edges
        draw.point((i, 0), fill=border)
        draw.point((i, 63), fill=border)
        # Vertical border at left and right edges
        draw.point((0, i), fill=border)
        draw.point((63, i), fill=border)

    # Subtle grid pattern for stone tiles
    for x in range(0, 64, 16):
        for y in range(64):
            draw.point((x, y), fill=detail)
    for y in range(0, 64, 16):
        for x in range(64):
            draw.point((x, y), fill=detail)

    # Small decorative details scattered (symmetric for tiling)
    detail_points = [
        (8, 8),
        (24, 8),
        (40, 8),
        (56, 8),
        (8, 24),
        (24, 24),
        (40, 24),
        (56, 24),
        (8, 40),
        (24, 40),
        (40, 40),
        (56, 40),
        (8, 56),
        (24, 56),
        (40, 56),
        (56, 56),
    ]
    for px, py in detail_points:
        draw.point((px, py), fill=accent)
        draw.point((px + 1, py), fill=accent)
        draw.point((px, py + 1), fill=accent)

    # Central decorative dot (spec requirement)
    draw.point((31, 31), fill=border)
    draw.point((32, 31), fill=border)
    draw.point((31, 32), fill=border)
    draw.point((32, 32), fill=border)

    # Add some very subtle random-looking but tileable noise
    # Use symmetric patterns that repeat at tile boundaries
    noise_spots = [
        (5, 13),
        (21, 3),
        (37, 13),
        (53, 3),
        (13, 29),
        (29, 19),
        (45, 29),
        (61, 19),
        (5, 45),
        (21, 35),
        (37, 45),
        (53, 35),
        (13, 61),
        (29, 51),
        (45, 61),
        (61, 51),
        (11, 7),
        (27, 11),
        (43, 7),
        (59, 11),
        (3, 23),
        (19, 27),
        (35, 23),
        (51, 27),
        (11, 39),
        (27, 43),
        (43, 39),
        (59, 43),
        (3, 55),
        (19, 59),
        (35, 55),
        (51, 59),
    ]
    for px, py in noise_spots:
        if 0 <= px < 64 and 0 <= py < 64:
            draw.point((px, py), fill=detail)

    save(img, "world", "ground-tile.png")


# ─── MAIN ─────────────────────────────────────────────────


def main():
    print("Generating Solana Survivors assets...")
    print()

    print("[1/7] Player")
    generate_player()

    print("[2/7] Enemies")
    generate_swarm()
    generate_fast()
    generate_tank()
    generate_ranged()
    generate_exploder()
    generate_elite()
    generate_boss()

    print("[3/7] Projectiles")
    generate_magic_bolt()
    generate_knife()
    generate_bomb()
    generate_drone_bullet()
    generate_enemy_bullet()

    print("[4/7] Effects")
    generate_orbit_orb()
    generate_drone()
    generate_explosion()
    generate_xp_gem()

    print("[5/7] World")
    generate_ground_tile()

    print()
    print("All 18 assets generated!")


if __name__ == "__main__":
    main()
