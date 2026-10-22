/* ===== 생태관 이용안내 (guide.html) ===== */

/* 1F / 2F 필터: 지도와 전시 구역 목록을 함께 전환 */
(function () {
  var tabs = document.querySelectorAll('[data-floor-tab]');
  if (!tabs.length) return;
  var label = document.querySelector('[data-floor-label]');

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var floor = tab.dataset.floorTab;
      tabs.forEach(function (t) {
        var on = t === tab;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      document.querySelectorAll('.floor-panel').forEach(function (panel) {
        panel.hidden = panel.dataset.floor !== floor;
      });
      if (label) label.textContent = floor + 'F';
      document.dispatchEvent(new Event('click')); // 열린 전시명 말풍선 닫기
    });
  });
})();

/* 1층 구역 보기: 전체 지도에서 구역(생태유리온실/곤충홍보관) 선택 → 확대 지도 + 옆에 전시 사진
   - 확대 지도 번호를 누르면 오른쪽 사진·이름이 바뀜 (사진: images/greenhouse_<두 자리 번호>.png)
   - window.guideShowSpot(btn): 다른 곳(전시 목록, 메인 카드 링크)에서 번호를 고를 때 해당 구역을 먼저 열어 줌 */
(function () {
  var pick = document.querySelector('.zone-pick');
  var views = document.querySelectorAll('.zone-view:not(.zone-view-2f)'); // 1층 구역 화면 (2층은 한 화면이라 따로)
  var allViews = document.querySelectorAll('.zone-view');
  if (!allViews.length) return;

  function setPhoto(btn) {
    var view = btn.closest('.zone-view');
    if (!view) return;
    var fig = view.querySelector('.zone-photo');
    var no = btn.dataset.no || btn.dataset.spot;
    view.querySelectorAll('button.mk').forEach(function (b) { b.classList.toggle('is-selected', b === btn); });
    // 사진 공개하지 않는 곳(2층 5·6번): 사진 대신 같은 크기의 안내 박스
    if (btn.hasAttribute('data-nophoto')) {
      view.querySelector('.zone-note-title').textContent = no + '. ' + btn.dataset.name;
      view.classList.remove('has-photo');
      view.classList.add('has-note');
      return;
    }
    fig.querySelector('img').src = btn.dataset.photo || 'images/greenhouse_' + ('0' + no).slice(-2) + '.png';
    fig.querySelector('img').alt = no + '번 ' + btn.dataset.name + ' 전시 모습';
    fig.querySelector('figcaption').textContent = no + '. ' + btn.dataset.name;
    view.classList.remove('has-note');
    view.classList.add('has-photo'); // 캐릭터 대신 사진 박스 표시
  }

  // 들어갈 때 모션 순서용: 번호 마크마다 순번(--i)
  allViews.forEach(function (v) {
    v.querySelectorAll('.zone-stage .mk').forEach(function (mk, i) { mk.style.setProperty('--i', i); });
    v.style.setProperty('--n', v.querySelectorAll('.zone-stage .mk').length); // 캐릭터는 마지막 번호가 다 뜬 뒤 등장
  });

  // 처음 상태로 + 등장 모션 다시 재생 (지도 → 번호 → 캐릭터)
  function replay(v) {
    v.classList.remove('is-enter', 'has-photo', 'has-note');
    v.querySelectorAll('button.mk.is-selected').forEach(function (b) { b.classList.remove('is-selected'); });
    if (!v.hidden && v.offsetParent) { void v.offsetWidth; v.classList.add('is-enter'); }
  }

  function showZone(zone) {
    if (pick) pick.hidden = !!zone;
    views.forEach(function (v) {
      v.hidden = v.dataset.zone !== zone;
      // 구역 화면이 열릴 때마다 등장 모션 다시 재생 (지도 → 번호 → 사진 순)
      replay(v); // 처음엔 캐릭터 → 번호를 누르면 사진
    });
    document.dispatchEvent(new Event('click')); // 열린 말풍선 닫기
  }

  function openZone(zone) {
    showZone(zone); // 사진은 번호를 눌렀을 때 나옴
  }

  document.querySelectorAll('[data-zone-open]').forEach(function (b) {
    b.addEventListener('click', function () { openZone(b.dataset.zoneOpen); });
  });
  document.querySelectorAll('.zone-back').forEach(function (b) {
    b.addEventListener('click', function () { showZone(null); });
  });
  document.querySelectorAll('.zone-view button.mk[data-spot]').forEach(function (btn) {
    btn.addEventListener('click', function () { setPhoto(btn); });
  });

  // 2층: 2F 탭을 누를 때마다 처음 상태로 등장
  var view2f = document.querySelector('.zone-view-2f');
  document.querySelectorAll('[data-floor-tab="2"]').forEach(function (t) {
    t.addEventListener('click', function () { if (view2f) replay(view2f); }); // 층 전환(파일 맨 위 코드)이 먼저 실행된 뒤
  });

  window.guideShowSpot = function (btn) {
    var view = btn && btn.closest('.zone-view');
    if (!view) return;
    if (view.hidden) showZone(view.dataset.zone);
    setPhoto(btn);
  };

  // 전시 목록에서 1층 항목을 누르면 해당 구역을 먼저 열기 (목록의 기존 동작보다 먼저 실행)
  document.addEventListener('click', function (e) {
    var row = e.target.closest && e.target.closest('.spot-list li[data-spot]');
    if (!row) return;
    var btn = document.querySelector('.zone-view button.mk[data-spot="' + row.dataset.spot + '"]');
    if (btn) window.guideShowSpot(btn);
  }, true);
})();

