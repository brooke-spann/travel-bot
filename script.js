// Cost assumptions for each location
const COST_DATA = {
    'arizona': {
        name: 'Arizona',
        icon: '🌵',
        flight: 450,        // Average flight cost per person
        hotel: 250,         // Hotel cost per night per person
        meals: 75,          // Meals per day per person
        uber: 100          // 2 Uber trips at $50 per person ($100 total per person)
    },
    'san-francisco': {
        name: 'San Francisco',
        icon: '🌉',
        flight: 520,
        hotel: 350,
        meals: 75,
        uber: 100
    },
    'denver': {
        name: 'Denver',
        icon: '🏔️',
        flight: 380,
        hotel: 300,
        meals: 75,
        uber: 100
    },
    'new-york': {
        name: 'New York',
        icon: '🗽',
        flight: 480,
        hotel: 400,
        meals: 75,
        uber: 100
    }
};

let currentFormData = {};

// Navigation functions
function nextStep(stepNumber) {
    if (validateCurrentStep()) {
        showStep(stepNumber);
        saveCurrentStepData();
    }
}

function previousStep(stepNumber) {
    showStep(stepNumber);
}

function showStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show target step
    document.getElementById(`step-${stepNumber}`).classList.add('active');
}

function validateCurrentStep() {
    const activeStep = document.querySelector('.form-section.active');
    const requiredInputs = activeStep.querySelectorAll('input[required]');
    
    for (let input of requiredInputs) {
        if (!input.value || (input.type === 'radio' && !activeStep.querySelector('input[type="radio"]:checked'))) {
            input.focus();
            showError('Please fill in all required fields.');
            return false;
        }
    }
    
    return true;
}

function saveCurrentStepData() {
    const form = document.getElementById('offsite-form');
    const formData = new FormData(form);
    
    for (let [key, value] of formData.entries()) {
        currentFormData[key] = value;
    }
}

