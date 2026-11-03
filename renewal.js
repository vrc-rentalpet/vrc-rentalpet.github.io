// =============================================================
//  VRCレンタルペットショップ - renewal.js
//  ─ トップページ専用（メニュー・日程チェック・フォーム送信は common.js）
// =============================================================

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===== ヒーローの写真ボード =====
const HERO_ROTATE_INTERVAL = 5000;

(function setupHeroBoard() {
  if (typeof HERO_PHOTOS === 'undefined' || HERO_PHOTOS.length === 0) return;
  const photos = HERO_PHOTOS;
  const imgs = Array.from(document.querySelectorAll('.polaroid__img'));

  const shuffled = [...photos];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  imgs.forEach((img, i) => { img.src = shuffled[i % shuffled.length]; });

  // スマホ用: 全部の写真を横一列に並べて流す（CSS で1列表示のときだけ出す）。
  // 画面幅を変えても切り替わるよう、PCでも組み立てておく。画像はスマホ幅になったときに読み込む
  // （loading="lazy" だと、画面の外で切られている写真が読み込まれず、流れてきたときに白く見えるため）
  const board = document.querySelector('.hero__board');
  const narrow = window.matchMedia('(max-width: 960px)');
  const track = document.createElement('div');
  track.className = 'hero__track';
  const tilts = ['-4deg', '3deg', '-2deg', '4deg', '-3deg', '2deg'];
  // 切れ目なく流すため、同じ並びを2回つなげる
  [...shuffled, ...shuffled].forEach((src, i) => {
    const fig = imgs[0].closest('.polaroid').cloneNode(true);
    fig.style.setProperty('--i', String(Math.min(i, 4)));
    fig.style.setProperty('--r', tilts[i % shuffled.length % tilts.length]);
    const img = fig.querySelector('img');
    img.removeAttribute('style');
    img.removeAttribute('src');
    img.dataset.src = src;
    track.appendChild(fig);
  });
  board.appendChild(track);
  const loadTrack = () => {
    if (!narrow.matches) return;
    track.querySelectorAll('img[data-src]').forEach(img => { img.src = img.dataset.src; img.removeAttribute('data-src'); });
  };
  loadTrack();
  // 環境によって matchMedia の change が届かないことがあるので、resize でも確かめる
  narrow.addEventListener('change', loadTrack);
  window.addEventListener('resize', loadTrack);

  if (photos.length <= imgs.length) return;

  setInterval(() => {
    const target = imgs[Math.floor(Math.random() * imgs.length)];
    const onScreen = imgs.map(img => img.getAttribute('src'));
    const candidates = photos.filter(p => !onScreen.includes(p));
    if (candidates.length === 0) return;
    const next = candidates[Math.floor(Math.random() * candidates.length)];

    if (prefersReducedMotion) {
      target.src = next;
      return;
    }
    target.style.opacity = '0';
    setTimeout(() => {
      target.addEventListener('load', () => { target.style.opacity = ''; }, { once: true });
      target.src = next;
    }, 600);
  }, HERO_ROTATE_INTERVAL);
})();

// ===== キャスト: 値札タグ =====
(function renderCastTags() {
  const grid = document.getElementById('cast-grid');
  if (!grid || typeof CAST_DATA === 'undefined') return;

  const listRow = (modifier, label, items) => items && items.length
    ? `<div class="tag__row tag__row--${modifier}">
         <dt><span>${label}</span></dt>
         <dd><ul>${items.map(item => `<li>${item}</li>`).join('')}</ul></dd>
       </div>`
    : '';

  grid.innerHTML = CAST_DATA.map(cast => {
    const prefs = listRow('like', '好きなワールド', cast.worldGenres) + listRow('ng', 'NG', cast.ngList);
    return `
      <article class="tag">
        <div class="tag__photo">
          <img src="${cast.image}" alt="${cast.name}" loading="lazy">
        </div>
        <h3 class="tag__name">${cast.name}</h3>
        <p class="tag__vrc">VRC: ${cast.vrchatName}</p>
        <p class="tag__desc">${cast.description}</p>
        ${prefs ? `<dl class="tag__prefs">${prefs}</dl>` : ''}
      </article>`;
  }).join('');
})();

// ===== 紹介動画: クリックされるまで YouTube を読み込まない =====
const videoFacade = document.getElementById('video-facade');
videoFacade.addEventListener('click', () => {
  const iframe = document.createElement('iframe');
  iframe.src = 'https://www.youtube.com/embed/T0pC2vz0DdY?autoplay=1';
  iframe.title = 'VRCレンタルペットショップのご紹介';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  iframe.allowFullscreen = true;
  videoFacade.replaceWith(iframe);
  iframe.focus();
});

// ===== 予約フォーム =====
const form = document.getElementById('reservation-form');
const dateError = document.getElementById('date-error');
const otherField = document.getElementById('activity-other-field');
const otherInput = document.getElementById('activity_other_text');

const findTooEarlyDate = setupLeadTimeDates(
  ['date1', 'date2', 'date3'].map(id => document.getElementById(id)),
  dateError
);

form.querySelectorAll('input[name="activity"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const isOther = document.getElementById('activity_other').checked;
    otherField.hidden = !isOther;
    // 「その他」以外のときは欄を無効にして、送信内容に含めない
    otherInput.disabled = !isOther;
    otherInput.required = isOther;
    if (isOther) otherInput.focus();
  });
});

form.addEventListener('submit', (e) => {
  e.preventDefault();

  const tooEarly = findTooEarlyDate();
  if (tooEarly) {
    dateError.hidden = false;
    tooEarly.focus();
    return;
  }

  // 「その他」の欄に空白しか入っていない場合も「未入力」として扱う
  if (!otherInput.disabled && !otherInput.value.trim()) otherInput.value = '';

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const data = Object.fromEntries(new FormData(form).entries());
  submitToGas(form, data, document.getElementById('form-done'));
});
