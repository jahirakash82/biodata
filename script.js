// নিরাপত্তা কনফিগারেশন
const SECURITY_CONFIG = {
    password: "jahirulislamakash00100",
    maxAttempts: 3,
    blockDuration: 5 * 60 * 1000, // 5 মিনিট
    sessionDuration: 24 * 60 * 60 * 1000 // 24 ঘন্টা
};

// ডেটা কনফিগারেশন
const DATA_CONFIG = {
    csvUrl: 'https://docs.google.com/spreadsheets/d/1r4wwNscRr_ynXBEwUI7z0mNk1thiBqXtrvDQMKJ3vrE/gviz/tq?tqx=out:csv&gid=1929296116',
    googleFormUrl: 'https://forms.gle/RM7uAESdi5Zm6uop6',
    itemsPerPage: 12,
    refreshInterval: 30000 // 30 সেকেন্ড
};

// গ্লোবাল ভেরিয়েবল
let biodataList = [];
let filteredData = [];
let currentPage = 1;
let isAuthenticated = false;
let failedAttempts = 0;
let isBlocked = false;

// DOM এলিমেন্ট
const elements = {
    passwordScreen: document.getElementById('passwordScreen'),
    mainContent: document.getElementById('mainContent'),
    passwordForm: document.getElementById('passwordForm'),
    passwordInput: document.getElementById('passwordInput'),
    togglePassword: document.getElementById('togglePassword'),
    errorMessage: document.getElementById('errorMessage'),
    errorText: document.getElementById('errorText'),
    attemptCount: document.getElementById('attemptCount'),
    searchInput: document.getElementById('searchInput'),
    refreshBtn: document.getElementById('refreshBtn'),
    addNewBtn: document.getElementById('addNewBtn'),
    totalCount: document.getElementById('totalCount'),
    lastUpdated: document.getElementById('lastUpdated'),
    birthdayBtn: document.getElementById('birthdayBtn'),
    birthdayBadge: document.getElementById('birthdayBadge'),
    birthdayCount: document.getElementById('birthdayCount'),
    birthdayNotification: document.getElementById('birthdayNotification'),
    loadingSpinner: document.getElementById('loadingSpinner'),
    gridContainer: document.getElementById('gridContainer'),
    noResults: document.getElementById('noResults'),
    pagination: document.getElementById('pagination'),
    prevPage: document.getElementById('prevPage'),
    nextPage: document.getElementById('nextPage'),
    pageInfo: document.getElementById('pageInfo'),
    detailsModal: document.getElementById('detailsModal'),
    modalBody: document.getElementById('modalBody'),
    closeDetailsModal: document.getElementById('closeDetailsModal'),
    birthdayModal: document.getElementById('birthdayModal'),
    birthdayModalBody: document.getElementById('birthdayModalBody'),
    closeBirthdayModal: document.getElementById('closeBirthdayModal')
};

// ইনিশিয়ালাইজেশন
document.addEventListener('DOMContentLoaded', function() {
    initializeSecurity();
    setupEventListeners();
    checkAuthentication();
});

// নিরাপত্তা ইনিশিয়ালাইজেশন
function initializeSecurity() {
    // ডেভেলপার টুলস ব্লক
    blockDevTools();
    
    // রাইট ক্লিক ব্লক
    document.addEventListener('contextmenu', e => e.preventDefault());
    
    // কীবোর্ড শর্টকাট ব্লক
    document.addEventListener('keydown', function(e) {
        // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U ব্লক
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
            (e.ctrlKey && e.key === 'u')) {
            e.preventDefault();
            return false;
        }
    });
}

// ডেভেলপার টুলস ব্লক
function blockDevTools() {
    let devtools = {
        open: false,
        orientation: null
    };
    
    const threshold = 160;
    
    setInterval(() => {
        if (window.outerHeight - window.innerHeight > threshold || 
            window.outerWidth - window.innerWidth > threshold) {
            if (!devtools.open) {
                devtools.open = true;
                // ডেভেলপার টুলস খোলা হলে পেজ রিডাইরেক্ট বা ব্লক
                document.body.innerHTML = `
                    <div style="
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: #2c3e50;
                        color: white;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-family: Arial, sans-serif;
                        font-size: 24px;
                        text-align: center;
                        z-index: 99999;
                    ">
                        <div>
                            <i class="fas fa-shield-alt" style="font-size: 64px; margin-bottom: 20px; color: #e74c3c;"></i>
                            <h2>নিরাপত্তা সতর্কতা!</h2>
                            <p>অননুমোদিত অ্যাক্সেস সনাক্ত হয়েছে</p>
                            <p style="font-size: 16px; margin-top: 20px;">পেজ রিলোড করুন</p>
                        </div>
                    </div>
                `;
            }
        } else {
            devtools.open = false;
        }
    }, 500);
}

