// =============================================================
//  VRCレンタルペットショップ - common.js
//  ─ トップページ（index.html）とコラボ依頼ページ（collab.html）の共通処理
// =============================================================

// GAS Web App URL（予約フォーム・コラボ依頼フォーム共通の送信先）
// クライアント側に露出するが、GAS側で防御済み
// - ハニーポット / タイムスタンプ検証 / 必須フィールド検証
// - 入力値サニタイズ / レートリミット(個別+全体)
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwQCV_GPfOoFDjRymzRQ-1US61XkLvOIjGjZAYQEe_OfgQW80xriLPTam1jI0DaRdNP7g/exec';

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
