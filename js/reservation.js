// 프로그램 예약 페이지 (서버 저장 없이 화면 동작만)
// 프로그램 정보는 data/programs.js에서 읽음 → 수정은 그 파일에서

const { parseKey, toKey, dotDate, WEEKDAYS } = ProgramUtils;
const PROGRAMS = ProgramUtils.getPrograms();
const TERMS = window.PROGRAM_DATA?.common?.terms ?? [];
const MAX_PEOPLE = 4; // 1회 최대 신청 인원 (기본)
// 정원이 큰 프로그램(데이터 type '단체')은 정원(capacity.max)까지 한 번에 신청 가능
const maxPeople = (p) => (p?.type === '단체' && p.capacity.max ? p.capacity.max : MAX_PEOPLE);
const today = ProgramUtils.today();

const state = {
  step: 1, program: null, date: null, time: null,
  adult: 1, child: 0, // 개인
  groupTarget: null, // 단체: 유아/초등/중등
  option: null, // 체험 옵션(재료) 이름
};

const form = document.getElementById('reserveForm');
const panels = form.querySelectorAll('.step-panel');
const stepItems = document.querySelectorAll('.steps li');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const nextHelp = document.getElementById('nextHelp');

// ---------- 공통 ----------
const formatDate = (key) => { const d = parseKey(key); return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}(${WEEKDAYS[d.getDay()]})`; };
const won = (n) => `${n.toLocaleString()}원`;
const findProgram = (id) => PROGRAMS.find((p) => p.id === id);

// 회차별 잔여: 서버가 없으므로 날짜·회차로 고정된 가상 값
// 단체는 회차당 1팀(1: 예약 가능, 0: 예약 완료), 개인은 정원 기준 잔여석
function remainingSeats(program, dateKey, time) {
  let hash = 0;
  for (const ch of program.id + dateKey + time) hash = (hash * 31 + ch.charCodeAt(0)) % 9973;
  if (program.isGroup) return hash % 4 === 0 ? 0 : 1;
  const cap = program.capacity.max ?? 20;
  return Math.max(cap - (hash % (cap + 3)), 0);
}

function isBookable(program, date) {
  return program.status.online
    && date >= today
    && date >= parseKey(program.applyPeriod.start)
    && date <= parseKey(program.applyPeriod.end)
    && ProgramUtils.isOpenDate(program, date);
}

// 예약 가능한 첫 날짜가 있는 달
function initialMonth(program) {
  const start = parseKey(program.period.start);
  const d = new Date(Math.max(start, today));
  for (let i = 0; i < 400; i++) {
    if (isBookable(program, d)) break;
    d.setDate(d.getDate() + 1);
  }
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function lastMonth(program) {
  const end = new Date(Math.min(parseKey(program.period.end), parseKey(program.applyPeriod.end)));
  return new Date(end.getFullYear(), end.getMonth(), 1);
}

// 상태별 예약 버튼 문구 (ProgramUtils 공통)
const { reserveLabel } = ProgramUtils;

// ---------- STEP 1: 프로그램 ----------
const programList = document.getElementById('programList');

function renderPrograms(filter = 'all') {
  programList.innerHTML = PROGRAMS
    .filter((p) => filter === 'all' || p.category === filter)
    .map((p) => {
      const selected = state.program?.id === p.id;
      return `
      <li>
        <button type="button" class="choice${p.status.online ? '' : ' is-closed'}${selected ? ' is-selected' : ''}" data-id="${p.id}" aria-haspopup="dialog" aria-label="${p.title} 상세 정보 보기 (${p.status.label}${selected ? ', 선택됨' : ''})">
          <span class="choice-thumb">
            <img src="${p.image}" alt="">
            <span class="tag tag-${p.category}">${p.categoryLabel}</span>
            <span class="choice-status status-${p.status.key}">${p.status.label}</span>
          </span>
          <span class="choice-body">
            <strong class="choice-name">${p.title}</strong>
            <span class="choice-meta">${dotDate(p.period.start)} ~ ${dotDate(p.period.end)}</span>
            <span class="choice-meta">${p.duration.label ? `${p.duration.label} · ` : ''}${p.target.minAge ? `${p.target.minAge}세 이상` : '누구나'}</span>
            <span class="choice-more">자세히 보기 <i class="bi bi-chevron-right" aria-hidden="true"></i></span>
          </span>
        </button>
      </li>`;
    })
    .join('');
}

function selectProgram(program) {
  if (state.program?.id !== program.id) {
    Object.assign(state, { date: null, time: null, groupTarget: null, option: null, adult: 1, child: 0 });
    document.getElementById('groupCount').value = '';
    calMonth = initialMonth(program);
  }
  state.program = program;
  renderPrograms(document.querySelector('.reserve-filter .is-active').dataset.filter);
  renderProgramFields();
  update();
}

document.querySelectorAll('.reserve-filter button').forEach((tab, _, tabs) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => {
      t.classList.toggle('is-active', t === tab);
      t.setAttribute('aria-pressed', t === tab);
    });
    renderPrograms(tab.dataset.filter);
  });
});

// ---------- 프로그램 상세 팝업 ----------
const modal = document.getElementById('programModal');
const modalBody = document.getElementById('modalBody');
const modalReserve = document.getElementById('modalReserve');
let modalProgram = null;
let modalOpener = null;

function specRow(label, value) {
  return value ? `<div><dt>${label}</dt><dd>${value}</dd></div>` : '';
}

function openModal(p, opener) {
  modalProgram = p;
  modalOpener = opener;
  const timeText = `${p.time.start} ~ ${p.time.end}${p.sessions.length ? ` <span class="spec-sub">(총 ${p.sessions.length}회차)</span>` : ''}`;
 const notices = p.notices.length ? `
      <div class="modal-notes">
        <p class="modal-notes-title"><i class="bi bi-info-circle" aria-hidden="true"></i> 유의사항</p>
        <ul>${p.notices.map((n) => `<li>${n}</li>`).join('')}</ul>
      </div>` : '';
  modalBody.innerHTML = `
    <div class="modal-thumb">
      <img src="${p.image}" alt="">
      <span class="tag tag-${p.category}">${p.categoryLabel}</span>
    </div>
    <div class="modal-info">
      <span class="modal-status status-${p.status.key}">${p.status.label}</span>
      <h3 class="modal-title" id="modalTitle">${p.title}</h3>
      <p class="modal-desc">${p.summary}</p>
      <dl class="modal-spec">
        ${specRow('운영 기간', `${dotDate(p.period.start)} ~ ${dotDate(p.period.end)}`)}
        ${specRow('운영 요일', ProgramUtils.daysText(p))}
        ${specRow('운영 시간', timeText)}
        ${specRow('소요 시간', p.duration.label)}
      </dl>
      <a href="${p.detailUrl}" class="modal-detail-btn">상세 정보 확인하기 <i class="bi bi-chevron-right" aria-hidden="true"></i></a>
      ${notices}
    </div>`;
  modalReserve.disabled = !p.status.online;
  modalReserve.textContent = reserveLabel(p);
  modal.showModal();
  modal.querySelector('.modal-close').focus();
}

programList.addEventListener('click', (e) => {
  const card = e.target.closest('.choice');
  if (card) openModal(findProgram(card.dataset.id), card);
});

modal.addEventListener('close', () => {
  if (modalOpener?.isConnected) modalOpener.focus();
});
modal.querySelector('.modal-close').addEventListener('click', () => modal.close());
// 바깥(어두운 배경) 클릭 시 닫기
modal.addEventListener('click', (e) => {
  if (e.target === modal) modal.close();
});
modalReserve.addEventListener('click', () => {
  if (!modalProgram?.status.online) return;
  modalOpener = null;
  modal.close();
  selectProgram(modalProgram);
  goStep(2);
});

// ---------- STEP 2: 달력·시간 ----------
const calTitle = document.getElementById('calTitle');
const calGrid = document.getElementById('calGrid');
const timeDate = document.getElementById('timeDate');
const timeList = document.getElementById('timeList');
let calMonth = new Date(today.getFullYear(), today.getMonth(), 1);

function renderCalendar() {
  const y = calMonth.getFullYear();
  const m = calMonth.getMonth();
  calTitle.textContent = `${y}년 ${m + 1}월`;
  const first = new Date(y, m, 1).getDay();
  const last = new Date(y, m + 1, 0).getDate();
  let html = '<span class="cal-empty"></span>'.repeat(first);
  for (let d = 1; d <= last; d++) {
    const date = new Date(y, m, d);
    const key = toKey(date);
    const ok = state.program && isBookable(state.program, date);
    const cls = ['cal-day', date.getDay() === 0 ? 'is-sun' : '', date.getDay() === 6 ? 'is-sat' : '', key === toKey(today) ? 'is-today' : '', key === state.date ? 'is-selected' : ''].join(' ');
    html += `<button type="button" class="${cls}" data-date="${key}" ${ok ? '' : 'disabled'} aria-pressed="${key === state.date}" aria-label="${formatDate(key)}${ok ? '' : ' 예약 불가'}">${d}</button>`;
  }
  calGrid.innerHTML = html;

  // 예약 가능 기간 밖으로는 달 이동 막기
  if (state.program) {
    document.querySelector('.cal-nav[data-dir="-1"]').disabled = calMonth <= initialMonth(state.program);
    document.querySelector('.cal-nav[data-dir="1"]').disabled = calMonth >= lastMonth(state.program);
  }
}

function renderTimes() {
  if (!state.date) {
    timeDate.textContent = '먼저 날짜를 선택해 주세요.';
    timeList.innerHTML = '';
    return;
  }
  const p = state.program;
  timeDate.textContent = `${formatDate(state.date)} ${p.sessions.length ? '회차' : '운영 시간'}`;
  timeList.innerHTML = ProgramUtils.getSessions(p).map((s) => {
    const left = remainingSeats(p, state.date, s.value);
    const leftText = p.isGroup ? (left ? '예약 가능' : '예약 완료') : (left ? `잔여 ${left}석` : '마감');
    return `
      <li>
        <label class="time-item${left === 0 ? ' is-full' : ''}">
          <input type="radio" name="time" value="${s.value}" ${left === 0 ? 'disabled' : ''} ${state.time === s.value ? 'checked' : ''}>
          <span class="time-clock">${s.label}</span>
          <span class="time-left">${leftText}</span>
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
  state.time = null;
  renderCalendar();
  update();
});

