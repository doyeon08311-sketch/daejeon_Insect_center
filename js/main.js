// 모바일/태블릿 메뉴 토글
const header = document.getElementById('header');
const menuBtn = header.querySelector('.menu-btn');

menuBtn.addEventListener('click', () => {
  const isOpen = header.classList.toggle('is-open');
  menuBtn.setAttribute('aria-expanded', isOpen);
  menuBtn.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
});

// 메인 메뉴 서브메뉴
// PC: 클릭하면 패널과 서브메뉴가 내려오고, 마우스(또는 키보드 포커스)가 헤더를 벗어나면 닫힘
// 태블릿·모바일: 아코디언으로 열고 닫음
const gnbItems = header.querySelectorAll('.gnb-list > li');
const gnbPanelTitle = header.querySelector('.gnb-panel-title');
const isDesktop = () => window.innerWidth > 1024;
let wasDesktop = isDesktop();

function setActiveMenu(item) {
  gnbItems.forEach((li) => {
    const isActive = li === item;
    li.classList.toggle('is-active', isActive);
    li.querySelector('.gnb-link').setAttribute('aria-expanded', isActive);
  });
}

function closeSubmenu() {
  header.classList.remove('is-sub-open');
  setActiveMenu(null);
}

gnbItems.forEach((item) => {
  item.querySelector('.gnb-link').addEventListener('click', () => {
    if (isDesktop()) {
      gnbPanelTitle.textContent = item.querySelector('.gnb-link').textContent;
      header.classList.add('is-sub-open');
      setActiveMenu(item);
    } else {
      setActiveMenu(item.classList.contains('is-active') ? null : item);
    }
  });
});

header.addEventListener('mouseleave', () => {
  if (isDesktop()) closeSubmenu();
});
header.addEventListener('focusout', (e) => {
  if (isDesktop() && !header.contains(e.relatedTarget)) closeSubmenu();
});

// 우측 하단 퀵버튼 (모든 페이지 공통): 예약 / 안내도 / TOP — 300px 이상 내려가면 셋이 함께 나타남
// 메인 페이지는 아이콘 폰트를 쓰지 않으므로 아이콘은 SVG로 직접 넣음
(() => {
  const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const quick = document.createElement('nav');
  quick.className = 'quick';
  quick.setAttribute('aria-label', '바로가기');
  quick.innerHTML = `
    <a href="program_reservation.html" class="quick-btn quick-reserve">${svg('<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4M8.5 14.5l2.3 2.3 4.7-4.7"/>')}<span>예약</span></a>
    <a href="guide.html#map" class="quick-btn quick-guide">${svg('<path d="M9 4 3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5L9 4z"/><path d="M9 4v13.5M15 6.5V20"/>')}<span>안내도</span></a>
    <button type="button" class="quick-btn quick-top">${svg('<path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/>')}<span>TOP</span></button>`;
  document.body.appendChild(quick);

  const topBtn = quick.querySelector('.quick-top');
  topBtn.addEventListener('click', () => {
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
  });
  // 메인 페이지(히어로가 있는 페이지)는 조금 내려갔을 때만 퀵버튼 전체 보이기, 서브 페이지는 처음부터 항상 보임
  const isMain = !!document.querySelector('.hero');
  const onScroll = () => quick.classList.toggle('is-scrolled', !isMain || window.scrollY > 300);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// 아래 섹션 기능은 메인 페이지에만 있으므로, 해당 요소가 있을 때만 실행 (서브 페이지에서 오류 방지)

// 알림마당: data/notices.js에서 최신 공지 4개 (누르면 공지 상세로 이동)
const mainNotice = document.getElementById('mainNotice');
if (mainNotice && window.NOTICE_DATA) {
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  mainNotice.innerHTML = [...window.NOTICE_DATA]
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
    .slice(0, 4)
    .map((n) => `<li><a href="notice_detail.html?id=${n.id}"><span class="notice-title">${esc(n.title)}</span><time datetime="${n.date}">${n.date}</time></a></li>`)
    .join('');
}

// 이달의 프로그램 슬라이드: data/programs.js로 카드 생성 (누르면 예약 페이지에서 해당 프로그램 상세가 열림)
if (document.querySelector('.program-swiper')) {
  if (typeof ProgramUtils !== 'undefined') {
    document.querySelector('.program-swiper .swiper-wrapper').innerHTML = ProgramUtils.getPrograms().map((p) => `
      <div class="swiper-slide" data-category="${p.category}">
        <a href="program_reservation.html?program=${encodeURIComponent(p.id)}" class="program-card">
          <div class="thumb">
            <img src="${p.image}" alt="">
            <span class="tag tag-${p.category}">${p.categoryLabel}</span>
          </div>
          <h3 class="card-title">${p.title}</h3>
          <p class="card-date">${p.period.start} ~ ${p.period.end}</p>
        </a>
      </div>`).join('');
  }

  const programSwiper = new Swiper('.program-swiper', {
    slidesPerView: 1.2,
    spaceBetween: 16,
    navigation: {
      prevEl: '.program-prev',
      nextEl: '.program-next',
    },
    breakpoints: {
      769: { slidesPerView: 2, spaceBetween: 24 },
      1025: { slidesPerView: 3, spaceBetween: 45 },
    },
  });

  // 이달의 프로그램 탭 필터
  const programSlides = [...document.querySelectorAll('.program-swiper .swiper-slide')].map((slide) => slide.outerHTML);
  const programTabs = document.querySelectorAll('.program-tabs button');

  programTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      programTabs.forEach((t) => {
        t.classList.toggle('is-active', t === tab);
        t.setAttribute('aria-pressed', t === tab);
      });

      const filter = tab.dataset.filter;
      const filtered = programSlides.filter((html) => filter === 'all' || html.includes(`data-category="${filter}"`));
      programSwiper.removeAllSlides();
      programSwiper.appendSlide(filtered);
      programSwiper.slideTo(0, 0);
    });
  });
}

