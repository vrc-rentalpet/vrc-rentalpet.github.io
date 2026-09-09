// =============================================================
//  キャストデータ
//  ─ 追加・編集はこのファイルだけおこなう
//  ─ ページに表示される順番 ＝ この配列の並び順
// =============================================================
//
//  【キャストを追加する手順】
//  1. images/ フォルダにプロフィール画像を置く（例: newcast.png）
//  2. 圧縮スクリプトで WebP に変換する（大きな画像をそのまま置くと
//     ページの読み込みが遅くなります）
//       python tools/optimize_images.py cast --delete images/newcast.png
//     → images/newcast.webp ができ、元ファイルは削除されます
//  3. 下の配列に新しいオブジェクトをコピー＆ペーストして編集
//     （image には .webp のパスを書く）
//  4. push
//
//  【各項目の説明】
//  name          : 表示名
//  vrchatName    : VRChatのユーザーネーム（"VRC: ○○" と表示）
//  image         : 画像ファイルパス（images/ からの相対パス）
//  description   : 紹介文（改行したい場合は <br> を使用）
//                  ★カードの1行は約15文字。それより長い文は文節の区切りで
//                    <br> を入れると「〜だよ！」だけが次の行に落ちるのを防げます
//                    例: 'ご飯とお風呂が<br>とっても大好きだよ！'
//  worldGenres   : 好きなワールドジャンルの配列（空配列 [] なら非表示）
//  ngList        : NG項目の配列（何個でもOK、空配列 [] ならNG欄を非表示）
// =============================================================

const CAST_DATA = [

  // ── りちゃ ──
  {
    name: 'りちゃ',
    vrchatName: 'りちゃ！',
    image: 'images/richa.webp',
    description: 'いろんなものに興味津々なドラゴンです！',
    worldGenres: [
      'ホラーワールド',
    ],
    ngList: [

    ],
  },

  // ── そら ──
  {
    name: 'そら',
    vrchatName: 'SORA｜そら',
    image: 'images/sora.webp',
    description: '少し恥ずかしがりやさんだけど<br>人懐っこくて、元気いっぱいの男の子です！',
    worldGenres: [
      '景色が綺麗なまったりできるワールド',
    ],
    ngList: [
      'ゲームワールド',
      'ホラーワールド',
    ],
  },

  // ── かれーちゃん ──
  {
    name: 'かれーちゃん',
    vrchatName: 'かれーちゃん',
    image: 'images/curry.webp',
    description: 'とても元気いっぱい、活発な猫どらごん！！<br>食いしん坊でご飯をくれる人がだーいすき！！！',
    worldGenres: [
      '食べられるものがたくさんのワールド',
      'ゲームワールド',
    ],
    ngList: [
      'ホラーワールドを無理矢理最後まで',
      '酔うワールド',
    ],
  },

  {
    name: 'Eve/イヴ',
    vrchatName: 'Evernight_Star',
    image: 'images/eve.webp',
    description: 'みんなと遊ぶのが大好きな、<br>自称 願い星の精霊！',
    worldGenres: [
      'ゲームワールド',
    ],
    ngList: [
      'ゲーム以外のホラーワールド',
      '極度に酔うワールド',
    ],
  },

  {
    name: '黒ちゃん',
    vrchatName: '四肢黒助',
    image: 'images/shishikurosuke.webp',
    description: '二つの姿を持つ少し大きなトリちゃん！<br>遊ぶのがとっても好き！',
    worldGenres: [
      'ゲームワールド',
    ],
    ngList: [
      'ホラーワールドで一匹にする',
    ],
  },

  // ── アクア ──
  {
    name: 'アクア',
    vrchatName: 'アウラヴィローズ',
    image: 'images/aqua.webp',
    description: 'オシャレ好きなドラゴンさん<br>のんびり屋さんで一緒にのんびりしてくれる人を探してます',
    worldGenres: [
      '綺麗系ワールド',
      'お部屋ワールド',
    ],
    ngList: [
      'ホラーワールド',
      'V感をいじる・試すような行為<br>（軽く撫でる程度はOK）※痛感持ちです',
      '大きな音を出すこと',
    ],
  },

  // ── とまみ ──
  {
    name: 'とまみ',
    vrchatName: '兎狸（tomami）',
    image: 'images/tomami.webp',
    description: '綺麗好きの猫ちゃん！<br>ご飯とお風呂が<br>とっても大好きだよ！',
    worldGenres: [
      'お風呂や温泉があるワールド',
      '食べ物ギミックがたくさんあるワールド',
    ],
    ngList: [
      'ゲームワールドで遊ぶ',
      'ホラーワールドを探検',
    ],
  },

  // ── きつね ──
  {
    name: 'きつね',
    vrchatName: '赤のきつね',
    image: 'images/kitsune.webp',
    description: 'どんなことにも積極的で<br>なんでも任せろ屋さんの<br>きつねなんだよ！！！',
    worldGenres: [
      '寒色系のチルワールド',
    ],
    ngList: [
      '暖色強めのワールド',
    ],
  },

  // ── 新しいキャストを追加するときはここにコピペ ──
  // {
  //   name: '名前',
  //   vrchatName: 'VRChat表示名',
  //   image: 'images/ファイル名.webp',
  //   description: '紹介文をここに',
  //   worldGenres: [
  //     'ジャンル1',
  //     'ジャンル2',
  //   ],
  //   ngList: [
  //     'NG項目1',
  //     'NG項目2',
  //   ],
  // },

];