timeList.addEventListener('change', (e) => {
  state.time = e.target.value;
  update();
});

// ---------- STEP 3: 신청자 정보 ----------
const formGrid = document.getElementById('formGrid');
const groupNameInput = document.getElementById('groupName');
const nameInput = document.getElementById('userName');
const phoneInput = document.getElementById('userPhone');
const emailInput = document.getElementById('userEmail');
const groupCountInput = document.getElementById('groupCount');
const groupCountMsg = document.getElementById('groupCountMsg');
const groupTargetBox = document.getElementById('groupTarget');
const optionField = document.getElementById('optionField');
const optionList = document.getElementById('optionList');
const agreeInput = document.getElementById('agreeAll');
const agreeTerms = document.getElementById('agreeTerms');
const peopleMsg = document.getElementById('peopleMsg');
const touched = new Set();

document.getElementById('termsList').innerHTML = TERMS.map((t) => `<li>${t}</li>`).join('');

const rules = {
  groupName: (v) => (!state.program?.isGroup || v.trim().length >= 2 ? '' : '단체명을 2자 이상 입력해 주세요.'),
  userName: (v) => (v.trim().length >= 2 ? '' : `${state.program?.isGroup ? '담당자명' : '이름'}을 2자 이상 입력해 주세요.`),
  userPhone: (v) => (/^0\d{1,2}-?\d{3,4}-?\d{4}$/.test(v.trim()) ? '' : '연락처를 010-0000-0000 형식으로 입력해 주세요.'),
  userEmail: (v) => (!v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? '' : '이메일 형식을 확인해 주세요.'),
};
const textInputs = [groupNameInput, nameInput, phoneInput, emailInput];

