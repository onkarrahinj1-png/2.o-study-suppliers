// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// EmailJS Credentials Declarations
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";   
const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";   
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID"; 

const SECRET_ADMIN_KEY = "admin2020";

// EmailJS Initialization
(function() {
    if (typeof emailjs !== "undefined") {
        try {
            if (EMAILJS_PUBLIC_KEY && EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY") {
                emailjs.init(EMAILJS_PUBLIC_KEY);
            }
        } catch (err) {
            console.error("EmailJS Init Error:", err);
        }
    }
})();

// BCom CA Syllabus Data Structure
const bcomCaSyllabus = {
    fy: {
        title: "FY BCom CA",
        semesters: {
            sem1: {
                title: "Semester 1",
                subjects: [
                    { name: "C Programming", isPractical: true },
                    { name: "OAT (Office Automation Tools)", isPractical: true },
                    { name: "Financial Accounting", isPractical: false },
                    { name: "Business Communication", isPractical: false },
                    { name: "Principles of Management", isPractical: false }
                ]
            },
            sem2: {
                title: "Semester 2",
                subjects: [
                    { name: "TPA", isPractical: true },
                    { name: "DBMS", isPractical: true },
                    { name: "Financial Accounting II", isPractical: false },
                    { name: "Business Economics", isPractical: false },
                    { name: "Principles of Marketing", isPractical: false }
                ]
            }
        }
    },
    sy: {
        title: "SY BCom CA",
        semesters: {
            sem3: {
                title: "Semester 3",
                subjects: [
                    { name: "Data Structure (DS)", isPractical: true },
                    { name: "PHP Programming", isPractical: true },
                    { name: "Cyber Security", isPractical: false },
                    { name: "Web Development", isPractical: true },
                    { name: "Cost Accounting", isPractical: false }
                ]
            },
            sem4: {
                title: "Semester 4",
                subjects: [
                    { name: "SY Project", isPractical: true },
                    { name: "Advanced Web Tech", isPractical: true },
                    { name: "Corporate Accounting", isPractical: false },
                    { name: "Computer Networks", isPractical: false },
                    { name: "MIS", isPractical: false }
                ]
            }
        }
    },
    ty: {
        title: "TY BCom CA",
        semesters: {
            sem5: {
                title: "Semester 5",
                subjects: [
                    { name: "Java Programming", isPractical: true },
                    { name: "Python Programming", isPractical: true },
                    { name: "SE (Software Engineering)", isPractical: true },
                    { name: "Cyber Law", isPractical: false },
                    { name: "E-Commerce", isPractical: false }
                ]
            },
            sem6: {
                title: "Semester 6",
                subjects: [
                    { name: "Cloud Computing", isPractical: true },
                    { name: "Main Project", isPractical: true },
                    { name: "Software Testing", isPractical: false },
                    { name: "Digital Marketing", isPractical: false },
                    { name: "Entrepreneurship", isPractical: false }
                ]
            }
        }
    }
};

// LocalStorage Helper for Logs and Saved Items
function getLocalData(key) {
    return JSON.parse(localStorage.getItem(key) || "[]");
}

function setLocalData(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
}

let currentUser = JSON.parse(localStorage.getItem("active_user") || "null");
let currentSelectedYear = "";
let currentSelectedSem = "";
let currentSelectedSubject = "";

document.addEventListener("DOMContentLoaded", function () {
    checkInitialAuthFlow();
    setupAuthAndFormEvents();
    renderHistoryList();
    updateDownloadBadgeCount();
});

function checkInitialAuthFlow() {
    const landingOverlay = document.getElementById("landingAuthOverlay");
    const portalContent = document.getElementById("portalMainContent");

    if (currentUser) {
        landingOverlay.classList.add("hidden");
        portalContent.classList.remove("hidden");
        updateUserStatusUI();
        showHome();
    } else {
        portalContent.classList.add("hidden");
        landingOverlay.classList.remove("hidden");
        switchAuthMode('login');
    }
}

