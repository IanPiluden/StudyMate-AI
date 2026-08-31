import { API_KEY } from "./Config.js";

const chatbox = document.getElementById("chatbox");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const voiceButton = document.getElementById("voice-button");
const fileInput = document.getElementById("file-input");
const fileButton = document.getElementById("file-button");
const fileStatus = document.getElementById("file-status");
const voiceSelect = document.getElementById("tts-voice");
const voiceRate = document.getElementById("tts-rate");
const stopSpeakingButton = document.getElementById("stop-speaking");
const appMenu = document.querySelector(".app-menu");
const menuButtons = document.querySelectorAll(".menu-button");
const mobileMenuButton = document.getElementById("mobile-menu-button");
const newChatButton = document.getElementById("new-chat-button");
const historyList = document.getElementById("history-list");
const projectForm = document.getElementById("project-form");
const projectName = document.getElementById("project-name");
const projectList = document.getElementById("project-list");
const scheduleForm = document.getElementById("schedule-form");
const scheduleTitle = document.getElementById("schedule-title");
const scheduleDate = document.getElementById("schedule-date");
const scheduleList = document.getElementById("schedule-list");

let uploadedFileText = "";
let uploadedFileName = "";
let isRecording = false;
let shouldSpeakNextReply = false;
const speechSynthesisSupported = "speechSynthesis" in window;
let availableVoices = [];
let activeChatId = localStorage.getItem("studymate-active-chat") || crypto.randomUUID();
const greeting = "Hello! I'm StudyMate AI. How can I help you today?";

window.addEventListener("studymate:new-chat", () => {
    activeChatId = crypto.randomUUID();
    localStorage.setItem("studymate-active-chat", activeChatId);
});

function getStored(key) {
    return JSON.parse(localStorage.getItem(key) || "[]");
}

function saveCurrentChat() {
    const chats = getStored("studymate-chats");
    const plainMessages = [...chatbox.querySelectorAll(".message")].map((item) => ({
        text: item.childNodes[0]?.textContent?.trim() || "",
        type: item.classList.contains("user-message") ? "user-message" : "bot-message"
    })).filter((item) => item.text && item.text !== "StudyMate AI is typing...");

    const title = plainMessages.find((item) => item.type === "user-message")?.text.slice(0, 42) || "New conversation";
    const record = { id: activeChatId, title, updatedAt: Date.now(), messages: plainMessages };
    const index = chats.findIndex((chat) => chat.id === activeChatId);
    if (index >= 0) chats[index] = record;
    else chats.push(record);
    localStorage.setItem("studymate-chats", JSON.stringify(chats));
    localStorage.setItem("studymate-active-chat", activeChatId);
}

function loadChat(chat) {
    activeChatId = chat.id;
    chatbox.replaceChildren();
    chat.messages.forEach((message) => addMessage(message.text, message.type));
    localStorage.setItem("studymate-active-chat", activeChatId);
    showView("chat");
}

function startNewChat() {
    saveCurrentChat();
    activeChatId = crypto.randomUUID();
    chatbox.replaceChildren();
    addMessage(greeting, "bot-message");
    saveCurrentChat();
    userInput.focus();
    showView("chat");
}

function formatDate(time) {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(time));
}

function renderHistory() {
    const chats = getStored("studymate-chats").sort((a, b) => b.updatedAt - a.updatedAt);
    historyList.replaceChildren();
    if (!chats.length) historyList.innerHTML = '<p class="empty-state">No saved conversations yet.</p>';
    chats.forEach((chat) => {
        const item = document.createElement("article");
        item.className = "saved-item";
        item.innerHTML = `<div><strong></strong><small></small></div><div class="saved-item-actions"><button class="list-action">Open</button><button class="list-action delete">Delete</button></div>`;
        item.querySelector("strong").textContent = chat.title;
        item.querySelector("small").textContent = formatDate(chat.updatedAt);
        item.querySelector(".list-action").addEventListener("click", () => loadChat(chat));
        item.querySelector(".delete").addEventListener("click", () => {
            localStorage.setItem("studymate-chats", JSON.stringify(chats.filter((saved) => saved.id !== chat.id)));
            renderHistory();
        });
        historyList.appendChild(item);
    });
}

function renderProjects() {
    const projects = getStored("studymate-projects");
    projectList.replaceChildren();
    if (!projects.length) projectList.innerHTML = '<p class="empty-state">Create a project for each subject or assignment.</p>';
    projects.forEach((project) => renderSavedItem(projectList, project.name, "Study project", () => {
        localStorage.setItem("studymate-projects", JSON.stringify(projects.filter((item) => item.id !== project.id)));
        renderProjects();
    }));
}

