"""Annotate the YouTube Quick Look screenshot with a 'Press Space' badge and an arrow."""
from pathlib import Path
import math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "store-assets" / "screenshot-raw.png"
OUT = ROOT / "store-assets" / "screenshot-annotated.png"

WHITE = (255, 255, 255)
CORAL = (255, 95, 87)
SHADOW = (0, 0, 0, 180)


def font(size, bold=True):
    for path in [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/SFNS.ttf",
    ]:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    return ImageFont.load_default()


def draw_pill(draw, xy, text, font_obj, pad_x=28, pad_y=14, bg=WHITE, fg=(15, 15, 15)):
    """Draw a rounded pill with text, centered on xy. Returns its bbox."""
    bbox = draw.textbbox((0, 0), text, font=font_obj)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    w = tw + pad_x * 2
    h = th + pad_y * 2
    x, y = xy
    box = [x - w // 2, y - h // 2, x + w // 2, y + h // 2]
    radius = h // 2
    draw.rounded_rectangle(box, radius=radius, fill=bg)
    draw.text((x - tw // 2 - bbox[0], y - th // 2 - bbox[1]), text, font=font_obj, fill=fg)
    return box


def draw_kbd(draw, xy, text, font_obj, pad_x=24, pad_y=12):
    """Draw a keyboard key (lighter, with border)."""
    return draw_pill(draw, xy, text, font_obj, pad_x=pad_x, pad_y=pad_y,
                     bg=(245, 245, 245), fg=(15, 15, 15))


def quad_bezier(p0, p1, p2, steps=80):
    pts = []
    for i in range(steps + 1):
        t = i / steps
        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0]
        y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]
        pts.append((x, y))
    return pts


def draw_curved_arrow(draw, start, end, ctrl, color=CORAL, width=10):
    pts = quad_bezier(start, ctrl, end)
    # Linie
    draw.line(pts, fill=color, width=width, joint="curve")
    # Pfeilspitze
    p_end = pts[-1]
    p_prev = pts[-6]
    angle = math.atan2(p_end[1] - p_prev[1], p_end[0] - p_prev[0])
    size = 38
    spread = math.radians(28)
    tip = p_end
    left = (p_end[0] - size * math.cos(angle - spread),
            p_end[1] - size * math.sin(angle - spread))
    right = (p_end[0] - size * math.cos(angle + spread),
             p_end[1] - size * math.sin(angle + spread))
    draw.polygon([tip, left, right], fill=color)


def main():
    img = Image.open(SRC).convert("RGBA")
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))

    # Pass 1: shadow layer (for arrow + text), blurred
    shadow_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow_layer)

    # Pass 2: main draw
    draw = ImageDraw.Draw(overlay)

    # Coordinates (image is 2700x1302). Source = bottom thumbnail area; target = popup top-left.
    start = (520, 770)        # an der LG-OLED-Thumbnail
    end   = (1320, 250)       # auf den Popup-Header
    ctrl  = (820, 250)        # Kontrollpunkt: erst hoch, dann nach rechts

    # Shadow pass for the arrow
    draw_curved_arrow(shadow_draw, (start[0] + 6, start[1] + 6),
                      (end[0] + 6, end[1] + 6),
                      (ctrl[0] + 6, ctrl[1] + 6),
                      color=(0, 0, 0, 200), width=14)

    # Real arrow
    draw_curved_arrow(draw, start, end, ctrl, color=CORAL, width=12)

    # Badge: "Press" pill + Space-key pill
    f_text = font(58, bold=True)
    f_key = font(50, bold=True)

    badge_y = 460
    badge_cx = 900

    # shadow for badges
    sf_text = font(58, bold=True)
    sf_key = font(50, bold=True)

    # measure widths to layout side by side
    pad_x_pill = 28
    pad_x_kbd = 24
    pad_y = 14

    def text_w(txt, fobj, pad):
        bbox = draw.textbbox((0, 0), txt, font=fobj)
        return (bbox[2] - bbox[0]) + pad * 2

    w_press = text_w("Press", f_text, pad_x_pill)
    w_space = text_w("⎵  Space", f_key, pad_x_kbd)
    gap = 22
    total_w = w_press + gap + w_space

    left_edge = badge_cx - total_w // 2
    press_center = (left_edge + w_press // 2, badge_y)
    space_center = (left_edge + w_press + gap + w_space // 2, badge_y)

    # shadows
    shadow_draw.rounded_rectangle(
        [press_center[0] - w_press // 2 + 6, badge_y - 50 + 6,
         press_center[0] + w_press // 2 + 6, badge_y + 50 + 6],
        radius=50, fill=(0, 0, 0, 160))
    shadow_draw.rounded_rectangle(
        [space_center[0] - w_space // 2 + 6, badge_y - 45 + 6,
         space_center[0] + w_space // 2 + 6, badge_y + 45 + 6],
        radius=45, fill=(0, 0, 0, 160))

    # actual pills
    draw_pill(draw, press_center, "Press", f_text, pad_x=pad_x_pill, pad_y=pad_y,
              bg=CORAL, fg=WHITE)
    draw_kbd(draw, space_center, "⎵  Space", f_key, pad_x=pad_x_kbd, pad_y=pad_y)

    # blur shadow
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(radius=8))

    composed = Image.alpha_composite(img, shadow_layer)
    composed = Image.alpha_composite(composed, overlay)
    composed.convert("RGB").save(OUT, "PNG")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
