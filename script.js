// script.js — College Week Planner

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const ALL_DAYS  = [...WEEKDAYS, "Saturday", "Sunday"];

const TIMES = [];
for (let h = 8; h <= 23; h++) {
  TIMES.push(`${String(h).padStart(2, "0")}:00`);
}

// ─── BUILD DAY CARDS ──────────────────────────────────────────
function buildDayCards() {
  const container = document.querySelector(".days-container");
  container.innerHTML = "";
  const examMode = getChecked("examMode");

  WEEKDAYS.forEach(day => {
    const examSection = examMode ? `
      <div class="exam-section">
        <div class="exam-section-title">📝 Exam</div>
        <div class="time-row">
          <div class="input-group">
            <label>Exam Start</label>
            <select id="${day}-exam-start">
              <option value="">— none —</option>
              <option value="8.45">08:45</option>
              <option value="10.45">10:45</option>
              <option value="13.45">13:45</option>
              <option value="15.45">15:45</option>
            </select>
          </div>
          <div class="input-group">
            <label>Exam End</label>
            <select id="${day}-exam-end">
              <option value="">— none —</option>
              <option value="10.30">10:30</option>
              <option value="12.30">12:30</option>
              <option value="15.30">15:30</option>
              <option value="17.30">17:30</option>
            </select>
          </div>
        </div>
        <div class="input-group">
          <label>Exam Name</label>
          <input type="text" id="${day}-exam-name" placeholder="e.g. Structural Mechanics">
        </div>
      </div>
    ` : "";

    container.insertAdjacentHTML("beforeend", `
      <div class="day-card">
        <div class="day-card-header">
          <h3>${day}</h3>
        </div>
        <div class="time-row">
          <div class="input-group">
            <label>Lecture Start</label>
            <select id="${day}-start">
              <option value="">— none —</option>
              <option value="8.45">08:45</option>
              <option value="10.45">10:45</option>
              <option value="13.45">13:45</option>
              <option value="15.45">15:45</option>
            </select>
          </div>
          <div class="input-group">
            <label>Lecture End</label>
            <select id="${day}-end">
              <option value="">— none —</option>
              <option value="10.30">10:30</option>
              <option value="12.30">12:30</option>
              <option value="15.30">15:30</option>
              <option value="17.30">17:30</option>
            </select>
          </div>
        </div>
        <div class="input-group">
          <label>Event / Plan</label>
          <input type="text" id="${day}-event" placeholder="e.g. Movie night">
        </div>
        ${examSection}
      </div>
    `);
  });
}

// ─── HELPERS ──────────────────────────────────────────────────
function makeBlock(text, type) {
  if (type === "free") return `<div class="block free"></div>`;
  return `<div class="block ${type}">${text}</div>`;
}

function fillSlots(schedule, day, startHour, endHour, text, type) {
  for (let h = startHour; h < endHour; h++) {
    const key = `${String(h).padStart(2, "0")}:00`;
    if (schedule[day] && schedule[day][key] !== undefined) {
      schedule[day][key] = makeBlock(text, type);
    }
  }
}

function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value : "";
}

function getChecked(id) {
  const el = document.getElementById(id);
  return el ? el.checked : false;
}