function renderSchedule() {
    const sessions = getStored("studymate-schedule").sort((a, b) => new Date(a.date) - new Date(b.date));
    scheduleList.replaceChildren();
    if (!sessions.length) scheduleList.innerHTML = '<p class="empty-state">No study sessions scheduled yet.</p>';
    sessions.forEach((session) => renderSavedItem(scheduleList, session.title, formatDate(session.date), () => {
        localStorage.setItem("studymate-schedule", JSON.stringify(sessions.filter((item) => item.id !== session.id)));
        renderSchedule();
    }));
}

function renderSavedItem(list, title, detail, remove) {
    const item = document.createElement("article");
    item.className = "saved-item";
    item.innerHTML = `<div><strong></strong><small></small></div><div class="saved-item-actions"><button class="list-action delete">Delete</button></div>`;
    item.querySelector("strong").textContent = title;
    item.querySelector("small").textContent = detail;
    item.querySelector("button").addEventListener("click", remove);
    list.appendChild(item);
}

function showView(view) {
    ["chat", "history", "projects", "schedule", "downloads", "studio"].forEach((name) => {
        document.getElementById(`${name}-view`).hidden = name !== view;
    });
    menuButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === view));
    appMenu.classList.remove("open");
    if (view === "history") renderHistory();
    if (view === "projects") renderProjects();
    if (view === "schedule") renderSchedule();
}

if (!window.studyMateMenuEnabled) {
menuButtons.forEach((button) => button.addEventListener("click", () => button.dataset.view === "chat" ? startNewChat() : showView(button.dataset.view)));
mobileMenuButton.addEventListener("click", () => appMenu.classList.toggle("open"));
newChatButton.addEventListener("click", startNewChat);
projectForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const projects = getStored("studymate-projects");
    projects.push({ id: crypto.randomUUID(), name: projectName.value.trim() });
    localStorage.setItem("studymate-projects", JSON.stringify(projects));
    projectForm.reset(); renderProjects();
});
scheduleForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const sessions = getStored("studymate-schedule");
    sessions.push({ id: crypto.randomUUID(), title: scheduleTitle.value.trim(), date: scheduleDate.value });
    localStorage.setItem("studymate-schedule", JSON.stringify(sessions));
    scheduleForm.reset(); renderSchedule();
});
}

function populateVoices() {
    if (!speechSynthesisSupported) return;

    availableVoices = window.speechSynthesis.getVoices();
    voiceSelect.replaceChildren();

    if (availableVoices.length === 0) {
        voiceSelect.add(new Option("No system voices found", ""));
        return;
    }

    availableVoices
        .filter((voice) => voice.lang.startsWith("en"))
        .concat(availableVoices.filter((voice) => !voice.lang.startsWith("en")))
        .forEach((voice) => voiceSelect.add(new Option(`${voice.name} (${voice.lang})`, voice.name)));
}

function speakText(text, button) {
    if (!speechSynthesisSupported) {
        alert("Text-to-speech is not supported by this browser.");
        return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = Number(voiceRate.value);
    utterance.pitch = 1;
    utterance.voice = availableVoices.find((voice) => voice.name === voiceSelect.value) || null;
    utterance.onstart = () => { if (button) button.textContent = "■ Stop reading"; };
    utterance.onend = () => { if (button) button.textContent = "🔊 Read aloud"; };
    utterance.onerror = () => { if (button) button.textContent = "🔊 Read aloud"; };
    window.speechSynthesis.speak(utterance);
}

if (speechSynthesisSupported) {
    populateVoices();
    window.speechSynthesis.addEventListener("voiceschanged", populateVoices);
    stopSpeakingButton.addEventListener("click", () => window.speechSynthesis.cancel());
} else {
    document.querySelector(".voice-tools").style.display = "none";
}

function addMessage(message, className) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("message", className);
    messageElement.textContent = message;

    if (className === "bot-message" && speechSynthesisSupported) {
        const speakButton = document.createElement("button");
        speakButton.className = "speak-button";
        speakButton.type = "button";
        speakButton.textContent = "🔊 Read aloud";
        speakButton.addEventListener("click", () => {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
                speakButton.textContent = "🔊 Read aloud";
            } else {
                speakText(message, speakButton);
            }
        });
        messageElement.appendChild(speakButton);
    }
    chatbox.appendChild(messageElement);
    chatbox.scrollTop = chatbox.scrollHeight;
}

function showTyping() {
    const element = document.createElement("div");
    element.classList.add("message", "bot-message");
    element.textContent = "StudyMate AI is typing...";
    chatbox.appendChild(element);
    chatbox.scrollTop = chatbox.scrollHeight;
    return element;
}

