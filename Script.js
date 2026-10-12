const views = ["overview", "analyzer", "roadmap", "advisor"];

function showView(view) {
  views.forEach((name) => document.getElementById(`${name}-view`).hidden = name !== view);
  document.querySelectorAll(".nav-link").forEach((button) => button.classList.toggle("active", button.dataset.view === view));
  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => showView(button.dataset.view)));

const assessmentForm = document.getElementById("assessment-form");
const reportPanel = document.getElementById("report-panel");
const makeRecommendation = (title, text) => `<article class="recommendation"><strong>${title}</strong><p>${text}</p></article>`;

assessmentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = new FormData(assessmentForm);
  const challenge = form.get("challenge");
  const spend = Math.max(0, Number(form.get("weeklySpend")) || 0);
  const waste = Number(form.get("wasteRate"));
  const tools = form.getAll("tools");
  const type = form.get("workshopType");
  const score = Math.min(96, Math.max(39, 52 + tools.length * 10 + (waste <= 5 ? 12 : waste <= 10 ? 6 : 0)));
  const saving = Math.round(spend * 4 * Math.max(0, waste - 5) / 100 * .5);
  const typeLabel = { small: "small workshop", growing: "growing workshop", production: "production workshop" }[type];
  const recommendations = [];
  const focus = {
    precision: ["Improve the measurement-to-cut workflow.", "Start with connected measurement", "Create a repeatable digital layout and cut-list check before purchasing automation. A laser measure and documented setup routine can reduce preventable rework."],
    safety: ["Reduce avoidable safety exposure before increasing output.", "Make safety signals visible", "Inspect guards, dust control, shutdown procedures, and maintenance records first. Add sensing hardware only after the basic controls are reliable."],
    waste: ["Find where usable material becomes offcut.", "Measure waste before automating cuts", "Record offcuts for two weeks. Then trial cut-list or nesting software on repeat jobs and compare usable yield."],
    speed: ["Standardize the repetitive bottleneck.", "Automate one repetitive task", "Map the slowest repeated step, standardize it, and test a jig, digital setting, or assisted tool before evaluating CNC."]
  }[challenge];
  recommendations.push(makeRecommendation(focus[1], focus[2]));
  if (!tools.includes("digitalMeasure")) recommendations.push(makeRecommendation("Fill the measurement gap", "A digital measurement workflow is a practical Phase 1 foundation for accurate quotes, layouts, and repeatable setups."));
  if (!tools.includes("inventory")) recommendations.push(makeRecommendation("Track material and tool usage", "Use simple labels or a spreadsheet first. Knowing what is used and when it fails makes future AI or RFID upgrades meaningful."));
  if (tools.includes("cnc")) recommendations.push(makeRecommendation("Use your CNC data", "Track bit life, material type, feed rate, and rejected pieces. These records are the starting point for predictive maintenance and optimization."));
  reportPanel.innerHTML = `<div class="report-header"><div><p class="eyebrow">${typeLabel.toUpperCase()}</p><h2>Your next-step report</h2></div><div class="score"><strong>${score}</strong><small>readiness score</small></div></div><section class="report-section"><h3>Priority action</h3><p>${focus[0]}</p></section><section class="report-section"><h3>Suggested next moves</h3><div class="recommendations">${recommendations.slice(0, 3).join("")}</div></section><section class="report-section"><h3>Material opportunity</h3><div class="savings"><strong>${saving > 0 ? `₱${saving.toLocaleString()}` : "—"}</strong><p>${saving > 0 ? "Estimated monthly opportunity from reducing only part of the current waste. This is a planning estimate, not a promise." : "Your selected waste level is near the benchmark. Keep measuring before investing in a new tool."}</p></div></section><button class="save-report" type="button">Save report summary to this browser</button>`;
  reportPanel.querySelector(".save-report").addEventListener("click", (button) => {
    localStorage.setItem("carpentry-ai-last-report", JSON.stringify({ createdAt: new Date().toISOString(), score, challenge, spend, waste, tools }));
    button.target.textContent = "Saved to this browser ✓";
  });
});

const advisorForm = document.getElementById("advisor-form");
const advisorInput = document.getElementById("advisor-input");
const advisorFeed = document.getElementById("advisor-feed");

function getAdvice(question) {
  const text = question.toLowerCase();
  if (/(waste|offcut|timber|plywood|nest)/.test(text)) return "Start by measuring where waste happens: defects, layout errors, trim loss, or changed cuts. Keep a two-week offcut log, group similar parts, then trial cut-list or nesting software on one repeat job. Review grain direction and defect placement before treating every offcut as a software problem.";
  if (/(safe|safety|injur|blade|danger|risk)/.test(text)) return "Treat safety as a system, not a gadget. Check guarding, dust collection, training, machine condition, and emergency procedures first. For a high-risk operation, use a documented risk assessment and consult qualified safety and equipment professionals before adding vision or sensor systems.";
  if (/(cnc|automat|robot|cobot)/.test(text)) return "CNC is most useful when work is repeated, dimensions are stable, and you can prepare accurate cut data. First calculate setup time, repeat-job volume, rejected parts, training time, and maintenance cost. A small pilot job gives a safer answer than buying equipment based on a general trend.";
  if (/(tool|maintenance|fail|vibration|motor)/.test(text)) return "Begin a simple maintenance history: tool name, hours used, vibration or heat changes, bit changes, and breakdowns. Clean and inspect tools on schedule. Once there is enough history, sensor data can help flag unusual patterns—but it does not replace inspection by a qualified technician.";
  if (/(measure|precision|accur|lidar|layout)/.test(text)) return "Use one source of truth for measurements: a digital drawing or cut list, a repeatable setup checklist, and a final verification point before cutting expensive stock. Advanced measurement tools work best when the team follows the same workflow every time.";
  return "A good first step is to name the exact problem, measure it for a short period, and test one small change. In a workshop, useful intelligence comes from reliable measurements, clear maintenance records, and human review—not from replacing craft judgment.";
}

function addMessage(text, role) {
  const item = document.createElement("article");
  item.className = `advisor-message ${role}`;
  const badge = document.createElement("b");
  badge.textContent = role === "user" ? "YOU" : "AI";
  const message = document.createElement("p");
  message.textContent = text;
  item.append(badge, message);
  advisorFeed.append(item);
  advisorFeed.scrollTop = advisorFeed.scrollHeight;
}

function askAdvisor(question) {
  const cleanQuestion = question.trim();
  if (!cleanQuestion) return;
  addMessage(cleanQuestion, "user");
  window.setTimeout(() => addMessage(getAdvice(cleanQuestion), "assistant"), 280);
}

advisorForm.addEventListener("submit", (event) => { event.preventDefault(); askAdvisor(advisorInput.value); advisorInput.value = ""; });
document.querySelectorAll("[data-question]").forEach((button) => button.addEventListener("click", () => askAdvisor(button.dataset.question)));
