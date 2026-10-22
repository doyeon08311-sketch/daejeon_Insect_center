// 공지사항 목록(notice.html) + 상세(notice_detail.html?id=번호)
// 데이터는 data/notices.js → 수정은 그 파일에서

(() => {
  const PER_PAGE = 10;
  const NEW_DAYS = 7; // 등록 후 7일 이내면 N 표시
  const all = [...(window.NOTICE_DATA ?? [])].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const pinned = all.filter((n) => n.important);
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dot = (d) => d.replaceAll('-', '.');
  const isNew = (d) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [y, m, day] = d.split('-').map(Number);
    return (today - new Date(y, m - 1, day)) / 86400000 <= NEW_DAYS;
  };
  const badges = (n) => `${n.attachments?.length ? '<i class="bi bi-paperclip ntc-clip" aria-label="첨부파일 있음"></i>' : ''}${isNew(n.date) ? '<span class="ntc-new" aria-label="새 글">N</span>' : ''}`;

  // ---------- 목록 ----------
  const list = document.getElementById('ntcList');
  if (list) {
    const params = new URLSearchParams(location.search);
    let keyword = params.get('q') ?? '';
    let page = Number(params.get('page')) || 1;
    const input = document.getElementById('ntcKeyword');
    const count = document.getElementById('ntcCount');
    const empty = document.getElementById('ntcEmpty');
    const paging = document.getElementById('ntcPaging');
    input.value = keyword;

    // 주소에 검색어·페이지를 남겨 상세에서 돌아와도 같은 목록이 보이게
    const syncUrl = () => {
      const q = new URLSearchParams();
      if (keyword) q.set('q', keyword);
      if (page > 1) q.set('page', page);
      history.replaceState(null, '', `${location.pathname}${q.toString() ? `?${q}` : ''}`);
    };
    const detailHref = (id) => `notice_detail.html?id=${id}${location.search ? `&back=${encodeURIComponent(location.search)}` : ''}`;

    const render = () => {
      const items = all.filter((n) => !keyword || n.title.includes(keyword));
      const pages = Math.max(1, Math.ceil(items.length / PER_PAGE));
      page = Math.min(Math.max(page, 1), pages);
      const start = (page - 1) * PER_PAGE;
      const rows = items.slice(start, start + PER_PAGE);
      const rowHtml = (n, no) => `
        <tr${n.important && no === null ? ' class="is-pinned"' : ''}>
          <td class="ntc-no">${no === null ? '<span class="ntc-pin">공지</span>' : no}</td>
          <td class="ntc-subject"><div class="ntc-subject-in"><a href="${detailHref(n.id)}">${esc(n.title)}</a>${badges(n)}</div></td>
          <td class="ntc-date"><time datetime="${n.date}">${dot(n.date)}</time></td>
        </tr>`;
      // 중요 공지는 검색어가 없을 때 매 페이지 맨 위에 고정
      const top = keyword ? '' : pinned.map((n) => rowHtml(n, null)).join('');
      list.innerHTML = top + rows.map((n, i) => rowHtml(n, items.length - start - i)).join('');
      count.innerHTML = keyword
        ? `<strong>'${esc(keyword)}'</strong> 검색 결과 <strong>${items.length}</strong>건`
        : `전체 <strong>${items.length}</strong>건 <span class="ntc-page">(${page}/${pages} 페이지)</span>`;
      empty.hidden = items.length > 0;

      // 페이지 번호
      if (pages <= 1) { paging.innerHTML = ''; return; }
      const btn = (p, label, cls = '', disabled = false) => `<button type="button" class="${cls}" data-page="${p}" ${disabled ? 'disabled' : ''} ${p === page && !cls ? 'aria-current="page"' : ''}>${label}</button>`;
      let html = btn(page - 1, '<i class="bi bi-chevron-left" aria-hidden="true"></i><span class="blind">이전 페이지</span>', 'pg-arrow', page === 1);
      for (let p = 1; p <= pages; p++) html += btn(p, p);
      html += btn(page + 1, '<i class="bi bi-chevron-right" aria-hidden="true"></i><span class="blind">다음 페이지</span>', 'pg-arrow', page === pages);
      paging.innerHTML = html;
    };

    paging.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || b.disabled) return;
      page = Number(b.dataset.page);
      syncUrl();
      render();
      document.querySelector('.ntc').scrollIntoView({ behavior: 'smooth' });
    });
    document.getElementById('ntcSearch').addEventListener('submit', (e) => {
      e.preventDefault();
      keyword = input.value.trim();
      page = 1;
      syncUrl();
      render();
    });
    render();
  }

  // ---------- 상세 ----------
  const view = document.getElementById('ntcView');
  if (view) {
    const params = new URLSearchParams(location.search);
    const id = Number(params.get('id'));
    const back = params.get('back') ?? '';
    const listHref = `notice.html${back}`;
    const idx = all.findIndex((n) => n.id === id);
    const n = all[idx];

    if (!n) {
      view.innerHTML = `
        <div class="ntc-missing">
          <p>공지사항을 찾을 수 없어요.</p>
          <a href="notice.html" class="btn btn-line">목록으로</a>
        </div>`;
      return;
    }

    document.title = `${n.title} | 대전곤충생태관`;
    // 본문: '- '로 시작하는 연속된 줄은 목록으로 묶음
    let body = '';
    let inList = false;
    n.body.forEach((line) => {
      if (line.startsWith('- ')) {
        if (!inList) { body += '<ul>'; inList = true; }
        body += `<li>${esc(line.slice(2))}</li>`;
      } else {
        if (inList) { body += '</ul>'; inList = false; }
        body += `<p>${esc(line)}</p>`;
      }
    });
    if (inList) body += '</ul>';

    const newer = all[idx - 1];
    const older = all[idx + 1];
    const navRow = (label, icon, item) => `
      <li>
        <span class="ntc-nav-label"><i class="bi ${icon}" aria-hidden="true"></i>${label}</span>
        ${item ? `<a href="notice_detail.html?id=${item.id}${back ? `&back=${encodeURIComponent(back)}` : ''}">${esc(item.title)}</a><time datetime="${item.date}">${dot(item.date)}</time>` : '<span class="ntc-nav-none">글이 없습니다.</span>'}
      </li>`;

    view.innerHTML = `
      <div class="ntc-view-in">
        <header class="ntc-view-head">
          ${n.important ? '<span class="ntc-pin">공지</span>' : ''}
          <h3 class="ntc-view-title">${esc(n.title)}</h3>
          <dl class="ntc-view-meta">
            <div><dt>등록일</dt><dd><time datetime="${n.date}">${dot(n.date)}</time></dd></div>
            <div><dt>작성자</dt><dd>대전곤충생태관</dd></div>
          </dl>
        </header>
        ${n.attachments?.length ? `
        <div class="ntc-files">
          <span class="ntc-files-label"><i class="bi bi-paperclip" aria-hidden="true"></i>첨부파일</span>
          <ul>${n.attachments.map((f) => `<li><a href="#none" class="ntc-file"><i class="bi bi-file-earmark-text" aria-hidden="true"></i><span>${esc(f)}</span><i class="bi bi-download ntc-file-dl" aria-hidden="true"></i></a></li>`).join('')}</ul>
        </div>` : ''}
        <div class="ntc-view-body">${body}</div>
        <ul class="ntc-nav">
          ${navRow('이전 글', 'bi-chevron-up', older)}
          ${navRow('다음 글', 'bi-chevron-down', newer)}
        </ul>
        <div class="ntc-view-btns">
          <a href="${listHref}" class="btn btn-green">목록으로</a>
        </div>
      </div>`;
  }
})();