function checkField(input) {
  const msg = rules[input.id](input.value);
  const show = touched.has(input.id) ? msg : '';
  input.closest('.field').querySelector('.field-msg').textContent = show;
  input.setAttribute('aria-invalid', Boolean(show));
  return !msg;
}

// 연락처 자동 하이픈 (휴대폰·지역번호 모두)
phoneInput.addEventListener('input', () => {
  const n = phoneInput.value.replace(/\D/g, '').slice(0, 11);
  const head = n.startsWith('02') ? 2 : 3;
  if (n.length <= head) phoneInput.value = n;
  else if (n.length <= head + 4) phoneInput.value = `${n.slice(0, head)}-${n.slice(head)}`;
  else phoneInput.value = `${n.slice(0, head)}-${n.slice(head, n.length - 4)}-${n.slice(-4)}`;
});

textInputs.forEach((input) => {
  input.addEventListener('input', () => { checkField(input); update(); });
  input.addEventListener('blur', () => { touched.add(input.id); checkField(input); });
});
[agreeInput, agreeTerms].forEach((c) => c.addEventListener('change', update));

// 단체 인원
function groupCountError() {
  const { min, max } = state.program.capacity;
  const v = groupCountInput.value.trim();
  if (!v) return `${min}~${max}명 사이로 입력해 주세요.`;
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) return `참여 인원은 ${min}~${max}명이어야 합니다.`;
  return '';
}
groupCountInput.addEventListener('input', update);
groupCountInput.addEventListener('blur', () => { touched.add('groupCount'); update(); });