/* 지도 번호·전시 목록 클릭 시 지도에 전시명 표시, 서로 강조
   - data-spot: 층마다 고유한 값(1층 "1"~"21", 2층 "2f-1"~"2f-6"), data-no: 화면에 보이는 번호 */
(function () {
  var stages = document.querySelectorAll('.map-stage');
  var items = document.querySelectorAll('[data-spot]');
  if (!stages.length || !items.length) return;

  function toggle(spot, on) {
    document.querySelectorAll('[data-spot="' + spot + '"]').forEach(function (el) {
      el.classList.toggle('is-on', on);
    });
  }

  items.forEach(function (el) {
    var spot = el.getAttribute('data-spot');
    el.addEventListener('mouseenter', function () { toggle(spot, true); });
    el.addEventListener('mouseleave', function () { toggle(spot, false); });
  });

  // 전시명 말풍선: 지도(층)마다 하나씩
  stages.forEach(function (stage) {
    var tip = document.createElement('div');
    tip.className = 'mk-tip';
    tip.setAttribute('role', 'status');
    tip.hidden = true;
    stage.appendChild(tip);
  });
  var current = null;

  function closeTip() {
    document.querySelectorAll('.mk-tip').forEach(function (t) { t.hidden = true; });
    current = null;
  }

  function openTip(btn) {
    closeTip();
    var tip = btn.closest('.map-stage').querySelector('.mk-tip');
    var left = parseFloat(btn.style.left);
    tip.textContent = (btn.dataset.no || btn.dataset.spot) + '. ' + btn.dataset.name;
    tip.style.left = btn.style.left;
    tip.style.top = btn.style.top;
    tip.classList.toggle('is-left', left < 25);
    tip.classList.toggle('is-right', left > 75);
    tip.hidden = false;
    current = btn;
  }

  document.querySelectorAll('.map-stage button.mk').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (current === btn) closeTip();
      else openTip(btn);
    });
  });

  // 아래 전시 구역 목록 클릭 → 그 항목 아래에 사진이 토글로 펼쳐짐(한 번에 하나) + 지도 해당 번호에 전시명 표시
  // 사진: 1층은 images/greenhouse_<두 자리 번호>.png, 2층은 li의 data-photo. 사진이 없는 항목은 지도 말풍선만
  var openRow = null;

  function setOpen(row, open) {
    row.classList.toggle('is-open', open);
    row.querySelector('.spot-row').setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  document.querySelectorAll('.spot-list li[data-spot]').forEach(function (li) {
    var spot = li.dataset.spot;
    var btn = document.querySelector('.map-stage button.mk[data-spot="' + spot + '"]');
    var name = li.querySelector('.spot-name').textContent;
    var photo = li.dataset.photo || (/^\d+$/.test(spot) ? 'images/greenhouse_' + ('0' + spot).slice(-2) + '.png' : '');
    var hasPhoto = !!photo;
    var panelId = 'spot-photo-' + spot;

    // 번호·이름을 버튼으로 감싸기
    var row = document.createElement('button');
    row.type = 'button';
    row.className = 'spot-row';
    while (li.firstChild) row.appendChild(li.firstChild);
    li.appendChild(row);

    if (hasPhoto) {
      row.setAttribute('aria-expanded', 'false');
      row.setAttribute('aria-controls', panelId);
      row.insertAdjacentHTML('beforeend', '<i class="bi bi-chevron-down spot-arrow" aria-hidden="true"></i>');
      li.insertAdjacentHTML('beforeend',
        '<div class="spot-photo" id="' + panelId + '"><div class="spot-photo-in">' +
          '<img src="' + photo + '" alt="' + li.querySelector('.spot-num').textContent + '번 ' + name + ' 전시 모습" loading="lazy">' +
        '</div></div>');
    }

    row.addEventListener('click', function (e) {
      e.stopPropagation();
      if (!hasPhoto) {
        if (btn && current !== btn) openTip(btn);
        else closeTip();
        return;
      }
      var willOpen = !li.classList.contains('is-open');
      if (openRow && openRow !== li) setOpen(openRow, false);
      setOpen(li, willOpen);
      openRow = willOpen ? li : null;
      if (btn && willOpen) openTip(btn);
      else closeTip();
    });

    // 지도 번호 마크 클릭 → 같은 번호의 전시 구역 토글도 함께 열기/닫기 (말풍선과 같이 움직임)
    if (btn && hasPhoto) {
      btn.addEventListener('click', function () {
        var willOpen = current === btn; // 마크 자체 클릭 처리(말풍선 열기/닫기)가 먼저 실행된 뒤의 상태
        if (openRow && openRow !== li) setOpen(openRow, false);
        setOpen(li, willOpen);
        openRow = willOpen ? li : null;
      });
    }
  });

  document.addEventListener('click', closeTip);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeTip();
  });

  // 메인 "생태관의 사계" 카드에서 guide.html?floor=1&spot=4 로 들어오면 해당 층·번호를 바로 표시
  var params = new URLSearchParams(location.search);
  var floor = params.get('floor') || '1';
  var spotNo = params.get('spot');
  if (!params.get('floor') && !spotNo) return;
  var tab = document.querySelector('[data-floor-tab="' + floor + '"]');
  if (tab) tab.click();
  var spot = spotNo && (floor === '1' ? spotNo : floor + 'f-' + spotNo);
  var target = spot && document.querySelector('.map-stage button.mk[data-spot="' + spot + '"]');
  if (target) {
    if (window.guideShowSpot) window.guideShowSpot(target); // 1층은 해당 구역 화면을 먼저 열기
    openTip(target);
    // 전시 구역 목록·지도 번호를 호버 상태로 표시 (다른 번호·목록을 고르면 해제)
    var marked = document.querySelectorAll('[data-spot="' + spot + '"]');
    marked.forEach(function (el) { el.classList.add('is-target'); });
    document.addEventListener('click', function clear(e) {
      if (e.target.closest && e.target.closest('[data-spot="' + spot + '"]')) return;
      marked.forEach(function (el) { el.classList.remove('is-target'); });
      document.removeEventListener('click', clear, true);
    }, true);
  }
  var mapSec = document.querySelector('.guide-map');
  if (mapSec) (mapSec.closest('.guide-sec') || mapSec).scrollIntoView({ block: 'start' });
})();

/* 퀵버튼 '안내도'(guide.html#map)로 들어오면, 이미지가 다 불러와져 높이가 정해진 뒤 관람안내도 위치로 다시 맞춤 */
window.addEventListener('load', function () {
  if (location.hash !== '#map') return;
  var el = document.getElementById('map');
  if (el) el.scrollIntoView({ block: 'start', behavior: 'instant' });
});