function switchAuthMode(mode) {
    document.getElementById("mainAuthTabs").classList.remove("hidden");
    
    const regBtn = document.getElementById("tabRegisterBtn");
    const loginBtn = document.getElementById("tabLoginBtn");
    const regForm = document.getElementById("registerForm");
    const loginForm = document.getElementById("loginForm");
    const forgotForm = document.getElementById("forgotForm");
    const adminForm = document.getElementById("adminLoginForm");

    forgotForm.classList.add("hidden");
    adminForm.classList.add("hidden");

    if (mode === 'register') {
        regBtn.classList.add("active");
        loginBtn.classList.remove("active");
        regForm.classList.remove("hidden");
        loginForm.classList.add("hidden");
    } else if (mode === 'login') {
        loginBtn.classList.add("active");
        regBtn.classList.remove("active");
        loginForm.classList.remove("hidden");
        regForm.classList.add("hidden");
    }
}

function toggleForgotView(e) {
    if (e) e.preventDefault();
    const forgotForm = document.getElementById("forgotForm");
    const loginForm = document.getElementById("loginForm");
    
    if (forgotForm.classList.contains("hidden")) {
        loginForm.classList.add("hidden");
        forgotForm.classList.remove("hidden");
    } else {
        forgotForm.classList.add("hidden");
        loginForm.classList.remove("hidden");
    }
}

function openAdminModal(e) {
    if (e) e.preventDefault();
    document.getElementById("registerForm").classList.add("hidden");
    document.getElementById("loginForm").classList.add("hidden");
    document.getElementById("forgotForm").classList.add("hidden");
    document.getElementById("mainAuthTabs").classList.add("hidden");
    document.getElementById("adminLoginForm").classList.remove("hidden");
}

function closeAdminModal(e) {
    if (e) e.preventDefault();
    switchAuthMode('login');
}

function updateUserStatusUI() {
    const greeting = document.getElementById("userGreeting");
    const adminNavBtn = document.getElementById("adminNavBtn");

    if (currentUser) {
        greeting.textContent = `Logged in: ${currentUser.name || 'Admin'} - [${currentUser.role.toUpperCase()}]`;
        if (currentUser.role === "admin") {
            adminNavBtn.classList.remove("hidden");
        } else {
            adminNavBtn.classList.add("hidden");
        }
    }
}

