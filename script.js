const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday"
];

const times = [];

for (let i = 8; i <= 23; i++) {

  times.push(
    `${String(i).padStart(2,"0")}:00`
  );
}

const daysContainer =
  document.getElementById("daysContainer");

days.forEach(day => {

  daysContainer.innerHTML += `

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
        <label>Event / Plan</label>
        <input
          type="text"
          id="${day}-event"
          placeholder="Dinner, Society, HAIP..."
        >
      </div>

      <div class="checkbox">
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

  const examMode =
    document.getElementById("examMode").checked;

  let meals = 0;
  let snacks = 0;
  let gymCount = 0;

  let prepDay = "Wednesday";

  const warningBox =
    document.getElementById("warningBox");

  warningBox.classList.add("hidden");

  const weekly = {};

  days.forEach(day => {

    weekly[day] = {};

    times.forEach(time => {
      weekly[day][time] =
        createBlock("Free", "free");
    });

    if (day === "Saturday") {

      addBlock(weekly, day, 9, 15, "Study", "study");

      if (!examMode) {

        addBlock(weekly, day, 16, 18, "Gym", "gym");

        gymCount++;
      }

      addBlock(
        weekly,
        day,
        19,
        21,
        "Business/Admin",
        "free"
      );

      meals += 1;
      snacks += 1;

      return;
    }

    if (day === "Sunday") {

      addBlock(
        weekly,
        day,
        10,
        13,
        "Meal Prep",
        "meal"
      );

      addBlock(
        weekly,
        day,
        14,
        15,
        "Long Walk",
        "free"
      );

      addBlock(
        weekly,
        day,
        16,
        18,
        "Reset + Clean",
        "study"
      );

      meals += 1;
      snacks += 1;

      return;
    }

    const start =
      document.getElementById(`${day}-start`).value;

    const end =
      document.getElementById(`${day}-end`).value;

    const event =
      document.getElementById(`${day}-event`).value;

    const busy =
      document.getElementById(`${day}-busy`).checked;

    if (!start || !end) {

      addBlock(
        weekly,
        day,
        10,
        13,
        "Deep Study",
        "study"
      );

      addBlock(
        weekly,
        day,
        16,
        18,
        examMode ? "Study" : "Gym",
        examMode ? "study" : "gym"
      );

      if (!examMode) {
        gymCount++;
      }

      return;
    }

    const startHour =
      parseInt(start.split(":")[0]);

    const endHour =
      parseInt(end.split(":")[0]);

    addBlock(
      weekly,
      day,
      startHour,
      endHour,
      "College",
      "lecture"
    );

    const fullDay =
      startHour < 10 && endHour >= 16;

    const earlyDay =
      endHour <= 13;

    if (fullDay) {

      meals += 1;
      snacks += 2;

      addBlock(
        weekly,
        day,
        18,
        19,
        "Dinner",
        "meal"
      );

      addBlock(
        weekly,
        day,
        20,
        22,
        "Study",
        "study"
      );
    }

    else if (earlyDay) {

      meals += 1;
      snacks += 1;

      if (!busy && !examMode) {

        addBlock(
          weekly,
          day,
          16,
          18,
          "Gym",
          "gym"
        );

        gymCount++;
      }

      else {

        addBlock(
          weekly,
          day,
          16,
          18,
          "Study",
          "study"
        );
      }

      addBlock(
        weekly,
        day,
        19,
        21,
        "Study",
        "study"
      );
    }

    else {

      meals += 2;
      snacks += 1;

      addBlock(
        weekly,
        day,
        18,
        20,
        "Study + Dinner",
        "study"
      );

      if (!examMode) {

        addBlock(
          weekly,
          day,
          20,
          21,
          "Gym",
          "gym"
        );

        gymCount++;
      }
    }

    if (event) {

      addBlock(
        weekly,
        day,
        21,
        23,
        event,
        "social"
      );
    }
  });

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

      warningBox.classList.remove("hidden");

      document.getElementById("warningText")
      .textContent =
        "No available meal prep day exists.";
    }
  }

  document.getElementById("mealCount")
    .textContent = meals;

  document.getElementById("snackCount")
    .textContent = snacks;

  document.getElementById("gymCount")
    .textContent = gymCount;

  document.getElementById("prepDay")
    .textContent = prepDay;

  renderCalendar(weekly);
}

function addBlock(
  weekly,
  day,
  start,
  end,
  text,
  type
) {

  for (let i = start; i < end; i++) {

    const time =
      `${String(i).padStart(2,"0")}:00`;

    weekly[day][time] =
      createBlock(text, type);
  }
}

function createBlock(text, type) {

  return `
    <div class="block ${type}">
      ${text}
    </div>
  `;
}

function renderCalendar(weekly) {

  const body =
    document.getElementById("calendarBody");

  body.innerHTML = "";

  times.forEach(time => {

    let row = `<tr><td>${time}</td>`;

    days.forEach(day => {

      row += `
        <td>
          ${weekly[day][time]}
        </td>
      `;
    });

    row += "</tr>";

    body.innerHTML += row;
  });
}

generateWeek();
