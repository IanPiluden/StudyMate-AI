const appMenu = document.querySelector(".app-menu");
const menuButtons = document.querySelectorAll(".menu-button");
const mobileMenuButton = document.getElementById("mobile-menu-button");
const newChatButton = document.getElementById("new-chat-button");
const chatbox = document.getElementById("chatbox");
const historyList = document.getElementById("history-list");
const projectForm = document.getElementById("project-form");
const projectName = document.getElementById("project-name");
const projectList = document.getElementById("project-list");
const scheduleForm = document.getElementById("schedule-form");
const scheduleTitle = document.getElementById("schedule-title");
const scheduleDate = document.getElementById("schedule-date");
const scheduleList = document.getElementById("schedule-list");
const greeting = "Hello! I'm StudyMate AI. How can I help you today?";
window.studyMateMenuEnabled = true;

function getStored(key) {
    try { return JSON.parse(localStorage.getItem(key) || "[]"); }
    catch { return []; }
}

function renderList(list, entries, emptyText, makeItem) {
    list.replaceChildren();
    if (!entries.length) {
        const empty = document.createElement("p");
        empty.className = "empty-state";
        empty.textContent = emptyText;
        list.append(empty);
        return;
    }
    entries.forEach((entry) => list.append(makeItem(entry)));
}

function showView(view) {
    ["dashboard", "chat", "history", "projects", "schedule", "toolkit", "progress", "downloads", "studio"].forEach((name) => {
        document.getElementById(`${name}-view`).hidden = name !== view;
    });
    menuButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === view));
    appMenu.classList.remove("open");
    if (view === "history") renderHistory();
    if (view === "projects") renderProjects();
    if (view === "schedule") renderSchedule();
    if (view === "dashboard") renderDashboard();
    if (view === "progress") renderProgress();
}

function getProgress() { return JSON.parse(localStorage.getItem("studymate-progress") || '{"answered":0,"correct":0,"quizzes":0}'); }
function renderDashboard() {
    const progress = getProgress();
    const accuracy = progress.answered ? `${Math.round(progress.correct / progress.answered * 100)}%` : "—";
    document.getElementById("chat-count").textContent = getStored("studymate-chats").length;
    document.getElementById("project-count").textContent = getStored("studymate-projects").length;
    document.getElementById("session-count").textContent = getStored("studymate-schedule").filter((item) => new Date(item.date) >= new Date()).length;
    document.getElementById("accuracy-count").textContent = accuracy;
}
function renderProgress() {
    const progress = getProgress(); const accuracy = progress.answered ? Math.round(progress.correct / progress.answered * 100) : null;
    document.getElementById("quizzes-count").textContent = progress.quizzes;
    document.getElementById("answers-count").textContent = progress.answered;
    document.getElementById("correct-count").textContent = progress.correct;
    document.getElementById("progress-accuracy").textContent = accuracy === null ? "—" : `${accuracy}%`;
    document.getElementById("progress-message").textContent = accuracy === null ? "Create a quiz from your notes to begin tracking your practice." : accuracy >= 75 ? "Great work. Try a new topic or use flashcards to retain the material." : "Review the topics you missed, then generate another short quiz.";
}

function renderHistory() {
    const chats = getStored("studymate-chats").sort((a, b) => b.updatedAt - a.updatedAt);
    renderList(historyList, chats, "No saved conversations yet.", (chat) => {
        const item = makeItem(chat.title || "New conversation", new Date(chat.updatedAt).toLocaleString());
        const open = document.createElement("button");
        open.className = "list-action";
        open.textContent = "Open";
        open.onclick = () => {
            localStorage.setItem("studymate-active-chat", chat.id);
            location.reload();
        };
        item.querySelector(".saved-item-actions").prepend(open);
        item.querySelector(".delete").onclick = () => {
            localStorage.setItem("studymate-chats", JSON.stringify(chats.filter((item) => item.id !== chat.id)));
            renderHistory();
        };
        return item;
    });
}

function makeItem(title, detail) {
    const item = document.createElement("article");
    item.className = "saved-item";
    const text = document.createElement("div");
    const heading = document.createElement("strong");
    const subtext = document.createElement("small");
    const actions = document.createElement("div");
    const remove = document.createElement("button");
    heading.textContent = title;
    subtext.textContent = detail;
    actions.className = "saved-item-actions";
    remove.className = "list-action delete";
    remove.textContent = "Delete";
    text.append(heading, subtext);
    actions.append(remove);
    item.append(text, actions);
    return item;
}

function renderProjects() {
    const projects = getStored("studymate-projects");
    renderList(projectList, projects, "Create a project for each subject or assignment.", (project) => {
        const item = makeItem(project.name, "Study project");
        item.querySelector(".delete").onclick = () => {
            localStorage.setItem("studymate-projects", JSON.stringify(projects.filter((entry) => entry.id !== project.id)));
            renderProjects();
        };
        return item;
    });
}

function renderSchedule() {
    const sessions = getStored("studymate-schedule").sort((a, b) => new Date(a.date) - new Date(b.date));
    renderList(scheduleList, sessions, "No study sessions scheduled yet.", (session) => {
        const item = makeItem(session.title, new Date(session.date).toLocaleString());
        item.querySelector(".delete").onclick = () => {
            localStorage.setItem("studymate-schedule", JSON.stringify(sessions.filter((entry) => entry.id !== session.id)));
            renderSchedule();
        };
        return item;
    });
}

