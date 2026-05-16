// script.js — College Week Planner

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const ALL_DAYS  = [...WEEKDAYS, "Saturday", "Sunday"];

const TIMES = [];
for (let h = 8; h <= 23; h++) {
  TIMES.push(`${String(h).padStart(2, "0")}:00`);
}

// ─── BUILD DAY CARDS (no busy checkbox) ───────────────────────
function buildDayCards() {
  const container = document.querySelector(".days-container");
  container.innerHTML = "";

  WEEKDAYS.forEach(day => {
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

  // meals/snacks = only food you need to BRING to college
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

  // ── COLLECT WEEKDAY DATA FIRST (needed for prep day logic) ──
  const dayData = {};
  WEEKDAYS.forEach(day => {
    const startRaw = getVal(`${day}-start`);
    const endRaw   = getVal(`${day}-end`);
    const event    = getVal(`${day}-event`);

    const hasLectures = startRaw && endRaw;
    const startHour   = hasLectures ? Math.floor(parseFloat(startRaw)) : null;
    const endHour     = hasLectures ? Math.ceil(parseFloat(endRaw))    : null;
    const lectureHours = hasLectures ? (endHour - startHour) : 0;

    // "Busy evening" = event is scheduled OR lectures run past 17:00
    const busyEvening = !!event || (hasLectures && endHour >= 17);

    dayData[day] = { startRaw, endRaw, event, hasLectures, startHour, endHour, lectureHours, busyEvening };
  });

  // ── MEAL PREP DAY: pick least-busy weekday (fewest lecture hours) ──
  // Prefer Wed → Thu → Tue → Mon → Fri, but among those pick lightest day
  const prepCandidates = ["Wednesday", "Thursday", "Tuesday", "Monday", "Friday"];
  // Sort by lecture hours ascending (0 = no lectures = best)
  const sortedCandidates = [...prepCandidates].sort(
    (a, b) => dayData[a].lectureHours - dayData[b].lectureHours
  );
  const prepDay = sortedCandidates[0];

  const warningBox = document.getElementById("warningBox");
  warningBox.classList.add("hidden");

  // ── PROCESS EACH WEEKDAY ──
  WEEKDAYS.forEach(day => {
    const { hasLectures, startHour, endHour, event, busyEvening } = dayData[day];

    // NO LECTURES
    if (!hasLectures) {
      fillSlots(schedule, day, 10, 13, "Deep Study", "study");
      if (examMode) {
        fillSlots(schedule, day, 14, 16, "Extra Study", "study");
      } else if (!busyEvening) {
        fillSlots(schedule, day, 16, 18, "Gym", "gym");
        gym++;
      }
      fillSlots(schedule, day, 19, 20, "Dinner", "meal");
      if (event) fillSlots(schedule, day, 20, 22, event, "social");
      // No meals/snacks to bring — eating at home
      return;
    }

    // COLLEGE DAY — add lecture block
    const sH = Math.max(8,  startHour);
    const eH = Math.min(23, endHour);
    fillSlots(schedule, day, sH, eH, "College", "lecture");

    const isFullDay  = startHour <= 9 && endHour >= 17;   // e.g. 08:45–17:30
    const isEarlyDay = endHour <= 13;                      // done by 10:30 or 12:30
    const isMidDay   = !isFullDay && !isEarlyDay;          // 13:45 start or ends ~15:30

    if (isFullDay) {
      // Long day — bring lunch + snack, home for dinner
      meals += 1; snacks += 1;
      fillSlots(schedule, day, 19, 20, "Dinner", "meal");
      fillSlots(schedule, day, 20, 22, "Study",  "study");

    } else if (isEarlyDay) {
      // Short day — back by 10:30 or 12:30, eat at home, nothing to bring
      // (maybe a snack if leaving early)
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
      // Mid day — bring lunch, home for dinner
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
  });

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

// ─── INIT ─────────────────────────────────────────────────────
buildDayCards();
document.getElementById("generateBtn").addEventListener("click", generateWeek);
