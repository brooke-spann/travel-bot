// Cost assumptions for each location
const COST_DATA = {
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
        remote: parseInt(currentFormData['attendees-remote']) || 0
    };
    
    if (!location || !totalAttendees || !days) {
        showError('Please complete all steps before calculating costs.');
        return;
    }
    
    // Calculate costs for all locations and find the cheapest
    const allLocationCosts = calculateAllLocationCosts(attendeeBreakdown, totalAttendees, days);
    const currentLocationCost = allLocationCosts[location];
    const cheapestLocation = findCheapestLocation(allLocationCosts);
    
    // Display results with comparison
    displayResults({
        location: COST_DATA[location],
        attendees: totalAttendees,
        localAttendees: currentLocationCost.localAttendees,
        travelingAttendees: currentLocationCost.travelingAttendees,
        attendeeBreakdown,
        days,
        costs: currentLocationCost.costs,
        allLocationCosts,
        cheapestLocation,
        currentLocation: location
    });
    
    // Show results section
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById('results').style.display = 'block';
    document.getElementById('results').classList.add('active');
}

function calculateAllLocationCosts(attendeeBreakdown, totalAttendees, days) {
    const allCosts = {};
    
    // Calculate costs for each location
    Object.keys(COST_DATA).forEach(locationKey => {
        const costs = COST_DATA[locationKey];
        
        // Calculate local vs traveling attendees for this location
        let localAttendees = 0;
        let travelingAttendees = 0;
        
        switch(locationKey) {
            case 'new-york':
                localAttendees = attendeeBreakdown.ny;
                travelingAttendees = attendeeBreakdown.sf + attendeeBreakdown.denver + attendeeBreakdown.remote;
                break;
            case 'san-francisco':
                localAttendees = attendeeBreakdown.sf;
                travelingAttendees = attendeeBreakdown.ny + attendeeBreakdown.denver + attendeeBreakdown.remote;
                break;
            case 'denver':
                localAttendees = attendeeBreakdown.denver;
                travelingAttendees = attendeeBreakdown.ny + attendeeBreakdown.sf + attendeeBreakdown.remote;
                break;
        }
        
        // Calculate costs for this location
        const flightCosts = costs.flight * travelingAttendees;
        const hotelCosts = costs.hotel * travelingAttendees * days;
        const mealCosts = costs.meals * totalAttendees * days;
        const uberCosts = costs.uber * travelingAttendees;
        const totalCost = flightCosts + hotelCosts + mealCosts + uberCosts;
        const costPerPerson = totalCost / totalAttendees;
        
        allCosts[locationKey] = {
            locationData: costs,
            localAttendees,
            travelingAttendees,
            costs: {
                flights: flightCosts,
                hotel: hotelCosts,
                meals: mealCosts,
                uber: uberCosts,
                total: totalCost,
                perPerson: costPerPerson
            }
        };
    });
    
    return allCosts;
}

function findCheapestLocation(allLocationCosts) {
    let cheapestLocation = null;
    let lowestCost = Infinity;
    
    Object.keys(allLocationCosts).forEach(locationKey => {
        const cost = allLocationCosts[locationKey].costs.total;
        if (cost < lowestCost) {
            lowestCost = cost;
            cheapestLocation = locationKey;
        }
    });
    
    return cheapestLocation;
}

