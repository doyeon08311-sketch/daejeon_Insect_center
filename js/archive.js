// 자료실 목록 (archive.html) — 데이터는 data/archives.js
(() => {
  const list = document.getElementById('arcList');
  if (!list) return;

  const PER_PAGE = 10;
  const all = [...(window.ARCHIVE_DATA ?? [])].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const input = document.getElementById('arcKeyword');
  const count = document.getElementById('arcCount');
  const empty = document.getElementById('arcEmpty');
  const emptyText = document.getElementById('arcEmptyText');
  const table = list.closest('table');
  const paging = document.getElementById('arcPaging');
  let keyword = '';
  let page = 1;

  const fileLinks = (files = []) => files.map((f) => `<a href="${f.url || '#none'}" class="arc-file" download title="${esc(f.name)} 내려받기"><i class="bi bi-download" aria-hidden="true"></i><span class="blind">${esc(f.name)}</span></a>`).join('');

  const render = () => {
    const items = all.filter((a) => !keyword || a.title.includes(keyword));
    const pages = Math.max(1, Math.ceil(items.length / PER_PAGE));
    page = Math.min(Math.max(page, 1), pages);
    const start = (page - 1) * PER_PAGE;
    list.innerHTML = items.slice(start, start + PER_PAGE).map((a, i) => `
      <tr>
        <td class="ntc-no">${items.length - start - i}</td>
        <td class="ntc-subject"><span class="ntc-subject-in">${esc(a.title)}</span></td>
        <td class="arc-files">${fileLinks(a.files)}</td>
        <td class="ntc-date"><time datetime="${a.date}">${a.date.replaceAll('-', '.')}</time></td>
      </tr>`).join('');
    count.innerHTML = keyword
      ? `<strong>'${esc(keyword)}'</strong> 검색 결과 <strong>${items.length}</strong>건`
      : `전체 <strong>${items.length}</strong>건`;
    empty.hidden = items.length > 0;
    emptyText.textContent = keyword ? '검색 결과가 없어요.' : '등록된 자료가 없습니다.';
    table.classList.toggle('is-empty', items.length === 0);

    if (pages <= 1) { paging.innerHTML = ''; return; }
    let html = `<button type="button" class="pg-arrow" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}><i class="bi bi-chevron-left" aria-hidden="true"></i><span class="blind">이전 페이지</span></button>`;
    for (let p = 1; p <= pages; p++) html += `<button type="button" data-page="${p}" ${p === page ? 'aria-current="page"' : ''}>${p}</button>`;
    html += `<button type="button" class="pg-arrow" data-page="${page + 1}" ${page === pages ? 'disabled' : ''}><i class="bi bi-chevron-right" aria-hidden="true"></i><span class="blind">다음 페이지</span></button>`;
    paging.innerHTML = html;
  };

  paging.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    page = Number(b.dataset.page);
    render();
  });
  document.getElementById('arcSearch').addEventListener('submit', (e) => {
    e.preventDefault();
    keyword = input.value.trim();
    page = 1;
    render();
  });
  render();
})();
