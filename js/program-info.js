// 프로그램 안내(목록) + 프로그램 상세 페이지
// 데이터는 data/programs.js → 수정은 그 파일에서

(() => {
  const { dotDate, WEEKDAYS, parseKey } = ProgramUtils;
  const PROGRAMS = ProgramUtils.getPrograms();
  const TERMS = window.PROGRAM_DATA?.common?.terms ?? [];
  const won = (n) => `${n.toLocaleString()}원`;
  const isRunning = (p) => p.status.key !== 'ended';

  // ---------- 목록 ----------
  const list = document.getElementById('pinfoList');
  if (list) {
    const count = document.getElementById('pinfoCount');
    const empty = document.getElementById('pinfoEmpty');
    const onlyActive = document.getElementById('onlyActive');
    const tabs = document.querySelectorAll('.pinfo-filter button');
    let type = 'all';

    const render = () => {
      const items = PROGRAMS.filter((p) => (type === 'all' || p.category === type) && (!onlyActive.checked || isRunning(p)));
      list.innerHTML = items.map((p) => `
        <li>
          <a href="${p.detailUrl}" class="pinfo-card${isRunning(p) ? '' : ' is-ended'}">
            <div class="pinfo-thumb">
              <img src="${p.image}" alt="">
              <span class="tag tag-${p.category}">${p.categoryLabel}</span>
              <span class="pinfo-status status-${p.status.key}">${p.status.label}</span>
            </div>
            <div class="pinfo-body">
              <p class="pinfo-type">${p.year} ${p.season}</p>
              <h3 class="pinfo-title">${p.title}</h3>
              <p class="pinfo-summary">${p.summary}</p>
              <p class="pinfo-date"><i class="bi bi-calendar3" aria-hidden="true"></i><span class="blind">기간</span>${dotDate(p.period.start)} ~ ${dotDate(p.period.end)}</p>
            </div>
          </a>
        </li>`).join('');
      count.innerHTML = `총 <strong>${items.length}</strong>개의 프로그램`;
      empty.hidden = items.length > 0;
    };

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        type = tab.dataset.type;
        tabs.forEach((t) => {
          t.classList.toggle('is-active', t === tab);
          t.setAttribute('aria-pressed', t === tab);
        });
        render();
      });
    });
    onlyActive.addEventListener('change', render);
    render();
  }

  // ---------- 상세 ----------
  const detail = document.getElementById('pdetail');
  if (detail) {
    const id = new URLSearchParams(location.search).get('id');
    const p = PROGRAMS.find((x) => x.id === id);

    if (!p) {
      detail.innerHTML = `
        <div class="inner pdetail-missing">
          <p>프로그램 정보를 찾을 수 없어요.</p>
          <a href="program_Information.html" class="btn btn-line">프로그램 목록으로</a>
        </div>`;
      return;
    }

    document.title = `${p.title} | 대전곤충생태관`;
    document.getElementById('crumbTitle').textContent = p.title;

    const row = (label, value) => (value ? `<div><dt>${label}</dt><dd>${value}</dd></div>` : '');
    const canReserve = p.status.online;
    const timeText = `${p.time.start} ~ ${p.time.end}`;

    // 회차 / 운영일
    const sessions = p.sessions.length ? `
      <section class="pdetail-sec">
        <h3 class="pdetail-sec-title"><i class="bi bi-clock" aria-hidden="true"></i>운영 회차 <span class="sec-sub">회차당 ${p.duration.label}</span></h3>
        <ol class="session-grid">
          ${p.sessions.map((s) => `<li><span class="session-no">${s.no}회차</span><span class="session-time">${s.start} ~ ${s.end}</span></li>`).join('')}
        </ol>
      </section>` : '';

    const openDates = p.openDates.length ? `
      <p class="pdetail-callout"><i class="bi bi-calendar-check" aria-hidden="true"></i>운영일: ${p.openDates.map((k) => { const d = parseKey(k); return `${d.getMonth() + 1}월 ${d.getDate()}일(${WEEKDAYS[d.getDay()]})`; }).join(', ')}</p>` : '';

    const options = p.options.length ? `
      <section class="pdetail-sec">
        <h3 class="pdetail-sec-title"><i class="bi bi-scissors" aria-hidden="true"></i>체험 선택 <span class="sec-sub is-right">※ 예약 시 하나를 골라 주세요</span><span class="sec-note">※ 재료비 별도 (재료비 현장 결제)</span></h3>
        <ul class="option-cards">
          ${p.options.map((o) => `
          <li class="option-card">
            <div class="option-img"><img src="${o.image}" alt="${o.name} 완성품" onerror="this.parentNode.classList.add('is-empty');this.remove()"><i class="bi bi-image" aria-hidden="true"></i></div>
            <div class="option-info">
              <p class="option-title">${o.name}<span class="option-form">${o.form}</span></p>
              <dl>
                <div><dt>재료비</dt><dd>${won(o.materialFee)}</dd></div>
                <div><dt>추천 연령</dt><dd>${o.ageLabel}</dd></div>
              </dl>
            </div>
          </li>`).join('')}
        </ul>
      </section>` : '';

    const notices = p.notices.length ? `
      <section class="pdetail-sec">
        <h3 class="pdetail-sec-title"><i class="bi bi-info-circle" aria-hidden="true"></i>유의사항</h3>
        <ul class="pdetail-notes">${p.notices.map((n) => `<li>${n}</li>`).join('')}</ul>
      </section>` : '';

    const terms = TERMS.length ? `
      <section class="pdetail-sec">
        <h3 class="pdetail-sec-title"><i class="bi bi-shield-check" aria-hidden="true"></i>관람 수칙</h3>
        <ul class="pdetail-notes">${TERMS.map((t) => `<li>${t}</li>`).join('')}</ul>
      </section>` : '';

    // 다른 프로그램 (운영 중 우선, 최대 3개)
    const others = PROGRAMS.filter((x) => x.id !== p.id).slice(0, 3);

    detail.innerHTML = `
      <div class="inner">
        <div class="pdetail-head">
          <div class="pdetail-img">
            <img src="${p.image}" alt="${p.title} 대표 사진">
            <span class="tag tag-${p.category}">${p.categoryLabel}</span>
          </div>
          <div class="pdetail-summary">
            <div class="pdetail-badges">
              <span class="pinfo-status status-${p.status.key}">${p.status.label}</span>
              <span class="pdetail-type">${p.year} ${p.season}</span>
            </div>
            <h3 class="pdetail-title">${p.title}</h3>
            <p class="pdetail-lead">${p.summary}</p>
            <dl class="pdetail-key">
              ${row('운영 기간', `${dotDate(p.period.start)} ~ ${dotDate(p.period.end)}`)}
              ${row('운영 요일', ProgramUtils.daysText(p))}
              ${row('운영 시간', timeText)}
              ${row('장소', p.location)}
            </dl>
            <div class="pdetail-cta">
              <a href="${canReserve ? p.reserveUrl : '#none'}" class="btn btn-green${canReserve ? '' : ' is-disabled'}"${canReserve ? '' : ' aria-disabled="true" tabindex="-1"'}>${canReserve ? '예약하러 가기' : ProgramUtils.reserveLabel(p)}</a>
              <a href="program_Information.html" class="btn btn-line">목록으로</a>
            </div>
          </div>
        </div>

        <div class="pdetail-content">
          <section class="pdetail-sec">
            <h3 class="pdetail-sec-title"><i class="bi bi-card-list" aria-hidden="true"></i>프로그램 정보</h3>
            <dl class="pdetail-table">
              ${row('대상', ProgramUtils.targetText(p))}
              ${row('인원', ProgramUtils.capacityText(p))}
              ${row('소요 시간', p.duration.label)}
              ${row('운영 시간', timeText)}
              ${p.type !== '전시' ? row('신청 기간', `${dotDate(p.applyPeriod.start)} ~ ${dotDate(p.applyPeriod.end)}`) : ''}
              ${row('신청 방법', p.applyMethod)}
              ${row('참가비', ProgramUtils.feeText(p))}
              ${row('문의', p.contact)}
            </dl>
            ${openDates}
          </section>
          ${sessions}
          ${options}
          ${notices}
          ${terms}
        </div>

        ${others.length ? `
        <section class="pdetail-others">
          <h3 class="pdetail-sec-title"><i class="bi bi-grid" aria-hidden="true"></i>다른 프로그램</h3>
          <ul class="others-list">
            ${others.map((o) => `
            <li>
              <a href="${o.detailUrl}" class="others-card">
                <div class="others-thumb"><img src="${o.image}" alt=""><span class="pinfo-status status-${o.status.key}">${o.status.label}</span></div>
                <p class="others-title">${o.title}</p>
                <p class="others-date">${dotDate(o.period.start)} ~ ${dotDate(o.period.end)}</p>
              </a>
            </li>`).join('')}
          </ul>
        </section>` : ''}
      </div>`;
  }
})();