// 1. Firebase Register Function (No Page Refresh)
async function handleRegister(e) {
    e.preventDefault(); // <-- Yeh page ko refresh hone se rokta hai

    const name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;

    try {
        // Firebase Authentication me user create karein
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Firebase Firestore Database me User profile save karein
        await db.collection("users").doc(user.uid).set({
            name: name,
            email: email,
            role: "student",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        alert("Registration Successful!");
        
        // Form reset karein aur Login tab par jayein
        document.getElementById("registerForm").reset();
        switchAuthMode('login'); // Instant Tab Switch

    } catch (error) {
        alert("Error: " + error.message);
    }
}

// 2. Firebase Login Function
async function handleLogin(e) {
    e.preventDefault(); // Page refresh stop

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Firestore database se user role fetch karein
        const docRef = await db.collection("users").doc(user.uid).get();
        if (docRef.exists) {
            currentUser = docRef.data();
            currentUser.uid = user.uid;
        } else {
            currentUser = { name: "Student", email: email, role: "student", uid: user.uid };
        }

        localStorage.setItem("active_user", JSON.stringify(currentUser));
        alert("Login Successful!");
        checkInitialAuthFlow(); 
    } catch (error) {
        alert("Login Failed: " + error.message);
    }
}

function setupAuthAndFormEvents() {
    // 3. Event Listeners Attach Karein
    document.getElementById("registerForm").addEventListener("submit", handleRegister);
    document.getElementById("loginForm").addEventListener("submit", handleLogin);

    // Admin Login Event
    document.getElementById("adminLoginForm").onsubmit = function (e) {
        e.preventDefault();
        const email = document.getElementById("adminEmail").value.trim();
        const password = document.getElementById("adminPassword").value;
        const key = document.getElementById("adminKeyInput").value.trim();

        if (key !== SECRET_ADMIN_KEY) {
            alert("Invalid Secret Key!");
            return;
        }

        currentUser = { name: "Admin", email: email, role: "admin" };
        localStorage.setItem("active_user", JSON.stringify(currentUser));
        checkInitialAuthFlow();
    };

    // Forgot Password Event
    document.getElementById("forgotForm").onsubmit = function (e) {
        e.preventDefault();
        const userEmail = document.getElementById("forgotEmail").value.trim();
        const submitBtn = this.querySelector(".submit-btn");

        if (!EMAILJS_PUBLIC_KEY || EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY") {
            alert("EmailJS is not configured yet! Please update credentials in script.js");
            return;
        }

        submitBtn.innerText = "Sending Email...";
        submitBtn.disabled = true;

        const templateParams = {
            to_email: userEmail,
            message: "Password reset request received for Study Suppliers account."
        };

        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams)
            .then(function() {
                alert("Password reset link sent to: " + userEmail);
                switchAuthMode('login');
            }, function(error) {
                alert("Failed to send email. Check EmailJS configuration.");
            })
            .finally(function() {
                submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Send Password Reset Link';
                submitBtn.disabled = false;
            });
    };

    document.getElementById("userShareForm").onsubmit = function (e) {
        e.preventDefault();
        handleSaveMaterial("userMatYear", "userMatSem", "userMatSubject", "userMatCategory", "userMatTitle", "userMatUrl");
        document.getElementById("userShareForm").reset();
    };

    document.getElementById("addMaterialForm").onsubmit = function (e) {
        e.preventDefault();
        handleSaveMaterial("adminMatYear", "adminMatSem", "adminMatSubject", "adminMatCategory", "adminMatTitle", "adminMatUrl");
        document.getElementById("addMaterialForm").reset();
        renderAdminMaterialsList();
    };

    document.getElementById("clearHistoryBtn").onclick = function() {
        setLocalData("activity_logs", []);
        renderHistoryList();
    };
}

function logoutUser() {
    auth.signOut().then(() => {
        localStorage.removeItem("active_user");
        currentUser = null;
        checkInitialAuthFlow();
    });
}

function hideAllViews() {
    const views = document.querySelectorAll(".view-section");
    views.forEach(v => v.classList.add("hidden"));
}

function populateFormSemesters(yId, sId, subjId) {
    const yVal = document.getElementById(yId).value;
    const semSelect = document.getElementById(sId);
    document.getElementById(subjId).innerHTML = '<option value="">3. Select Subject</option>';

    semSelect.innerHTML = '<option value="">2. Select Semester</option>';
    if (!yVal || !bcomCaSyllabus[yVal]) return;

    Object.keys(bcomCaSyllabus[yVal].semesters).forEach(sKey => {
        const opt = document.createElement("option");
        opt.value = sKey;
        opt.textContent = bcomCaSyllabus[yVal].semesters[sKey].title;
        semSelect.appendChild(opt);
    });
}

function populateFormSubjects(yId, sId, subjId) {
    const yVal = document.getElementById(yId).value;
    const sVal = document.getElementById(sId).value;
    const subjSelect = document.getElementById(subjId);

    subjSelect.innerHTML = '<option value="">3. Select Subject</option>';
    if (!yVal || !sVal || !bcomCaSyllabus[yVal].semesters[sVal]) return;

    bcomCaSyllabus[yVal].semesters[sVal].subjects.forEach(subj => {
        const opt = document.createElement("option");
        opt.value = subj.name;
        opt.textContent = subj.name + (subj.isPractical ? " [Practical]" : "");
        subjSelect.appendChild(opt);
    });
}

