// DOM Elements
const habitsContainer = document.getElementById('habits-container');
const addHabitBtn = document.getElementById('add-habit-btn');
const habitModal = document.getElementById('habit-form-modal');
const closeModalBtn = document.querySelector('.close');
const habitForm = document.getElementById('habit-form');
const habitNameInput = document.getElementById('habit-name');
const habitDescInput = document.getElementById('habit-description');
const habitColorInput = document.getElementById('habit-color');

// State
let habits = JSON.parse(localStorage.getItem('habits')) || [];

// Event Listeners
document.addEventListener('DOMContentLoaded', renderHabits);
addHabitBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);
habitForm.addEventListener('submit', saveHabit);
window.addEventListener('click', (e) => {
    if (e.target === habitModal) {
        closeModal();
    }
});

// Functions
function renderHabits() {
    habitsContainer.innerHTML = '';
    
    if (habits.length === 0) {
        habitsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-list"></i>
                <h3>No habits yet</h3>
                <p>Start tracking your habits by adding a new one.</p>
            </div>
        `;
        return;
    }
    
    habits.forEach((habit, index) => {
        const habitCard = document.createElement('div');
        habitCard.classList.add('habit-card');
        habitCard.style.borderTop = `4px solid ${habit.color}`;
        
        const today = new Date();
        const lastWeek = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            lastWeek.push(formatDate(date));
        }
        
        const streaksHTML = lastWeek.map(date => {
            const completed = habit.completedDates.includes(date);
            return `
                <div class="streak-day ${completed ? 'completed' : ''}" 
                     style="${completed ? 'background-color: ' + habit.color : ''}"
                     data-date="${date}" 
                     data-habit-index="${index}">
                    ${date.split('-')[2]}
                </div>
            `;
        }).join('');
        
        habitCard.innerHTML = `
            <div class="habit-header">
                <h3 class="habit-name">${habit.name}</h3>
                <div class="habit-actions">
                    <button class="action-btn edit-btn" data-index="${index}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <p class="habit-description">${habit.description || 'No description'}</p>
            <div class="habit-streaks">
                ${streaksHTML}
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
        btn.addEventListener('click', editHabit);
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', deleteHabit);
    });
}

function openModal(e, editIndex = null) {
    habitModal.style.display = 'block';
    
    if (editIndex !== null) {
        // Editing existing habit
        const habit = habits[editIndex];
        habitNameInput.value = habit.name;
        habitDescInput.value = habit.description || '';
        habitColorInput.value = habit.color;
        habitForm.dataset.editIndex = editIndex;
        document.querySelector('.modal-content h2').textContent = 'Edit Habit';
    } else {
        // Adding new habit
        habitForm.reset();
        delete habitForm.dataset.editIndex;
        document.querySelector('.modal-content h2').textContent = 'Add New Habit';
    }
}

function closeModal() {
    habitModal.style.display = 'none';
    habitForm.reset();
}

function saveHabit(e) {
    e.preventDefault();
    
    const name = habitNameInput.value.trim();
    const description = habitDescInput.value.trim();
    const color = habitColorInput.value;
    
    if (name === '') return;
    
    const editIndex = habitForm.dataset.editIndex;
    
    if (editIndex !== undefined) {
        // Update existing habit
        habits[editIndex].name = name;
        habits[editIndex].description = description;
        habits[editIndex].color = color;
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

function toggleStreak(e) {
    const date = this.dataset.date;
    const habitIndex = this.dataset.habitIndex;
    
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

function editHabit() {
    const index = this.dataset.index;
    openModal(null, index);
}

function deleteHabit() {
    const index = this.dataset.index;
    
    if (confirm(`Are you sure you want to delete "${habits[index].name}"?`)) {
        habits.splice(index, 1);
        saveHabitsToStorage();
        renderHabits();
    }
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