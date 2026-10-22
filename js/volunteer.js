// 자원봉사 신청 페이지 (서버 저장 없이 화면 동작만)
(() => {
  const form = document.getElementById('volForm');
  if (!form) return;

  const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
  const SLOTS = [
    { value: 'am', label: '오전 10:00~12:00' },
    { value: 'pm', label: '오후 14:00~16:00' },
  ];
  const CAPACITY = 2; // 시간대별 1일 봉사 인원
  const MIN_DAYS = 2; // 봉사일 2일 전까지
  const MAX_DAYS = 15; // 봉사일 15일 전부터

  const toKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const formatDate = (k) => { const d = parseKey(k); return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}(${WEEKDAYS[d.getDay()]})`; };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const addDays = (n) => { const d = new Date(today); d.setDate(d.getDate() + n); return d; };
  const firstDay = addDays(MIN_DAYS);
  const lastDay = addDays(MAX_DAYS);

  // 남은 인원: 서버가 없으므로 날짜·시간대로 고정된 가상 값
  function remaining(dateKey, slot) {
    let h = 0;
    for (const ch of dateKey + slot) h = (h * 31 + ch.charCodeAt(0)) % 9973;
    return Math.max(CAPACITY - (h % 4 === 0 ? 2 : h % 3 === 0 ? 1 : 0), 0);
  }
  const isOpenDate = (d) => d >= firstDay && d <= lastDay && d.getDay() !== 1;
  const dayLeft = (k) => SLOTS.reduce((sum, s) => sum + remaining(k, s.value), 0);

  const state = { date: null, slot: null, group: null };

  // ---------- 달력 ----------
  const calTitle = document.getElementById('calTitle');
  const calGrid = document.getElementById('calGrid');
  const timeDate = document.getElementById('timeDate');
  const timeList = document.getElementById('timeList');
  const minMonth = new Date(firstDay.getFullYear(), firstDay.getMonth(), 1);
  const maxMonth = new Date(lastDay.getFullYear(), lastDay.getMonth(), 1);
  let calMonth = new Date(minMonth);

  function renderCalendar() {
    const y = calMonth.getFullYear();
    const m = calMonth.getMonth();
    calTitle.textContent = `${y}년 ${m + 1}월`;
    let html = '<span class="cal-empty"></span>'.repeat(new Date(y, m, 1).getDay());
    const last = new Date(y, m + 1, 0).getDate();
    for (let d = 1; d <= last; d++) {
      const date = new Date(y, m, d);
      const key = toKey(date);
      const open = isOpenDate(date);
      const full = open && dayLeft(key) === 0;
      const ok = open && !full;
      const cls = ['cal-day', date.getDay() === 0 ? 'is-sun' : '', date.getDay() === 6 ? 'is-sat' : '', key === toKey(today) ? 'is-today' : '', open ? 'is-open' : '', full ? 'is-full' : '', key === state.date ? 'is-selected' : ''].join(' ');
      const note = !open ? ' 신청 불가' : full ? ' 마감' : ` 남은 인원 ${dayLeft(key)}명`;
      html += `<button type="button" class="${cls}" data-date="${key}" ${ok ? '' : 'disabled'} aria-pressed="${key === state.date}" aria-label="${formatDate(key)}${note}">${d}</button>`;
    }
    calGrid.innerHTML = html;
    document.querySelector('.cal-nav[data-dir="-1"]').disabled = calMonth <= minMonth;
    document.querySelector('.cal-nav[data-dir="1"]').disabled = calMonth >= maxMonth;
  }

  function renderTimes() {
    if (!state.date) {
      timeDate.textContent = '먼저 날짜를 선택해 주세요.';
      timeList.innerHTML = '';
      return;
    }
    timeDate.textContent = `${formatDate(state.date)} 봉사 시간`;
    timeList.innerHTML = SLOTS.map((s) => {
      const left = remaining(state.date, s.value);
      return `
        <li>
          <label class="time-item${left ? '' : ' is-full'}">
            <input type="radio" name="volSlot" value="${s.value}" ${left ? '' : 'disabled'} ${state.slot === s.value ? 'checked' : ''}>
            <span class="time-clock">${s.label}</span>
            <span class="time-left">${left ? `잔여 ${left}명 / ${CAPACITY}명` : '마감'}</span>
          </label>
        </li>`;
    }).join('');
  }

  document.querySelectorAll('.cal-nav').forEach((btn) => {
    btn.addEventListener('click', () => {
      calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + Number(btn.dataset.dir), 1);
      renderCalendar();
    });
  });
  calGrid.addEventListener('click', (e) => {
    const day = e.target.closest('.cal-day');
    if (!day || day.disabled) return;
    state.date = day.dataset.date;
    state.slot = null;
    renderCalendar();
    renderTimes();
    update();
  });
  timeList.addEventListener('change', (e) => { state.slot = e.target.value; update(); });

  // ---------- 신청자 정보 ----------
  const nameInput = document.getElementById('volName');
  const phoneInput = document.getElementById('volPhone');
  const idInput = document.getElementById('volId');
  const agree1365 = document.getElementById('agree1365');
  const agreePrivacy = document.getElementById('agreePrivacy');
  const touched = new Set();
  const rules = {
    volName: (v) => (v.trim().length >= 2 ? '' : '이름을 2자 이상 입력해 주세요.'),
    volPhone: (v) => (/^01[016789]-?\d{3,4}-?\d{4}$/.test(v.trim()) ? '' : '연락처를 010-0000-0000 형식으로 입력해 주세요.'),
    volId: (v) => (v.trim().length >= 3 ? '' : '1365 자원봉사포털 아이디를 입력해 주세요.'),
  };
  const inputs = [nameInput, phoneInput, idInput];

  function checkField(input) {
    const msg = rules[input.id](input.value);
    const show = touched.has(input.id) ? msg : '';
    input.closest('.field').querySelector('.field-msg').textContent = show;
    input.setAttribute('aria-invalid', Boolean(show));
  }

  phoneInput.addEventListener('input', () => {
    const n = phoneInput.value.replace(/\D/g, '').slice(0, 11);
    phoneInput.value = n.length < 4 ? n : n.length < 8 ? `${n.slice(0, 3)}-${n.slice(3)}` : `${n.slice(0, 3)}-${n.slice(3, n.length - 4)}-${n.slice(-4)}`;
  });
  inputs.forEach((input) => {
    input.addEventListener('input', () => { checkField(input); update(); });
    input.addEventListener('blur', () => { touched.add(input.id); checkField(input); });
  });
  document.getElementById('volGroup').addEventListener('change', (e) => { state.group = e.target.value; update(); });
  [agree1365, agreePrivacy].forEach((c) => c.addEventListener('change', update));

  // ---------- 요약·버튼 ----------
  const submitBtn = document.getElementById('volSubmit');
  const help = document.getElementById('volHelp');
  const slotLabel = () => SLOTS.find((s) => s.value === state.slot)?.label;

  function missing() {
    if (!state.date || !state.slot) return '봉사 날짜와 시간을 선택해 주세요.';
    if (inputs.some((i) => rules[i.id](i.value)) || !state.group) return '신청자 정보를 입력해 주세요.';
    if (!agree1365.checked || !agreePrivacy.checked) return '1365 가입 확인과 개인정보 동의가 필요해요.';
    return '';
  }

  function update() {
    document.getElementById('sumDate').textContent = state.date ? formatDate(state.date) : '-';
    document.getElementById('sumTime').textContent = slotLabel() ?? '-';
    document.getElementById('sumName').textContent = nameInput.value.trim() ? `${nameInput.value.trim()}${state.group ? ` (${state.group})` : ''}` : '-';
    const msg = missing();
    submitBtn.disabled = Boolean(msg);
    help.textContent = msg;
  }

  // ---------- 신청 완료 ----------
  const done = document.getElementById('volDone');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    inputs.forEach((i) => { touched.add(i.id); checkField(i); });
    if (missing()) return;
    document.getElementById('volNumber').textContent = `VS${state.date.replaceAll('-', '').slice(2)}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
    document.getElementById('volSummary').innerHTML = `
      <div><dt>봉사일</dt><dd>${formatDate(state.date)}</dd></div>
      <div><dt>시간</dt><dd>${slotLabel()}</dd></div>
      <div><dt>신청자</dt><dd>${nameInput.value.trim()} (${state.group}) · ${phoneInput.value}</dd></div>
      <div><dt>1365 ID</dt><dd>${idInput.value.trim()}</dd></div>`;
    form.hidden = true;
    done.hidden = false;
    done.scrollIntoView({ behavior: 'smooth', block: 'center' });
    done.focus({ preventScroll: true });
  });

  document.getElementById('volRestart').addEventListener('click', () => {
    Object.assign(state, { date: null, slot: null, group: null });
    form.reset();
    touched.clear();
    form.querySelectorAll('.field-msg').forEach((m) => { m.textContent = ''; });
    done.hidden = true;
    form.hidden = false;
    calMonth = new Date(minMonth);
    renderCalendar();
    renderTimes();
    update();
    document.getElementById('volApply').scrollIntoView({ behavior: 'smooth' });
  });

  renderCalendar();
  renderTimes();
  update();
})();