// ─── GENERATE ─────────────────────────────────────────────────
function generateWeek() {
  const examMode = getChecked("examMode");

  // Init schedule
  const schedule = {};
  ALL_DAYS.forEach(day => {
    schedule[day] = {};
    TIMES.forEach(t => { schedule[day][t] = makeBlock("", "free"); });
  });

  let meals = 0, snacks = 0, gym = 0;

  // ── SATURDAY ──
  fillSlots(schedule, "Saturday", 9,  15, "Study", "study");
  if (!examMode) {
    fillSlots(schedule, "Saturday", 16, 18, "Gym", "gym");
    gym++;
  } else {
    fillSlots(schedule, "Saturday", 16, 18, "Study", "study");
  }
  fillSlots(schedule, "Saturday", 19, 20, "Dinner", "meal");
  fillSlots(schedule, "Saturday", 20, 22, "Business / Admin", "free");

  // ── SUNDAY ──
  fillSlots(schedule, "Sunday", 10, 13, "Meal Prep",     "meal");
  fillSlots(schedule, "Sunday", 14, 15, "Long Walk",     "free");
  fillSlots(schedule, "Sunday", 16, 18, "Reset + Clean", "study");
  fillSlots(schedule, "Sunday", 19, 20, "Dinner",        "meal");

  // ── COLLECT WEEKDAY DATA FIRST ──
  const dayData = {};
  WEEKDAYS.forEach(day => {
    const startRaw   = getVal(`${day}-start`);
    const endRaw     = getVal(`${day}-end`);
    const event      = getVal(`${day}-event`);
    const examStart  = examMode ? getVal(`${day}-exam-start`) : "";
    const examEnd    = examMode ? getVal(`${day}-exam-end`)   : "";
    const examName   = examMode ? getVal(`${day}-exam-name`)  : "";

    const hasLectures = startRaw && endRaw;
    const hasExam     = examStart && examEnd;

    const startHour    = hasLectures ? Math.floor(parseFloat(startRaw)) : null;
    const endHour      = hasLectures ? Math.ceil(parseFloat(endRaw))    : null;
    const lectureHours = hasLectures ? (endHour - startHour) : 0;

    const examStartHour = hasExam ? Math.floor(parseFloat(examStart)) : null;
    const examEndHour   = hasExam ? Math.ceil(parseFloat(examEnd))    : null;

    // Busy evening = has an event OR lectures/exam run until 17:30
    const lateDayEnd = (hasLectures && endHour >= 17) || (hasExam && examEndHour >= 17);
    const busyEvening = !!event || lateDayEnd;

    dayData[day] = {
      startRaw, endRaw, event,
      hasLectures, startHour, endHour, lectureHours,
      hasExam, examStartHour, examEndHour, examName,
      busyEvening
    };
  });

  // ── MEAL PREP DAY: pick lightest weekday ──
  const prepCandidates = ["Wednesday", "Thursday", "Tuesday", "Monday", "Friday"];
  const sortedCandidates = [...prepCandidates].sort(
    (a, b) => dayData[a].lectureHours - dayData[b].lectureHours
  );
  const prepDay = sortedCandidates[0];

  document.getElementById("warningBox").classList.add("hidden");

  // ── PROCESS EACH WEEKDAY ──
  WEEKDAYS.forEach(day => {
    const {
      hasLectures, startHour, endHour,
      hasExam, examStartHour, examEndHour, examName,
      event, busyEvening
    } = dayData[day];

    // Place exam block if set (overlays or replaces lecture slot)
    if (hasExam) {
      const label = examName ? `Exam: ${examName}` : "Exam";
      fillSlots(schedule, day, examStartHour, examEndHour, label, "exam");
    }

    // Place lecture block (exam takes visual priority via fill order — exam written after)
    if (hasLectures) {
      const sH = Math.max(8,  startHour);
      const eH = Math.min(23, endHour);
      fillSlots(schedule, day, sH, eH, "College", "lecture");
      // Re-draw exam on top if both exist
      if (hasExam) {
        const label = examName ? `Exam: ${examName}` : "Exam";
        fillSlots(schedule, day, examStartHour, examEndHour, label, "exam");
      }
    }

    // Use effective end hour for scheduling logic (whichever is later: lecture or exam)
    const effectiveEnd = Math.max(
      hasLectures ? endHour : 0,
      hasExam     ? examEndHour : 0
    );
    const effectiveStart = hasLectures ? startHour : (hasExam ? examStartHour : null);
    const hasCollegeToday = hasLectures || hasExam;

    // NO COLLEGE TODAY
    if (!hasCollegeToday) {
      fillSlots(schedule, day, 10, 13, "Deep Study", "study");
      if (examMode) {
        fillSlots(schedule, day, 14, 16, "Extra Study", "study");
        fillSlots(schedule, day, 16, 18, "Extra Study", "study");
      } else if (!busyEvening) {
        fillSlots(schedule, day, 16, 18, "Gym", "gym");
        gym++;
      }
      fillSlots(schedule, day, 19, 20, "Dinner", "meal");
      if (event) fillSlots(schedule, day, 20, 22, event, "social");
      return;
    }

    const isFullDay  = effectiveStart <= 9 && effectiveEnd >= 17;
    const isEarlyDay = effectiveEnd <= 13;

    if (isFullDay) {
      meals += 1; snacks += 1;
      fillSlots(schedule, day, 19, 20, "Dinner", "meal");
      fillSlots(schedule, day, 20, 22, "Study",  "study");

    } else if (isEarlyDay) {
      snacks += 1;
      if (!examMode && !busyEvening) {
        fillSlots(schedule, day, 16, 18, "Gym", "gym");
        gym++;
      } else {
        fillSlots(schedule, day, 16, 18, "Study", "study");
      }
      fillSlots(schedule, day, 19, 20, "Dinner", "meal");
      if (event) fillSlots(schedule, day, 20, 22, event, "social");
      else       fillSlots(schedule, day, 20, 22, "Study", "study");

    } else {
      // Mid day
      meals += 1;
      if (!examMode && !busyEvening) {
        fillSlots(schedule, day, 18, 20, "Gym", "gym");
        gym++;
      } else {
        fillSlots(schedule, day, 18, 20, "Study", "study");
      }
      fillSlots(schedule, day, 20, 21, "Dinner", "meal");
      if (event) fillSlots(schedule, day, 21, 23, event, "social");
    }

    // ── MEAL PREP BLOCK on the chosen prep day ──
    // Scheduled at 20:00–22:00, but only if those slots aren't already taken by dinner/event
    if (day === prepDay) {
      // Find first 2-hour gap from 19:00 onwards that isn't already filled
      const mealPrepSlots = [19, 20, 21];
      let placed = false;
      for (const h of mealPrepSlots) {
        const s1 = `${String(h).padStart(2,"0")}:00`;
        const s2 = `${String(h+1).padStart(2,"0")}:00`;
        const s3 = `${String(h+2).padStart(2,"0")}:00`;
        if (
          h + 2 <= 23 &&
          schedule[day][s1].includes("free") &&
          schedule[day][s2].includes("free")
        ) {
          fillSlots(schedule, day, h, h + 2, "Meal Prep", "meal");
          placed = true;
          break;
        }
      }
      if (!placed) {
        // Fallback: overwrite 21–23 regardless
        fillSlots(schedule, day, 21, 23, "Meal Prep", "meal");
      }
    }
  });

  // Also add meal prep block for no-college days (handled after the forEach above)
  // Re-check prepDay in case it's a no-college day and slot wasn't filled yet
  const pdData = dayData[prepDay];
  if (!pdData.hasLectures && !pdData.hasExam) {
    // No-college day — prep goes at 20:00
    fillSlots(schedule, prepDay, 20, 22, "Meal Prep", "meal");
  }

  // ── UPDATE STATS ──
  document.getElementById("mealCount").textContent  = meals;
  document.getElementById("snackCount").textContent = snacks;
  document.getElementById("gymCount").textContent   = gym;
  document.getElementById("prepDay").textContent    = prepDay;

  renderCalendar(schedule);
}

// ─── RENDER CALENDAR ──────────────────────────────────────────
function renderCalendar(schedule) {
  const body = document.getElementById("calendarBody");
  body.innerHTML = "";

  TIMES.forEach(time => {
    const tr = document.createElement("tr");
    const timeTd = document.createElement("td");
    timeTd.textContent = time;
    tr.appendChild(timeTd);

    ALL_DAYS.forEach(day => {
      const td = document.createElement("td");
      td.innerHTML = schedule[day][time];
      tr.appendChild(td);
    });

    body.appendChild(tr);
  });

  document.getElementById("calendarWrapper").classList.remove("hidden");
  document.getElementById("emptyState").classList.add("hidden");
}

// ─── EXAM MODE TOGGLE: rebuild cards when toggled ─────────────
document.getElementById("examMode").addEventListener("change", buildDayCards);

// ─── INIT ─────────────────────────────────────────────────────
buildDayCards();
document.getElementById("generateBtn").addEventListener("click", generateWeek);
