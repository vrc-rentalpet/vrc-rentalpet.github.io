// =============================================================
//  VRCレンタルペットショップ - collab.js
//  ─ コラボ依頼ページ専用（メニュー・日程チェック・フォーム送信は common.js）
// =============================================================

const collabForm = document.getElementById('collab-form');
const collabDateError = document.getElementById('date-error');
const collabDateEls = ['date1', 'date2', 'date3'].map(id => document.getElementById(id));

const findTooEarlyDate = setupLeadTimeDates(collabDateEls, collabDateError);

// GAS には「第1候補: 2026-11-15」形式の1つの文字列（event_date）として送る
const buildEventDate = () => collabDateEls
  .map((el, i) => el.value ? `第${i + 1}候補: ${el.value}` : '')
  .filter(Boolean)
  .join('\n');

// 必須の文字欄に空白しか入っていない場合も「未入力」として扱う
const textFields = Array.from(collabForm.querySelectorAll('input[type="text"][required], textarea[required]'));
textFields.forEach(el => {
  el.addEventListener('input', () => el.removeAttribute('aria-invalid'));
});

collabForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const blank = textFields.find(el => !el.value.trim());
  if (blank) {
    blank.value = '';
    blank.setAttribute('aria-invalid', 'true');
  }

  const tooEarly = findTooEarlyDate();
  if (tooEarly) {
    collabDateError.hidden = false;
    tooEarly.focus();
    return;
  }

  if (!collabForm.checkValidity()) {
    collabForm.reportValidity();
    return;
  }

  const data = Object.fromEntries(new FormData(collabForm).entries());
  data.event_date = buildEventDate();
  delete data.date1;
  delete data.date2;
  delete data.date3;
  data.form_type = 'collab';
  submitToGas(collabForm, data, document.getElementById('form-done'));
});