function displayResults(data) {
    const { location, attendees, localAttendees, travelingAttendees, attendeeBreakdown, days, costs, allLocationCosts, cheapestLocation, currentLocation, justSwitched } = data;
    
    // Create attendee breakdown display
    const breakdownDisplay = [];
    if (attendeeBreakdown.ny > 0) breakdownDisplay.push(`🗽 ${attendeeBreakdown.ny} from New York`);
    if (attendeeBreakdown.sf > 0) breakdownDisplay.push(`🌉 ${attendeeBreakdown.sf} from San Francisco`);
    if (attendeeBreakdown.denver > 0) breakdownDisplay.push(`🏔️ ${attendeeBreakdown.denver} from Denver`);
    if (attendeeBreakdown.remote > 0) breakdownDisplay.push(`💻 ${attendeeBreakdown.remote} remote`);
    
    // Check if there's a cheaper location
    const isCheapest = cheapestLocation === currentLocation;
    const savings = isCheapest ? 0 : costs.total - allLocationCosts[cheapestLocation].costs.total;
    const cheapestLocationData = COST_DATA[cheapestLocation];
    
    // Update summary with comparison
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
        
        ${justSwitched ? `
            <div class="location-switched-confirmation">
                <div class="confirmation-header">
                    <h4>✅ Location Updated!</h4>
                </div>
                <div class="confirmation-content">
                    <p>Your off-site location has been changed to <strong>${location.name}</strong>.</p>
                    <p>Here's your updated cost breakdown:</p>
                </div>
            </div>
        ` : !isCheapest ? `
            <div class="cheaper-location-alert">
                <div class="alert-header">
                    <h4>💡 Cost-Saving Opportunity!</h4>
                </div>
                <div class="alert-content">
                    <p>We found a cheaper location for your off-site:</p>
                    <div class="cheaper-option">
                        <div class="cheaper-location">
                            <span class="location-name">${cheapestLocationData.icon} ${cheapestLocationData.name}</span>
                            <span class="savings-amount">Save $${savings.toLocaleString()}</span>
                        </div>
                        <div class="cheaper-total">Total: $${allLocationCosts[cheapestLocation].costs.total.toLocaleString()}</div>
                    </div>
                    <div class="alert-actions">
                        <button type="button" class="btn btn-success" onclick="switchToLocation('${cheapestLocation}')">
                            Switch to ${cheapestLocationData.name}
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="dismissCheaperOption()">
                            Keep Current Location
                        </button>
                    </div>
                </div>
            </div>
        ` : `
            <div class="best-price-badge">
                <span>🏆 Best Price!</span>
                <p>This is the most cost-effective location for your team.</p>
            </div>
        `}
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
        remote: parseInt(currentFormData['attendees-remote']) || 0
    };
    
    // Calculate local vs traveling attendees
    let localAttendees = 0;
    let travelingAttendees = 0;
    
    switch(currentFormData.location) {
        case 'new-york':
            localAttendees = attendeeBreakdown.ny;
            travelingAttendees = attendeeBreakdown.sf + attendeeBreakdown.denver + attendeeBreakdown.remote;
            break;
        case 'san-francisco':
            localAttendees = attendeeBreakdown.sf;
            travelingAttendees = attendeeBreakdown.ny + attendeeBreakdown.denver + attendeeBreakdown.remote;
            break;
        case 'denver':
            localAttendees = attendeeBreakdown.denver;
            travelingAttendees = attendeeBreakdown.ny + attendeeBreakdown.sf + attendeeBreakdown.remote;
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
    const remoteCount = parseInt(document.getElementById('attendees-remote').value) || 0;
    
    const total = nyCount + sfCount + denverCount + remoteCount;
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

function switchToLocation(newLocation) {
    // Update the current form data
    currentFormData.location = newLocation;
    
    // Recalculate with the new location
    const totalAttendees = parseInt(currentFormData.attendees);
    const days = parseInt(currentFormData.days);
    
    const attendeeBreakdown = {
        ny: parseInt(currentFormData['attendees-ny']) || 0,
        sf: parseInt(currentFormData['attendees-sf']) || 0,
        denver: parseInt(currentFormData['attendees-denver']) || 0,
        remote: parseInt(currentFormData['attendees-remote']) || 0
    };
    
    // Calculate costs for all locations again
    const allLocationCosts = calculateAllLocationCosts(attendeeBreakdown, totalAttendees, days);
    const newLocationCost = allLocationCosts[newLocation];
    const cheapestLocation = findCheapestLocation(allLocationCosts);
    
    // Display results with the new location
    displayResults({
        location: COST_DATA[newLocation],
        attendees: totalAttendees,
        localAttendees: newLocationCost.localAttendees,
        travelingAttendees: newLocationCost.travelingAttendees,
        attendeeBreakdown,
        days,
        costs: newLocationCost.costs,
        allLocationCosts,
        cheapestLocation,
        currentLocation: newLocation,
        justSwitched: true
    });
}

function dismissCheaperOption() {
    // Hide the cheaper location alert
    const alert = document.querySelector('.cheaper-location-alert');
    if (alert) {
        alert.style.display = 'none';
    }
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
    ['attendees-ny', 'attendees-sf', 'attendees-denver', 'attendees-remote'].forEach(id => {
        document.getElementById(id).addEventListener('input', function() {
            if (this.value < 0) this.value = 0;
            updateBreakdownTotal();
        });
    });
});