async function getBotReply(prompt) {
    if (!API_KEY || API_KEY.includes("PASTE_YOUR")) {
        return "AI setup is incomplete. Add your Gemini API key in Config.js, then run this folder with Live Server or another local web server.";
    }

    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent";

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-goog-api-key": API_KEY },
            body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
        });
        const data = await response.json();

        if (!response.ok) {
            console.error("Gemini API error:", data);
            return data.error?.message || "The AI service could not process the request.";
        }

        return data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("")
            || "Sorry, I could not generate a response.";
    } catch (error) {
        console.error("Network error:", error);
        return "Could not reach the AI service. Run the site with Live Server and check your internet connection.";
    }
}

async function readUploadedFile(file) {
    const extension = file.name.split(".").pop().toLowerCase();

    if (extension === "pdf") {
        const pdfjsLib = await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";
        const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
        const pages = [];

        for (let number = 1; number <= pdf.numPages; number += 1) {
            const content = await (await pdf.getPage(number)).getTextContent();
            pages.push(content.items.map((item) => item.str).join(" "));
        }
        return pages.join("\n\n");
    }

    if (extension === "docx") {
        if (!window.mammoth) throw new Error("The Word reader did not load. Check your internet connection.");
        return (await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value;
    }

    if (["txt", "md", "csv", "json", "js", "html", "css", "py", "java", "c", "cpp"].includes(extension)) {
        return file.text();
    }

    throw new Error("Supported files: PDF, DOCX, TXT, Markdown, CSV, JSON, and common code files.");
}

fileInput.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5_000_000) {
        addMessage("Please upload a file smaller than 5 MB.", "bot-message");
        fileInput.value = "";
        return;
    }

    fileStatus.textContent = `Reading ${file.name}...`;
    try {
        uploadedFileText = await readUploadedFile(file);
        uploadedFileName = file.name;
        fileButton.classList.add("has-file");
        fileStatus.textContent = `Attached: ${file.name}`;
        userInput.value = `Please help me with this uploaded file: ${file.name}`;
        userInput.focus();
    } catch (error) {
        console.error("File read error:", error);
        fileStatus.textContent = "";
        fileInput.value = "";
        fileButton.classList.remove("has-file");
        addMessage(error.message || "I could not read that file.", "bot-message");
    }
});

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message && !uploadedFileText) return;

    const prompt = uploadedFileText
        ? `${message}\n\nUploaded file: ${uploadedFileName}\n--- File contents ---\n${uploadedFileText}\n--- End file contents ---`
        : message;

    addMessage(message || `Uploaded: ${uploadedFileName}`, "user-message");
    userInput.value = "";
    sendButton.disabled = true;
    const typingElement = showTyping();

    try {
        const reply = await getBotReply(prompt);
        addMessage(reply, "bot-message");

        if (shouldSpeakNextReply) {
            shouldSpeakNextReply = false;
            speakText(reply);
        }
    } finally {
        typingElement.remove();
        uploadedFileText = "";
        uploadedFileName = "";
        fileInput.value = "";
        fileStatus.textContent = "";
        fileButton.classList.remove("has-file");
        sendButton.disabled = false;
        saveCurrentChat();
    }
}

sendButton.addEventListener("click", sendMessage);
userInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        sendMessage();
    }
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SpeechRecognition) {
    voiceButton.style.display = "none";
} else {
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    voiceButton.addEventListener("click", () => isRecording ? recognition.stop() : recognition.start());
    recognition.onstart = () => {
        isRecording = true;
        voiceButton.classList.add("recording");
        voiceButton.textContent = "⏹";
        userInput.placeholder = "Listening...";
    };
    recognition.onresult = (event) => {
        userInput.value = event.results[0][0].transcript.trim();
        shouldSpeakNextReply = true;
        sendMessage();
    };
    recognition.onend = () => {
        isRecording = false;
        voiceButton.classList.remove("recording");
        voiceButton.textContent = "🎤";
        userInput.placeholder = "Ask StudyMate anything...";
    };
    recognition.onerror = (event) => {
        if (event.error === "not-allowed") alert("Allow microphone access in your browser settings, then try again.");
    };
}

// Restore the latest conversation when the page opens.
const savedActiveChat = getStored("studymate-chats").find((chat) => chat.id === activeChatId);
if (savedActiveChat) {
    chatbox.replaceChildren();
    savedActiveChat.messages.forEach((message) => addMessage(message.text, message.type));
} else {
    saveCurrentChat();
}
