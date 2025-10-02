// 만다라트 기본 데이터 (첨부 이미지 내용)
const defaultData = [
  ["내몸/마음의 변화 이해", "가족관계변화 적응하기", "직업시장변화 적응하기", "100개 소원버킷 리스트", "노후에 어떻게 살고 싶나?", "남기고 싶은 묘비명", "국민연금 증액 작업", "개인연금 준비", "주택연금 언제 받을까?"],
  ["변화와 나의 연관성 찾기", "변화", "경제적 변화 적응하기", "나의 강점은?", "자기이해", "나의 약점은?", "나쁜 지출 습관 개선", "재무", "자산배분 투자하기"],
  ["인적네트워크의 도움받기", "평생학습 활용", "기술적변화 수용하기", "나의 흥미는?", "내 삶에 꼭 필요한 10가지", "나의 직업가치?", "보험관리는 어떻게?", "수입/지출 관리", "건강에 투자하기"],
  ["퇴직후 할 일(기존? 새 일?)", "내 몸값을 높이려면?", "죽기전에 하고싶은일", "변화", "자기이해", "재무", "1주~1달 살기 체험", "요리 배우기", "기타배우기(시니어밴드)"],
  ["주된 일자리 이탈시키는?", "직업", "완전은퇴 시키는?", "직업", "나", "여가", "유튜브를 통한 학습", "여가", "트레킹 모임"],
  ["업무관련 네트워크 확장", "AI, 내 일에 활용하기", "시골북카페 민박집 운영", "건강", "가족관계", "사회적관계", "독서모임 운영", "평생학습 즐기기", "야구장 인근 이사"],
  ["매일 10분 이상 산책", "주 1회 이하 음주", "매일 10분 스트레칭", "아내부터 챙기기", "이이들의 서포터 되기", "가사분담 늘려가기", "친구들과 정기모임", "그 사람이 필요한 것은?", "공감/소통 지속학습"],
  ["욕심 줄이기", "건강", "감사일기 쓰기", "테마가 있는 가족여행", "가족관계", "양가가족 챙기기", "온라인 모임 활용하기", "사회적관계", "새 친구를 사귀려면?"],
  ["14H 간헐적 단식", "규칙적 수면시간", "아침/저녁 5분 명상", "가족이 싫어 하는 것은?", "가르치려 들지 않기", "가족과 추억 기록하기", "응원단 되기 / 응원단 활용", "Give&Take (먼저 돕기)", "동네친구 만들기"]
];

// 다중 만다라트, 셀 메타, 각종 버튼/모달 참조 등 모든 기능 추가
let mandalartBoards = JSON.parse(localStorage.getItem('mandalartBoards')||'null') || [{name:'기본', data:defaultData, meta:{}}];
let currentBoardIdx = 0;
const table = document.getElementById('mandalart');
const boardList = document.getElementById('boardList');
const exportPdfBtn = document.getElementById('exportPdfBtn');
const exportImgBtn = document.getElementById('exportImgBtn');
const backupBtn = document.getElementById('backupBtn');
const restoreBtn = document.getElementById('restoreBtn');
const restoreFile = document.getElementById('restoreFile');
const newBoardBtn = document.getElementById('newBoardBtn');
const cellModal = document.getElementById('cellModal');
const closeModal = document.getElementById('closeModal');
const cellMemo = document.getElementById('cellMemo');
const cellProgress = document.getElementById('cellProgress');
const progressVal = document.getElementById('progressVal');
const cellColor = document.getElementById('cellColor');
const cellDeadline = document.getElementById('cellDeadline');
const cellHighlight = document.getElementById('cellHighlight');
const saveCellDetail = document.getElementById('saveCellDetail');
let modalTarget = null;

function renderTable(data, meta = {}) {
  table.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const tr = document.createElement('tr');
    for (let j = 0; j < 9; j++) {
      const td = document.createElement('td');
      td.textContent = data[i][j] || '';
      td.setAttribute('data-row', i);
      td.setAttribute('data-col', j);
      if (i === 4 && j === 4) {
        td.classList.add('central');
      } else if (i % 4 === 0 || j % 4 === 0) {
        td.classList.add('subgoal');
      }
      // 셀 메타 적용
      const key = `${i}_${j}`;
      const m = meta[key] || {};
      if (m.color) td.style.background = m.color;
      if (m.highlight) td.classList.add('highlight');
      if (m.progress !== undefined) {
        const bar = document.createElement('div');
        bar.className = 'progress-bar';
        const inner = document.createElement('div');
        inner.className = 'progress-bar-inner';
        inner.style.width = m.progress + '%';
        bar.appendChild(inner);
        td.appendChild(bar);
      }
      if (m.deadline) {
        const d = document.createElement('div');
        d.style.fontSize = '11px';
        d.style.color = '#888';
        d.textContent = m.deadline;
        td.appendChild(d);
      }
      td.addEventListener('click', handleCellEdit);
      td.addEventListener('contextmenu', (e) => { e.preventDefault(); openCellModal(td); });
      td.addEventListener('touchstart', (e) => { td._touchTimer = setTimeout(() => openCellModal(td), 600); });
      td.addEventListener('touchend', (e) => { clearTimeout(td._touchTimer); });
      tr.appendChild(td);
    }
    table.appendChild(tr);
  }
}

function handleCellEdit(e) {
  const td = e.target;
  if (td.classList.contains('editing')) return;
  td.classList.add('editing');
  let oldValue = td.childNodes[0]?.nodeType === 3 ? td.childNodes[0].textContent : td.textContent;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = oldValue;
  input.style.width = '95%';
  input.style.height = '90%';
  input.style.fontSize = '15px';
  input.addEventListener('blur', () => finishEdit(td, input, oldValue));
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') input.blur();
    if (ev.key === 'Escape') {
      input.value = oldValue;
      input.blur();
    }
  });
  td.innerHTML = '';
  td.appendChild(input);
  input.focus();
  input.select();
}

