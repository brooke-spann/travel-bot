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
        // Special handling for step 3 (attendee breakdown)
        if (stepNumber === 3) {
            updateAttendeeBreakdownDisplay();
        }
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
    const stepId = activeStep.id;
    
    // Special validation for attendee breakdown step
    if (stepId === 'step-3') {
        return validateAttendeeBreakdown();
    }
    
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
    const totalAttendees = parseInt(currentFormData.attendees);
    const days = parseInt(currentFormData.days);
    
    // Get attendee breakdown
    const attendeeBreakdown = {
        ny: parseInt(currentFormData['attendees-ny']) || 0,
        sf: parseInt(currentFormData['attendees-sf']) || 0,
        denver: parseInt(currentFormData['attendees-denver']) || 0,
        arizona: parseInt(currentFormData['attendees-arizona']) || 0,
        remote: parseInt(currentFormData['attendees-remote']) || 0
    };
    
    if (!location || !totalAttendees || !days) {
        showError('Please complete all steps before calculating costs.');
        return;
    }
    
    const costs = COST_DATA[location];
    
    // Calculate local vs traveling attendees
    let localAttendees = 0;
    let travelingAttendees = 0;
    
    switch(location) {
        case 'new-york':
            localAttendees = attendeeBreakdown.ny;
            travelingAttendees = attendeeBreakdown.sf + attendeeBreakdown.denver + attendeeBreakdown.arizona + attendeeBreakdown.remote;
            break;
        case 'san-francisco':
            localAttendees = attendeeBreakdown.sf;
            travelingAttendees = attendeeBreakdown.ny + attendeeBreakdown.denver + attendeeBreakdown.arizona + attendeeBreakdown.remote;
            break;
        case 'denver':
            localAttendees = attendeeBreakdown.denver;
            travelingAttendees = attendeeBreakdown.ny + attendeeBreakdown.sf + attendeeBreakdown.arizona + attendeeBreakdown.remote;
            break;
        case 'arizona':
            localAttendees = attendeeBreakdown.arizona;
            travelingAttendees = attendeeBreakdown.ny + attendeeBreakdown.sf + attendeeBreakdown.denver + attendeeBreakdown.remote;
            break;
    }
    
    // Calculate costs - only traveling attendees pay for flights, hotels, and uber
    const flightCosts = costs.flight * travelingAttendees;
    const hotelCosts = costs.hotel * travelingAttendees * days;
    const mealCosts = costs.meals * totalAttendees * days; // Everyone eats
    const uberCosts = costs.uber * travelingAttendees; // Only traveling attendees need transportation
    
    const totalCost = flightCosts + hotelCosts + mealCosts + uberCosts;
    const costPerPerson = totalCost / totalAttendees;
    
    // Display results
    displayResults({
        location: costs,
        attendees: totalAttendees,
        localAttendees,
        travelingAttendees,
        attendeeBreakdown,
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
    const { location, attendees, localAttendees, travelingAttendees, attendeeBreakdown, days, costs } = data;
    
    // Create attendee breakdown display
    const breakdownDisplay = [];
    if (attendeeBreakdown.ny > 0) breakdownDisplay.push(`🗽 ${attendeeBreakdown.ny} from New York`);
    if (attendeeBreakdown.sf > 0) breakdownDisplay.push(`🌉 ${attendeeBreakdown.sf} from San Francisco`);
    if (attendeeBreakdown.denver > 0) breakdownDisplay.push(`🏔️ ${attendeeBreakdown.denver} from Denver`);
    if (attendeeBreakdown.arizona > 0) breakdownDisplay.push(`🌵 ${attendeeBreakdown.arizona} from Arizona`);
    if (attendeeBreakdown.remote > 0) breakdownDisplay.push(`💻 ${attendeeBreakdown.remote} remote`);
    
    // Update summary
    const summaryHTML = `
        <div class="location-info">
            <h3>${location.icon} ${location.name} Off-Site</h3>
            <p><strong>${attendees}</strong> attendees for <strong>${days}</strong> ${days === 1 ? 'day' : 'days'}</p>
            <div class="attendee-breakdown-summary">
                ${breakdownDisplay.join(' • ')}
            </div>
            ${localAttendees > 0 ? `<p class="local-savings">💡 ${localAttendees} local attendee${localAttendees === 1 ? '' : 's'} save on flights, hotels & transportation!</p>` : ''}
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
                <span class="cost-label">✈️ Flights (${travelingAttendees} traveling people)</span>
                <span class="cost-value">$${costs.flights.toLocaleString()}</span>
            </div>
            <div class="cost-item">
                <span class="cost-label">🏨 Hotel (${travelingAttendees} traveling people × ${days} ${days === 1 ? 'night' : 'nights'})</span>
                <span class="cost-value">$${costs.hotel.toLocaleString()}</span>
            </div>
            <div class="cost-item">
                <span class="cost-label">🍽️ Meals (${attendees} people × ${days} ${days === 1 ? 'day' : 'days'})</span>
                <span class="cost-value">$${costs.meals.toLocaleString()}</span>
            </div>
            <div class="cost-item">
                <span class="cost-label">🚕 Uber (${travelingAttendees} traveling people × 2 trips)</span>
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
    const totalAttendees = parseInt(currentFormData.attendees);
    const days = parseInt(currentFormData.days);
    
    // Get attendee breakdown
    const attendeeBreakdown = {
        ny: parseInt(currentFormData['attendees-ny']) || 0,
        sf: parseInt(currentFormData['attendees-sf']) || 0,
        denver: parseInt(currentFormData['attendees-denver']) || 0,
        arizona: parseInt(currentFormData['attendees-arizona']) || 0,
        remote: parseInt(currentFormData['attendees-remote']) || 0
    };
    
    // Calculate local vs traveling attendees
    let localAttendees = 0;
    let travelingAttendees = 0;
    
    switch(currentFormData.location) {
        case 'new-york':
            localAttendees = attendeeBreakdown.ny;
            travelingAttendees = attendeeBreakdown.sf + attendeeBreakdown.denver + attendeeBreakdown.arizona + attendeeBreakdown.remote;
            break;
        case 'san-francisco':
            localAttendees = attendeeBreakdown.sf;
            travelingAttendees = attendeeBreakdown.ny + attendeeBreakdown.denver + attendeeBreakdown.arizona + attendeeBreakdown.remote;
            break;
        case 'denver':
            localAttendees = attendeeBreakdown.denver;
            travelingAttendees = attendeeBreakdown.ny + attendeeBreakdown.sf + attendeeBreakdown.arizona + attendeeBreakdown.remote;
            break;
        case 'arizona':
            localAttendees = attendeeBreakdown.arizona;
            travelingAttendees = attendeeBreakdown.ny + attendeeBreakdown.sf + attendeeBreakdown.denver + attendeeBreakdown.remote;
            break;
    }
    
    // Calculate costs again for export
    const costs = COST_DATA[currentFormData.location];
    const flightCosts = costs.flight * travelingAttendees;
    const hotelCosts = costs.hotel * travelingAttendees * days;
    const mealCosts = costs.meals * totalAttendees * days;
    const uberCosts = costs.uber * travelingAttendees;
    const totalCost = flightCosts + hotelCosts + mealCosts + uberCosts;
    
    // Create attendee breakdown text
    const breakdownText = [];
    if (attendeeBreakdown.ny > 0) breakdownText.push(`  • ${attendeeBreakdown.ny} from New York`);
    if (attendeeBreakdown.sf > 0) breakdownText.push(`  • ${attendeeBreakdown.sf} from San Francisco`);
    if (attendeeBreakdown.denver > 0) breakdownText.push(`  • ${attendeeBreakdown.denver} from Denver`);
    if (attendeeBreakdown.arizona > 0) breakdownText.push(`  • ${attendeeBreakdown.arizona} from Arizona`);
    if (attendeeBreakdown.remote > 0) breakdownText.push(`  • ${attendeeBreakdown.remote} remote`);
    
    const exportData = `
OFF-SITE COST ESTIMATE
=====================

Location: ${location.name}
Total Attendees: ${totalAttendees} people
Duration: ${days} ${days === 1 ? 'day' : 'days'}
Date Generated: ${new Date().toLocaleDateString()}

ATTENDEE BREAKDOWN:
------------------
${breakdownText.join('\n')}

Local attendees (no travel costs): ${localAttendees}
Traveling attendees: ${travelingAttendees}

COST BREAKDOWN:
--------------
Flights (${travelingAttendees} traveling people): $${flightCosts.toLocaleString()}
Hotel (${travelingAttendees} people × ${days} nights): $${hotelCosts.toLocaleString()}
Meals (${totalAttendees} people × ${days} days): $${mealCosts.toLocaleString()}
Uber (${travelingAttendees} traveling people): $${uberCosts.toLocaleString()}

TOTAL COST: $${totalCost.toLocaleString()}
Cost per person: $${Math.round(totalCost / totalAttendees).toLocaleString()}

ASSUMPTIONS:
-----------
• Flights: $${costs.flight} per person (round-trip)
• Hotel: $${costs.hotel} per person per night
• Meals: $${costs.meals} per person per day
• Uber: $${costs.uber} per person (2 trips at $50 each)
• Local attendees do not incur flight, hotel, or transportation costs

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

// Attendee breakdown functions
function updateAttendeeBreakdownDisplay() {
    const totalAttendees = parseInt(document.getElementById('attendees').value) || 0;
    document.getElementById('total-attendees-display').textContent = totalAttendees;
    document.getElementById('breakdown-target').textContent = totalAttendees;
    updateBreakdownTotal();
}

function updateBreakdownTotal() {
    const nyCount = parseInt(document.getElementById('attendees-ny').value) || 0;
    const sfCount = parseInt(document.getElementById('attendees-sf').value) || 0;
    const denverCount = parseInt(document.getElementById('attendees-denver').value) || 0;
    const arizonaCount = parseInt(document.getElementById('attendees-arizona').value) || 0;
    const remoteCount = parseInt(document.getElementById('attendees-remote').value) || 0;
    
    const total = nyCount + sfCount + denverCount + arizonaCount + remoteCount;
    document.getElementById('breakdown-total').textContent = total;
    
    // Update styling based on whether total matches target
    const summaryElement = document.querySelector('.attendee-summary');
    const targetTotal = parseInt(document.getElementById('breakdown-target').textContent) || 0;
    
    if (total === targetTotal && total > 0) {
        summaryElement.style.background = '#f0fdf4';
        summaryElement.style.borderColor = '#bbf7d0';
        summaryElement.style.color = '#166534';
    } else if (total > targetTotal) {
        summaryElement.style.background = '#fef2f2';
        summaryElement.style.borderColor = '#fecaca';
        summaryElement.style.color = '#dc2626';
    } else {
        summaryElement.style.background = '#f0f9ff';
        summaryElement.style.borderColor = '#bfdbfe';
        summaryElement.style.color = '#1e40af';
    }
}

function validateAttendeeBreakdown() {
    const targetTotal = parseInt(document.getElementById('breakdown-target').textContent) || 0;
    const currentTotal = parseInt(document.getElementById('breakdown-total').textContent) || 0;
    
    if (currentTotal !== targetTotal) {
        showError(`Please distribute all ${targetTotal} attendees. Current total: ${currentTotal}`);
        return false;
    }
    
    if (currentTotal === 0) {
        showError('Please specify where your attendees are coming from.');
        return false;
    }
    
    return true;
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
    
    // Add event listeners for attendee breakdown inputs
    ['attendees-ny', 'attendees-sf', 'attendees-denver', 'attendees-arizona', 'attendees-remote'].forEach(id => {
        document.getElementById(id).addEventListener('input', function() {
            if (this.value < 0) this.value = 0;
            updateBreakdownTotal();
        });
    });
});