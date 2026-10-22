// 포토갤러리 목록(gallery.html) + 상세(gallery_detail.html?id=번호) — 데이터는 data/photos.js
(() => {
  const all = [...(window.PHOTO_DATA ?? [])].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dot = (d) => d.replaceAll('-', '.');

  // ---------- 목록 ----------
  const list = document.getElementById('phList');
  if (list) {
    const PER_PAGE = 9;
    const input = document.getElementById('phKeyword');
    const count = document.getElementById('phCount');
    const empty = document.getElementById('phEmpty');
    const paging = document.getElementById('phPaging');
    let keyword = '';
    let page = 1;

    const render = () => {
      const items = all.filter((p) => !keyword || p.title.includes(keyword));
      const pages = Math.max(1, Math.ceil(items.length / PER_PAGE));
      page = Math.min(Math.max(page, 1), pages);
      const start = (page - 1) * PER_PAGE;
      list.innerHTML = items.slice(start, start + PER_PAGE).map((p) => `
        <li>
          <a href="gallery_detail.html?id=${p.id}" class="ph-card">
            <div class="ph-thumb">
              <img src="${p.images[0]}" alt="">
              <span class="ph-num"><i class="bi bi-images" aria-hidden="true"></i>${p.images.length}<span class="blind">장</span></span>
            </div>
            <div class="ph-body">
              <p class="ph-title">${esc(p.title)}</p>
              <time class="ph-date" datetime="${p.date}">${dot(p.date)}</time>
            </div>
          </a>
        </li>`).join('');
      count.innerHTML = keyword
        ? `<strong>'${esc(keyword)}'</strong> 검색 결과 <strong>${items.length}</strong>건`
        : `전체 <strong>${items.length}</strong>건`;
      empty.hidden = items.length > 0;
      document.getElementById('phEmptyText').textContent = keyword ? '검색 결과가 없어요.' : '등록된 사진이 없습니다.';

      if (pages <= 1) { paging.innerHTML = ''; return; }
      let html = `<button type="button" class="pg-arrow" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}><i class="bi bi-chevron-left" aria-hidden="true"></i><span class="blind">이전 페이지</span></button>`;
      for (let n = 1; n <= pages; n++) html += `<button type="button" data-page="${n}" ${n === page ? 'aria-current="page"' : ''}>${n}</button>`;
      html += `<button type="button" class="pg-arrow" data-page="${page + 1}" ${page === pages ? 'disabled' : ''}><i class="bi bi-chevron-right" aria-hidden="true"></i><span class="blind">다음 페이지</span></button>`;
      paging.innerHTML = html;
    };

    paging.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || b.disabled) return;
      page = Number(b.dataset.page);
      render();
    });
    document.getElementById('phSearch').addEventListener('submit', (e) => {
      e.preventDefault();
      keyword = input.value.trim();
      page = 1;
      render();
    });
    render();
  }

  // ---------- 상세 ----------
  const view = document.getElementById('phView');
  if (view) {
    const id = Number(new URLSearchParams(location.search).get('id'));
    const idx = all.findIndex((p) => p.id === id);
    const p = all[idx];
    if (!p) {
      view.innerHTML = '<div class="ntc-missing"><p>게시물을 찾을 수 없어요.</p><a href="gallery.html" class="btn btn-line">목록으로</a></div>';
      return;
    }
    document.title = `${p.title} | 대전곤충생태관`;
    const total = p.images.length;
    const navRow = (label, icon, item) => `
      <li>
        <span class="ntc-nav-label"><i class="bi ${icon}" aria-hidden="true"></i>${label}</span>
        ${item ? `<a href="gallery_detail.html?id=${item.id}">${esc(item.title)}</a><time datetime="${item.date}">${dot(item.date)}</time>` : '<span class="ntc-nav-none">글이 없습니다.</span>'}
      </li>`;

    view.innerHTML = `
      <header class="ntc-view-head">
        <h3 class="ntc-view-title">${esc(p.title)}</h3>
        <dl class="ntc-view-meta">
          <div><dt>작성일</dt><dd><time datetime="${p.date}">${dot(p.date)}</time></dd></div>
          <div><dt>작성자</dt><dd>대전곤충생태관</dd></div>
        </dl>
      </header>
      <div class="ntc-view-body ph-body-text">${p.body.map((line) => `<p>${esc(line)}</p>`).join('')}</div>
      <div class="ph-viewer" aria-roledescription="사진 보기">
        <div class="ph-stage">
          <img id="phMain" src="${p.images[0]}" alt="${esc(p.title)} 사진 1">
          <button type="button" class="ph-arrow ph-prev" aria-label="이전 사진"><i class="bi bi-chevron-left" aria-hidden="true"></i></button>
          <button type="button" class="ph-arrow ph-next" aria-label="다음 사진"><i class="bi bi-chevron-right" aria-hidden="true"></i></button>
          <span class="ph-counter" aria-live="polite"><strong id="phCur">1</strong> / ${total}</span>
        </div>
        <ul class="ph-thumbs">
          ${p.images.map((src, i) => `
          <li><button type="button" class="ph-thumb-btn${i === 0 ? ' is-active' : ''}" data-index="${i}" aria-label="사진 ${i + 1} 크게 보기" aria-pressed="${i === 0}"><img src="${src}" alt=""></button></li>`).join('')}
        </ul>
      </div>
      <ul class="ntc-nav">
        ${navRow('이전 글', 'bi-chevron-up', all[idx + 1])}
        ${navRow('다음 글', 'bi-chevron-down', all[idx - 1])}
      </ul>
      <div class="ntc-view-btns"><a href="gallery.html" class="btn btn-green">목록으로</a></div>`;

    // 큰 사진 전환 (화살표·썸네일·키보드 좌우)
    const main = document.getElementById('phMain');
    const cur = document.getElementById('phCur');
    const thumbs = view.querySelectorAll('.ph-thumb-btn');
    let index = 0;
    const show = (i) => {
      index = (i + total) % total; // 처음/끝에서 반대쪽으로 순환
      main.classList.remove('is-show');
      void main.offsetWidth; // 페이드 다시 시작
      main.src = p.images[index];
      main.alt = `${p.title} 사진 ${index + 1}`;
      main.classList.add('is-show');
      cur.textContent = index + 1;
      thumbs.forEach((t, n) => {
        t.classList.toggle('is-active', n === index);
        t.setAttribute('aria-pressed', n === index);
      });
      thumbs[index].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    };
    view.querySelector('.ph-prev').addEventListener('click', () => show(index - 1));
    view.querySelector('.ph-next').addEventListener('click', () => show(index + 1));
    thumbs.forEach((t) => t.addEventListener('click', () => show(Number(t.dataset.index))));
    view.querySelector('.ph-stage').addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') show(index - 1);
      if (e.key === 'ArrowRight') show(index + 1);
    });
    if (total < 2) view.querySelectorAll('.ph-arrow').forEach((b) => { b.hidden = true; });
  }
})();