function startNewChat() {
    chatbox.replaceChildren();
    const greetingElement = document.createElement("div");
    greetingElement.className = "message bot-message";
    greetingElement.textContent = greeting;
    chatbox.append(greetingElement);
    localStorage.removeItem("studymate-active-chat");
    window.dispatchEvent(new Event("studymate:new-chat"));
    showView("chat");
}

menuButtons.forEach((button) => button.addEventListener("click", () => button.dataset.view === "chat" ? startNewChat() : showView(button.dataset.view)));
mobileMenuButton.addEventListener("click", () => appMenu.classList.toggle("open"));
newChatButton.addEventListener("click", startNewChat);
projectForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = projectName.value.trim();
    if (!name) return;
    const projects = getStored("studymate-projects");
    projects.push({ id: Date.now(), name });
    localStorage.setItem("studymate-projects", JSON.stringify(projects));
    projectForm.reset();
    renderProjects();
});
scheduleForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = scheduleTitle.value.trim();
    if (!title || !scheduleDate.value) return;
    const sessions = getStored("studymate-schedule");
    sessions.push({ id: Date.now(), title, date: scheduleDate.value });
    localStorage.setItem("studymate-schedule", JSON.stringify(sessions));
    scheduleForm.reset();
    renderSchedule();
});

document.querySelectorAll(".dashboard-action").forEach((button) => button.addEventListener("click", () => showView(button.dataset.go)));
const toolkitResult = document.getElementById("toolkit-result");
const studySource = document.getElementById("study-source");
const escapeHtml = (value) => value.replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character]));
const sentences = (source) => source.replace(/\s+/g, " ").match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((item) => item.trim()).filter(Boolean) || [];
function recordQuiz(answered, correct) { const progress = getProgress(); progress.answered += answered; progress.correct += correct; progress.quizzes += 1; localStorage.setItem("studymate-progress", JSON.stringify(progress)); }
function createQuiz(source) {
    const questions = sentences(source).slice(0, 3).map((line, index) => { const words = line.match(/[A-Za-z][A-Za-z-]{3,}/g) || ["topic"]; const answer = words[Math.min(1, words.length - 1)]; return `<article class="quiz-question"><strong>${index + 1}. Complete the idea from your notes:</strong><p>${escapeHtml(line.replace(answer, "_____"))}</p><input data-answer="${escapeHtml(answer.toLowerCase())}" placeholder="Your answer"><small class="quiz-feedback"></small></article>`; }).join("");
    toolkitResult.innerHTML = `<h3>Practice quiz</h3><p>Answer each blank using your notes.</p>${questions}<button id="check-quiz" class="primary-action">Check answers</button>`;
    document.getElementById("check-quiz").onclick = () => { let correct = 0; const inputs = [...toolkitResult.querySelectorAll("input")]; inputs.forEach((input) => { const ok = input.value.trim().toLowerCase() === input.dataset.answer; if (ok) correct += 1; const feedback = input.nextElementSibling; feedback.textContent = ok ? "Correct" : `Review: ${input.dataset.answer}`; feedback.className = `quiz-feedback ${ok ? "correct" : "incorrect"}`; }); recordQuiz(inputs.length, correct); renderDashboard(); };
}
document.querySelectorAll("[data-tool]").forEach((button) => button.addEventListener("click", () => {
    const source = studySource.value.trim(); if (!source) { toolkitResult.innerHTML = "<p>Paste a topic or notes first.</p>"; return; } const lines = sentences(source);
    if (button.dataset.tool === "summary") toolkitResult.innerHTML = `<h3>Key takeaways</h3><ul>${lines.slice(0, 5).map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`;
    if (button.dataset.tool === "flashcards") { toolkitResult.innerHTML = `<h3>Flashcards</h3><div class="flashcards">${lines.slice(0, 5).map((line, index) => `<button class="flashcard" type="button"><span>Card ${index + 1} — click to reveal</span><strong hidden>${escapeHtml(line)}</strong></button>`).join("")}</div>`; toolkitResult.querySelectorAll(".flashcard").forEach((card) => card.onclick = () => { card.querySelector("span").hidden = true; card.querySelector("strong").hidden = false; }); }
    if (button.dataset.tool === "quiz") createQuiz(source);
}));
const authScreen = document.getElementById("auth-screen"); const appShell = document.getElementById("app-shell"); const storedProfile = JSON.parse(localStorage.getItem("studymate-profile") || "null");
function enterApp(profile) { document.getElementById("student-name").textContent = profile.name.split(" ")[0]; authScreen.hidden = true; appShell.hidden = false; showView("dashboard"); }
if (storedProfile) enterApp(storedProfile);
document.getElementById("auth-form").addEventListener("submit", (event) => { event.preventDefault(); const profile = { name: document.getElementById("auth-name").value.trim(), email: document.getElementById("auth-email").value.trim() }; localStorage.setItem("studymate-profile", JSON.stringify(profile)); enterApp(profile); });
document.getElementById("sign-out-button").onclick = () => { localStorage.removeItem("studymate-profile"); appShell.hidden = true; authScreen.hidden = false; document.getElementById("auth-form").reset(); };