// 단체 대상·옵션 선택
groupTargetBox.addEventListener('change', (e) => { state.groupTarget = e.target.value; update(); });
optionList.addEventListener('change', (e) => { state.option = e.target.value; update(); });

// 개인 인원
document.querySelectorAll('.counter').forEach((counter) => {
  counter.addEventListener('click', (e) => {
    const btn = e.target.closest('.counter-btn');
    if (!btn) return;
    state[counter.dataset.type] += Number(btn.dataset.step);
    update();
  });
});

// 프로그램에 맞춰 입력 항목 구성
function renderProgramFields() {
  const p = state.program;
  if (!p) return;
  formGrid.dataset.mode = p.isGroup ? 'group' : 'individual';
  document.getElementById('userNameLabel').textContent = p.isGroup ? '담당자명' : '이름';
  nameInput.placeholder = p.isGroup ? '담당 선생님 성함' : '홍길동';
  if (p.isGroup) {
    groupCountInput.min = p.capacity.min;
    groupCountInput.max = p.capacity.max;
    groupCountInput.placeholder = `${p.capacity.min}~${p.capacity.max}`;
    groupTargetBox.innerHTML = p.target.groups.map((g) => `
      <label class="chip"><input type="radio" name="groupTarget" value="${g}" ${state.groupTarget === g ? 'checked' : ''}><span>${g}</span></label>`).join('');
  }
  optionField.hidden = !p.options.length;
  optionList.innerHTML = p.options.map((o) => `
    <label class="option-item">
      <input type="radio" name="option" value="${o.name}" ${state.option === o.name ? 'checked' : ''}>
      <span class="option-name">${o.name} <span class="option-form">${o.form}</span></span>
      <span class="option-meta">재료비 ${won(o.materialFee)} · ${o.ageLabel}</span>
    </label>`).join('');
}

