// =============================================================
//  VRCレンタルペットショップ - collab.js
//  ─ イベントコラボ依頼ページ（collab.html）専用の処理
//  ─ 送信先 GAS_URL は common.js で定義
// =============================================================

const collabForm = document.getElementById('collab-form');
const collabSuccess = document.getElementById('form-success');
const collabError = document.getElementById('form-error');
const collabSubmitBtn = collabForm.querySelector('.form__submit');
const collabIntro = document.querySelector('.reservation__lead-notice');

// タイムスタンプ記録（bot検知: フォーム表示から送信まで3秒未満はbot判定）
const collabFormLoadedAt = Date.now();

const SUBMIT_LABEL = '<span class="form__submit-paw">🐾</span> 依頼を送信する';

const showCollabError = (message) => {
  collabError.querySelector('p').textContent = message;
  collabError.hidden = false;
  collabSubmitBtn.disabled = false;
  collabSubmitBtn.innerHTML = SUBMIT_LABEL;
};

collabForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  // 空白だけの入力は「未入力」として弾く（required は空白のみを通してしまうため）
  const blankRequired = Array.from(collabForm.querySelectorAll('[required]'))
    .find(el => (el.type === 'text' || el.tagName === 'TEXTAREA') && !el.value.trim());
  if (blankRequired) {
    blankRequired.focus();
    blankRequired.style.borderColor = '#e8836e';
    return;
  }

  collabSubmitBtn.disabled = true;
  collabSubmitBtn.innerHTML = '<span class="form__spinner"></span> 送信中...';
  collabError.hidden = true;

  const data = Object.fromEntries(new FormData(collabForm).entries());
  data.form_type = 'collab';
  data._ts = String(collabFormLoadedAt);

  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.result === 'success') {
      collabForm.hidden = true;
      if (collabIntro) collabIntro.hidden = true;
      collabSuccess.hidden = false;
      collabSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      // GAS側でエラー（レートリミット等）
      showCollabError(result.message || '送信に失敗しました。時間をおいて再度お試しください。');
    }

  } catch (error) {
    console.error('Submit error:', error);
    showCollabError('送信に失敗しました。時間をおいて再度お試しください。');
  }
});

// 赤枠は入力し直したら解除
collabForm.querySelectorAll('.form__input').forEach(el => {
  el.addEventListener('input', () => { el.style.borderColor = ''; });
});
