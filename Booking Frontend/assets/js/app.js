/* ========= Demo Data ========= */
const DOCTORS = [
  { id: 1, name: "Dr. Ayesha Rahman", specialization: "Cardiology", hospital: "City Heart Clinic", fee: 800, days: ["Sun","Tue","Thu"], times: ["10:00","11:00","12:00"], emoji:"❤️" },
  { id: 2, name: "Dr. Anik Chowdhury", specialization: "Neurology", hospital: "NeuroCare Center", fee: 900, days: ["Mon","Wed"], times: ["14:00","15:00","16:00"], emoji:"🧠" },
  { id: 3, name: "Dr. Farah Islam", specialization: "Orthopedics", hospital: "OrthoPlus Hospital", fee: 750, days: ["Tue","Thu"], times: ["10:30","12:30","15:00"], emoji:"🦴" },
  { id: 4, name: "Dr. Saif Uddin", specialization: "Dermatology", hospital: "SkinCare Clinic", fee: 600, days: ["Sat","Mon"], times: ["11:00","12:00","13:00"], emoji:"🧴" },
  { id: 5, name: "Dr. Nafisa Khan", specialization: "Pediatrics", hospital: "Happy Kids Hospital", fee: 700, days: ["Sun","Wed"], times: ["09:30","10:30","11:30"], emoji:"🧸" },
  { id: 6, name: "Dr. Tanvir Ahmed", specialization: "ENT", hospital: "Clear ENT Center", fee: 650, days: ["Mon","Thu"], times: ["16:00","17:00","18:00"], emoji:"👂" }
];

const SPECIALIZATIONS = [...new Set(DOCTORS.map(d => d.specialization))];

/* ========= Storage Helpers ========= */
const LS_USERS = "hb_users";
const LS_USER = "hb_user";
const LS_APPTS = "hb_appointments";

function getUsers(){ return JSON.parse(localStorage.getItem(LS_USERS) || "[]"); }
function setUsers(u){ localStorage.setItem(LS_USERS, JSON.stringify(u)); }

function getUser(){ return JSON.parse(localStorage.getItem(LS_USER) || "null"); }
function setUser(u){ localStorage.setItem(LS_USER, JSON.stringify(u)); }
function logout(){ localStorage.removeItem(LS_USER); location.href = "index.html"; }

function getAppointments(){ return JSON.parse(localStorage.getItem(LS_APPTS) || "[]"); }
function setAppointments(a){ localStorage.setItem(LS_APPTS, JSON.stringify(a)); }

function genTicket(){
  const s = Math.random().toString(36).slice(2,7).toUpperCase();
  const n = Math.floor(100 + Math.random()*900);
  return `HB-${s}${n}`;
}

function todayISO(){ return new Date().toISOString().split("T")[0]; }

/* ========= UI Bootstrapping ========= */
document.addEventListener("DOMContentLoaded", () => {
  // year
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // login/logout visibility
  const user = getUser();
  const loginBtn = document.getElementById("loginBtn");
  const logoutItem = document.getElementById("logoutItem");
  if (user && logoutItem) {
    logoutItem.classList.remove("d-none");
    if (loginBtn) loginBtn.classList.add("d-none");
    const lb = document.getElementById("logoutBtn");
    if (lb) lb.addEventListener("click", logout);
  }

  const page = document.body.dataset.page;

  if (page === "doctors") initDoctorsPage();
  if (page === "book") initBookingPage();
  if (page === "login") initAuthPage();
  if (page === "my") initMyAppointmentsPage();
});

/* ========= Doctors Page ========= */
function initDoctorsPage(){
  // fill specialization dropdown
  const specSel = document.getElementById("filterSpecialization");
  SPECIALIZATIONS.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s; opt.textContent = s;
    specSel.appendChild(opt);
  });

  const grid = document.getElementById("doctorsGrid");
  const searchInput = document.getElementById("searchInput");

  function render(list){
    grid.innerHTML = "";
    if (!list.length){
      grid.innerHTML = `<div class="col-12"><div class="alert alert-info">No doctors found.</div></div>`;
      return;
    }
    list.forEach(d => {
      const col = document.createElement("div");
      col.className = "col-md-4";
      col.innerHTML = `
        <div class="card h-100">
          <div class="card-body">
            <div class="d-flex align-items-center gap-3 mb-3">
              <div class="doc-avatar">${d.emoji}</div>
              <div>
                <h5 class="mb-0">${d.name}</h5>
                <small class="text-muted">${d.specialization}</small>
              </div>
            </div>
            <p class="mb-1"><strong>Hospital:</strong> ${d.hospital}</p>
            <p class="mb-1"><strong>Fee:</strong> ৳${d.fee}</p>
            <p class="mb-3">
              <strong>Days:</strong>
              ${d.days.map(x => `<span class="badge badge-day me-1">${x}</span>`).join("")}
            </p>
            <a href="appointment.html?doctor=${d.id}" class="btn btn-primary">Book ${d.emoji}</a>
          </div>
        </div>`;
      grid.appendChild(col);
    });
  }

  function applyFilter(){
    const spec = specSel.value.trim().toLowerCase();
    const q = (searchInput.value || "").trim().toLowerCase();
    const filtered = DOCTORS.filter(d => {
      const matchSpec = !spec || d.specialization.toLowerCase() === spec;
      const matchQuery = !q || d.name.toLowerCase().includes(q) || d.hospital.toLowerCase().includes(q);
      return matchSpec && matchQuery;
    });
    render(filtered);
  }

  specSel.addEventListener("change", applyFilter);
  searchInput.addEventListener("input", applyFilter);

  render(DOCTORS);
}

