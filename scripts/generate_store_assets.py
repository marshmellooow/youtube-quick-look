from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ICONS = ROOT / "icons"
STORE = ROOT / "store-assets"
BRANDING = ROOT / "branding"

BG = (14, 15, 17)
PANEL = (31, 31, 31)
TEXT = (248, 248, 248)
MUTED = (170, 174, 180)
CORAL = (255, 95, 87)
CORAL_DARK = (226, 67, 61)
CYAN = (102, 232, 255)
WHITE = (255, 255, 255)


def font(size, bold=False):
    names = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/SFNS.ttf",
        "/Library/Fonts/Arial.ttf",
    ]
    for name in names:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    return ImageFont.load_default()


def rounded_gradient(size, radius):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    px = img.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * max(1, size - 1))
            c = tuple(int((32, 33, 36)[i] * (1 - t) + (9, 9, 9)[i] * t) for i in range(3))
            px[x, y] = (*c, 255)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    img.putalpha(mask)
    return img


def draw_mark(draw, box, scale=1.0):
    x0, y0, x1, y1 = box
    w = x1 - x0
    h = y1 - y0
    r = max(4, int(w * 0.14))
    preview = [x0 + w * 0.08, y0 + h * 0.18, x0 + w * 0.70, y0 + h * 0.70]
    draw.rounded_rectangle(preview, radius=r, fill=CORAL)
    draw.rounded_rectangle([preview[0], preview[1], preview[2], preview[1] + h * 0.12], radius=r, fill=(255, 118, 109))
    tri = [
        (x0 + w * 0.36, y0 + h * 0.34),
        (x0 + w * 0.36, y0 + h * 0.56),
        (x0 + w * 0.56, y0 + h * 0.45),
    ]
    draw.polygon(tri, fill=WHITE)
    lw = max(2, int(w * 0.07 * scale))
    cx, cy = x0 + w * 0.68, y0 + h * 0.64
    rr = w * 0.18
    draw.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=CYAN, width=lw)
    draw.line([cx + rr * 0.70, cy + rr * 0.70, x0 + w * 0.94, y0 + h * 0.92], fill=CYAN, width=lw)


def make_icon(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    pad = max(1, round(size * 0.125))
    base = rounded_gradient(size - 2 * pad, max(2, round(size * 0.22)))
    img.alpha_composite(base, (pad, pad))
    draw = ImageDraw.Draw(img)
    draw_mark(draw, [pad + size * 0.12, pad + size * 0.10, size - pad - size * 0.08, size - pad - size * 0.08])
    return img


def text(draw, xy, value, size, fill=TEXT, bold=False, anchor=None):
    draw.text(xy, value, fill=fill, font=font(size, bold), anchor=anchor)


def logo_tile(draw, xy, size):
    x, y = xy
    icon = make_icon(size)
    return icon, (x, y)


def screenshot_main():
    img = Image.new("RGB", (1280, 800), (244, 246, 248))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, 1280, 64], fill=(34, 37, 42))
    d.rounded_rectangle([96, 18, 720, 46], radius=14, fill=(55, 59, 66))
    text(d, (120, 24), "example.com/article-with-video-links", 14, (210, 214, 220))
    text(d, (80, 112), "Preview videos without leaving the page", 34, (22, 24, 28), True)
    text(d, (80, 162), "Hover a YouTube link or thumbnail, press Space, and keep browsing.", 19, (82, 88, 98))
    for i, x in enumerate([80, 310, 540]):
        d.rounded_rectangle([x, 240, x + 190, 120 + 360], radius=8, fill=(255, 255, 255), outline=(226, 230, 235))
        d.rounded_rectangle([x + 16, 258, x + 174, 342], radius=6, fill=(28, 29, 31))
        d.polygon([(x + 82, 285), (x + 82, 315), (x + 110, 300)], fill=CORAL)
        text(d, (x + 16, 370), ["Tutorial overview", "Product demo", "Short clip"][i], 17, (30, 33, 37), True)
        text(d, (x + 16, 402), "youtube.com/watch?v=...", 13, (105, 113, 125))
    d.rounded_rectangle([356, 182, 1076, 622], radius=16, fill=BG)
    d.rectangle([356, 182, 1076, 218], fill=PANEL)
    text(d, (376, 194), "YouTube Quick Look", 13, MUTED)
    d.ellipse([1032, 190, 1054, 212], fill=CORAL)
    d.rectangle([356, 218, 1076, 622], fill=(0, 0, 0))
    d.rounded_rectangle([532, 322, 900, 520], radius=18, fill=(24, 26, 29))
    d.polygon([(674, 374), (674, 468), (758, 421)], fill=CORAL)
    text(d, (894, 584), "Space / Esc to close", 14, (120, 124, 128))
    img.save(STORE / "screenshot-main-1280x800.png")