function peopleLimit() {
  const max = maxPeople(state.program);
  const seats = state.program && state.date && state.time ? remainingSeats(state.program, state.date, state.time) : max;
  return Math.min(max, seats);
}

function renderPeople() {
  const limit = peopleLimit();
  const total = state.adult + state.child;
  document.querySelectorAll('.counter').forEach((counter) => {
    const type = counter.dataset.type;
    counter.querySelector('.counter-value').textContent = state[type];
    counter.querySelector('[data-step="-1"]').disabled = state[type] <= 0;
    counter.querySelector('[data-step="1"]').disabled = total >= limit;
  });
  peopleMsg.textContent = total === 0
    ? '1명 이상 선택해 주세요.'
    : `한 번에 최대 ${limit}명까지 신청할 수 있습니다.${limit < maxPeople(state.program) ? ' (선택한 회차의 잔여석 기준)' : ''}`;
  peopleMsg.classList.toggle('is-error', total === 0);
}

const headCount = () => (state.program?.isGroup ? Number(groupCountInput.value) || 0 : state.adult + state.child);

// ---------- 단계 이동 ----------
function stepValid(step) {
  const p = state.program;
  if (step === 1) return Boolean(p);
  if (step === 2) return Boolean(state.date && state.time);
  if (step === 3) {
    const fieldsOk = textInputs.every((i) => !rules[i.id](i.value));
    const peopleOk = p.isGroup ? !groupCountError() && Boolean(state.groupTarget) : state.adult + state.child > 0;
    const optionOk = !p.options.length || Boolean(state.option);
    return fieldsOk && peopleOk && optionOk && agreeInput.checked && agreeTerms.checked;
  }
  return true;
}

const HELP = {
  1: '프로그램을 선택해 주세요.',
  2: '날짜와 시간을 선택해 주세요.',
  3: '필수 항목 입력과 동의가 필요해요.',
};