/* ========= Booking Page ========= */
function initBookingPage(){
  const user = getUser();
  const loginHint = document.getElementById("loginHint");
  if (!user && loginHint) {
    loginHint.innerHTML = `You are not logged in. Please <a href="login.html">login</a> to save appointments under your account. (You can still submit as guest.)`;
  }

  const doctorSelect = document.getElementById("doctorSelect");
  const doctorSpec = document.getElementById("doctorSpec");
  const dateInput = document.getElementById("date");
  const timeSelect = document.getElementById("time");
  const form = document.getElementById("bookingForm");

  // populate doctors
  doctorSelect.innerHTML = `<option value="">Select a doctor</option>` + 
    DOCTORS.map(d => `<option value="${d.id}">${d.name} — ${d.specialization}</option>`).join("");

  // preselect via query string ?doctor=ID
  const params = new URLSearchParams(location.search);
  const pre = params.get("doctor");
  if (pre) {
    doctorSelect.value = pre;
    const d = DOCTORS.find(x => x.id == pre);
    if (d) {
      doctorSpec.value = d.specialization;
      fillTimes(d);
    }
  }

  // min date = today
  dateInput.min = todayISO();

  doctorSelect.addEventListener("change", () => {
    const d = DOCTORS.find(x => x.id == doctorSelect.value);
    doctorSpec.value = d ? d.specialization : "";
    fillTimes(d);
  });

  function fillTimes(doc){
    timeSelect.innerHTML = "";
    if (!doc){ return; }
    timeSelect.innerHTML = doc.times.map(t => `<option value="${t}">${t}</option>`).join("");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const patientName = document.getElementById("patientName").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const doctorId = parseInt(doctorSelect.value, 10);
    const date = dateInput.value;
    const time = timeSelect.value;
    const symptoms = document.getElementById("symptoms").value.trim();

    if (!patientName || !phone || !doctorId || !date || !time) {
      showToast("Please complete all required fields.");
      return;
    }
    const doc = DOCTORS.find(d => d.id === doctorId);
    const appts = getAppointments();

    const appt = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      ticket: genTicket(),
      userEmail: (getUser() && getUser().email) || null,
      patientName, phone,
      doctorId: doc.id,
      doctorName: doc.name,
      specialization: doc.specialization,
      date, time, symptoms,
      createdAt: new Date().toISOString()
    };

    appts.push(appt);
    setAppointments(appts);

    showToast(`Appointment confirmed! Ticket: ${appt.ticket}`);
    setTimeout(() => location.href = "my-appointments.html", 1200);
  });
}

function showToast(msg){
  const el = document.getElementById("toast");
  const body = document.getElementById("toastBody");
  if (!el || !body) { alert(msg); return; }
  body.textContent = msg;
  const t = new bootstrap.Toast(el);
  t.show();
}

/* ========= Auth Page ========= */
function initAuthPage(){
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  if (loginForm){
    loginForm.addEventListener("submit", (e)=>{
      e.preventDefault();
      const email = document.getElementById("loginEmail").value.trim().toLowerCase();
      const pass = document.getElementById("loginPassword").value;
      const users = getUsers();
      const u = users.find(x => x.email === email && x.password === pass);
      if (!u) { alert("Invalid email or password."); return; }
      setUser({ name: u.name, email: u.email });
      location.href = "index.html";
    });
  }

  if (signupForm){
    signupForm.addEventListener("submit", (e)=>{
      e.preventDefault();
      const name = document.getElementById("signupName").value.trim();
      const email = document.getElementById("signupEmail").value.trim().toLowerCase();
      const password = document.getElementById("signupPassword").value;

      if (password.length < 6) { alert("Password must be at least 6 characters."); return; }
      const users = getUsers();
      if (users.some(u => u.email === email)) { alert("Email already registered."); return; }
      users.push({ name, email, password });
      setUsers(users);
      setUser({ name, email });
      alert("Account created! You are now logged in.");
      location.href = "index.html";
    });
  }
}

/* ========= My Appointments ========= */
function initMyAppointmentsPage(){
  const user = getUser();
  const tbody = document.getElementById("apptTbody");
  const noData = document.getElementById("noData");

  let list = getAppointments();
  if (user) {
    list = list.filter(a => a.userEmail === user.email);
  }

  if (!list.length){
    noData.classList.remove("d-none");
    return;
  }

  noData.classList.add("d-none");
  tbody.innerHTML = "";
  list.forEach((a, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i+1}</td>
      <td>${a.doctorName}</td>
      <td>${a.specialization}</td>
      <td>${a.date}</td>
      <td>${a.time}</td>
      <td><span class="badge text-bg-primary">${a.ticket}</span></td>
      <td>
        <button class="btn btn-sm btn-outline-danger" data-id="${a.id}">Cancel</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.addEventListener("click", (e)=>{
    const btn = e.target.closest("button[data-id]");
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    const all = getAppointments().filter(x => x.id !== id);
    setAppointments(all);
    location.reload();
  });
}
