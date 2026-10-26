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

// ===== 日程（第一〜第三候補） =====
// 通常予約と同じく、最小値を「当日 + 14日後（= 2週間後の同曜日）」にする
const collabDateEls = ['date1', 'date2', 'date3'].map(id => document.getElementById(id));
const collabDateError = document.getElementById('date-error');
const minDateStr = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();

const isTooEarly = (el) => el.value && el.value < minDateStr;

collabDateEls.forEach(el => {
  el.min = minDateStr;
  el.setAttribute('min', minDateStr);

  // 一部端末（iOS Safari 等）のカレンダーUIは min を無視するため、選択時にもチェック
  el.addEventListener('change', () => {
    el.style.borderColor = isTooEarly(el) ? '#e8836e' : '';
    collabDateError.hidden = !collabDateEls.some(isTooEarly);
  });
});

// GAS には「第1候補: 2026-11-15」形式の1つの文字列（event_date）として送る
const buildEventDate = () => collabDateEls
  .map((el, i) => el.value ? `第${i + 1}候補: ${el.value}` : '')
  .filter(Boolean)
  .join('\n');

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

  // 手入力などで2週間以内の日付が入っていたら送信しない
  const tooEarlyDate = collabDateEls.find(isTooEarly);
  if (tooEarlyDate) {
    tooEarlyDate.focus();
    tooEarlyDate.style.borderColor = '#e8836e';
    collabDateError.hidden = false;
    return;
  }

  collabSubmitBtn.disabled = true;
  collabSubmitBtn.innerHTML = '<span class="form__spinner"></span> 送信中...';
  collabError.hidden = true;

  const data = Object.fromEntries(new FormData(collabForm).entries());
  data.event_date = buildEventDate();
  delete data.date1;
  delete data.date2;
  delete data.date3;
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
