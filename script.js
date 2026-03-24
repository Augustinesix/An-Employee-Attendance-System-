let employees = [];
let records = [];
let activeEmployeeFilter = "";
let adminSearchFilters = {name: "", date: "", time: ""};

/* ================= LOCAL STORAGE ================= */
function saveData() {
  localStorage.setItem("employees", JSON.stringify(employees));
  localStorage.setItem("records", JSON.stringify(records));
}

function loadData() {
  let empData = localStorage.getItem("employees");
  let recData = localStorage.getItem("records");

  employees = empData ? JSON.parse(empData) : [];
  records = recData ? JSON.parse(recData) : [];
}

/* ================= MESSAGE SYSTEM ================= */
function showMessage(text, type = "success") {
  let box = document.getElementById("messageBox");
  if (!box) return;

  box.textContent = text;
  box.classList.remove("hidden", "error");

  if (type === "error") {
    box.classList.add("error");
  }

  setTimeout(() => {
    box.classList.add("hidden");
  }, 2500);
}

/* ================= SAFE ELEMENT ================= */
function el(id){
  return document.getElementById(id);
}

/* ================= NAVIGATION ================= */
function showAdmin(){
  hideAll();
  if(el("adminPanel")) el("adminPanel").classList.remove("hidden");
  displayAdmin();
}

function showEmployees(){
  hideAll();
  if(el("employeeList")) el("employeeList").classList.remove("hidden");
  displayEmployees();
}

function hideAll(){
  if(el("adminPanel")) el("adminPanel").classList.add("hidden");
  if(el("employeeList")) el("employeeList").classList.add("hidden");
}

/* ================= ADD EMPLOYEE ================= */
function addEmployee(){
  let nameInput = el("empName");
  if(!nameInput) return;

  let name = nameInput.value.trim();

  if(!name) return showMessage("Enter name", "error");
  if(employees.includes(name)) return showMessage("Employee already exists", "error");

  employees.push(name);
  saveData();

  nameInput.value = "";
  displayEmployees();

  showMessage("Employee added successfully ✅");
}

/* ================= DELETE EMPLOYEE ================= */
function deleteEmployee(index){
  let name = employees[index];

  if(!confirm(`Delete ${name}?`)) return;

  // Remove employee
  employees.splice(index, 1);

  // Remove related records
  records = records.filter(r => r.name !== name);

  saveData();
  displayEmployees();
  displayAdmin();

  showMessage("Employee deleted successfully 🗑️");
}

/* ================= DISPLAY EMPLOYEES ================= */
function displayEmployees(){
  let table = el("employeeTable");
  if(!table) return;

  table.innerHTML = "";

  employees.forEach((e, index)=>{
    table.innerHTML += `
      <tr>
        <td>${e}</td>
        <td>
          <button onclick="deleteEmployee(${index})" class="delete-btn">Delete</button>
        </td>
      </tr>
    `;
  });
}

/* ================= DATE ================= */
function getToday(){
  return new Date().toLocaleDateString();
}

function findRecord(name){
  return records.find(r=>r.name===name && r.date===getToday());
}

/* ================= EMPLOYEE ACTIONS ================= */
function updateUI(){
  let input = el("searchName");
  if(!input) return;

  let name = input.value.trim();
  let record = findRecord(name);

  let inBtn = el("checkInBtn");
  let outBtn = el("checkOutBtn");
  let absBtn = el("absentBtn");

  if(!record){
    if(inBtn) inBtn.classList.remove("hidden");
    if(outBtn) outBtn.classList.add("hidden");
    if(absBtn) absBtn.classList.remove("hidden");
  }else if(record.status==="Present" && record.checkOut === "-"){
    if(inBtn) inBtn.classList.add("hidden");
    if(outBtn) outBtn.classList.remove("hidden");
    if(absBtn) absBtn.classList.add("hidden");
  }else{
    if(inBtn) inBtn.classList.add("hidden");
    if(outBtn) outBtn.classList.add("hidden");
    if(absBtn) absBtn.classList.add("hidden");
  }
}

function checkIn(){
  let input = el("searchName");
  if(!input) return;

  let name = input.value.trim();

  if(!employees.includes(name)) return showMessage("Employee not found", "error");
  if(findRecord(name)) return showMessage("Already marked today", "error");

  records.push({
    name,
    date:getToday(),
    status:"Present",
    checkIn:new Date().toLocaleTimeString(),
    checkOut:"-"
  });

  saveData();
  adminSearchFilters = {name: "", date: "", time: ""};
  activeEmployeeFilter = name; // show only this name until checkout
  displayAdmin();
  updateUI();

  showMessage("Checked in successfully ✅");
}

function checkOut(){
  let input = el("searchName");
  if(!input) return;

  let name = input.value.trim();
  let record = findRecord(name);

  if(!record) return showMessage("No record found", "error");

  record.checkOut = new Date().toLocaleTimeString();

  saveData();
  if (activeEmployeeFilter === name) activeEmployeeFilter = ""; // restore all records after checkout
  displayAdmin();
  updateUI();

  showMessage("Checked out successfully ✅");
}

function markAbsent(){
  let input = el("searchName");
  if(!input) return;

  let name = input.value.trim();

  if(!employees.includes(name)) return showMessage("Employee not found", "error");
  if(findRecord(name)) return showMessage("Already marked today", "error");

  records.push({
    name,
    date:getToday(),
    status:"Absent",
    checkIn:"-",
    checkOut:"-"
  });

  saveData();

  showMessage("Marked absent successfully ✅");
}

/* ================= DISPLAY RECORDS ================= */
function displayAdmin(){
  let table = el("adminTable");
  if(!table) return;

  table.innerHTML = "";

  // filter priority: admin search inputs first, then activeEmployeeFilter from check-in mode
  let nameFilter = adminSearchFilters.name.trim().toLowerCase();
  let dateFilter = adminSearchFilters.date;
  let timeFilter = adminSearchFilters.time;

  let visibleRecords = records;

  if (nameFilter || dateFilter || timeFilter) {
    visibleRecords = records.filter(r => {
      let matchName = !nameFilter || r.name.toLowerCase().includes(nameFilter);
      let matchDate = !dateFilter || r.date === new Date(dateFilter).toLocaleDateString();
      let matchTime = !timeFilter || r.checkIn.includes(timeFilter) || r.checkOut.includes(timeFilter);
      return matchName && matchDate && matchTime;
    });
  } else if (activeEmployeeFilter) {
    visibleRecords = records.filter(r => r.name.toLowerCase() === activeEmployeeFilter.toLowerCase());
  }

  visibleRecords.forEach(r=>{
    table.innerHTML += `
    <tr>
      <td>${r.name}</td>
      <td>${r.date}</td>
      <td class="${r.status==="Present"?"status-present":"status-absent"}">${r.status}</td>
      <td>${r.checkIn}</td>
      <td>${r.checkOut}</td>
    </tr>`;
  });
}

/* ================= SEARCH ================= */
function searchRecords(){
  adminSearchFilters.name = el("searchNameAdmin")?.value.trim() || "";
  adminSearchFilters.date = el("searchDateAdmin")?.value || "";
  adminSearchFilters.time = el("searchTimeAdmin")?.value || "";

  displayAdmin();
  showMessage("Search completed 🔍");
}

/* ================= INIT ================= */
window.onload = function () {
  loadData();
  displayEmployees();
  displayAdmin();
};