// 생태관의 사계: 선택한 계절로 배경·카드 전환 (표시는 CSS의 data-season 선택자가 담당)
const season = document.querySelector('.season');

function setSeason(name) {
  season.dataset.season = name;
  season.querySelectorAll('.season-menu button').forEach((btn) => btn.setAttribute('aria-pressed', btn.dataset.season === name));
}

if (season) {
  season.querySelectorAll('.season-menu button').forEach((btn) => {
    btn.addEventListener('click', () => setSeason(btn.dataset.season));
  });

  // 처음에는 현재 월에 맞는 계절 선택
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) setSeason('spring');
  else if (month >= 6 && month <= 8) setSeason('summer');
  else if (month >= 9 && month <= 11) setSeason('autumn');
  else setSeason('winter');

  // 곤충 카드: data/insects.js 정보(서식지·활동시기·전시 위치)를 사진 위에 표시, 클릭 시 관람안내도의 해당 전시 번호로 이동
  const insects = window.INSECT_DATA || [];
  season.querySelectorAll('.insect-card[data-insect]').forEach((card) => {
    const info = insects.find((d) => String(d.id) === card.dataset.insect);
    if (!info) return;
    const floor = parseInt(info.floor, 10);
    card.href = `guide.html?floor=${floor}&spot=${info.exhibitNo}`;
    card.setAttribute('aria-label', `${info.name} — 서식지 ${info.habitat}, 활동시기 ${info.activePeriod}, ${info.floor} ${info.exhibitNo}번 전시. 관람안내도에서 위치 보기`);
    const box = document.createElement('div');
    box.className = 'insect-info';
    box.setAttribute('aria-hidden', 'true');
    box.innerHTML = `
      <p class="insect-info-name"></p>
      <dl>
        <div><dt>서식지</dt><dd></dd></div>
        <div><dt>활동시기</dt><dd></dd></div>
        <div><dt>전시 위치</dt><dd></dd></div>
      </dl>
      <span class="insect-more">관람안내도에서 보기 ›</span>`;
    const dds = box.querySelectorAll('dd');
    dds[0].textContent = info.habitat;
    dds[1].textContent = info.activePeriod;
    dds[2].textContent = `${info.floor} · ${info.exhibitNo}번`;
    box.querySelector('.insect-info-name').textContent = card.querySelector('.insect-name').textContent;
    card.appendChild(box); // 사진 + 이름 칸까지 카드 전체를 덮음
  });

  // 모바일: 카드를 누르면 관람안내도로 이동하지 않고 정보만 열고 닫음 (한 번에 하나)
  const isMobile = window.matchMedia('(max-width: 768px)');
  season.addEventListener('click', (e) => {
    const card = e.target.closest('.insect-card');
    if (!card || !isMobile.matches) return;
    e.preventDefault();
    const willOpen = !card.classList.contains('is-open');
    season.querySelectorAll('.insect-card.is-open').forEach((c) => c.classList.remove('is-open'));
    card.classList.toggle('is-open', willOpen);
  });
}

