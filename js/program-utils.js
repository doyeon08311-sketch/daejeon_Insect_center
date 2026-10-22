// data/programs.js(window.PROGRAM_DATA)를 화면에서 쓰기 쉬운 형태로 바꿔 주는 공통 함수
// 메인 페이지와 예약 페이지가 함께 사용합니다.

const ProgramUtils = (() => {
  const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
  const CATEGORY_LABEL = { experience: '체험', exhibit: '전시' };

  const parseKey = (key) => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d); };
  const toKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const dotDate = (key) => key.replaceAll('-', '.');
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

  // 예약 상태
  // online: 온라인 예약 가능 여부 / key: 배지 색 구분용
  function getStatus(p, now = today()) {
    const ENDED = { key: 'ended', label: '마감', online: false };
    // 운영 기간이 끝난 프로그램은 유형과 상관없이 '마감'
    if (parseKey(p.period.end) < now) return ENDED;
    if (p.type === '전시') return { key: 'none', label: '예약 없음', online: false };
    if (p.applyMethod.includes('현장')) return { key: 'onsite', label: '현장 접수', online: false };
    const applyStart = parseKey(p.applyPeriod.start);
    const applyEnd = parseKey(p.applyPeriod.end);
    if (applyEnd < now) return ENDED;
    if (applyStart > now) return { key: 'soon', label: '접수예정', online: false };
    return { key: 'open', label: '접수중', online: true };
  }

  // 회차 목록: sessions가 있으면 회차별, 없으면 운영 시간 하나
  function getSessions(p) {
    if (p.sessions.length) return p.sessions.map((s) => ({ value: s.start, label: `${s.no}회차 ${s.start}~${s.end}` }));
    return [{ value: p.time.start, label: `${p.time.start}~${p.time.end}` }];
  }

  // 해당 날짜에 운영(예약)하는지
  function isOpenDate(p, date) {
    const key = toKey(date);
    if (p.openDates.length) return p.openDates.includes(key);
    return date >= parseKey(p.period.start)
      && date <= parseKey(p.period.end)
      && p.days.includes(WEEKDAYS[date.getDay()])
      && !p.closedDates.includes(key);
  }

  function targetText(p) {
    const parts = [];
    if (p.target.minAge) parts.push(`${p.target.minAge}세 이상`);
    if (p.target.groups.length) parts.push(p.target.groups.join('·'));
    return parts.join(' / ') || '누구나';
  }

  function capacityText(p) {
    const { min, max } = p.capacity;
    if (p.type === '단체' && min && max) return `${min}~${max}명`;
    if (max) return `회차별 선착순 ${max}명`;
    return '';
  }

  function feeText(p) {
    if (p.fee === null) return '';
    const base = p.fee === 0 ? '무료' : `${p.fee.toLocaleString()}원`;
    return p.feeNote ? `${base} (${p.feeNote})` : base;
  }

  function daysText(p) {
    if (p.openDates.length) return p.openDates.map((k) => { const d = parseKey(k); return `${d.getMonth() + 1}/${d.getDate()}(${WEEKDAYS[d.getDay()]})`; }).join(', ');
    const days = p.days.length === 7 ? '매일' : `매주 ${p.days.join('·')}`;
    if (!p.closedDates.length) return days;
    const closed = p.closedDates.map((k) => { const d = parseKey(k); return `${d.getMonth() + 1}/${d.getDate()}`; }).join(', ');
    return `${days} (휴관: ${closed})`;
  }

  function normalize(p) {
    return {
      ...p,
      category: p.type === '전시' ? 'exhibit' : 'experience',
      categoryLabel: p.type === '전시' ? '전시' : '체험',
      isGroup: false, // 모든 프로그램을 개인 신청으로 받음 (단체 입력 양식 사용 안 함)
      status: getStatus(p),
      // 개별 상세페이지 (data에 detailUrl을 따로 적으면 그 주소 우선)
      detailUrl: p.detailUrl || `program_detail.html?id=${encodeURIComponent(p.id)}`,
      reserveUrl: `program_reservation.html?program=${encodeURIComponent(p.id)}`,
    };
  }

  // 상태 정렬: 접수중 → 접수예정 → 현장 접수 → 예약 없음 → 종료
  const ORDER = { open: 0, soon: 1, onsite: 2, none: 3, ended: 4 };
  function getPrograms() {
    const data = window.PROGRAM_DATA;
    if (!data) return [];
    return data.programs.map(normalize).sort((a, b) => ORDER[a.status.key] - ORDER[b.status.key]);
  }

  // 상태별 예약 버튼 문구 (예약 팝업·상세페이지 공통)
  function reserveLabel(p) {
    switch (p.status.key) {
      case 'open': return '이 프로그램 예약하기';
      case 'soon': return `${dotDate(p.applyPeriod.start)}부터 예약 가능`;
      case 'onsite': return '현장 접수 프로그램';
      case 'none': return '예약 없이 관람';
      default: return '모집 마감';
    }
  }

  return { reserveLabel, WEEKDAYS, CATEGORY_LABEL, parseKey, toKey, dotDate, today, getPrograms, getSessions, isOpenDate, targetText, capacityText, feeText, daysText };
})();
