"""
画像圧縮スクリプト（サイトの表示速度対策）
==================================================

VRChat のスクリーンショット（2560x1440 / 3840x2160 の PNG、1 枚 2〜7MB）を
そのまま置くとページが極端に重くなるため、サイトに置く前にこのスクリプトで
表示サイズに合わせて縮小 & WebP 化してください。

【使い方】（リポジトリ直下で実行）

  ヒーロー写真（コルクボードのポラロイド）:
    python tools/optimize_images.py hero images/hero/VRChat_xxx.png

  キャストのプロフィール画像:
    python tools/optimize_images.py cast images/newcast.png

  複数ファイルやワイルドカードも OK:
    python tools/optimize_images.py hero images/hero/*.png

  変換後に元ファイルを削除したい場合は --delete を付ける:
    python tools/optimize_images.py hero --delete images/hero/*.png

【出力】
  元ファイルと同じ場所に、同じ名前で拡張子だけ .webp に変えたファイルを作ります。
  例: images/hero/VRChat_xxx.png → images/hero/VRChat_xxx.webp
  作った .webp のパスを hero-photos.js / cast-data.js に書いてください。

【サイズの根拠】
  hero: ポラロイド枠は最大 220px 幅・縦横比 4:5 で中央トリミング表示
        （style.css の .polaroid--1 / .polaroid__frame）。
        高解像度ディスプレイ向けに約 2.4 倍の 520x650 に中央クロップ。
  cast: キャストカードは正方形・object-fit: cover 表示。
        短辺 800px まで縮小（縦横比は維持）。

必要ライブラリ: Pillow（pip install pillow）
"""

import argparse
import glob
import sys
from pathlib import Path

from PIL import Image, ImageOps

HERO_SIZE = (520, 650)   # 4:5
CAST_SHORT_SIDE = 800
WEBP_QUALITY = 82


def convert_hero(im: Image.Image) -> Image.Image:
    # object-fit: cover と同じ「中央を切り出して枠いっぱいに」を事前に行う
    return ImageOps.fit(im, HERO_SIZE, method=Image.LANCZOS, centering=(0.5, 0.5))


def convert_cast(im: Image.Image) -> Image.Image:
    w, h = im.size
    short = min(w, h)
    if short <= CAST_SHORT_SIDE:
        return im
    scale = CAST_SHORT_SIDE / short
    return im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)


def uses_alpha(im: Image.Image) -> bool:
    if im.mode not in ("RGBA", "LA"):
        return "transparency" in im.info
    return im.getchannel("A").getextrema()[0] < 255


def process(path: Path, mode: str, delete: bool) -> None:
    im = Image.open(path)
    im = ImageOps.exif_transpose(im)

    # 透過を使っていない画像は RGB に落として容量を減らす
    if uses_alpha(im):
        im = im.convert("RGBA")
    else:
        im = im.convert("RGB")

    out_im = convert_hero(im) if mode == "hero" else convert_cast(im)
    out = path.with_suffix(".webp")
    out_im.save(out, "WEBP", quality=WEBP_QUALITY, method=6)

    before = path.stat().st_size // 1024
    after = out.stat().st_size // 1024
    print(f"{path} ({im.size[0]}x{im.size[1]}, {before}KB)"
          f" -> {out} ({out_im.size[0]}x{out_im.size[1]}, {after}KB)")

    if delete and out != path:
        path.unlink()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("mode", choices=["hero", "cast"], help="hero: ポラロイド写真 / cast: プロフィール画像")
    parser.add_argument("files", nargs="+", help="変換する画像（ワイルドカード可）")
    parser.add_argument("--delete", action="store_true", help="変換後に元ファイルを削除する")
    args = parser.parse_args()

    paths = []
    for pattern in args.files:
        matched = glob.glob(pattern)
        paths.extend(Path(p) for p in matched) if matched else paths.append(Path(pattern))

    ok = True
    for p in paths:
        if p.suffix.lower() == ".webp":
            print(f"skip (already webp): {p}")
            continue
        if not p.is_file():
            print(f"not found: {p}", file=sys.stderr)
            ok = False
            continue
        process(p, args.mode, args.delete)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
