// 프로그램 데이터 (programs.json 기반)
// 메인 '이달의 프로그램'과 예약 페이지가 이 파일을 함께 읽습니다. 프로그램 정보는 이 파일만 수정하면 됩니다.
// image: 대표 사진(임시로 기존 사진 연결) / options[].image: 옵션 사진(파일이 없으면 화면에서 숨김)
// detailUrl(선택): 프로그램 상세페이지 주소를 넣으면 예약 팝업의 '상세 정보' 버튼에 연결됩니다.
window.PROGRAM_DATA ={
  "common": {
    "facility": "대전곤충생태관",
    "terms": [
      "생태관 내에서 떠들거나 뛰지 않습니다.",
      "바퀴있는 신발을 신고 생태관 내를 관람하지 않습니다.",
      "유모차, 킥보드 등은 생태관 입구에 안전하게 놓고 관람합니다.",
      "다른 관람객에게 지장을 초래할 경우 및 직원의 안내, 지시를 따르지 않을 시 입장이 거부될 수 있습니다.",
      "전시물 및 시설물 손상에 주의하시고 전시물(시설물 포함)에 올라가지 않습니다.",
      "전시물이나 시설물을 파괴하거나 훼손하였을 경우에는 이에 대한 책임을 지고 변상해야 합니다."
    ]
  },
  "programs": [
    {
      "id": "insect-model-2026-h2",
      "type": "단체",
      "title": "곤충모형 만들기",
      "image": "images/program02.png",
      "year": 2026,
      "season": "하반기",
      "summary": "자연물을 이용한 곤충모형 만들기",
      "location": "대전곤충생태관 1층 교육실",
      "contact": "042-270-5271",
      "target": {
        "minAge": 5,
        "groups": [
          "유아",
          "초등",
          "중등"
        ]
      },
      "capacity": {
        "min": 1,
        "max": 20
      },
      "period": {
        "start": "2026-09-18",
        "end": "2026-12-11"
      },
      "applyPeriod": {
        "start": "2026-09-01",
        "end": "2026-12-11"
      },
      "days": [
        "화",
        "수",
        "목",
        "금"
      ],
      "closedDates": [],
      "openDates": [],
      "time": {
        "start": "10:00",
        "end": "11:30"
      },
      "duration": {
        "minutes": 90,
        "label": "90분"
      },
      "sessions": [],
      "applyMethod": "온라인예약(선착순)",
      "fee": 0,
      "feeNote": "생태관 관람은 무료",
      "options": [
        {
          "name": "곤충피리 만들기",
          "form": "목걸이형",
          "materialFee": 3000,
          "ageMin": 5,
          "ageMax": 12,
          "ageLabel": "5세~12세(초등)",
          "image": "images/options01.png"
        },
        {
          "name": "반딧불이 만들기",
          "form": "액자형",
          "materialFee": 5000,
          "ageMin": 7,
          "ageMax": 15,
          "ageLabel": "7세~15세(중학생)",
          "image": "images/options02.png"
        },
        {
          "name": "원목새 버드콜",
          "form": "목걸이형",
          "materialFee": 5000,
          "ageMin": 7,
          "ageMax": null,
          "ageLabel": "7세~성인",
          "image": "images/options03.png"
        }
      ],
      "notices": [
        "예약은 한 달 전부터 가능합니다.",
        "예약이 확정된 후 취소가 안 되시는 분은 담당자(042-270-5271)에게 연락 부탁드립니다."
      ],
      "attachments": []
    },
    {
      "id": "guided-tour-2026-h2",
      "type": "단체",
      "title": "단체해설",
      "image": "images/program01.png",
      "year": 2026,
      "season": "하반기",
      "summary": "대전곤충생태관 내부를 돌아보며 1층, 2층에 전시된 전시생물 해설",
      "location": "대전곤충생태관 1층, 2층",
      "contact": "042-270-5271",
      "target": {
        "minAge": 6,
        "groups": [
          "유아",
          "초등",
          "중등"
        ]
      },
      "capacity": {
        "min": 1,
        "max": 20
      },
      "period": {
        "start": "2026-09-16",
        "end": "2026-12-11"
      },
      "applyPeriod": {
        "start": "2026-08-23",
        "end": "2026-12-11"
      },
      "days": [
        "수",
        "목",
        "금"
      ],
      "closedDates": [],
      "openDates": [],
      "time": {
        "start": "10:00",
        "end": "11:00"
      },
      "duration": {
        "minutes": 20,
        "label": "20분 내외"
      },
      "sessions": [],
      "applyMethod": "온라인예약(선착순)",
      "fee": 0,
      "feeNote": "",
      "options": [],
      "notices": [
        "5세 이하의 유아는 해설 진행이 어려워 양해 부탁드립니다.",
        "예약이 확정된 후 취소가 안 되시는 분은 담당자(042-270-5271)에게 연락 부탁드립니다."
      ],
      "attachments": []
    },
    {
      "id": "firefly-2026-summer",
      "type": "개인",
      "title": "반딧불이 불빛체험",
      "image": "images/program03.jpg",
      "year": 2026,
      "season": "하반기",
      "summary": "직접 번식·사육한 반딧불이 4만여 마리를 어두운 체험 공간에서 직접 관찰",
      "location": "대전곤충생태관 1층 교육실",
      "contact": "",
      "target": {
        "minAge": null,
        "groups": []
      },
      "capacity": {
        "min": null,
        "max": null
      },
      "period": {
        "start": "2026-07-24",
        "end": "2026-12-30"
      },
      "applyPeriod": {
        "start": "2026-07-24",
        "end": "2026-12-30"
      },
      "days": [
        "월",
        "화",
        "수",
        "목",
        "금",
        "토",
        "일"
      ],
      "closedDates": [
        "2026-07-27",
        "2026-08-03",
        "2026-08-10"
      ],
      "openDates": [],
      "time": {
        "start": "13:00",
        "end": "16:55"
      },
      "duration": {
        "minutes": 15,
        "label": "15분"
      },
      "sessions": [
        {
          "no": 1,
          "start": "13:00",
          "end": "13:15"
        },
        {
          "no": 2,
          "start": "13:20",
          "end": "13:35"
        },
        {
          "no": 3,
          "start": "13:40",
          "end": "13:55"
        },
        {
          "no": 4,
          "start": "14:00",
          "end": "14:15"
        },
        {
          "no": 5,
          "start": "14:20",
          "end": "14:35"
        },
        {
          "no": 6,
          "start": "14:40",
          "end": "14:55"
        },
        {
          "no": 7,
          "start": "15:00",
          "end": "15:15"
        },
        {
          "no": 8,
          "start": "15:20",
          "end": "15:35"
        },
        {
          "no": 9,
          "start": "15:40",
          "end": "15:55"
        },
        {
          "no": 10,
          "start": "16:00",
          "end": "16:15"
        },
        {
          "no": 11,
          "start": "16:20",
          "end": "16:35"
        },
        {
          "no": 12,
          "start": "16:40",
          "end": "16:55"
        }
      ],
      "applyMethod": "온라인예약(선착순)",
      "fee": 0,
      "feeNote": "",
      "options": [],
      "notices": [
        "입장권은 체험 당일 오전 10시부터 현장에서 선착순 무료 배부합니다.",
        "입장권 소지자에 한해 체험 가능합니다.",
        "관람 시작 10분 전까지 도착해 주세요. (입장권 지참)",
        "지정된 일시 외에는 관람이 불가합니다."
      ],
      "attachments": []
    },
    {
      "id": "butterfly-exhibition-2026-spring",
      "type": "전시",
      "title": "나비 특별기획전",
      "image": "images/Tab_Banner_Spring_01(03).png",
      "year": 2026,
      "season": "봄",
      "summary": "배추흰나비, 호랑나비, 암끝검은표범나비 등 다양한 나비를 관찰하고 애벌레와 번데기도 볼 수 있는 특별기획전",
      "location": "대전곤충생태관 1층 유리온실",
      "contact": "",
      "target": {
        "minAge": null,
        "groups": []
      },
      "capacity": {
        "min": null,
        "max": null
      },
      "period": {
        "start": "2026-05-15",
        "end": "2026-05-25"
      },
      "applyPeriod": {
        "start": "2026-05-15",
        "end": "2026-05-25"
      },
      "days": [
        "월",
        "화",
        "수",
        "목",
        "금",
        "토",
        "일"
      ],
      "closedDates": [
        "2026-05-18"
      ],
      "openDates": [],
      "time": {
        "start": "10:00",
        "end": "17:00"
      },
      "duration": {
        "minutes": null,
        "label": ""
      },
      "sessions": [],
      "applyMethod": "",
      "fee": null,
      "feeNote": "",
      "options": [],
      "notices": [],
      "attachments": []
    },
    {
      "id": "butterfly-specimen-2026-spring",
      "type": "개인",
      "title": "나비 표본 만들기 체험",
      "image": "images/Tab_Banner_Spring_01(01).png",
      "year": 2026,
      "season": "봄",
      "summary": "나비 특별기획전 연계 체험으로, 직접 나비 표본을 만드는 방법을 배우고 제작해보는 체험",
      "location": "대전곤충생태관 1층 교육실",
      "contact": "",
      "target": {
        "minAge": null,
        "groups": []
      },
      "capacity": {
        "min": null,
        "max": 15
      },
      "period": {
        "start": "2026-05-17",
        "end": "2026-05-25"
      },
      "applyPeriod": {
        "start": "2026-05-17",
        "end": "2026-05-25"
      },
      "days": [
        "일",
        "월"
      ],
      "closedDates": [],
      "openDates": [
        "2026-05-17",
        "2026-05-25"
      ],
      "time": {
        "start": "13:00",
        "end": "15:50"
      },
      "duration": {
        "minutes": 50,
        "label": "50분"
      },
      "sessions": [
        {
          "no": 1,
          "start": "13:00",
          "end": "13:50"
        },
        {
          "no": 2,
          "start": "14:00",
          "end": "14:50"
        },
        {
          "no": 3,
          "start": "15:00",
          "end": "15:50"
        }
      ],
      "applyMethod": "",
      "fee": null,
      "feeNote": "",
      "options": [],
      "notices": [
        "회차별 선착순 15명입니다.",
        "체험한 표본은 가져갈 수 없습니다."
      ],
      "attachments": []
    }
  ]
};
