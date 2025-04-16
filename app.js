// DOM Elements
const habitsContainer = document.getElementById('habits-container');
const addHabitBtn = document.getElementById('add-habit-btn');
const habitModal = document.getElementById('habit-form-modal');
const closeModalBtn = document.querySelector('.close');
const habitForm = document.getElementById('habit-form');
const habitNameInput = document.getElementById('habit-name');
const habitDescInput = document.getElementById('habit-description');
const cancelHabitBtn = document.getElementById('cancel-habit');
const currentDateEl = document.getElementById('current-date');
const navLinks = document.querySelectorAll('.sidebar-nav a');

// State
let habits = JSON.parse(localStorage.getItem('habits')) || [];
let currentEditIndex = null;
let currentView = 'daily'; // 'daily' or 'stats'

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateCurrentDate();
    renderView();
    
    // Add event listeners to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const view = this.getAttribute('href').substring(1) || 'daily';
            switchView(view);
        });
    });
});

// Event Listeners
addHabitBtn.addEventListener('click', () => openModal());
closeModalBtn.addEventListener('click', closeModal);
cancelHabitBtn.addEventListener('click', closeModal);
habitForm.addEventListener('submit', saveHabit);
window.addEventListener('click', (e) => {
    if (e.target === habitModal) {
        closeModal();
    }
});

// Functions
function switchView(view) {
    currentView = view;
    
    // Update active nav item
    navLinks.forEach(link => {
        const linkView = link.getAttribute('href').substring(1) || 'daily';
        if (linkView === view) {
            link.parentElement.classList.add('active');
        } else {
            link.parentElement.classList.remove('active');
        }
    });
    
    // Update UI based on view
    renderView();
    
    // Update buttons visibility
    if (view === 'daily') {
        addHabitBtn.style.display = 'flex';
    } else {
        addHabitBtn.style.display = 'none';
    }
}

function renderView() {
    if (currentView === 'daily') {
        renderHabits();
    } else if (currentView === 'stats') {
        renderStats();
    } else if (currentView === 'settings') {
        renderSettings();
    }
}

function updateCurrentDate() {
    const now = new Date();
    const options = { month: 'long', day: 'numeric' };
    currentDateEl.textContent = now.toLocaleDateString('en-US', options);
}

function renderHabits() {
    habitsContainer.innerHTML = '';
    
    if (habits.length === 0) {
        habitsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <h3>No habits yet</h3>
                <p>Start tracking your habits by creating a new one.</p>
            </div>
        `;
        return;
    }
    
    habits.forEach((habit, index) => {
        const habitCard = document.createElement('div');
        habitCard.classList.add('habit-card');
        habitCard.style.borderLeftColor = habit.color;
        
        const today = new Date();
        const lastWeek = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            lastWeek.push(formatDate(date));
        }
        
        // Calculate streak count
        const currentStreak = calculateCurrentStreak(habit.completedDates);
        
        const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        
        const streakDaysHTML = lastWeek.map((date, i) => {
            const completed = habit.completedDates.includes(date);
            return `
                <div class="streak-day ${completed ? 'completed' : ''}" 
                     style="${completed ? 'background-color: ' + habit.color : ''}"
                     data-date="${date}" 
                     data-habit-index="${index}">
                    ${dayNames[i]}
                </div>
            `;
        }).join('');
        
        habitCard.innerHTML = `
            <div class="habit-header">
                <h3 class="habit-name">${habit.name}</h3>
                <div class="habit-actions">
                    <button class="action-btn edit-btn" data-index="${index}" aria-label="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-index="${index}" aria-label="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <p class="habit-description">${habit.description || 'No description'}</p>
            <div class="habit-streak">
                <span class="streak-label">Last 7 days</span>
                <div class="streak-days">
                    ${streakDaysHTML}
                </div>
                <div class="streak-info">
                    <span>Current streak</span>
                    <span class="streak-count">${currentStreak} days</span>
                </div>
            </div>
        `;
        
        habitsContainer.appendChild(habitCard);
    });
    
    // Add event listeners to streak days
    document.querySelectorAll('.streak-day').forEach(day => {
        day.addEventListener('click', toggleStreak);
    });
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            openModal(index);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const index = parseInt(btn.dataset.index);
            deleteHabit(index);
        });
    });
}

function renderStats() {
    if (habits.length === 0) {
        habitsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-bar"></i>
                <h3>No stats available</h3>
                <p>Add some habits and track them to see statistics.</p>
            </div>
        `;
        return;
    }
    
    // Calculate overall completion rate for the last 30 days
    const today = new Date();
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        last30Days.push(formatDate(date));
    }
    
    let totalPossibleCompletions = habits.length * 30;
    let totalCompletions = 0;
    
    // Calculate stats for each habit
    const habitStats = habits.map(habit => {
        let completedInLast30 = 0;
        
        last30Days.forEach(date => {
            if (habit.completedDates.includes(date)) {
                completedInLast30++;
                totalCompletions++;
            }
        });
        
        const completionRate = totalPossibleCompletions > 0 
            ? (completedInLast30 / 30) * 100 
            : 0;
            
        const currentStreak = calculateCurrentStreak(habit.completedDates);
        const longestStreak = calculateLongestStreak(habit.completedDates);
        
        return {
            name: habit.name,
            color: habit.color,
            completionRate,
            currentStreak,
            longestStreak,
            completedInLast30
        };
    });
    
    const overallCompletionRate = totalPossibleCompletions > 0 
        ? (totalCompletions / totalPossibleCompletions) * 100 
        : 0;
    
    // Sort habits by completion rate (highest first)
    habitStats.sort((a, b) => b.completionRate - a.completionRate);
    
    // Render stats HTML
    habitsContainer.innerHTML = `
        <div class="stats-container">
            <div class="stats-header">
                <h3>Your Stats</h3>
                <p>Last 30 days performance</p>
            </div>
            
            <div class="stats-overview">
                <div class="stat-card">
                    <div class="stat-value">${Math.round(overallCompletionRate)}%</div>
                    <div class="stat-label">Overall Completion</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${totalCompletions}</div>
                    <div class="stat-label">Total Check-ins</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${habits.length}</div>
                    <div class="stat-label">Active Habits</div>
                </div>
            </div>
            
            <h3 class="section-title">Habits Performance</h3>
            
            <div class="habit-stats-list">
                ${habitStats.map(stat => `
                    <div class="habit-stat-item">
                        <div class="habit-stat-header">
                            <div class="habit-color-indicator" style="background-color: ${stat.color}"></div>
                            <h4>${stat.name}</h4>
                            <div class="completion-rate">${Math.round(stat.completionRate)}%</div>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${stat.completionRate}%; background-color: ${stat.color}"></div>
                        </div>
                        <div class="habit-stat-details">
                            <div class="stat-detail">
                                <span class="detail-label">Current streak</span>
                                <span class="detail-value">${stat.currentStreak} days</span>
                            </div>
                            <div class="stat-detail">
                                <span class="detail-label">Longest streak</span>
                                <span class="detail-value">${stat.longestStreak} days</span>
                            </div>
                            <div class="stat-detail">
                                <span class="detail-label">Completed</span>
                                <span class="detail-value">${stat.completedInLast30}/${30} days</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderSettings() {
    habitsContainer.innerHTML = `
        <div class="settings-container">
            <h3>Settings</h3>
            <p>App settings will be available soon.</p>
        </div>
    `;
}