function finishEdit(td, input, oldValue) {
  const newValue = input.value.trim();
  const i = td.getAttribute('data-row');
  const j = td.getAttribute('data-col');
  const meta = getCurrentMeta();
  const data = getCurrentTableData();
  data[i][j] = newValue || oldValue;
  saveCurrentBoard(data, meta);
  renderTable(data, meta);
}

function getCurrentTableData() {
  const data = [];
  for (let i = 0; i < 9; i++) {
    data[i] = [];
    for (let j = 0; j < 9; j++) {
      const td = table.rows[i].cells[j];
      data[i][j] = td.childNodes[0]?.nodeType === 3 ? td.childNodes[0].textContent : td.textContent.split('\n')[0];
    }
  }
  return data;
}

function getCurrentMeta() {
  return mandalartBoards[currentBoardIdx]?.meta || {};
}
function saveCurrentBoard(data, meta) {
  mandalartBoards[currentBoardIdx].data = data;
  mandalartBoards[currentBoardIdx].meta = meta;
  localStorage.setItem('mandalartBoards', JSON.stringify(mandalartBoards));
}
function saveCurrentToMemory() {
  const data = getCurrentTableData();
  const meta = getCurrentMeta();
  saveCurrentBoard(data, meta);
}

function saveTable() {
  saveCurrentToMemory();
  alert('저장되었습니다!');
}

function loadTable(idx) {
  if (typeof idx !== 'number') idx = currentBoardIdx;
  const board = mandalartBoards[idx];
  if (board) {
    renderTable(board.data, board.meta);
    currentBoardIdx = idx;
    updateBoardList();
  } else {
    renderTable(defaultData, {});
  }
}

document.getElementById('saveBtn').addEventListener('click', saveTable);
document.getElementById('loadBtn').addEventListener('click', () => loadTable(currentBoardIdx));

// PDF 내보내기
exportPdfBtn.addEventListener('click', () => {
  import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js').then(jsPDF => {
    import('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js').then(() => {
      html2canvas(table).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF.jsPDF({orientation:'landscape'});
        pdf.addImage(imgData, 'PNG', 10, 10, 270, 160);
        pdf.save('mandalart.pdf');
      });
    });
  });
});
// 이미지 저장
exportImgBtn.addEventListener('click', () => {
  import('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js').then(() => {
    html2canvas(table).then(canvas => {
      const link = document.createElement('a');
      link.download = 'mandalart.png';
      link.href = canvas.toDataURL();
      link.click();
    });
  });
});
// 백업 내보내기
backupBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(mandalartBoards)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mandalart_backup.json';
  a.click();
  URL.revokeObjectURL(url);
});
// 백업 불러오기
restoreBtn.addEventListener('click', () => restoreFile.click());
restoreFile.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      mandalartBoards = JSON.parse(ev.target.result);
      localStorage.setItem('mandalartBoards', JSON.stringify(mandalartBoards));
      loadTable(0);
    } catch { alert('백업 파일이 올바르지 않습니다.'); }
  };
  reader.readAsText(file);
});
// 새 만다라트
newBoardBtn.addEventListener('click', () => {
  const name = prompt('새 만다라트 이름을 입력하세요');
  if (!name) return;
  mandalartBoards.push({name, data:JSON.parse(JSON.stringify(defaultData)), meta:{}});
  localStorage.setItem('mandalartBoards', JSON.stringify(mandalartBoards));
  loadTable(mandalalartBoards.length-1);
});
// 만다라트 목록
function updateBoardList() {
  boardList.innerHTML = '';
  mandalartBoards.forEach((b, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = b.name;
    if (i === currentBoardIdx) opt.selected = true;
    boardList.appendChild(opt);
  });
}
boardList.addEventListener('change', (e) => {
  loadTable(Number(e.target.value));
});

// 셀 상세 모달
function openCellModal(td) {
  modalTarget = td;
  const i = td.getAttribute('data-row');
  const j = td.getAttribute('data-col');
  const meta = getCurrentMeta();
  const key = `${i}_${j}`;
  const m = meta[key] || {};
  cellMemo.value = m.memo || '';
  cellProgress.value = m.progress || 0;
  progressVal.textContent = (m.progress||0) + '%';
  cellColor.value = m.color || '#ffffff';
  cellDeadline.value = m.deadline || '';
  cellHighlight.checked = !!m.highlight;
  cellModal.style.display = 'flex';
}
closeModal.onclick = () => { cellModal.style.display = 'none'; };
cellProgress.oninput = () => { progressVal.textContent = cellProgress.value + '%'; };
saveCellDetail.onclick = () => {
  if (!modalTarget) return;
  const i = modalTarget.getAttribute('data-row');
  const j = modalTarget.getAttribute('data-col');
  const meta = getCurrentMeta();
  const key = `${i}_${j}`;
  meta[key] = {
    memo: cellMemo.value,
    progress: Number(cellProgress.value),
    color: cellColor.value === '#ffffff' ? '' : cellColor.value,
    deadline: cellDeadline.value,
    highlight: cellHighlight.checked
  };
  saveCurrentBoard(getCurrentTableData(), meta);
  renderTable(getCurrentTableData(), meta);
  cellModal.style.display = 'none';
};
window.onclick = function(event) {
  if (event.target === cellModal) cellModal.style.display = 'none';
};

// 최초 로드 시
window.onload = function() {
  loadTable();
};
