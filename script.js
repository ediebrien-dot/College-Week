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

const times = [];

for (let i = 8; i <= 23; i++) {

  times.push(
    `${String(i).padStart(2,"0")}:00`
  );
}

document
.getElementById("generateBtn")
.addEventListener("click", generateWeek);

function generateWeek() {

  const weekly = {};

  let meals = 0;
  let snacks = 0;
  let gym = 0;

  const examMode =
    document.getElementById("examMode").checked;

  const warningBox =
    document.getElementById("warningBox");

  warningBox.classList.add("hidden");

  days.forEach(day => {

    weekly[day] = {};

    times.forEach(time => {

      weekly[day][time] =
        block("Free", "free");
    });

    // SATURDAY

    if (day === "Saturday") {

      add(weekly, day, 9, 15, "Study", "study");

      if (!examMode) {

        add(weekly, day, 16, 18, "Gym", "gym");

        gym++;
      }

      add(
        weekly,
        day,
        19,
        21,
        "Business/Admin",
        "free"
      );

      meals++;
      snacks++;

      return;
    }

    // SUNDAY

    if (day === "Sunday") {

      add(
        weekly,
        day,
        10,
        13,
        "Meal Prep",
        "meal"
      );

      add(
        weekly,
        day,
        14,
        15,
        "Long Walk",
        "free"
      );

      add(
        weekly,
        day,
        16,
        18,
        "Reset + Clean",
        "study"
      );

      meals++;
      snacks++;

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

    // NO LECTURES

    if (!start || !end) {

      add(
        weekly,
        day,
        10,
        13,
        "Deep Study",
        "study"
      );

      if (examMode) {

        add(
          weekly,
          day,
          16,
          18,
          "Extra Study",
          "study"
        );
      }

      else {

        add(
          weekly,
          day,
          16,
          18,
          "Gym",
          "gym"
        );

        gym++;
      }

      continue;
    }

    const startHour =
      parseInt(start.split(":")[0]);

    const endHour =
      parseInt(end.split(":")[0]);

    add(
      weekly,
      day,
      startHour,
      endHour,
      "College",
      "lecture"
    );

    const fullDay =
      startHour < 10 &&
      endHour >= 16;

    const earlyDay =
      endHour <= 13;

    // FULL DAY

    if (fullDay) {

      meals += 1;
      snacks += 2;

      add(
        weekly,
        day,
        18,
        19,
        "Dinner",
        "meal"
      );

      add(
        weekly,
        day,
        20,
        22,
        "Study",
        "study"
      );
    }

    // EARLY DAY

    else if (earlyDay) {

      meals += 1;
      snacks += 1;

      if (examMode || busy) {

        add(
          weekly,
          day,
          16,
          18,
          "Study",
          "study"
        );
      }

      else {

        add(
          weekly,
          day,
          16,
          18,
          "Gym",
          "gym"
        );

        gym++;
      }

      add(
        weekly,
        day,
        19,
        21,
        "Study",
        "study"
      );
    }

    // LATE DAY

    else {

      meals += 2;
      snacks += 1;

      add(
        weekly,
        day,
        18,
        20,
        "Study + Dinner",
        "study"
      );

      if (!examMode) {

        add(
          weekly,
          day,
          20,
          21,
          "Gym",
          "gym"
        );

        gym++;
      }
    }

    // EVENTS

    if (event) {

      add(
        weekly,
        day,
        21,
        23,
        event,
        "social"
      );
    }
  });

  // MEAL PREP LOGIC

  let prepDay = "Wednesday";

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
        "No available meal prep day.";
    }
  }

  document.getElementById("mealCount")
    .textContent = meals;

  document.getElementById("snackCount")
    .textContent = snacks;

  document.getElementById("gymCount")
    .textContent = gym;

  document.getElementById("prepDay")
    .textContent = prepDay;

  render(weekly);
}

function add(
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
      block(text, type);
  }
}

function block(text, type) {

  return `
    <div class="block ${type}">
      ${text}
    </div>
  `;
}

function render(weekly) {

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
