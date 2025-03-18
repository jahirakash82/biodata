// Password Configuration
const PASSWORD = "jahirulislamakash00100"; // Fixed password
const passwordPrompt = document.getElementById('passwordPrompt');
const passwordInput = document.getElementById('passwordInput');
const errorMessage = document.getElementById('errorMessage');

// Show password prompt on page load
window.onload = function () {
    passwordPrompt.style.display = 'flex';
    handleBackButton();
};

// Function to check password
function checkPassword() {
    if (passwordInput.value === PASSWORD) {
        passwordPrompt.style.display = 'none';
        document.body.style.display = 'block';
    } else {
        errorMessage.style.display = 'block';
        passwordInput.value = '';
    }
}

// Enter key press event for password input
passwordInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        checkPassword();
    }
});

// Prevent right-click and other shortcuts
document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
});

document.addEventListener('keydown', function (e) {
    if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
    }
});

// Configuration Constants
const CSV_URL = 'https://docs.google.com/spreadsheets/d/1r4wwNscRr_ynXBEwUI7z0mNk1thiBqXtrvDQMKJ3vrE/gviz/tq?tqx=out:csv&gid=1929296116';
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/200x300.png?text=No+Image';
const REFRESH_DELAY = 10000; // 10 seconds

// DOM Elements
const gridContainer = document.getElementById('gridContainer');
const detailsModal = document.getElementById('detailsModal');
const modalContent = document.getElementById('modalContent');
const searchInput = document.getElementById('searchInput');
const totalCount = document.getElementById('totalCount');
const lastUpdated = document.getElementById('lastUpdated');
const refreshBtn = document.getElementById('refreshBtn');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');
const birthdayNotification = document.getElementById('birthdayNotification');
const birthdayCount = document.getElementById('birthdayCount');

// State Management
let biodata = [];
let filteredData = [];
let currentUser = null;
let currentPage = 1;
const itemsPerPage = 10;

// Image Processing
function processDriveLink(link) {
    try {
        if (!link || typeof link !== 'string' || link.trim() === '' || link.toLowerCase() === 'nan') {
            return PLACEHOLDER_IMAGE;
        }
        const match = link.match(/\/d\/([^\/]+)/) || link.match(/id=([^&]+)/) || link.match(/([-\w]{25,})/);
        return match ? `https://drive.google.com/thumbnail?sz=w1000&id=${match[1]}` : PLACEHOLDER_IMAGE;
    } catch (error) {
        console.error('Error processing image link:', error);
        return PLACEHOLDER_IMAGE;
    }
}

function handleImageError(img) {
    if (!img.src.includes(PLACEHOLDER_IMAGE)) {
        img.src = PLACEHOLDER_IMAGE;
    }
    img.onerror = null;
}

// Data Mapping and Formatting
function mapColumns(row) {
    return {
        Name: row['নাম']?.trim() || 'N/A',
        Image: row['ছবি']?.trim(),
        Phone: row['ফোন নাম্বার']?.trim(),
        Gmail: row['gmail']?.trim(),
        Birthdate: formatDate(row['Birthdate']?.trim()),
        BloodGroup: row['Blood Group']?.trim() || 'N/A',
        Division: row['বিভাগ']?.trim() || 'N/A',
        Thana: row['থানা']?.trim() || 'N/A',
        Village: row['গ্রাম']?.trim() || 'N/A',
        Other: row['Other']?.trim() || 'N/A'
    };
}

function cleanPhoneNumber(phone) {
    return phone?.replace(/[^\d+]/g, '').trim() || 'N/A';
}

function formatDate(dateString) {
    if (!dateString || dateString.toLowerCase() === 'nan') return 'N/A';
    
    const cleanedDate = dateString.replace(/[\.\/]/g, '-');
    const parts = cleanedDate.split('-');
    
    if (parts.length === 3) {
        let day = parts[0].padStart(2, '0');
        let month = parts[1].padStart(2, '0');
        const year = parts[2];
        
        const monthNum = parseInt(month);
        const dayNum = parseInt(day);
        if (monthNum > 12) {
            month = day.padStart(2, '0');
            day = monthNum.toString().padStart(2, '0');
        }
        
        return `${day}-${month}-${year}`;
    }
    return 'N/A';
}

// Card Creation
function createCard(person, index) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    const img = document.createElement('img');
    img.src = processDriveLink(person.Image);
    img.alt = person.Name;
    img.loading = 'lazy';
    img.onerror = () => handleImageError(img);
    
    const name = document.createElement('h3');
    name.textContent = person.Name;
    
    card.appendChild(img);
    card.appendChild(name);
    card.addEventListener('click', () => showModal(person));
    return card;
}

