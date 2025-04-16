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

// State
let habits = JSON.parse(localStorage.getItem('habits')) || [];
let currentEditIndex = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    updateCurrentDate();
    renderHabits();
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
    renderHabits();
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
    renderHabits();
}

function deleteHabit(index) {
    if (confirm(`Are you sure you want to delete "${habits[index].name}"?`)) {
        habits.splice(index, 1);
        saveHabitsToStorage();
        renderHabits();
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

function saveHabitsToStorage() {
    localStorage.setItem('habits', JSON.stringify(habits));
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
