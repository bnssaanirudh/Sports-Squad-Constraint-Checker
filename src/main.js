import { roster, defaultSelectedIds } from './data.js';
import { validateSquad } from './validator.js';

// Application State
let selectedIds = new Set(defaultSelectedIds);

// DOM Elements
const rosterBody = document.getElementById('roster-body');
const countsDisplay = document.getElementById('counts-display');
const rulesSummary = document.getElementById('rules-summary');
const overallStatus = document.getElementById('overall-status');
const errorList = document.getElementById('error-list');

const validateBtn = document.getElementById('validate-btn');
const loadValidBtn = document.getElementById('load-valid-btn');
const loadInvalidBtn = document.getElementById('load-invalid-btn');
const resetBtn = document.getElementById('reset-btn');

// Initialize Roster Table DOM once
function initRosterTable() {
  rosterBody.innerHTML = '';
  roster.forEach(player => {
    const tr = document.createElement('tr');
    if (player.availability === 'UNAVAILABLE') tr.classList.add('unavailable');

    const badgeClass = player.availability === 'AVAILABLE' ? 'badge-available' : 'badge-unavailable';

    tr.innerHTML = `
      <td><input type="checkbox" value="${player.id}" class="player-checkbox"></td>
      <td>${player.id}</td>
      <td><strong>${player.student}</strong></td>
      <td>${player.position}</td>
      <td>${player.cohort}</td>
      <td><span class="availability-badge ${badgeClass}">${player.availability}</span></td>
    `;
    rosterBody.appendChild(tr);
  });

  // Event delegation: one listener for all checkboxes
  rosterBody.addEventListener('change', (e) => {
    if (e.target.classList.contains('player-checkbox')) {
      if (e.target.checked) selectedIds.add(e.target.value);
      else selectedIds.delete(e.target.value);
      updateUI();
    }
  });
}

// Sync View with State
function updateUI() {
  const selectedArray = Array.from(selectedIds);
  const result = validateSquad(selectedArray, roster);

  // 1. Update Roster Table State (No DOM destruction)
  const rows = rosterBody.querySelectorAll('tr');
  rows.forEach(tr => {
    const checkbox = tr.querySelector('.player-checkbox');
    const isChecked = selectedIds.has(checkbox.value);
    
    checkbox.checked = isChecked;
    if (isChecked) {
      tr.classList.add('selected-row');
    } else {
      tr.classList.remove('selected-row');
    }
  });

  // 2. Update Counts
  const c = result.counts;
  countsDisplay.innerHTML = `
    <div class="stat-card"><span>Size</span><strong>${c.size}</strong></div>
    <div class="stat-card"><span>Goalkeeper</span><strong>${c.positions.GOALKEEPER}</strong></div>
    <div class="stat-card"><span>Defender</span><strong>${c.positions.DEFENDER}</strong></div>
    <div class="stat-card"><span>Forward</span><strong>${c.positions.FORWARD}</strong></div>
    <div class="stat-card"><span>Utility</span><strong>${c.positions.UTILITY}</strong></div>
    <div class="stat-card"><span>YEAR_2</span><strong>${c.cohorts.YEAR_2}</strong></div>
    <div class="stat-card"><span>YEAR_3</span><strong>${c.cohorts.YEAR_3}</strong></div>
  `;

  // Update Badge
  document.getElementById('selection-count-badge').textContent = `${c.size}/7 Selected`;

  // 3. Update Rule Checklist (Derived strictly from validator results)
  const errs = result.errors;
  const hasErr = (errStr) => errs.some(e => e.includes(errStr));
  
  const ruleChecklist = [
    { name: 'Exactly 7 Players', pass: !hasErr('SQUAD_SIZE_MUST_BE_7') && !hasErr('INVALID_SELECTION_REFERENCE') },
    { name: 'Exactly 1 Goalkeeper', pass: !hasErr('GOALKEEPER_COUNT_MUST_BE_1') && !hasErr('INVALID_SELECTION_REFERENCE') },
    { name: 'Min 2 Defenders', pass: !hasErr('MINIMUM_DEFENDERS_NOT_MET') && !hasErr('INVALID_SELECTION_REFERENCE') },
    { name: 'Min 2 Forwards', pass: !hasErr('MINIMUM_FORWARDS_NOT_MET') && !hasErr('INVALID_SELECTION_REFERENCE') },
    { name: 'No Unavailable Players', pass: !hasErr('PLAYER_UNAVAILABLE') && !hasErr('INVALID_SELECTION_REFERENCE') },
    { name: 'Max 4 per Cohort', pass: !hasErr('COHORT_LIMIT_EXCEEDED') && !hasErr('INVALID_SELECTION_REFERENCE') }
  ];

  rulesSummary.innerHTML = ruleChecklist.map(rule => `
    <li>
      <span>${rule.name}</span>
      <span class="${rule.pass ? 'rule-pass' : 'rule-fail'}">${rule.pass ? 'PASS' : 'FAIL'}</span>
    </li>
  `).join('');

  // 4. Update Validation Output
  const violationCountEl = document.getElementById('violation-count');
  if (result.isValid) {
    overallStatus.textContent = 'VALID';
    overallStatus.className = 'status-badge valid';
    violationCountEl.textContent = '0 violations found';
    errorList.innerHTML = '';
    errorList.style.display = 'none';
  } else {
    overallStatus.textContent = 'INVALID';
    overallStatus.className = 'status-badge invalid';
    violationCountEl.textContent = `${errs.length} violation${errs.length !== 1 ? 's' : ''} found`;
    errorList.style.display = 'block';
    errorList.innerHTML = errs.map(err => `<li>${err}</li>`).join('');
  }
}

// Event Listeners for Buttons
validateBtn.addEventListener('click', updateUI);

loadValidBtn.addEventListener('click', () => {
  selectedIds = new Set(['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07']);
  updateUI();
});

loadInvalidBtn.addEventListener('click', () => {
  selectedIds = new Set(['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S08']);
  updateUI();
});

resetBtn.addEventListener('click', () => {
  selectedIds = new Set(['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07']);
  updateUI();
});

// Initial boot
initRosterTable();
updateUI();
