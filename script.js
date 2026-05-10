// =============================================================
//  VRCレンタルペットショップ - script.js
// =============================================================

// ===== Hamburger Menu =====
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navMenu.classList.toggle('open');
});

// Close menu on link click
navMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('open');
  });
});

// ===== "Other" radio toggle =====
const activityOther = document.getElementById('activity_other');
const activityOtherText = document.getElementById('activity_other_text');
const activityRadios = document.querySelectorAll('input[name="activity"]');

activityRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    if (activityOther.checked) {
      activityOtherText.disabled = false;
      activityOtherText.focus();
    } else {
      activityOtherText.disabled = true;
      activityOtherText.value = '';
    }
  });
});

// ===== Form Submission =====
// GAS Web App URL（クライアント側に露出するが、GAS側で防御済み）
// - ハニーポット / タイムスタンプ検証 / 必須フィールド検証
// - 入力値サニタイズ / レートリミット(個別+全体)
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwQCV_GPfOoFDjRymzRQ-1US61XkLvOIjGjZAYQEe_OfgQW80xriLPTam1jI0DaRdNP7g/exec';

const form = document.getElementById('reservation-form');
const formSuccess = document.getElementById('form-success');
const formError = document.getElementById('form-error');
const submitBtn = form.querySelector('.form__submit');

// タイムスタンプ記録（bot検知: フォーム表示から送信まで3秒未満はbot判定）
const formLoadedAt = Date.now();

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Validate "other" text when "other" is selected
  if (activityOther.checked && !activityOtherText.value.trim()) {
    activityOtherText.focus();
    activityOtherText.style.borderColor = '#e8836e';
    return;
  }

  // Disable button & show loading
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="form__spinner"></span> 送信中...';
  formError.hidden = true;

  // Collect form data
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  // タイムスタンプを付与（GAS側でbot判定に使用）
  data._ts = String(formLoadedAt);

  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.result === 'success') {
      form.hidden = true;
      formSuccess.hidden = false;
      formSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      // GAS側でエラー（レートリミット等）
      formError.querySelector('p').textContent = result.message || '送信に失敗しました。時間をおいて再度お試しください。';
      formError.hidden = false;
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="form__submit-paw">🐾</span> 予約を送信する';
    }

  } catch (error) {
    console.error('Submit error:', error);
    formError.querySelector('p').textContent = '送信に失敗しました。時間をおいて再度お試しください。';
    formError.hidden = false;
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span class="form__submit-paw">🐾</span> 予約を送信する';
  }
});

// ===== Hero Polaroid Photos (hero-photos.js からランダム選出 & 自動切り替え) =====
const HERO_ROTATE_INTERVAL = 5000;   // 何ミリ秒ごとに 1 枚切り替えるか
const HERO_FADE_DURATION   = 600;    // フェードにかける時間（ミリ秒）

function setupHeroPhotos() {
  if (typeof HERO_PHOTOS === 'undefined' || HERO_PHOTOS.length === 0) return;
  const imgs = Array.from(document.querySelectorAll('.polaroid__img'));
  if (imgs.length === 0) return;

  // フェード用の transition を仕込む
  imgs.forEach(img => {
    img.style.transition = `opacity ${HERO_FADE_DURATION}ms ease`;
  });

  // Fisher-Yates でシャッフル
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // 初期表示：シャッフルした上で各枠に割り当て
  const pool = shuffle(HERO_PHOTOS);
  imgs.forEach((img, i) => {
    img.src = pool[i % pool.length];
  });

  // リストが枠数以下なら、入れ替える写真がないので回転は止める
  if (HERO_PHOTOS.length <= imgs.length) return;

  // 一定間隔でランダム 1 枚をフェード切り替え
  setInterval(() => {
    // 入れ替え対象の枠をランダム選出
    const targetIdx = Math.floor(Math.random() * imgs.length);
    const target = imgs[targetIdx];

    // 現在画面に出ていない写真の中から選ぶ
    const onScreen = imgs.map(img => img.getAttribute('src'));
    const candidates = HERO_PHOTOS.filter(p => !onScreen.includes(p));
    if (candidates.length === 0) return;
    const next = candidates[Math.floor(Math.random() * candidates.length)];

    // フェードアウト → src 差し替え → フェードイン
    target.style.opacity = '0';
    setTimeout(() => {
      target.src = next;
      // 画像のロード完了を待ってから戻す（チラつき防止）
      const onLoad = () => {
        target.style.opacity = '';
        target.removeEventListener('load', onLoad);
      };
      target.addEventListener('load', onLoad);
      // 既にキャッシュ済みで load が発火しないケースに備えて保険
      setTimeout(() => { target.style.opacity = ''; }, HERO_FADE_DURATION);
    }, HERO_FADE_DURATION);
  }, HERO_ROTATE_INTERVAL);
}