function populateCategories(yId, sId, subjId, catId) {
    const yVal = document.getElementById(yId).value;
    const sVal = document.getElementById(sId).value;
    const subjVal = document.getElementById(subjId).value;
    const catSelect = document.getElementById(catId);

    catSelect.innerHTML = '<option value="">4. Select Category</option>';
    if (!yVal || !sVal || !subjVal) return;

    const subjObj = bcomCaSyllabus[yVal].semesters[sVal].subjects.find(s => s.name === subjVal);

    catSelect.appendChild(new Option("Textbooks / Notes", "Textbooks & Notes"));
    catSelect.appendChild(new Option("Question Papers", "Question Papers"));
    catSelect.appendChild(new Option("Reference PDFs", "Reference PDFs"));

    if (subjObj && subjObj.isPractical) {
        catSelect.appendChild(new Option("Practical Files", "Practical Files"));
    }
}

async function handleSaveMaterial(yId, sId, subjId, catId, titleId, urlId) {
    const year = document.getElementById(yId).value;
    const sem = document.getElementById(sId).value;
    const subject = document.getElementById(subjId).value;
    const category = document.getElementById(catId).value;
    const title = document.getElementById(titleId).value.trim();
    const url = document.getElementById(urlId).value.trim();

    try {
        await db.collection("materials").add({
            year, sem, subject, category, title, url,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert("PDF Uploaded to Database Successfully!");
        addActivityLog(`Shared PDF: ${title} (${subject})`);
    } catch (error) {
        alert("Error saving material: " + error.message);
    }
}

function showHome() {
    hideAllViews();
    document.getElementById("courseSelectionView").classList.remove("hidden");
}

function openYear(yearKey) {
    currentSelectedYear = yearKey;
    hideAllViews();
    document.getElementById("semesterSelectionView").classList.remove("hidden");
    const yearData = bcomCaSyllabus[yearKey];
    document.getElementById("selectedYearTitle").textContent = `${yearData.title} - Select Semester`;

    const grid = document.getElementById("semesterGrid");
    grid.innerHTML = "";
    Object.keys(yearData.semesters).forEach(sKey => {
        const sem = yearData.semesters[sKey];
        const card = document.createElement("div");
        card.className = "course-card";
        card.onclick = function() { openSemester(yearKey, sKey); };
        card.innerHTML = `<i class="fa-solid fa-book-bookmark course-icon"></i><h3>${sem.title}</h3><p>${sem.subjects.length} Subjects Included</p><button type="button" class="explore-btn">Open Semester</button>`;
        grid.appendChild(card);
    });
}

function backToSemesters() {
    if (currentSelectedYear) openYear(currentSelectedYear);
    else showHome();
}

function openSemester(yearKey, semKey) {
    currentSelectedYear = yearKey;
    currentSelectedSem = semKey;
    hideAllViews();
    document.getElementById("subjectSelectionView").classList.remove("hidden");

    const semData = bcomCaSyllabus[yearKey].semesters[semKey];
    document.getElementById("selectedSemTitle").textContent = `${semData.title} - Select Subject`;

    const grid = document.getElementById("subjectGrid");
    grid.innerHTML = "";
    semData.subjects.forEach(subj => {
        const card = document.createElement("div");
        card.className = "subject-card";
        card.onclick = function() { openSubjectMaterials(yearKey, semKey, subj.name); };
        card.innerHTML = `<i class="fa-solid ${subj.isPractical ? 'fa-laptop-code' : 'fa-book'} subject-icon"></i><h3>${subj.name}</h3><p>${subj.isPractical ? 'Theory & Practical' : 'Theory Subject'}</p><button type="button" class="explore-btn">View PDFs</button>`;
        grid.appendChild(card);
    });
}

function backToSubjects() {
    if (currentSelectedYear && currentSelectedSem) openSemester(currentSelectedYear, currentSelectedSem);
    else showHome();
}

function openSubjectMaterials(yearKey, semKey, subjectName) {
    currentSelectedYear = yearKey;
    currentSelectedSem = semKey;
    currentSelectedSubject = subjectName;

    hideAllViews();
    document.getElementById("materialsDetailView").classList.remove("hidden");
    document.getElementById("selectedSubjectTitle").textContent = `${subjectName} - Study Materials`;

    renderSubjectMaterials(yearKey, semKey, subjectName);
}

function processPdfUrls(rawUrl) {
    let previewUrl = rawUrl;
    let downloadUrl = rawUrl;
    if (rawUrl.includes("drive.google.com")) {
        const match = rawUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || rawUrl.match(/id=([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            previewUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
            downloadUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
        }
    }
    return { previewUrl, downloadUrl };
}

async function renderSubjectMaterials(yearKey, semKey, subjectName) {
    const grid = document.getElementById("materialsGrid");
    grid.innerHTML = "<div style='text-align:center; padding:20px;'>Loading materials from Firestore...</div>";

    try {
        const snapshot = await db.collection("materials")
            .where("year", "==", yearKey)
            .where("sem", "==", semKey)
            .where("subject", "==", subjectName)
            .get();

        grid.innerHTML = "";
        if (snapshot.empty) {
            grid.innerHTML = `<div style="text-align:center; padding:30px;"><b>No PDFs uploaded for ${subjectName} yet.</b></div>`;
            return;
        }

        snapshot.forEach(doc => {
            const item = doc.data();
            const { previewUrl, downloadUrl } = processPdfUrls(item.url);
            const card = document.createElement("div");
            card.className = "pdf-item-card";
            card.innerHTML = `
                <div class="pdf-item-header">
                    <div><i class="fa-solid fa-file-pdf" style="color:#e11d48;"></i> <b>${item.title}</b> (${item.category})</div>
                    <div class="pdf-action-btns">
                        <a href="${previewUrl}" target="_blank" class="action-btn btn-open" onclick="trackAndSaveDownload('${item.title}', '${item.url}', 'view')">View</a>
                        <a href="${downloadUrl}" target="_blank" class="action-btn btn-download" onclick="trackAndSaveDownload('${item.title}', '${item.url}', 'download')">Download</a>
                    </div>
                </div>
                <iframe src="${previewUrl}" width="100%" height="300" style="margin-top:10px; border-radius:6px; border:1px solid #cbd5e1;"></iframe>
            `;
            grid.appendChild(card);
        });
    } catch (error) {
        grid.innerHTML = `<div style="text-align:center; padding:30px; color:red;">Error loading materials: ${error.message}</div>`;
    }
}

function trackAndSaveDownload(title, url, action) {
    let downloads = getLocalData("user_saved_downloads");
    if (!downloads.some(d => d.pdfTitle === title)) {
        downloads.push({ pdfTitle: title, pdfUrl: url, savedAt: new Date().toLocaleDateString() });
        setLocalData("user_saved_downloads", downloads);
        updateDownloadBadgeCount();
    }
    addActivityLog(`${action === 'view' ? 'Viewed' : 'Downloaded'} PDF: ${title}`);
}

function openUserUploadPanel() {
    hideAllViews();
    document.getElementById("userUploadView").classList.remove("hidden");
}

function openUserDownloads() {
    hideAllViews();
    document.getElementById("userDownloadsView").classList.remove("hidden");
    renderUserDownloadsList();
}

function renderUserDownloadsList() {
    const grid = document.getElementById("userDownloadsGrid");
    grid.innerHTML = "";
    const downloads = getLocalData("user_saved_downloads");

    if (downloads.length === 0) {
        grid.innerHTML = `<div style="text-align:center; padding:30px;"><b>No saved PDFs found in your library yet.</b></div>`;
        return;
    }

    downloads.forEach((item, index) => {
        const { previewUrl, downloadUrl } = processPdfUrls(item.pdfUrl);
        const card = document.createElement("div");
        card.className = "pdf-item-card";
        card.innerHTML = `
            <div class="pdf-item-header">
                <div><i class="fa-solid fa-bookmark" style="color:#0284c7;"></i> <b>${item.pdfTitle}</b> <span style="font-size:0.75rem; color:#64748b;">(Saved: ${item.savedAt})</span></div>
                <div class="pdf-action-btns">
                    <a href="${previewUrl}" target="_blank" class="action-btn btn-open">View</a>
                    <a href="${downloadUrl}" target="_blank" class="action-btn btn-download">Download</a>
                    <button type="button" class="action-btn" style="background:#ef4444; color:white;" onclick="removeSavedPdf(${index})">Remove</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function removeSavedPdf(index) {
    let downloads = getLocalData("user_saved_downloads");
    downloads.splice(index, 1);
    setLocalData("user_saved_downloads", downloads);
    renderUserDownloadsList();
    updateDownloadBadgeCount();
}

function updateDownloadBadgeCount() {
    const count = getLocalData("user_saved_downloads").length;
    document.getElementById("dlNavBadge").textContent = count;
}

function openAdminPanel() {
    hideAllViews();
    document.getElementById("adminPanelView").classList.remove("hidden");
    renderAdminMaterialsList();
}

async function renderAdminMaterialsList() {
    const list = document.getElementById("adminMaterialList");
    list.innerHTML = "<li style='padding:10px; text-align:center;'>Loading from database...</li>";

    try {
        const snapshot = await db.collection("materials").get();
        list.innerHTML = "";

        if (snapshot.empty) {
            list.innerHTML = `<li style="padding:10px; text-align:center; color:#64748b;">No materials uploaded yet.</li>`;
            return;
        }

        snapshot.forEach(doc => {
            const item = doc.data();
            const docId = doc.id;
            const li = document.createElement("li");
            li.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:8px 12px; border-bottom:1px solid #e2e8f0; font-size:0.9rem;";
            li.innerHTML = `
                <span><b>${item.title}</b> (${item.subject} - ${item.category})</span>
                <button type="button" class="action-btn" style="background:#ef4444; color:white; padding:4px 8px; font-size:0.75rem;" onclick="deleteMaterial('${docId}')">Delete</button>
            `;
            list.appendChild(li);
        });
    } catch (error) {
        list.innerHTML = `<li style="padding:10px; text-align:center; color:red;">Error: ${error.message}</li>`;
    }
}

async function deleteMaterial(docId) {
    if (confirm("Are you sure you want to delete this material?")) {
        try {
            await db.collection("materials").doc(docId).delete();
            renderAdminMaterialsList();
            alert("Material deleted successfully from Firestore.");
        } catch (error) {
            alert("Delete failed: " + error.message);
        }
    }
}

function addActivityLog(actionText) {
    let logs = getLocalData("activity_logs");
    logs.unshift({ text: actionText, time: new Date().toLocaleTimeString() });
    if (logs.length > 20) logs.pop(); 
    setLocalData("activity_logs", logs);
    renderHistoryList();
}

function renderHistoryList() {
    const list = document.getElementById("historyList");
    const countEl = document.getElementById("downloadCount");
    const logs = getLocalData("activity_logs");

    countEl.textContent = logs.length;
    list.innerHTML = "";

    if (logs.length === 0) {
        list.innerHTML = `<li class="empty-msg">No activity recorded.</li>`;
        return;
    }

    logs.forEach(log => {
        const li = document.createElement("li");
        li.style.cssText = "padding:6px 0; border-bottom:1px dashed #f1f5f9; font-size:0.82rem;";
        li.innerHTML = `<div>${log.text}</div><div style="font-size:0.7rem; color:#94a3b8;">${log.time}</div>`;
        list.appendChild(li);
    });
}