// ইভেন্ট লিসেনার সেটআপ
function setupEventListeners() {
    // পাসওয়ার্ড ফর্ম
    elements.passwordForm.addEventListener('submit', handlePasswordSubmit);
    elements.togglePassword.addEventListener('click', togglePasswordVisibility);
    
    // সার্চ
    elements.searchInput.addEventListener('input', handleSearch);
    
    // বাটন
    elements.refreshBtn.addEventListener('click', refreshData);
    elements.addNewBtn.addEventListener('click', () => window.open(DATA_CONFIG.googleFormUrl, '_blank'));
    elements.birthdayBtn.addEventListener('click', showBirthdayModal);
    elements.birthdayNotification.addEventListener('click', showBirthdayModal);
    
    // পেজিনেশন
    elements.prevPage.addEventListener('click', () => changePage(-1));
    elements.nextPage.addEventListener('click', () => changePage(1));
    
    // মডাল
    elements.closeDetailsModal.addEventListener('click', () => hideModal('detailsModal'));
    elements.closeBirthdayModal.addEventListener('click', () => hideModal('birthdayModal'));
    
    // মডাল বাইরে ক্লিক করলে বন্ধ
    elements.detailsModal.addEventListener('click', (e) => {
        if (e.target === elements.detailsModal) hideModal('detailsModal');
    });
    elements.birthdayModal.addEventListener('click', (e) => {
        if (e.target === elements.birthdayModal) hideModal('birthdayModal');
    });
}

// অথেনটিকেশন চেক
function checkAuthentication() {
    const authData = localStorage.getItem('biodata_auth');
    if (authData) {
        const { timestamp, authenticated } = JSON.parse(authData);
        const timePassed = Date.now() - timestamp;
        
        if (authenticated && timePassed < SECURITY_CONFIG.sessionDuration) {
            authenticateUser();
            return;
        }
    }
    
    // ব্লক স্ট্যাটাস চেক
    checkBlockStatus();
}

// ব্লক স্ট্যাটাস চেক
function checkBlockStatus() {
    const blockData = localStorage.getItem('biodata_block');
    if (blockData) {
        const { timestamp, attempts } = JSON.parse(blockData);
        const timePassed = Date.now() - timestamp;
        
        if (timePassed < SECURITY_CONFIG.blockDuration) {
            isBlocked = true;
            failedAttempts = attempts;
            updateAttemptsDisplay();
            showBlockMessage(Math.ceil((SECURITY_CONFIG.blockDuration - timePassed) / 1000));
        } else {
            localStorage.removeItem('biodata_block');
        }
    }
}

// পাসওয়ার্ড সাবমিট হ্যান্ডল
function handlePasswordSubmit(e) {
    e.preventDefault();
    
    if (isBlocked) {
        showError('আপনি ব্লক করা আছেন। অপেক্ষা করুন।');
        return;
    }
    
    const password = elements.passwordInput.value.trim();
    
    if (password === SECURITY_CONFIG.password) {
        // সফল লগইন
        authenticateUser();
        localStorage.setItem('biodata_auth', JSON.stringify({
            timestamp: Date.now(),
            authenticated: true
        }));
        localStorage.removeItem('biodata_block');
    } else {
        // ভুল পাসওয়ার্ড
        failedAttempts++;
        updateAttemptsDisplay();
        
        if (failedAttempts >= SECURITY_CONFIG.maxAttempts) {
            blockUser();
        } else {
            showError(`ভুল পাসওয়ার্ড! (${failedAttempts}/${SECURITY_CONFIG.maxAttempts} চেষ্টা)`);
        }
        
        elements.passwordInput.value = '';
    }
}

// ইউজার অথেনটিকেট
function authenticateUser() {
    isAuthenticated = true;
    elements.passwordScreen.style.display = 'none';
    elements.mainContent.style.display = 'block';
    loadData();
}