setupHeroPhotos();

// ===== Cast Cards (cast-data.js から自動生成) =====
function renderCastCards() {
  const grid = document.getElementById('cast-grid');
  if (!grid || typeof CAST_DATA === 'undefined') return;

  grid.innerHTML = CAST_DATA.map(cast => {
    // 好きなワールドジャンル: worldGenres が空なら非表示
    const likesSection = cast.worldGenres && cast.worldGenres.length > 0
      ? `<div class="cast__likes">
           <span class="cast__likes-label">好きなワールドジャンル</span>
           <ul class="cast__likes-list">
             ${cast.worldGenres.map(g => `<li>${g}</li>`).join('')}
           </ul>
         </div>`
      : '';

    // NG欄: ngList が空なら非表示
    const ngSection = cast.ngList && cast.ngList.length > 0
      ? `<div class="cast__ng">
           <span class="cast__ng-label">NG</span>
           <ul class="cast__ng-list">
             ${cast.ngList.map(ng => `<li>${ng}</li>`).join('')}
           </ul>
         </div>`
      : '';

    // 好き／NG をまとめるラッパー（カード下部に揃える）
    const tagsSection = (likesSection || ngSection)
      ? `<div class="cast__tags">${likesSection}${ngSection}</div>`
      : '';

    return `
      <div class="cast__card">
        <div class="cast__image-wrap">
          <img src="${cast.image}" alt="${cast.name}" class="cast__image" loading="lazy">
        </div>
        <div class="cast__info">
          <h3 class="cast__name">${cast.name}</h3>
          <p class="cast__vrchat-name">VRC: ${cast.vrchatName}</p>
          <p class="cast__description">${cast.description}</p>
          ${tagsSection}
        </div>
      </div>`;
  }).join('');
}

renderCastCards();

// ===== Scroll Animations =====
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

// Add fade-in class to animatable elements
document.querySelectorAll('.about__card, .cast__card, .schedule__card, .rules__card, .form__group').forEach(el => {
  el.classList.add('fade-in');
  observer.observe(el);
});

// ===== Floating Paw Particles =====
function createPawParticles() {
  const container = document.getElementById('particles');
  const pawEmojis = ['🐾', '🐱', '🐶', '🦴', '🐾'];

  for (let i = 0; i < 12; i++) {
    const paw = document.createElement('span');
    paw.className = 'paw-float';
    paw.textContent = pawEmojis[i % pawEmojis.length];
    paw.style.left = Math.random() * 100 + '%';
    paw.style.top = Math.random() * 100 + '%';
    paw.style.fontSize = (1 + Math.random() * 2) + 'rem';
    paw.style.animationDelay = (Math.random() * 6) + 's';
    paw.style.animationDuration = (4 + Math.random() * 4) + 's';
    container.appendChild(paw);
  }
}

createPawParticles();

// ===== Header background on scroll & Scroll to top =====
const header = document.querySelector('.header');
const scrollTopBtn = document.getElementById('scroll-top');

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    header.style.boxShadow = '0 2px 20px rgba(44, 74, 90, 0.1)';
  } else {
    header.style.boxShadow = 'none';
  }

  // Show/hide scroll-to-top button
  if (scrollTopBtn) {
    if (window.scrollY > 400) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  }
});

if (scrollTopBtn) {
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