// Grid Rendering
function renderGrid(data = filteredData) {
    gridContainer.innerHTML = '';
    if (data.length === 0) {
        gridContainer.innerHTML = '<p class="info">কোনো তথ্য পাওয়া যায়নি</p>';
        return;
    }
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedData = data.slice(start, end);
    
    paginatedData.forEach((person, index) => {
        if (person.Name !== 'N/A') {
            gridContainer.appendChild(createCard(person, index));
        }
    });
    totalCount.textContent = `মোট ডাটা: ${data.length}`;
    pageInfo.textContent = `পৃষ্ঠা ${currentPage}`;
}

// Modal Handling
function showModal(person) {
    currentUser = person;
    modalContent.innerHTML = '';
    
    const img = document.createElement('img');
    img.src = processDriveLink(person.Image);
    img.alt = person.Name;
    img.loading = 'lazy';
    img.onerror = () => handleImageError(img);
    
    const details = document.createElement('div');
    details.className = 'modal-details';
    details.innerHTML = `
        <p><strong>নাম:</strong> ${person.Name}</p>
        ${person.Phone !== 'N/A' ? `<p><strong>ফোন:</strong> <a class="phone-link" href="tel:${cleanPhoneNumber(person.Phone)}"><i class="fas fa-phone"></i> ${cleanPhoneNumber(person.Phone)}</a></p>` : ''}
        ${person.Gmail ? `<p><strong>জিমেইল:</strong> ${person.Gmail}</p>` : ''}
        ${person.Birthdate !== 'N/A' ? `<p><strong>জন্ম তারিখ:</strong> ${person.Birthdate}</p>` : ''}
        ${person.BloodGroup !== 'N/A' ? `<p><strong>রক্তের গ্রুপ:</strong> ${person.BloodGroup}</p>` : ''}
        ${person.Division !== 'N/A' ? `<p><strong>বিভাগ:</strong> ${person.Division}</p>` : ''}
        ${person.Thana !== 'N/A' ? `<p><strong>থানা:</strong> ${person.Thana}</p>` : ''}
        ${person.Village !== 'N/A' ? `<p><strong>গ্রাম:</strong> ${person.Village}</p>` : ''}
        ${person.Other !== 'N/A' ? `<p><strong>অন্যান্য তথ্য:</strong> ${person.Other}</p>` : ''}
    `;
    
    modalContent.appendChild(img);
    modalContent.appendChild(details);
    detailsModal.style.display = 'block';
}

// Data Fetching
async function fetchData() {
    try {
        showLoader();
        const response = await fetch(CSV_URL, { cache: 'no-store' });
        if (!response.ok) throw new Error('Network response was not ok');
        
        const csv = await response.text();
        
        Papa.parse(csv, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                biodata = results.data.map(mapColumns).filter(p => p.Name !== 'N/A');
                filteredData = [...biodata];
                renderGrid();
                updateLastUpdated();
                hideLoader();
                localStorage.setItem('biodata', JSON.stringify(biodata));
                updateBirthdayNotification(biodata);
            },
            error: (error) => {
                console.error('CSV parsing error:', error);
                showError('ডেটা প্রক্রিয়াকরণে সমস্যা হয়েছে');
            }
        });
    } catch (error) {
        console.error('Fetch error:', error);
        showError('ডেটা লোড করতে ব্যর্থ হয়েছে');
    }
}

// UI Feedback
function showLoader() {
    gridContainer.innerHTML = '<div class="loader"></div>';
}

function hideLoader() {
    const loader = gridContainer.querySelector('.loader');
    if (loader) loader.remove();
}

function showError(message) {
    gridContainer.innerHTML = `<p class="error">${message} <button onclick="fetchData()">পুনরায় চেষ্টা করুন</button></p>`;
    hideLoader();
}

function updateLastUpdated() {
    lastUpdated.textContent = `সর্বশেষ আপডেট: ${new Date().toLocaleString('bn-BD')}`;
}

// Search Functionality
function filterData(query) {
    filteredData = biodata.filter(person => 
        person.Name.toLowerCase().includes(query.toLowerCase()) ||
        person.Phone?.toLowerCase().includes(query.toLowerCase()) ||
        person.Gmail?.toLowerCase().includes(query.toLowerCase()) ||
        person.Birthdate?.toLowerCase().includes(query.toLowerCase()) ||
        person.BloodGroup?.toLowerCase().includes(query.toLowerCase()) ||
        person.Division?.toLowerCase().includes(query.toLowerCase()) ||
        person.Thana?.toLowerCase().includes(query.toLowerCase()) ||
        person.Village?.toLowerCase().includes(query.toLowerCase()) ||
        person.Other?.toLowerCase().includes(query.toLowerCase())
    );
    currentPage = 1;
    renderGrid();
}