// ইউজার ব্লক
function blockUser() {
    isBlocked = true;
    localStorage.setItem('biodata_block', JSON.stringify({
        timestamp: Date.now(),
        attempts: failedAttempts
    }));
    
    showBlockMessage(SECURITY_CONFIG.blockDuration / 1000);
}

// ব্লক মেসেজ দেখান
function showBlockMessage(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    showError(`অতিরিক্ত ভুল চেষ্টার কারণে ${minutes}:${remainingSeconds.toString().padStart(2, '0')} মিনিটের জন্য ব্লক করা হয়েছে`);
    
    if (seconds > 0) {
        setTimeout(() => showBlockMessage(seconds - 1), 1000);
    } else {
        isBlocked = false;
        failedAttempts = 0;
        localStorage.removeItem('biodata_block');
        hideError();
        updateAttemptsDisplay();
    }
}

// চেষ্টার সংখ্যা আপডেট
function updateAttemptsDisplay() {
    elements.attemptCount.textContent = failedAttempts;
    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        if (index < failedAttempts) {
            dot.classList.add('failed');
        } else {
            dot.classList.remove('failed');
        }
    });
}

// পাসওয়ার্ড দৃশ্যমানতা টগল
function togglePasswordVisibility() {
    const type = elements.passwordInput.type === 'password' ? 'text' : 'password';
    elements.passwordInput.type = type;
    
    const icon = elements.togglePassword.querySelector('i');
    icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
}

// এরর দেখান
function showError(message) {
    elements.errorText.textContent = message;
    elements.errorMessage.style.display = 'flex';
}

// এরর লুকান
function hideError() {
    elements.errorMessage.style.display = 'none';
}

// ডেটা লোড
async function loadData() {
    try {
        showLoading(true);
        
        const response = await fetch(DATA_CONFIG.csvUrl, { 
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const csvText = await response.text();
        
        Papa.parse(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                processBiodataData(results.data);
                showLoading(false);
            },
            error: function(error) {
                console.error('CSV parsing error:', error);
                showError('ডেটা প্রক্রিয়াকরণে সমস্যা হয়েছে');
                showLoading(false);
            }
        });
        
    } catch (error) {
        console.error('Data loading error:', error);
        showError('ডেটা লোড করতে সমস্যা হয়েছে');
        showLoading(false);
    }
}

// বায়োডাটা ডেটা প্রক্রিয়াকরণ
function processBiodataData(rawData) {
    biodataList = rawData.map(row => ({
        name: cleanText(row['নাম']),
        image: cleanText(row['ছবি']),
        phone: cleanText(row['ফোন নাম্বার']),
        email: cleanText(row['gmail']),
        birthdate: formatDate(cleanText(row['Birthdate'])),
        bloodGroup: cleanText(row['Blood Group']),
        division: cleanText(row['বিভাগ']),
        thana: cleanText(row['থানা']),
        village: cleanText(row['গ্রাম']),
        other: cleanText(row['Other'])
    })).filter(person => person.name && person.name !== 'N/A');
    
    filteredData = [...biodataList];
    updateDisplay();
    updateBirthdayNotification();
    updateLastUpdated();
}

// টেক্সট পরিষ্কার
function cleanText(text) {
    if (!text || text.toString().toLowerCase() === 'nan' || text.toString().trim() === '') {
        return 'N/A';
    }
    return text.toString().trim();
}

// তারিখ ফরম্যাট
function formatDate(dateString) {
    if (!dateString || dateString === 'N/A') return 'N/A';
    
    const cleanedDate = dateString.replace(/[\.\/]/g, '-');
    const parts = cleanedDate.split('-');
    
    if (parts.length === 3) {
        let day = parts[0].padStart(2, '0');
        let month = parts[1].padStart(2, '0');
        const year = parts[2];
        
        // মাস ১২ এর বেশি হলে দিন এবং মাস অদলবদল
        if (parseInt(month) > 12) {
            [day, month] = [month, day];
        }
        
        return `${day}-${month}-${year}`;
    }
    
    return 'N/A';
}

// ইমেজ URL প্রক্রিয়াকরণ
function processImageUrl(url) {
    if (!url || url === 'N/A') {
        return 'https://via.placeholder.com/300x400.png?text=No+Image';
    }
    
    // Google Drive লিংক প্রক্রিয়াকরণ
    const driveMatch = url.match(/\/d\/([^\/]+)/) || url.match(/id=([^&]+)/);
    if (driveMatch) {
        return `https://drive.google.com/thumbnail?sz=w400&id=${driveMatch[1]}`;
    }
    
    return url;
}

