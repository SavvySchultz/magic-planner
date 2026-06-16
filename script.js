const STORAGE_KEY = "magic_planner_data_v1";

const state = {
  bills: [],
  events: [],
  reminders: [],
  recurringTasks: [],
  theme: "light",
  selectedDate: null,
  calendarMonth: new Date().getMonth(),
  calendarYear: new Date().getFullYear(),
  billFilter: "all"
};

const quotes = [
  "A dream is a wish your heart makes.",
  "Believe in your sparkle.",
  "You can do hard things.",
  "Small steps still move you forward.",
  "Magic is made one day at a time."
];

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    Object.assign(state, JSON.parse(saved));
  }
}

function setTheme() {
  document.body.classList.toggle("dark", state.theme === "dark");
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function getTodayString() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function getId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function renderAll() {
  renderDashboard();
  renderBills();
  renderReminders();
  renderRecurringTasks();
  renderCalendar();
  updateTopInfo();
  setTheme();
}

function updateTopInfo() {
  document.getElementById("todayDate").textContent = getTodayString();
  document.getElementById("motivationalQuote").textContent =
    quotes[Math.floor(Math.random() * quotes.length)];
}

function renderDashboard() {
  const upcomingBills = [...state.bills]
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  const upcomingEvents = [...state.events]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  const reminders = [...state.reminders].slice(0, 5);

  document.getElementById("dashboardBills").innerHTML = upcomingBills.length
    ? upcomingBills.map(b => `
        <li>
          <span>${b.name} - $${Number(b.amount).toFixed(2)} - ${formatDate(b.dueDate)}</span>
        </li>
      `).join("")
    : "<li>No bills yet</li>";

  document.getElementById("dashboardEvents").innerHTML = upcomingEvents.length
    ? upcomingEvents.map(e => `
        <li>
          <span>${formatDate(e.date)} - ${e.text}</span>
        </li>
      `).join("")
    : "<li>No events yet</li>";

  document.getElementById("dashboardReminders").innerHTML = reminders.length
    ? reminders.map(r => `<li><span>${r.text}</span></li>`).join("")
    : "<li>No reminders yet</li>";

  const totalBills = state.bills.length;
  const paidBills = state.bills.filter(b => b.paid).length;
  const percent = totalBills ? Math.round((paidBills / totalBills) * 100) : 0;

  document.getElementById("progressText").textContent =
    `${paidBills} of ${totalBills} bills paid (${percent}%)`;

  document.getElementById("progressFill").style.width = `${percent}%`;
}

function renderBills() {
  const list = document.getElementById("billList");
  let bills = [...state.bills];

  if (state.billFilter === "paid") bills = bills.filter(b => b.paid);
  if (state.billFilter === "unpaid") bills = bills.filter(b => !b.paid);

  bills.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  list.innerHTML = bills.length ? bills.map(bill => `
    <li>
      <div>
        <strong>${bill.name}</strong><br />
        $${Number(bill.amount).toFixed(2)} • Due: ${formatDate(bill.dueDate)}<br />
        <span class="${bill.paid ? "paid-tag" : "unpaid-tag"}">
          ${bill.paid ? "Paid" : "Unpaid"}
        </span>
      </div>
      <div class="item-actions">
        <button class="small-btn paid-btn" onclick="toggleBillPaid('${bill.id}')">
          ${bill.paid ? "Mark Unpaid" : "Mark Paid"}
        </button>
        <button class="small-btn edit-btn" onclick="editBill('${bill.id}')">Edit</button>
        <button class="small-btn delete-btn" onclick="deleteBill('${bill.id}')">Delete</button>
      </div>
    </li>
  `).join("") : "<li>No bills yet</li>";
}

function renderReminders() {
  const list = document.getElementById("reminderList");

  list.innerHTML = state.reminders.length ? state.reminders.map(reminder => `
    <li>
      <span>${reminder.text}</span>
      <div class="item-actions">
        <button class="small-btn edit-btn" onclick="editReminder('${reminder.id}')">Edit</button>
        <button class="small-btn delete-btn" onclick="deleteReminder('${reminder.id}')">Delete</button>
      </div>
    </li>
  `).join("") : "<li>No reminders yet</li>";
}

function renderRecurringTasks() {
  const list = document.getElementById("recurringList");

  list.innerHTML = state.recurringTasks.length ? state.recurringTasks.map(task => {
    let repeatText = "";

    if (task.type === "weekly") {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      repeatText = `Every week on ${days[task.day]}`;
    } else {
      repeatText = `Every month on day ${task.monthDay}`;
    }

    return `
      <li>
        <div>
          <strong>${task.text}</strong><br />
          <span>${repeatText}</span>
        </div>
        <div class="item-actions">
          <button class="small-btn delete-btn" onclick="deleteRecurringTask('${task.id}')">Delete</button>
        </div>
      </li>
    `;
  }).join("") : "<li>No recurring tasks yet</li>";
}

function renderCalendar() {
  const monthLabel = document.getElementById("monthLabel");
  const grid = document.getElementById("calendarGrid");

  const date = new Date(state.calendarYear, state.calendarMonth, 1);
  monthLabel.textContent = date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric"
  });

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const firstDay = new Date(state.calendarYear, state.calendarMonth, 1).getDay();
  const daysInMonth = new Date(state.calendarYear, state.calendarMonth + 1, 0).getDate();

  let html = dayNames.map(d => `<div class="day-name">${d}</div>`).join("");

  for (let i = 0; i < firstDay; i++) {
    html += `<div class="day-cell" style="opacity:0.3"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const fullDate = new Date(state.calendarYear, state.calendarMonth, day);
    const dateStr = fullDate.toISOString().split("T")[0];
    const events = state.events.filter(e => e.date === dateStr);

    html += `
      <div class="day-cell" onclick="selectDay('${dateStr}')">
        <div class="day-number">${day}</div>
        <div>
          ${events.slice(0, 2).map(() => `<span class="day-dot"></span>`).join("")}
        </div>
      </div>
    `;
  }

  grid.innerHTML = html;

  if (state.selectedDate) {
    showSelectedDayEvents(state.selectedDate);
  }
}

function showSelectedDayEvents(dateStr) {
  const label = document.getElementById("selectedDayLabel");
  const list = document.getElementById("selectedDayEvents");
  const events = state.events.filter(e => e.date === dateStr);

  label.textContent = `Events for ${formatDate(dateStr)}`;

  list.innerHTML = events.length ? events.map(event => `
    <li>
      <span>${event.text}</span>
      <div class="item-actions">
        <button class="small-btn edit-btn" onclick="editEvent('${event.id}')">Edit</button>
        <button class="small-btn delete-btn" onclick="deleteEvent('${event.id}')">Delete</button>
      </div>
    </li>
  `).join("") : "<li>No events for this day</li>";
}

function selectDay(dateStr) {
  state.selectedDate = dateStr;
  showSelectedDayEvents(dateStr);
}

function addBill() {
  const name = document.getElementById("billName").value.trim();
  const amount = document.getElementById("billAmount").value.trim();
  const dueDate = document.getElementById("billDueDate").value;

  if (!name || !amount || !dueDate) return alert("Please fill out all bill fields.");

  state.bills.push({
    id: getId(),
    name,
    amount,
    dueDate,
    paid: false
  });

  saveState();
  renderAll();

  document.getElementById("billName").value = "";
  document.getElementById("billAmount").value = "";
  document.getElementById("billDueDate").value = "";
}

function toggleBillPaid(id) {
  const bill = state.bills.find(b => b.id === id);
  if (!bill) return;
  bill.paid = !bill.paid;
  saveState();
  renderAll();
}

function editBill(id) {
  const bill = state.bills.find(b => b.id === id);
  if (!bill) return;

  const name = prompt("Edit bill name:", bill.name);
  if (name === null) return;

  const amount = prompt("Edit bill amount:", bill.amount);
  if (amount === null) return;

  const dueDate = prompt("Edit bill due date (YYYY-MM-DD):", bill.dueDate);
  if (dueDate === null) return;

  bill.name = name.trim() || bill.name;
  bill.amount = amount.trim() || bill.amount;
  bill.dueDate = dueDate.trim() || bill.dueDate;

  saveState();
  renderAll();
}

function deleteBill(id) {
  state.bills = state.bills.filter(b => b.id !== id);
  saveState();
  renderAll();
}

function addEvent() {
  const date = document.getElementById("eventDate").value;
  const text = document.getElementById("eventText").value.trim();

  if (!date || !text) return alert("Please fill out both event fields.");

  state.events.push({
    id: getId(),
    date,
    text
  });

  saveState();
  renderAll();

  document.getElementById("eventDate").value = "";
  document.getElementById("eventText").value = "";
}

function editEvent(id) {
  const event = state.events.find(e => e.id === id);
  if (!event) return;

  const text = prompt("Edit event:", event.text);
  if (text === null) return;

  const date = prompt("Edit date (YYYY-MM-DD):", event.date);
  if (date === null) return;

  event.text = text.trim() || event.text;
  event.date = date.trim() || event.date;

  saveState();
  renderAll();
}

function deleteEvent(id) {
  state.events = state.events.filter(e => e.id !== id);
  saveState();
  renderAll();
}

function addReminder() {
  const text = document.getElementById("reminderText").value.trim();
  if (!text) return alert("Please type a reminder.");

  state.reminders.push({
    id: getId(),
    text
  });

  saveState();
  renderAll();
  document.getElementById("reminderText").value = "";
}

function editReminder(id) {
  const reminder = state.reminders.find(r => r.id === id);
  if (!reminder) return;

  const text = prompt("Edit reminder:", reminder.text);
  if (text === null) return;

  reminder.text = text.trim() || reminder.text;
  saveState();
  renderAll();
}

function deleteReminder(id) {
  state.reminders = state.reminders.filter(r => r.id !== id);
  saveState();
  renderAll();
}

function addRecurringTask() {
  const text = document.getElementById("recurringText").value.trim();
  const type = document.getElementById("recurringType").value;
  const day = document.getElementById("recurringDay").value;
  const monthDay = document.getElementById("recurringMonthDay").value;

  if (!text) return alert("Please enter a task name.");

  if (type === "weekly" && day === "") {
    return alert("Please choose a day of the week.");
  }

  if (type === "monthly" && (!monthDay || monthDay < 1 || monthDay > 31)) {
    return alert("Please enter a valid day of the month from 1 to 31.");
  }

  state.recurringTasks.push({
    id: getId(),
    text,
    type,
    day: type === "weekly" ? Number(day) : null,
    monthDay: type === "monthly" ? Number(monthDay) : null
  });

  saveState();
  renderAll();

  document.getElementById("recurringText").value = "";
  document.getElementById("recurringMonthDay").value = "";
}

function deleteRecurringTask(id) {
  state.recurringTasks = state.recurringTasks.filter(task => task.id !== id);
  saveState();
  renderAll();
}

function prevMonth() {
  state.calendarMonth--;
  if (state.calendarMonth < 0) {
    state.calendarMonth = 11;
    state.calendarYear--;
  }
  saveState();
  renderCalendar();
}

function nextMonth() {
  state.calendarMonth++;
  if (state.calendarMonth > 11) {
    state.calendarMonth = 0;
    state.calendarYear++;
  }
  saveState();
  renderCalendar();
}

function resetData() {
  if (!confirm("Are you sure you want to delete all data?")) return;

  localStorage.removeItem(STORAGE_KEY);
  location.reload();
}

function initTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach(button => {
    button.addEventListener("click", () => {
      tabButtons.forEach(btn => btn.classList.remove("active"));
      tabContents.forEach(tab => tab.classList.remove("active"));

      button.classList.add("active");
      document.getElementById(button.dataset.tab).classList.add("active");
    });
  });
}

function initFilters() {
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.billFilter = btn.dataset.filter === "all-bills" ? "all" : btn.dataset.filter;
      renderBills();
    });
  });
}

function initButtons() {
  document.getElementById("addBillBtn").addEventListener("click", addBill);
  document.getElementById("addEventBtn").addEventListener("click", addEvent);
  document.getElementById("addReminderBtn").addEventListener("click", addReminder);
  document.getElementById("addRecurringBtn").addEventListener("click", addRecurringTask);
  document.getElementById("prevMonthBtn").addEventListener("click", prevMonth);
  document.getElementById("nextMonthBtn").addEventListener("click", nextMonth);
  document.getElementById("toggleThemeBtn").addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    saveState();
    setTheme();
  });
  document.getElementById("resetBtn").addEventListener("click", resetData);
}

function init() {
  loadState();
  initTabs();
  initFilters();
  initButtons();

  if (!state.selectedDate) {
    state.selectedDate = new Date().toISOString().split("T")[0];
  }

  renderAll();
  showSelectedDayEvents(state.selectedDate);
}

init();
