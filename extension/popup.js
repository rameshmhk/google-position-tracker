/**
 * Ranking Anywhere — Extension Popup Controller v2.0
 */
const API_BASE = "http://localhost:5000/api";

document.addEventListener("DOMContentLoaded", async () => {
  const loginView  = document.getElementById("loginView");
  const dashView   = document.getElementById("dashView");
  const userBar    = document.getElementById("userBar");
  const statusBar  = document.getElementById("statusBar");
  const statusDot  = document.getElementById("statusDot");
  const statusLabel = document.getElementById("statusLabel");
  const loginBtn   = document.getElementById("loginBtn");
  const logoutBtn  = document.getElementById("logoutBtn");
  const loginError = document.getElementById("loginError");
  const emailInput = document.getElementById("emailInput");
  const passwordInput = document.getElementById("passwordInput");

  // Load saved session
  const session = await chrome.storage.local.get(["userId", "userName", "userEmail", "isExtensionActive"]);

  // AUTO-CONNECT: Skip login for local dev — hardcoded userId
  const LOCAL_USER = { userId: "1776349705175", userName: "RAmesh", userEmail: "rameshmjk@gmail.com" };

  if (!session.userId || !session.isExtensionActive) {
    // Auto-login with local user
    await chrome.storage.local.set({
      userId: LOCAL_USER.userId,
      userName: LOCAL_USER.userName,
      userEmail: LOCAL_USER.userEmail,
      isExtensionActive: true
    });
    chrome.runtime.sendMessage({ type: "START_ENGINE" });
    showDashboard(LOCAL_USER);
  } else {
    showDashboard(session);
  }

  // ── LOGIN ──
  loginBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showError("Please enter email and password");
      return;
    }

    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="spinner"></span>Connecting...';
    loginError.style.display = "none";

    try {
      const res = await fetch(`${API_BASE}/extension/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showError(data.error || "Login failed");
        loginBtn.disabled = false;
        loginBtn.textContent = "CONNECT EXTENSION";
        return;
      }

      // Save session
      await chrome.storage.local.set({
        userId: data.userId,
        userName: data.name,
        userEmail: data.email,
        isExtensionActive: true
      });

      // Notify background to start polling
      chrome.runtime.sendMessage({ type: "START_ENGINE" });

      showDashboard(data);
    } catch (err) {
      showError("Cannot reach server. Is it running?");
      loginBtn.disabled = false;
      loginBtn.textContent = "CONNECT EXTENSION";
    }
  });

  // Enter key support
  passwordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") loginBtn.click();
  });

  // ── LOGOUT ──
  logoutBtn.addEventListener("click", async () => {
    await chrome.storage.local.set({ userId: "", isExtensionActive: false, userName: "", userEmail: "" });
    chrome.runtime.sendMessage({ type: "STOP_ENGINE" });
    showLogin();
  });

  // ── UI HELPERS ──
  function showLogin() {
    loginView.classList.remove("hidden");
    dashView.classList.add("hidden");
    userBar.classList.add("hidden");
    setStatus(false);
  }

  function showDashboard(data) {
    loginView.classList.add("hidden");
    dashView.classList.remove("hidden");
    userBar.classList.remove("hidden");

    document.getElementById("userName").textContent = data.name || data.userName || "User";
    document.getElementById("userEmail").textContent = data.email || data.userEmail || "";
    document.getElementById("userAvatar").textContent = (data.name || data.userName || "U").charAt(0).toUpperCase();

    setStatus(true);
    fetchStats(data.userId || data.userId);
  }

  function setStatus(online) {
    statusDot.className = online ? "pulse" : "pulse offline";
    statusLabel.className = online ? "status-label online" : "status-label offline";
    statusLabel.textContent = online ? "CONNECTED & ACTIVE" : "NOT CONNECTED";
    statusBar.className = online ? "status-bar" : "status-bar offline";
  }

  function showError(msg) {
    loginError.textContent = msg;
    loginError.style.display = "block";
  }

  async function fetchStats(userId) {
    try {
      const res = await fetch(`${API_BASE}/extension/stats?userId=${userId}`);
      const data = await res.json();

      document.getElementById("statQueue").textContent = data.queueTotal || 0;
      document.getElementById("statDone").textContent = data.completedToday || 0;
      document.getElementById("statProcessing").textContent = data.processing || 0;
      document.getElementById("statDelayed").textContent = data.delayed || 0;

      // Show current processing task info
      const taskEl = document.getElementById("currentTask");
      if (data.processing > 0) {
        taskEl.className = "task-keyword";
        taskEl.textContent = "🔍 Scanning in progress...";
      } else if (data.queueTotal > 0) {
        taskEl.className = "task-keyword";
        taskEl.textContent = `⏳ ${data.queueTotal} keywords waiting`;
      } else {
        taskEl.className = "task-idle";
        taskEl.textContent = "Waiting for tasks...";
      }
    } catch (e) {
      // Server might be down
      setStatus(false);
    }
  }
});
