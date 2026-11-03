// =============================================================
//  VRCレンタルペットショップ - common.js
//  ─ トップ（index.html）とコラボ依頼（collab.html）の共通処理
// =============================================================

// GAS Web App URL（予約フォーム・コラボ依頼フォーム共通の送信先）
// クライアント側に露出するが、GAS側で防御済み
// - ハニーポット / タイムスタンプ検証 / 必須フィールド検証
// - 入力値サニタイズ / レートリミット(個別+全体)
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwQCV_GPfOoFDjRymzRQ-1US61XkLvOIjGjZAYQEe_OfgQW80xriLPTam1jI0DaRdNP7g/exec';

// タイムスタンプ記録（bot検知: フォーム表示から送信まで3秒未満はbot判定）
const formLoadedAt = Date.now();

// ===== ナビゲーション（スマホのメニュー） =====
const navToggle = document.getElementById('nav-toggle');
const navPanel = document.getElementById('nav-panel');

const setMenuOpen = (open) => {
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
  navPanel.hidden = !open;
};

navToggle.addEventListener('click', () => {
  setMenuOpen(navToggle.getAttribute('aria-expanded') !== 'true');
});

navPanel.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => setMenuOpen(false));
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !navPanel.hidden) {
    setMenuOpen(false);
    navToggle.focus();
  }
});

// ===== ステッカー文字（見出し・店名）の字間をそろえる =====
// 全角の字形は文字ごとに左右の空きがバラバラで（例: 「ット」は文字幅の 58%、「ルペ」は 4%）、
// フチ取りのある大きな文字ではその差が目立つ。このフォントは字詰め機能（palt）に対応していないため、
// 表示時に各文字の字形の幅を測り、字形どうしの間隔が「フチの太さ＋0.08em」になるよう1文字ずつ字間を付ける。
// （margin ではなく letter-spacing で付ける。margin の部分にはリンクの下線が引かれず、途切れてしまうため）
// ふつうの文章には適用しない。漢字のように枠いっぱいに詰まった字まで広がって「無 言 勢」のように
// 間延びして見えるため、本文はフォント本来の字間（ベタ組み）のままにしている。
// JS が動かない場合は、CSS の letter-spacing のまま表示される。
const STICKER_SELECTOR = '.sticker-title, .nav__logo-text';
const STICKER_GAP_EM = 0.08;

const glyphCache = new Map();
const glyphCtx = document.createElement('canvas').getContext('2d');

// 文字の字形の左右の位置と送り幅（em）。100px で測ると丸め誤差が小さい
function glyph(ch, weight, family) {
  const key = `${weight}|${family}|${ch}`;
  if (!glyphCache.has(key)) {
    glyphCtx.font = `${weight} 100px ${family}`;
    const m = glyphCtx.measureText(ch);
    glyphCache.set(key, { left: -m.actualBoundingBoxLeft / 100, right: m.actualBoundingBoxRight / 100, advance: m.width / 100 });
  }
  return glyphCache.get(key);
}

// ステッカー文字: 全文字を span で包み（見出し全体は aria-label で読み上げ）、フチの太さに合わせて余白を付ける
function wrapStickerChars(el) {
  if (el.dataset.kerned) return;
  if (!el.closest('[aria-label]')) el.setAttribute('aria-label', el.textContent.trim());
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach(node => {
    const frag = document.createDocumentFragment();
    for (const ch of node.data) {
      if (/\s/.test(ch)) {
        frag.appendChild(document.createTextNode(ch));
        continue;
      }
      const span = document.createElement('span');
      span.className = 'k';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = ch;
      frag.appendChild(span);
    }
    node.replaceWith(frag);
  });
  el.dataset.kerned = 'true';
}

function kernStickerText(el) {
  const cs = getComputedStyle(el);
  const size = parseFloat(cs.fontSize);
  const target = (parseFloat(cs.webkitTextStrokeWidth) || 0) / size + STICKER_GAP_EM;
  // 画面に出ている文字だけを対象にする（スマホで隠す「VRC」など）
  const chars = Array.from(el.querySelectorAll('.k')).filter(k => k.getClientRects().length);
  el.style.letterSpacing = '0';
  chars.forEach((k, i) => {
    if (i === chars.length - 1) { k.style.letterSpacing = ''; return; }
    const a = { ch: k.textContent, weight: cs.fontWeight, family: cs.fontFamily, size };
    const b = { ch: chars[i + 1].textContent, weight: cs.fontWeight, family: cs.fontFamily, size };
    // ステッカー文字は句読点や欧文も含めて、すべての字形の間隔をそろえる
    const ga = glyph(a.ch, a.weight, a.family), gb = glyph(b.ch, b.weight, b.family);
    k.style.letterSpacing = `${(target - ((ga.advance - ga.right) + gb.left)).toFixed(3)}em`;
  });
  // 行末の文字に付いた字間は行の右側に余白として残り、行が左に寄って見えるので外す。
  // ただし外したことで次の文字が同じ行に戻る（ぎりぎり収まる幅の）ときは、字間が消えるので元に戻す
  const onNextLine = (k, next) => {
    const a = k.getBoundingClientRect(), b = next.getBoundingClientRect();
    return b.top - a.top > a.height / 2;
  };
  chars.forEach((k, i) => {
    const next = chars[i + 1];
    if (!next || !onNextLine(k, next)) return;
    const spacing = k.style.letterSpacing;
    k.style.letterSpacing = '';
    if (!onNextLine(k, next)) k.style.letterSpacing = spacing;
  });
}