function goStep(step) {
  state.step = step;
  panels.forEach((p) => p.classList.toggle('is-active', Number(p.dataset.step) === step));
  stepItems.forEach((li, i) => {
    li.classList.toggle('is-current', i + 1 === step);
    li.classList.toggle('is-done', i + 1 < step);
    if (i + 1 === step) li.setAttribute('aria-current', 'step');
    else li.removeAttribute('aria-current');
  });
  if (step === 2) { renderCalendar(); renderTimes(); }
  update();
  document.querySelector('.steps').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

nextBtn.addEventListener('click', () => {
  if (state.step === 3) {
    textInputs.forEach((i) => { touched.add(i.id); checkField(i); });
    if (!stepValid(3)) return;
    complete();
    return;
  }
  if (stepValid(state.step)) goStep(state.step + 1);
});
prevBtn.addEventListener('click', () => goStep(state.step - 1));

// ---------- 요금·인원 문구 ----------
function peopleText() {
  if (state.program?.isGroup) {
    const n = headCount();
    return n ? `${state.groupTarget ? `${state.groupTarget} ` : ''}${n}명` : '-';
  }
  const parts = [];
  if (state.adult) parts.push(`성인 ${state.adult}명`);
  if (state.child) parts.push(`어린이 ${state.child}명`);
  return parts.join(', ') || '-';
}

function materialFee() {
  const opt = state.program?.options.find((o) => o.name === state.option);
  return opt ? { unit: opt.materialFee, total: opt.materialFee * headCount() } : null;
}

// ---------- 완료 ----------
function complete() {
  const p = state.program;
  const number = `IE${state.date.replaceAll('-', '').slice(2)}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  const fee = materialFee();
  const session = ProgramUtils.getSessions(p).find((s) => s.value === state.time);
  document.getElementById('doneNumber').textContent = number;
  document.getElementById('doneSummary').innerHTML = `
    <div><dt>프로그램</dt><dd>${p.title}</dd></div>
    <div><dt>일시</dt><dd>${formatDate(state.date)} ${session.label}</dd></div>
    <div><dt>장소</dt><dd>${p.location}</dd></div>
    ${p.isGroup ? `<div><dt>단체명</dt><dd>${groupNameInput.value.trim()}</dd></div>` : ''}
    <div><dt>인원</dt><dd>${peopleText()}</dd></div>
    ${state.option ? `<div><dt>체험</dt><dd>${state.option}${fee ? ` (재료비 ${won(fee.total)})` : ''}</dd></div>` : ''}
    <div><dt>${p.isGroup ? '담당자' : '신청자'}</dt><dd>${nameInput.value.trim()} (${phoneInput.value})</dd></div>
    ${p.contact ? `<div><dt>문의</dt><dd>${p.contact}</dd></div>` : ''}`;
  goStep(4);
  document.querySelector('.step-done').focus({ preventScroll: true });
}

document.getElementById('restartBtn').addEventListener('click', () => {
  Object.assign(state, { program: null, date: null, time: null, adult: 1, child: 0, groupTarget: null, option: null });
  form.reset();
  touched.clear();
  form.querySelectorAll('.field-msg').forEach((m) => { if (m.id !== 'peopleMsg') m.textContent = ''; });
  renderPrograms(document.querySelector('.reserve-filter .is-active').dataset.filter);
  goStep(1);
});

// ---------- 요약·버튼 상태 갱신 ----------
function update() {
  const p = state.program;
  if (p && !p.isGroup) {
    // 회차를 바꿔 잔여석이 줄었으면 인원도 맞춰 줄임
    const limit = peopleLimit();
    while (state.adult + state.child > limit) {
      if (state.child > 0) state.child--; else state.adult--;
    }
  }
  renderPeople();
  if (p?.isGroup) {
    const err = touched.has('groupCount') || groupCountInput.value ? groupCountError() : '';
    groupCountMsg.textContent = err || `${p.capacity.min}~${p.capacity.max}명까지 신청할 수 있습니다.`;
    groupCountMsg.classList.toggle('is-error', Boolean(err));
    groupCountInput.setAttribute('aria-invalid', Boolean(err));
  }
  if (state.step === 2) renderTimes();

  const session = p && state.time ? ProgramUtils.getSessions(p).find((s) => s.value === state.time) : null;
  document.getElementById('sumProgram').textContent = p?.title ?? '-';
  document.getElementById('sumDate').textContent = state.date ? formatDate(state.date) : '-';
  document.getElementById('sumTime').textContent = session?.label ?? '-';
  document.getElementById('sumPeople').textContent = state.step >= 3 ? peopleText() : '-';
  document.getElementById('sumOptionRow').hidden = !state.option;
  document.getElementById('sumOption').textContent = state.option ?? '-';

  // 참가비 / 재료비
  const fee = materialFee();
  document.getElementById('sumFee').textContent = p ? (ProgramUtils.feeText({ ...p, feeNote: '' }) || '-') : '-';
  document.getElementById('sumFeeNote').textContent = fee
    ? `재료비 ${won(fee.unit)} × ${headCount() || 0}명 = ${won(fee.total)} 별도`
    : (p?.options.length ? '체험 선택에 따라 재료비가 별도로 있어요.' : '');

  const done = state.step === 4;
  document.querySelector('.summary').hidden = done;
  prevBtn.hidden = state.step === 1 || done;
  nextBtn.textContent = state.step === 3 ? '예약하기' : '다음 단계';
  nextBtn.disabled = !stepValid(state.step);
  nextHelp.textContent = nextBtn.disabled ? HELP[state.step] : '';
}

renderPrograms();
update();

// 메인 페이지 카드에서 넘어온 경우(?program=id) 해당 프로그램 상세를 바로 열기
const linked = findProgram(new URLSearchParams(location.search).get('program'));
if (linked) openModal(linked, programList.querySelector(`[data-id="${linked.id}"]`));