function showError(message) {
    // Remove existing error messages
    const existingError = document.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Create and show new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        background: #fed7d7;
        color: #c53030;
        padding: 15px;
        border-radius: 10px;
        margin-bottom: 20px;
        border: 1px solid #feb2b2;
        text-align: center;
        font-weight: 500;
    `;
    errorDiv.textContent = message;
    
    const activeStep = document.querySelector('.form-section.active');
    activeStep.insertBefore(errorDiv, activeStep.firstChild);
    
    // Remove error message after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

function calculateCosts() {
    if (!validateCurrentStep()) {
        return;
    }
    
    saveCurrentStepData();
    
    const location = currentFormData.location;
    const attendees = parseInt(currentFormData.attendees);
    const days = parseInt(currentFormData.days);
    
    if (!location || !attendees || !days) {
        showError('Please complete all steps before calculating costs.');
        return;
    }
    
    const costs = COST_DATA[location];
    
    // Calculate costs
    const flightCosts = costs.flight * attendees;
    const hotelCosts = costs.hotel * attendees * days;
    const mealCosts = costs.meals * attendees * days;
    const uberCosts = costs.uber * attendees; // Fixed cost per person for 2 trips
    
    const totalCost = flightCosts + hotelCosts + mealCosts + uberCosts;
    const costPerPerson = totalCost / attendees;
    
    // Display results
    displayResults({
        location: costs,
        attendees,
        days,
        costs: {
            flights: flightCosts,
            hotel: hotelCosts,
            meals: mealCosts,
            uber: uberCosts,
            total: totalCost,
            perPerson: costPerPerson
        }
    });
    
    // Show results section
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById('results').style.display = 'block';
    document.getElementById('results').classList.add('active');
}

function displayResults(data) {
    const { location, attendees, days, costs } = data;
    
    // Update summary
    const summaryHTML = `
        <div class="location-info">
            <h3>${location.icon} ${location.name} Off-Site</h3>
            <p><strong>${attendees}</strong> attendees for <strong>${days}</strong> ${days === 1 ? 'day' : 'days'}</p>
        </div>
        <div class="total-cost">$${costs.total.toLocaleString()}</div>
        <div class="cost-per-person">$${Math.round(costs.perPerson).toLocaleString()} per person</div>
    `;
    
    document.getElementById('cost-summary').innerHTML = summaryHTML;
    
    // Update detailed breakdown
    const detailsHTML = `
        <h3>💼 Detailed Cost Breakdown</h3>
        <div class="cost-breakdown">
            <div class="cost-item">
                <span class="cost-label">✈️ Flights (${attendees} people)</span>
                <span class="cost-value">$${costs.flights.toLocaleString()}</span>
            </div>
            <div class="cost-item">
                <span class="cost-label">🏨 Hotel (${attendees} people × ${days} ${days === 1 ? 'night' : 'nights'})</span>
                <span class="cost-value">$${costs.hotel.toLocaleString()}</span>
            </div>
            <div class="cost-item">
                <span class="cost-label">🍽️ Meals (${attendees} people × ${days} ${days === 1 ? 'day' : 'days'})</span>
                <span class="cost-value">$${costs.meals.toLocaleString()}</span>
            </div>
            <div class="cost-item">
                <span class="cost-label">🚕 Uber (${attendees} people × 2 trips)</span>
                <span class="cost-value">$${costs.uber.toLocaleString()}</span>
            </div>
            <div class="cost-item">
                <span class="cost-label">💰 Total Cost</span>
                <span class="cost-value">$${costs.total.toLocaleString()}</span>
            </div>
        </div>
        
        <div style="margin-top: 30px; padding: 20px; background: #f0f9ff; border-radius: 10px; border-left: 4px solid #0ea5e9;">
            <h4 style="color: #0c4a6e; margin-bottom: 10px;">📊 Cost Assumptions:</h4>
            <ul style="color: #475569; line-height: 1.6;">
                <li><strong>Flights:</strong> $${location.flight} per person (round-trip)</li>
                <li><strong>Hotel:</strong> $${location.hotel} per person per night</li>
                <li><strong>Meals:</strong> $${location.meals} per person per day</li>
                <li><strong>Uber:</strong> $${location.uber} per person (2 trips at $50 each)</li>
            </ul>
        </div>
    `;
    
    document.getElementById('cost-details').innerHTML = detailsHTML;
}

function startOver() {
    currentFormData = {};
    document.getElementById('offsite-form').reset();
    document.getElementById('results').style.display = 'none';
    showStep(1);
}

function exportResults() {
    const location = COST_DATA[currentFormData.location];
    const attendees = parseInt(currentFormData.attendees);
    const days = parseInt(currentFormData.days);
    
    // Calculate costs again for export
    const costs = COST_DATA[currentFormData.location];
    const flightCosts = costs.flight * attendees;
    const hotelCosts = costs.hotel * attendees * days;
    const mealCosts = costs.meals * attendees * days;
    const uberCosts = costs.uber * attendees;
    const totalCost = flightCosts + hotelCosts + mealCosts + uberCosts;
    
    const exportData = `
OFF-SITE COST ESTIMATE
=====================

Location: ${location.name}
Attendees: ${attendees} people
Duration: ${days} ${days === 1 ? 'day' : 'days'}
Date Generated: ${new Date().toLocaleDateString()}

COST BREAKDOWN:
--------------
Flights: $${flightCosts.toLocaleString()}
Hotel: $${hotelCosts.toLocaleString()}
Meals: $${mealCosts.toLocaleString()}
Uber: $${uberCosts.toLocaleString()}

TOTAL COST: $${totalCost.toLocaleString()}
Cost per person: $${Math.round(totalCost / attendees).toLocaleString()}

ASSUMPTIONS:
-----------
• Flights: $${costs.flight} per person (round-trip)
• Hotel: $${costs.hotel} per person per night
• Meals: $${costs.meals} per person per day
• Uber: $${costs.uber} per person (2 trips at $50 each)

Generated by Off-Site Cost Calculator
    `.trim();
    
    // Create and download file
    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `offsite-cost-estimate-${location.name.toLowerCase().replace(' ', '-')}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    showStep(1);
    
    // Add event listeners for location cards
    document.querySelectorAll('input[name="location"]').forEach(radio => {
        radio.addEventListener('change', function() {
            // Remove active class from all cards
            document.querySelectorAll('.location-card').forEach(card => {
                card.classList.remove('selected');
            });
            // Add active class to selected card
            this.closest('.location-card').classList.add('selected');
        });
    });
    
    // Add input validation
    document.getElementById('attendees').addEventListener('input', function() {
        if (this.value < 1) this.value = 1;
        if (this.value > 100) this.value = 100;
    });
    
    document.getElementById('days').addEventListener('input', function() {
        if (this.value < 1) this.value = 1;
        if (this.value > 14) this.value = 14;
    });
});