// ডিসপ্লে আপডেট
function updateDisplay() {
    renderGrid();
    updateStats();
    updatePagination();
}

// গ্রিড রেন্ডার
function renderGrid() {
    const startIndex = (currentPage - 1) * DATA_CONFIG.itemsPerPage;
    const endIndex = startIndex + DATA_CONFIG.itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);
    
    if (pageData.length === 0) {
        elements.gridContainer.style.display = 'none';
        elements.noResults.style.display = 'block';
        elements.pagination.style.display = 'none';
        return;
    }
    
    elements.gridContainer.style.display = 'grid';
    elements.noResults.style.display = 'none';
    elements.pagination.style.display = 'flex';
    
    elements.gridContainer.innerHTML = pageData.map(person => createPersonCard(person)).join('');
    
    // কার্ড ক্লিক ইভেন্ট
    elements.gridContainer.querySelectorAll('.person-card').forEach((card, index) => {
        card.addEventListener('click', () => showPersonDetails(pageData[index]));
    });
}

// ব্যক্তির কার্ড তৈরি
function createPersonCard(person) {
    return `
        <div class="person-card">
            <img src="${processImageUrl(person.image)}" alt="${person.name}" class="card-image" 
                 onerror="this.src='https://via.placeholder.com/300x400.png?text=No+Image'">
            <div class="card-content">
                <h3 class="card-name">${person.name}</h3>
                <div class="card-info">
                    ${person.phone !== 'N/A' ? `
                        <div class="info-item">
                            <i class="fas fa-phone"></i>
                            <span>${person.phone}</span>
                        </div>
                    ` : ''}
                    ${person.bloodGroup !== 'N/A' ? `
                        <div class="info-item">
                            <i class="fas fa-tint"></i>
                            <span>${person.bloodGroup}</span>
                        </div>
                    ` : ''}
                    ${person.division !== 'N/A' ? `
                        <div class="info-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${person.division}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// ব্যক্তির বিস্তারিত দেখান
function showPersonDetails(person) {
    const detailsHtml = `
        <div class="person-details">
            <div class="person-image">
                <img src="${processImageUrl(person.image)}" alt="${person.name}"
                     onerror="this.src='https://via.placeholder.com/300x400.png?text=No+Image'">
            </div>
            <div class="person-info">
                ${createDetailItem('fas fa-user', '#3498db', 'নাম', person.name)}
                ${person.phone !== 'N/A' ? createDetailItem('fas fa-phone', '#27ae60', 'ফোন', `<a href="tel:${person.phone}">${person.phone}</a>`) : ''}
                ${person.email !== 'N/A' ? createDetailItem('fas fa-envelope', '#e74c3c', 'ইমেইল', `<a href="mailto:${person.email}">${person.email}</a>`) : ''}
                ${person.birthdate !== 'N/A' ? createDetailItem('fas fa-birthday-cake', '#f39c12', 'জন্ম তারিখ', person.birthdate) : ''}
                ${person.bloodGroup !== 'N/A' ? createDetailItem('fas fa-tint', '#e74c3c', 'রক্তের গ্রুপ', person.bloodGroup) : ''}
                ${person.division !== 'N/A' ? createDetailItem('fas fa-map-marker-alt', '#9b59b6', 'বিভাগ', person.division) : ''}
                ${person.thana !== 'N/A' ? createDetailItem('fas fa-building', '#34495e', 'থানা', person.thana) : ''}
                ${person.village !== 'N/A' ? createDetailItem('fas fa-home', '#16a085', 'গ্রাম', person.village) : ''}
                ${person.other !== 'N/A' ? createDetailItem('fas fa-info-circle', '#95a5a6', 'অন্যান্য', person.other) : ''}
            </div>
        </div>
    `;
    
    elements.modalBody.innerHTML = detailsHtml;
    showModal('detailsModal');
}

// বিস্তারিত আইটেম তৈরি
function createDetailItem(icon, color, label, value) {
    return `
        <div class="detail-item">
            <div class="detail-icon" style="background: ${color}">
                <i class="${icon}"></i>
            </div>
            <div class="detail-content">
                <div class="detail-label">${label}</div>
                <div class="detail-value">${value}</div>
            </div>
        </div>
    `;
}

// স্ট্যাটস আপডেট
function updateStats() {
    elements.totalCount.textContent = filteredData.length;
}

// পেজিনেশন আপডেট
function updatePagination() {
    const totalPages = Math.ceil(filteredData.length / DATA_CONFIG.itemsPerPage);
    
    elements.pageInfo.textContent = `পৃষ্ঠা ${currentPage} / ${totalPages}`;
    elements.prevPage.disabled = currentPage === 1;
    elements.nextPage.disabled = currentPage === totalPages;
}

// পেজ পরিবর্তন
function changePage(direction) {
    const totalPages = Math.ceil(filteredData.length / DATA_CONFIG.itemsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        updateDisplay();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// সার্চ হ্যান্ডল
function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    
    if (query === '') {
        filteredData = [...biodataList];
    } else {
        filteredData = biodataList.filter(person => 
            person.name.toLowerCase().includes(query) ||
            person.phone.toLowerCase().includes(query) ||
            person.email.toLowerCase().includes(query) ||
            person.bloodGroup.toLowerCase().includes(query) ||
            person.division.toLowerCase().includes(query) ||
            person.thana.toLowerCase().includes(query) ||
            person.village.toLowerCase().includes(query)
        );
    }
    
    currentPage = 1;
    updateDisplay();
}

// জন্মদিনের নোটিফিকেশন আপডেট
function updateBirthdayNotification() {
    const upcomingBirthdays = getUpcomingBirthdays();
    const count = upcomingBirthdays.length;
    
    elements.birthdayCount.textContent = count;
    elements.birthdayBadge.textContent = count;
    
    if (count > 0) {
        elements.birthdayNotification.style.display = 'flex';
    } else {
        elements.birthdayNotification.style.display = 'none';
    }
}

// আগামী জন্মদিন পান
function getUpcomingBirthdays() {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    return biodataList.filter(person => {
        if (person.birthdate === 'N/A') return false;
        
        const [day, month] = person.birthdate.split('-');
        const birthDate = new Date(today.getFullYear(), parseInt(month) - 1, parseInt(day));
        
        if (birthDate < today) {
            birthDate.setFullYear(today.getFullYear() + 1);
        }
        
        return birthDate >= today && birthDate <= nextWeek;
    });
}

// জন্মদিনের মডাল দেখান
function showBirthdayModal() {
    const upcomingBirthdays = getUpcomingBirthdays();
    
    if (upcomingBirthdays.length === 0) {
        elements.birthdayModalBody.innerHTML = `
            <div class="no-birthdays">
                <i class="fas fa-calendar-times"></i>
                <h3>আগামী ৭ দিনে কোনো জন্মদিন নেই</h3>
                <p>পরে আবার চেক করুন</p>
            </div>
        `;
    } else {
        const birthdayHtml = `
            <div class="birthday-list">
                ${upcomingBirthdays.map(person => `
                    <div class="birthday-item">
                        <div class="birthday-icon">
                            <i class="fas fa-birthday-cake"></i>
                        </div>
                        <div class="birthday-info">
                            <h4>${person.name}</h4>
                            <p><i class="fas fa-calendar-alt"></i> ${person.birthdate}</p>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        elements.birthdayModalBody.innerHTML = birthdayHtml;
    }
    
    showModal('birthdayModal');
}

// শেষ আপডেট সময় আপডেট
function updateLastUpdated() {
    const now = new Date();
    const timeString = now.toLocaleString('bn-BD', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    elements.lastUpdated.textContent = timeString;
}

// ডেটা রিফ্রেশ
function refreshData() {
    elements.refreshBtn.querySelector('i').style.animation = 'spin 1s linear infinite';
    loadData().finally(() => {
        elements.refreshBtn.querySelector('i').style.animation = '';
    });
}

// লোডিং দেখান/লুকান
function showLoading(show) {
    elements.loadingSpinner.style.display = show ? 'block' : 'none';
    elements.gridContainer.style.display = show ? 'none' : 'grid';
}

// মডাল দেখান
function showModal(modalId) {
    elements[modalId].style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// মডাল লুকান
function hideModal(modalId) {
    elements[modalId].style.display = 'none';
    document.body.style.overflow = 'auto';
}

// অটো রিফ্রেশ
setInterval(() => {
    if (isAuthenticated) {
        loadData();
    }
}, DATA_CONFIG.refreshInterval);