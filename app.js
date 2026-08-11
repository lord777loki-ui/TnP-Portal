// ====== 1) Paste your Supabase URL & anon key here (inside code) ======
const SUPABASE_URL = "https://bmmcusrrxiifdnqzvmpu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtbWN1c3JyeGlpZmRucXp2bXB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU5OTc2OTAsImV4cCI6MjEwMTU3MzY5MH0.uqTGW2EZ1PfJqTbSrEwB-6wkePeskrCPkIArZ6CQvik";

// ====== 2) Match this with your admin/student pseudo-email ======
const PSEUDO_EMAIL_DOMAIN = "tnpcellncechandi.local";

// ====== Supabase client ======
const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function rollToPseudoEmail(rollNo) {
  return `${rollNo}@${PSEUDO_EMAIL_DOMAIN}`;
}

async function getMyProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, roll_no, full_name, role, created_at")
    .eq("id", user.id)
    .single();

  if (error) throw error;
  return data;
}

// ====== LOGIN PAGE ======
async function handleLogin() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  const errEl = document.getElementById("err");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errEl.textContent = "";

    const rollNo = document.getElementById("roll_no").value.trim();
    const password = document.getElementById("password").value;

    try {
      const email = rollToPseudoEmail(rollNo);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const profile = await getMyProfile();
      if (!profile) throw new Error("Profile not found in profiles table.");

      if (profile.role === "admin") window.location.href = "/admin.html";
      else window.location.href = "/student.html";
    } catch (e2) {
      errEl.textContent = e2?.message || "Login failed";
    }
  });
}

// ====== STUDENT PAGE ======
async function initStudentPage() {
  const table = document.getElementById("profileTable");
  if (!table) return;

  const status = document.getElementById("status");
  const errEl = document.getElementById("err");

  try {
    status.textContent = "Loading...";
    const profile = await getMyProfile();
    if (!profile) {
      window.location.href = "/index.html";
      return;
    }
    if (profile.role !== "student") {
      window.location.href = "/admin.html";
      return;
    }

    table.querySelector("tbody").innerHTML = `
      <tr><td><b>Roll No</b></td><td>${profile.roll_no || ""}</td></tr>
      <tr><td><b>Name</b></td><td>${profile.full_name || ""}</td></tr>
      <tr><td><b>Role</b></td><td>${profile.role || ""}</td></tr>
      <tr><td><b>Created At</b></td><td>${profile.created_at ? new Date(profile.created_at).toLocaleString() : ""}</td></tr>
    `;

    status.textContent = "";
  } catch (e) {
    errEl.textContent = e?.message || "Failed to load";
  }
}

// ====== ADMIN PAGE ======
async function initAdminPage() {
  const body = document.getElementById("studentsBody");
  if (!body) return;

  const status = document.getElementById("status");
  const errEl = document.getElementById("err");

  try {
    status.textContent = "Loading...";

    const me = await getMyProfile();
    if (!me) {
      window.location.href = "/index.html";
      return;
    }
    if (me.role !== "admin") {
      window.location.href = "/student.html";
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("roll_no, full_name, role, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const students = (data || []).filter(x => x.role === "student");
    body.innerHTML = students.map(s => `
      <tr>
        <td>${s.roll_no || ""}</td>
        <td>${s.full_name || ""}</td>
        <td>${s.role || ""}</td>
        <td>${s.created_at ? new Date(s.created_at).toLocaleString() : ""}</td>
      </tr>
    `).join("");

    status.textContent = `Welcome, ${me.full_name || "Admin"}`;
  } catch (e) {
    errEl.textContent = e?.message || "Failed to load admin data";
  }
}

// ====== Shared logout ======
function initLogout() {
  const btn = document.getElementById("logoutBtn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "/index.html";
  });
}

// Boot
handleLogin();
initStudentPage();
initAdminPage();
initLogout();