// ボタン・選択肢・「必須」札の文字を、字形の見た目で左右中央にそろえる。
// 文字の枠は中央でも、最初の字の左の空きと最後の字の右の空きが違うと（例: 「！」は右側が大きく空く）
// 見た目の文字が左右どちらかに寄るので、その差の半分だけ文字をずらす
const CENTERED_SELECTOR = '.btn, .chip > span, .req';

function opticalCenter(el) {
  let holder = el.firstElementChild && el.childNodes.length === 1 ? el.firstElementChild : null;
  if (!holder) {
    const text = Array.from(el.childNodes).find(n => n.nodeType === 3 && n.data.trim());
    if (!text || el.children.length) return;
    holder = document.createElement('span');
    text.replaceWith(holder);
    holder.appendChild(text);
  }
  const label = el.textContent.trim();
  if (!label) return;
  const cs = getComputedStyle(el);
  const size = parseFloat(cs.fontSize);
  const first = glyph(label[0], cs.fontWeight, cs.fontFamily);
  const last = glyph(label[label.length - 1], cs.fontWeight, cs.fontFamily);
  const leftSpace = first.left * size;
  const rightSpace = (last.advance - last.right) * size;
  holder.style.display = 'inline-block';
  holder.style.translate = `${((rightSpace - leftSpace) / 2).toFixed(2)}px 0`;
}

(async function setupKerning() {
  if (!document.fonts) return;
  // Google Fonts は文字ごとにフォントを分割配信するので、測る前にページで使う文字のフォントを読み込む
  const text = document.body.textContent.replace(/\s+/g, '');
  const family = getComputedStyle(document.body).fontFamily;
  await Promise.all(['500', '700'].map(w => document.fonts.load(`${w} 100px ${family}`, text)));

  document.querySelectorAll(CENTERED_SELECTOR).forEach(opticalCenter);
  const stickers = Array.from(document.querySelectorAll(STICKER_SELECTOR));
  stickers.forEach(el => { wrapStickerChars(el); kernStickerText(el); });

  // ステッカー文字は画面幅でフチの太さや表示する文字が変わるので、幅が変わったら測り直す
  let raf = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => stickers.forEach(kernStickerText));
  });
})();

// ===== 日程: 2週間後以降のみ選べる =====
// 最小値は「当日 + 14日後（= 2週間後の同曜日）」。
// 一部端末（iOS Safari 等）のカレンダーは min を無視するので、選択時にもチェックする。
// 戻り値は「2週間以内の日付が入っている欄」を返す関数（送信前のチェック用）
function setupLeadTimeDates(dateEls, errorEl) {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  const minDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const isTooEarly = (el) => Boolean(el.value) && el.value < minDateStr;

  dateEls.forEach(el => {
    el.min = minDateStr;
    el.addEventListener('change', () => {
      el.setAttribute('aria-invalid', String(isTooEarly(el)));
      errorEl.hidden = !dateEls.some(isTooEarly);
    });
  });

  return () => dateEls.find(isTooEarly);
}

// ===== フォーム送信（予約・コラボ依頼共通） =====
// 送信中はボタンを押せなくし、成功したらフォームを「送信完了」の表示と入れ替える。
// 失敗したら（GAS 側のレートリミット等も含む）フォームの下に理由を出して、もう一度押せるように戻す
const SEND_ERROR_MESSAGE = '送信に失敗しました。時間をおいて再度お試しください。';

function setButtonLabel(button, text) {
  (button.firstElementChild || button).textContent = text;
  opticalCenter(button);
}

async function submitToGas(form, data, doneEl) {
  const button = form.querySelector('[type="submit"]');
  const resultEl = form.querySelector('.form__result');
  const label = button.textContent.trim();
  button.disabled = true;
  setButtonLabel(button, '送信中…');
  resultEl.hidden = true;

  const showError = (message) => {
    resultEl.textContent = message || SEND_ERROR_MESSAGE;
    resultEl.hidden = false;
    button.disabled = false;
    setButtonLabel(button, label);
  };

  try {
    data._ts = String(formLoadedAt);
    const response = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    const result = await response.json();

    if (result.result !== 'success') {
      showError(result.message);
      return;
    }
    form.hidden = true;
    doneEl.hidden = false;
    doneEl.focus({ preventScroll: true });
    doneEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (error) {
    console.error('Submit error:', error);
    showError();
  }
}