def screenshot_popup():
    img = Image.new("RGB", (1280, 800), (246, 247, 249))
    d = ImageDraw.Draw(img)
    text(d, (80, 112), "Simple controls", 36, (22, 24, 28), True)
    text(d, (80, 164), "Enable or disable previews and choose the trigger key.", 20, (82, 88, 98))
    d.rounded_rectangle([760, 116, 1040, 318], radius=10, fill=(15, 15, 15))
    text(d, (784, 140), "YouTube Quick Look", 15, WHITE, True)
    d.line([784, 176, 1016, 176], fill=(38, 38, 38), width=1)
    text(d, (784, 196), "Enabled", 14, (221, 221, 221))
    text(d, (784, 218), "Preview on/off", 11, (136, 136, 136))
    d.rounded_rectangle([962, 195, 1000, 217], radius=11, fill=CORAL)
    d.ellipse([980, 197, 998, 215], fill=WHITE)
    d.line([784, 244, 1016, 244], fill=(38, 38, 38), width=1)
    text(d, (784, 264), "Trigger key", 14, (221, 221, 221))
    text(d, (784, 286), "When hovering a link", 11, (136, 136, 136))
    d.rounded_rectangle([936, 260, 1016, 291], radius=6, fill=(31, 31, 31), outline=(70, 70, 70))
    text(d, (976, 267), "Space", 12, WHITE, anchor="ma")
    icon, pos = logo_tile(d, (154, 268), 192)
    img.paste(icon, pos, icon)
    text(d, (390, 300), "Keyboard-first previews", 28, (22, 24, 28), True)
    text(d, (390, 348), "No account required. No analytics. Settings stay in Chrome sync storage.", 18, (82, 88, 98))
    img.save(STORE / "screenshot-popup-1280x800.png")


def promo(width, height, path, headline_size):
    img = Image.new("RGB", (width, height), (14, 15, 17))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, width, height], fill=BG)
    d.rounded_rectangle([int(width * 0.58), -40, width + 60, height + 40], radius=36, fill=(25, 27, 31))
    icon = make_icon(int(height * 0.46))
    img.paste(icon, (int(width * 0.67), int(height * 0.25)), icon)
    text(d, (int(width * 0.08), int(height * 0.28)), "YouTube Quick Look", headline_size, WHITE, True)
    text(d, (int(width * 0.08), int(height * 0.50)), "Fast keyboard previews for YouTube links", max(14, int(headline_size * 0.42)), MUTED)
    d.rounded_rectangle([int(width * 0.08), int(height * 0.68), int(width * 0.08) + 126, int(height * 0.68) + 34], radius=17, fill=CORAL_DARK)
    text(d, (int(width * 0.08) + 63, int(height * 0.68) + 8), "Hover + Space", 13, WHITE, True, anchor="ma")
    img.save(STORE / path)


def main():
    ICONS.mkdir(exist_ok=True)
    STORE.mkdir(exist_ok=True)
    BRANDING.mkdir(exist_ok=True)
    for size in [16, 32, 48, 128]:
        make_icon(size).save(ICONS / f"icon{size}.png")
    make_icon(512).save(BRANDING / "logo-512.png")
    promo(440, 280, "promo-small-440x280.png", 30)
    promo(1400, 560, "promo-marquee-1400x560.png", 72)
    screenshot_main()
    screenshot_popup()


if __name__ == "__main__":
    main()