// Pagination
function goToPrevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderGrid();
    }
}

function goToNextPage() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderGrid();
    }
}

// Theme Management
function changeTheme(theme) {
    document.body.className = theme;
    localStorage.setItem('selectedTheme', theme);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('selectedTheme') || 'default-theme';
    document.body.className = savedTheme;
}

// Event Listeners
function setupEventListeners() {
    document.querySelectorAll('.close').forEach(btn => {
        btn.addEventListener('click', () => {
            detailsModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === detailsModal) {
            detailsModal.style.display = 'none';
        }
    });

    searchInput.addEventListener('input', (e) => {
        filterData(e.target.value);
    });

    refreshBtn.addEventListener('click', fetchData);

    prevPageBtn.addEventListener('click', goToPrevPage);
    nextPageBtn.addEventListener('click', goToNextPage);
}

function getUpcomingBirthdays(data) {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    return data.filter(person => {
        if (person.Birthdate === 'N/A') return false;

        const [day, month, year] = person.Birthdate.split('-');
        const birthDate = new Date(today.getFullYear(), month - 1, day);

        birthDate.setFullYear(today.getFullYear());

        if (birthDate < today) {
            birthDate.setFullYear(today.getFullYear() + 1);
        }

        return birthDate >= today && birthDate <= nextWeek;
    });
}

function updateBirthdayNotification(data) {
    const upcomingBirthdays = getUpcomingBirthdays(data);
    birthdayCount.textContent = upcomingBirthdays.length;

    const birthdayModalContent = document.getElementById('birthdayModalContent');
    birthdayModalContent.innerHTML = upcomingBirthdays.map(person => `
        <div class="birthday-entry">
            <p><strong>নাম:</strong> ${person.Name}</p>
            <p><strong>জন্ম তারিখ:</strong> ${person.Birthdate}</p>
        </div>
    `).join('');

    birthdayNotification.addEventListener('click', () => {
        document.getElementById('birthdayModal').style.display = 'block';
        createFloatingElements(); // মডাল ওপেন হলে বেলুন এবং আইকন ভেসে উঠবে
    }, { once: true }); // একবারই ইভেন্ট লিসেনার যোগ হবে
}

// র‍্যান্ডম কালার জেনারেট করার ফাংশন
function getRandomColor() {
    const colors = ['#ff6f61', '#6bff61', '#61bfff', '#ff61bf', '#ffcc61', '#61ffcc'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function createFloatingElements() {
    const modalContent = document.getElementById('birthdayModalContent');
    
    // প্রতি ১ সেকেন্ডে বেলুন এবং আইকন তৈরি
    setInterval(() => {
        if (document.getElementById('birthdayModal').style.display === 'block') {
            const elementType = Math.random() > 0.5 ? 'balloon' : 'birthday-icon';
            const element = document.createElement('div');
            element.className = elementType;
            
            if (elementType === 'balloon') {
                element.style.backgroundColor = getRandomColor();
                element.style.setProperty('--string-color', getRandomColor());
            } else {
                const emojis = ['🎈', '🎁', '🎂', '🎉'];
                element.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            }
            
            element.style.left = `${Math.random() * (modalContent.offsetWidth - 50)}px`;
            element.style.bottom = '0';
            modalContent.appendChild(element);

            setTimeout(() => {
                element.remove();
            }, 6000);
        }
    }, 1000);

    // ক্লিক বা টাচে বেলুন এবং আইকন তৈরি
    modalContent.addEventListener('click', (e) => {
        const elementType = Math.random() > 0.5 ? 'balloon' : 'birthday-icon';
        const element = document.createElement('div');
        element.className = elementType;
        
        if (elementType === 'balloon') {
            element.style.backgroundColor = getRandomColor();
            element.style.setProperty('--string-color', getRandomColor());
        } else {
            const emojis = ['🎈', '🎁', '🎂', '🎉'];
            element.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        }
        
        element.style.left = `${e.clientX - modalContent.getBoundingClientRect().left - 25}px`;
        element.style.top = `${e.clientY - modalContent.getBoundingClientRect().top - 35}px`;
        modalContent.appendChild(element);

        setTimeout(() => {
            element.remove();
        }, 6000);
    });
}

function closeBirthdayModal() {
    document.getElementById('birthdayModal').style.display = 'none';
}

function handleBackButton() {
    window.history.pushState({ page: "home" }, "", window.location.href);
    window.addEventListener("popstate", function (event) {
        if (event.state && event.state.page === "home") {
            window.history.back();
        }
    });
}

setInterval(() => {
    if (biodata.length > 0) {
        updateBirthdayNotification(biodata);
    }
}, REFRESH_DELAY);

// Initialize
function init() {
    loadTheme();
    setupEventListeners();
    fetchData();
}

init();