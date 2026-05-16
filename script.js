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

  WEEKDAYS.forEach(day => {
    container.insertAdjacentHTML("beforeend", `
      <div class="day-card">
        <div class="day-card-header">
          <h3>${day}</h3>
          <label class="busy-label">
            <input type="checkbox" id="${day}-busy">
            Something Scheduled
          </label>
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
    if (schedule[day][key] !== undefined) {
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
  fillSlots(schedule, "Saturday", 9,  15, "Study",          "study");
  fillSlots(schedule, "Saturday", 19, 21, "Business / Admin","free");
  if (!examMode) {
    fillSlots(schedule, "Saturday", 16, 18, "Gym", "gym");
    gym++;
  } else {
    fillSlots(schedule, "Saturday", 16, 18, "Study", "study");
  }
  meals++; snacks++;

  // ── SUNDAY ──
  fillSlots(schedule, "Sunday", 10, 13, "Meal Prep",     "meal");
  fillSlots(schedule, "Sunday", 14, 15, "Long Walk",     "free");
  fillSlots(schedule, "Sunday", 16, 18, "Reset + Clean", "study");
  meals++; snacks++;

  // ── WEEKDAYS ──
  WEEKDAYS.forEach(day => {
    const startRaw = getVal(`${day}-start`);
    const endRaw   = getVal(`${day}-end`);
    const event    = getVal(`${day}-event`);
    const busy     = getChecked(`${day}-busy`);

    // No lectures today
    if (!startRaw || !endRaw) {
      fillSlots(schedule, day, 10, 13, "Deep Study", "study");
      if (examMode) {
        fillSlots(schedule, day, 16, 18, "Extra Study", "study");
      } else {
        fillSlots(schedule, day, 16, 18, "Gym", "gym");
        gym++;
      }
      if (event) {
        fillSlots(schedule, day, 19, 21, event, "social");
      }
      meals += 1; snacks += 1;
      return; // forEach return = continue
    }

    const startHour = parseInt(startRaw.split(":")[0], 10);
    const endHour   = parseInt(endRaw.split(":")[0],   10);

    // Clamp to timetable range
    const sH = Math.max(8,  startHour);
    const eH = Math.min(23, endHour);

    fillSlots(schedule, day, sH, eH, "College", "lecture");

    const isFullDay  = startHour < 10 && endHour >= 16;
    const isEarlyDay = endHour <= 13;

    if (isFullDay) {
      // Full day of college
      fillSlots(schedule, day, 18, 19, "Dinner", "meal");
      fillSlots(schedule, day, 20, 22, "Study",  "study");
      meals += 1; snacks += 2;

    } else if (isEarlyDay) {
      // Done before 1 PM — afternoon free
      if (examMode || busy) {
        fillSlots(schedule, day, 16, 18, "Study", "study");
      } else {
        fillSlots(schedule, day, 16, 18, "Gym", "gym");
        gym++;
      }
      fillSlots(schedule, day, 19, 21, "Study", "study");
      meals += 1; snacks += 1;

    } else {
      // Mid/late day
      fillSlots(schedule, day, 18, 20, "Study + Dinner", "study");
      if (!examMode && !busy) {
        fillSlots(schedule, day, 20, 21, "Gym", "gym");
        gym++;
      }
      meals += 2; snacks += 1;
    }

    if (event) {
      fillSlots(schedule, day, 21, 23, event, "social");
    }
  });

  // ── MEAL PREP DAY ──
  const wedBusy = getChecked("Wednesday-busy");
  const thuBusy = getChecked("Thursday-busy");
  const tueBusy = getChecked("Tuesday-busy");

  let prepDay = "Wednesday";
  const warningBox = document.getElementById("warningBox");
  warningBox.classList.add("hidden");

  if (wedBusy) {
    if (!thuBusy)      { prepDay = "Thursday"; }
    else if (!tueBusy) { prepDay = "Tuesday"; }
    else {
      prepDay = "N/A";
      warningBox.classList.remove("hidden");
      document.getElementById("warningText").textContent =
        "All mid-week days are busy — no available meal prep slot found.";
    }
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

    // Time cell
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

  // Show calendar, hide empty state
  document.getElementById("calendarWrapper").classList.remove("hidden");
  document.getElementById("emptyState").classList.add("hidden");
}

// ─── INIT ─────────────────────────────────────────────────────
buildDayCards();
document.getElementById("generateBtn").addEventListener("click", generateWeek);