// 갤러리: 누른 사진이 큰 원(slot 0)으로 오도록 모든 사진의 자리를 같은 칸 수만큼 순환
const galleryPhotos = document.querySelectorAll('.gallery-photo');

galleryPhotos.forEach((photo) => {
  photo.addEventListener('click', () => {
    const shift = Number(photo.dataset.slot);
    // 모바일(768px 이하)은 가로 스와이프 카드라 눌러도 동작 없음
    if (shift === 0 || window.matchMedia('(max-width: 768px)').matches) return;
    galleryPhotos.forEach((p) => {
      p.dataset.slot = (Number(p.dataset.slot) - shift + galleryPhotos.length) % galleryPhotos.length;
    });
  });
});

// 모바일 가로 카드 줄(갤러리 사진, 생태관 라이브): 터치는 기본 스와이프,
// 마우스(PC 창을 좁혀 볼 때)는 끌어서 넘기기 — 끈 경우엔 카드 링크가 열리지 않음
function dragScroll(row) {
  row.querySelectorAll('img').forEach((img) => { img.draggable = false; });
  let drag = null;
  let justDragged = false;
  row.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || !window.matchMedia('(max-width: 768px)').matches) return;
    if (row.scrollWidth <= row.clientWidth) return;
    drag = { x: e.clientX, left: row.scrollLeft, moved: false };
    row.style.scrollSnapType = 'none'; // 끄는 동안은 자석 정렬 끔
  });
  window.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 5) drag.moved = true;
    row.scrollLeft = drag.left - dx;
  });
  window.addEventListener('pointerup', () => {
    if (!drag) return;
    justDragged = drag.moved;
    drag = null;
    // 가장 가까운 카드에 맞춰 멈춤 (offsetLeft 기준이 같도록 첫 카드 위치를 0으로 봄)
    const cards = [...row.children];
    const base = cards[0].offsetLeft;
    const target = cards.reduce((best, c) => (Math.abs(c.offsetLeft - base - row.scrollLeft) < Math.abs(best.offsetLeft - base - row.scrollLeft) ? c : best), cards[0]);
    row.scrollTo({ left: target.offsetLeft - base, behavior: 'smooth' });
    setTimeout(() => { row.style.scrollSnapType = ''; }, 400);
  });
  // 끌기 직후 손을 뗄 때 생기는 클릭은 무시 (라이브 카드 링크가 열리지 않게)
  row.addEventListener('click', (e) => {
    if (justDragged) { e.preventDefault(); e.stopPropagation(); justDragged = false; }
  }, true);
}
document.querySelectorAll('.gallery-stage, .live-list').forEach(dragScroll);

window.addEventListener('resize', () => {
  if (window.innerWidth > 1024 && header.classList.contains('is-open')) {
    header.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', false);
    menuBtn.setAttribute('aria-label', '메뉴 열기');
  }
  // PC ↔ 모바일 전환 시 열려 있던 서브메뉴 정리
  if (isDesktop() !== wasDesktop) {
    wasDesktop = isDesktop();
    closeSubmenu();
  }
});