function openModal(editIndex = null) {
    habitModal.style.display = 'block';
    
    if (editIndex !== null) {
        // Editing existing habit
        const habit = habits[editIndex];
        habitNameInput.value = habit.name;
        habitDescInput.value = habit.description || '';
        
        // Set the color radio button
        document.querySelectorAll('input[name="habit-color"]').forEach(radio => {
            if (radio.value === habit.color) {
                radio.checked = true;
            }
        });
        
        currentEditIndex = editIndex;
        document.querySelector('.modal-header h2').textContent = 'Edit Habit';
    } else {
        // Adding new habit
        habitForm.reset();
        document.querySelector('input[name="habit-color"][value="#4caf50"]').checked = true;
        currentEditIndex = null;
        document.querySelector('.modal-header h2').textContent = 'New Habit';
    }
}

function closeModal() {
    habitModal.style.display = 'none';
    habitForm.reset();
    currentEditIndex = null;
}

function saveHabit(e) {
    e.preventDefault();
    
    const name = habitNameInput.value.trim();
    const description = habitDescInput.value.trim();
    const color = document.querySelector('input[name="habit-color"]:checked').value;
    
    if (name === '') return;
    
    if (currentEditIndex !== null) {
        // Update existing habit
        habits[currentEditIndex].name = name;
        habits[currentEditIndex].description = description;
        habits[currentEditIndex].color = color;
    } else {
        // Create new habit
        const newHabit = {
            name,
            description,
            color,
            completedDates: [],
            createdAt: new Date().toISOString()
        };
        
        habits.push(newHabit);
    }
    
    saveHabitsToStorage();
    closeModal();
    renderView();
}

function toggleStreak() {
    const date = this.dataset.date;
    const habitIndex = parseInt(this.dataset.habitIndex);
    
    if (habits[habitIndex].completedDates.includes(date)) {
        // Remove date if already completed
        habits[habitIndex].completedDates = habits[habitIndex].completedDates.filter(d => d !== date);
    } else {
        // Add date to completed dates
        habits[habitIndex].completedDates.push(date);
    }
    
    saveHabitsToStorage();
    renderView();
}

function deleteHabit(index) {
    if (confirm(`Are you sure you want to delete "${habits[index].name}"?`)) {
        habits.splice(index, 1);
        saveHabitsToStorage();
        renderView();
    }
}

function calculateCurrentStreak(completedDates) {
    if (!completedDates.length) return 0;
    
    // Sort dates in descending order
    const sortedDates = [...completedDates].sort((a, b) => new Date(b) - new Date(a));
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayFormatted = formatDate(today);
    
    // Check if today is completed
    const todayCompleted = sortedDates.includes(todayFormatted);
    
    // If today is not completed, then check yesterday
    let currentDate = todayCompleted ? today : new Date(today);
    if (!todayCompleted) {
        currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // Go back in time and count consecutive days
    for (let i = 0; i < 1000; i++) { // Limiting to 1000 days to avoid infinite loops
        const dateStr = formatDate(currentDate);
        
        if (sortedDates.includes(dateStr)) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }
    
    return streak;
}

function calculateLongestStreak(completedDates) {
    if (!completedDates.length) return 0;
    
    // Sort dates in ascending order
    const sortedDates = [...completedDates].map(dateStr => new Date(dateStr))
        .sort((a, b) => a - b)
        .map(date => formatDate(date));
    
    let longestStreak = 0;
    let currentStreak = 1;
    
    for (let i = 1; i < sortedDates.length; i++) {
        const currentDate = new Date(sortedDates[i]);
        const prevDate = new Date(sortedDates[i-1]);
        
        // Check if dates are consecutive
        const diffTime = Math.abs(currentDate - prevDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            currentStreak++;
        } else {
            longestStreak = Math.max(longestStreak, currentStreak);
            currentStreak = 1;
        }
    }
    
    // Check one more time after the loop finishes
    longestStreak = Math.max(longestStreak, currentStreak);
    
    return longestStreak;
}

function saveHabitsToStorage() {
    localStorage.setItem('habits', JSON.stringify(habits));
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
