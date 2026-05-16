// script.js

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

const hours = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00"
];

const grid = document.getElementById("daysGrid");

days.forEach(day => {

  grid.innerHTML += `

    <div class="day-card">

      <h3>${day}</h3>

      <div class="input-group">
        <label>Lecture Start</label>
        <input type="time" id="${day}-start">
      </div>

      <div class="input-group">
        <label>Lecture End</label>
        <input type="time" id="${day}-end">
      </div>

      <div class="input-group">
        <label>Planned Event</label>
        <input type="text"
        placeholder="Dinner, Society, HAIP..."
        id="${day}-event">
      </div>

      <div class="checkbox-row">
        <input type="checkbox" id="${day}-busy">
        <label>Busy Evening</label>
      </div>

    </div>
  `;
});

document
.getElementById("generateBtn")
.addEventListener("click", generateWeek);

function generateWeek() {

  let meals = 0;
  let snacks = 0;
  let gymSessions = 0;

  let prepDay = "Wednesday";

  let warning = "";

  const examMode =
    document.getElementById("examMode").checked;

  const weeklySchedule = {};

  days.forEach(day => {

    const start =
      document.getElementById(`${day}-start`).value;

    const end =
      document.getElementById(`${day}-end`).value;

    const event =
      document.getElementById(`${day}-event`).value;

    const busy =
      document.getElementById(`${day}-busy`).checked;

    weeklySchedule[day] = buildDay(
      day,
      start,
      end,
      event,
      busy,
      examMode
    );

    meals += weeklySchedule[day].meals;
    snacks += weeklySchedule[day].snacks;

    if (weeklySchedule[day].gym) {
      gymSessions++;
    }
  });

  // meal prep logic

  const wedBusy =
    document.getElementById("Wednesday-busy").checked;

  const thuBusy =
    document.getElementById("Thursday-busy").checked;

  const tueBusy =
    document.getElementById("Tuesday-busy").checked;

  if (wedBusy) {

    if (!thuBusy) {
      prepDay = "Thursday";
    }

    else if (!tueBusy) {
      prepDay = "Tuesday";
    }

    else {
      prepDay = "Unavailable";
      warning =
        "No available meal prep day this week.";
    }
  }

  document.getElementById("mealCount")
    .textContent = meals;

  document.getElementById("snackCount")
    .textContent = snacks;

  document.getElementById("gymCount")
    .textContent = gymSessions;

  document.getElementById("prepDay")
    .textContent = prepDay;

  const warningBox =
    document.getElementById("warningBox");

  if (warning) {

    warningBox.classList.remove("hidden");

    document.getElementById("warningText")
      .textContent = warning;

  } else {
    warningBox.classList.add("hidden");
  }

  renderTable(weeklySchedule, prepDay);
}

function buildDay(
  day,
  start,
  end,
  event,
  busy,
  examMode
) {

  let type = "free";

  let meals = 0;
  let snacks = 0;

  let gym = false;

  const blocks = {};

  if (day === "Saturday") {

    blocks["08:00"] = activity("Wake + Breakfast", "meal");
    blocks["09:00"] = activity("Study", "study");
    blocks["10:00"] = activity("Study", "study");
    blocks["11:00"] = activity("Study", "study");
    blocks["12:00"] = activity("Study", "study");
    blocks["13:00"] = activity("Study", "study");
    blocks["14:00"] = activity("Study", "study");

    if (!examMode) {
      blocks["16:00"] = activity("Gym", "gym");
      gym = true;
    }

    blocks["19:00"] = activity("Business/Admin", "free");

    return {
      type: "saturday",
      meals: 1,
      snacks: 1,
      gym,
      blocks
    };
  }

  if (day === "Sunday") {

    blocks["09:00"] = activity("Meal Prep", "meal");
    blocks["10:00"] = activity("Meal Prep", "meal");
    blocks["11:00"] = activity("Clean", "free");
    blocks["13:00"] = activity("Long Walk", "free");
    blocks["15:00"] = activity("Reset", "study");
    blocks["20:00"] = activity("Skincare", "free");

    return {
      type: "sunday",
      meals: 1,
      snacks: 1,
      gym: false,
      blocks
    };
  }

  if (start && end) {

    const startHour = parseInt(start.split(":")[0]);
    const endHour = parseInt(end.split(":")[0]);

    if (startHour < 10 && endHour >= 16) {
      type = "full";
    }

    else if (endHour <= 13) {
      type = "early";
    }

    else {
      type = "late";
    }

    for (let h = startHour; h < endHour; h++) {

      const formatted =
        `${String(h).padStart(2,"0")}:00`;

      blocks[formatted] =
        activity("College", "lecture");
    }

    if (type === "early") {

      meals += 1;
      snacks += 1;

      if (!examMode) {
        blocks["16:00"] =
          activity("Gym", "gym");

        gym = true;
      }

      blocks["18:00"] =
        activity("Dinner", "meal");

      blocks["20:00"] =
        activity("Study", "study");

      blocks["22:00"] =
        activity("Relax", "free");
    }

    if (type === "late") {

      meals += 2;
      snacks += 1;

      blocks["18:00"] =
        activity("Study + Dinner", "study");

      if (!examMode) {

        blocks["20:00"] =
          activity("Gym", "gym");

        gym = true;
      }

      else {

        blocks["20:00"] =
          activity("Extra Study", "study");
      }
    }

    if (type === "full") {

      meals += 1;
      snacks += 2;

      blocks["18:00"] =
        activity("Clean + Meal Prep", "meal");

      blocks["20:00"] =
        activity("Study", "study");

      blocks["22:00"] =
        activity("Relax", "free");
    }

    if (busy && event) {

      blocks["21:00"] =
        activity(event, "social");

      if (type === "early") {

        delete blocks["16:00"];

        if (!examMode) {
          blocks["13:00"] =
            activity("Gym", "gym");
        }
      }
    }
  }

  return {
    type,
    meals,
    snacks,
    gym,
    blocks
  };
}

function renderTable(schedule, prepDay) {

  const body =
    document.getElementById("scheduleBody");

  body.innerHTML = "";

  hours.forEach(hour => {

    let row = `<tr><td>${hour}</td>`;

    days.forEach(day => {

      let content = "";

      if (
        schedule[day] &&
        schedule[day].blocks[hour]
      ) {
        content =
          schedule[day].blocks[hour];
      }

      else {
        content =
          activity("Free", "free");
      }

      row += `<td>${content}</td>`;
    });

    row += "</tr>";

    body.innerHTML += row;
  });
}

function activity(name, type) {

  return `
    <div class="activity ${type}">
      ${name}
    </div>
  `;
}
