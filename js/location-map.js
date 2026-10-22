// 찾아오시는 길: 카카오맵 + 로드뷰 전환
(() => {
  const mapEl = document.getElementById('kakaoMap');
  if (!mapEl) return;

  const roadviewEl = document.getElementById('kakaoRoadview');
  const toggle = document.getElementById('mapToggle');
  const toggleText = toggle.querySelector('.map-toggle-text');
  const message = document.getElementById('mapMessage');

  const PLACE_NAME = '대전곤충생태관';
  const ADDRESS = '대전광역시 서구 둔산대로 191';
  // 주소 검색 결과가 오기 전 임시 중심(한밭수목원 일대)
  const FALLBACK = { lat: 36.3687, lng: 127.3884 };

  const showMessage = (text) => {
    message.textContent = text;
    message.hidden = false;
  };

  // SDK 로드 실패: 키 오류, 등록되지 않은 도메인, 파일로 직접 열기(file://) 등
  if (!window.kakao?.maps) {
    showMessage('지도를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.');
    return;
  }

  kakao.maps.load(() => {
    let position = new kakao.maps.LatLng(FALLBACK.lat, FALLBACK.lng);
    const map = new kakao.maps.Map(mapEl, { center: position, level: 3 });
    // 페이지 스크롤 중 지도가 확대·축소되지 않도록 휠 확대는 끄고 확대 버튼 제공
    map.setZoomable(false);
    // 아래쪽은 주소 바가 덮으므로 확대 버튼은 오른쪽 위
    map.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.TOPRIGHT);

    // 이름표 + 핀을 한 덩어리로 그림 (카카오 기본 마커는 화면 배율에 따라 이름표와 어긋나서 쓰지 않음)
    // yAnchor 1 = 덩어리 맨 아래(핀 끝)가 정확히 위치를 가리킴
    const pin = '<svg class="map-pin" viewBox="0 0 30 40" aria-hidden="true"><path d="M15 39C15 39 2 23.5 2 14.5a13 13 0 0 1 26 0C28 23.5 15 39 15 39z" fill="rgb(32,160,85)" stroke="#fff" stroke-width="2"/><circle cx="15" cy="14.5" r="5" fill="#fff"/></svg>';
    const label = new kakao.maps.CustomOverlay({
      position,
      content: `<div class="map-label-wrap"><div class="map-label">${PLACE_NAME}</div>${pin}</div>`,
      yAnchor: 1,
      map,
    });

    const placeAt = (latlng) => {
      position = latlng;
      label.setPosition(latlng);
      map.setCenter(latlng);
    };

    // 정확한 위치: 장소명 검색 → 실패하면 주소 검색
    const places = new kakao.maps.services.Places();
    places.keywordSearch(PLACE_NAME, (data, status) => {
      if (status === kakao.maps.services.Status.OK) {
        placeAt(new kakao.maps.LatLng(data[0].y, data[0].x));
        return;
      }
      new kakao.maps.services.Geocoder().addressSearch(ADDRESS, (res, st) => {
        if (st === kakao.maps.services.Status.OK) placeAt(new kakao.maps.LatLng(res[0].y, res[0].x));
      });
    });

    // 화면 크기가 바뀌면 지도 크기 다시 계산
    window.addEventListener('resize', () => {
      map.relayout();
      map.setCenter(position);
      if (roadview) roadview.relayout();
    });

    // ---------- 로드뷰 ----------
    let roadview = null;
    const roadviewClient = new kakao.maps.RoadviewClient();
    let showingRoadview = false;

    const setMode = (isRoadview) => {
      showingRoadview = isRoadview;
      mapEl.hidden = isRoadview;
      roadviewEl.hidden = !isRoadview;
      toggle.setAttribute('aria-pressed', isRoadview);
      toggle.classList.toggle('is-roadview', isRoadview);
      toggleText.textContent = isRoadview ? '지도 보기' : '로드뷰 보기';
      if (!isRoadview) {
        map.relayout();
        map.setCenter(position);
      }
    };

    toggle.hidden = false;
    toggle.addEventListener('click', () => {
      message.hidden = true;
      if (showingRoadview) {
        setMode(false);
        return;
      }
      // 위치에서 가장 가까운 로드뷰 지점(반경 100m)을 찾아 표시
      roadviewClient.getNearestPanoId(position, 100, (panoId) => {
        if (!panoId) {
          showMessage('이 위치 주변에는 로드뷰가 없어요.');
          return;
        }
        setMode(true);
        if (!roadview) roadview = new kakao.maps.Roadview(roadviewEl);
        roadview.setPanoId(panoId, position);
        roadview.relayout();
      });
    });
  });
})();
