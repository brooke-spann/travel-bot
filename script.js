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

// Global variables
let currentFormData = {};
let employeeData = [];
let selectedEmployees = [];

// File upload and parsing functions
function initializeFileUpload() {
    const fileInput = document.getElementById('file-input');
    const uploadArea = document.getElementById('file-upload-area');
    
    // Click to upload
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
    
    // File input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });
}

function handleFile(file) {
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop().toLowerCase();
    
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension)) {
        showError('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            let data;
            
            if (fileExtension === 'csv') {
                data = parseCSV(e.target.result);
            } else {
                data = parseExcel(e.target.result);
            }
            
            if (data && data.length > 0) {
                employeeData = data;
                showFilePreview(data, fileName);
                document.getElementById('continue-btn').style.display = 'block';
            } else {
                showError('No employee data found in the file. Please check the format.');
            }
        } catch (error) {
            console.error('Error parsing file:', error);
            showError('Error reading the file. Please check the format and try again.');
        }
    };
    
    if (fileExtension === 'csv') {
        reader.readAsText(file);
    } else {
        reader.readAsArrayBuffer(file);
    }
}

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const employees = [];
    
    // Skip header row and process data
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const columns = parseCSVLine(line);
        if (columns.length >= 12) {
            const name = columns[0]?.trim();
            const location = columns[11]?.trim(); // Column L (index 11)
            
            if (name) {
                employees.push({
                    name: name,
                    location: location || 'Unknown',
                    category: categorizeLocation(location)
                });
            }
        }
    }
    
    return employees;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current);
    return result;
}

function parseExcel(arrayBuffer) {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    const employees = [];
    
    // Skip header row and process data
    for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (row && row.length >= 12) {
            const name = row[0]?.toString().trim();
            const location = row[11]?.toString().trim(); // Column L (index 11)
            
            if (name) {
                employees.push({
                    name: name,
                    location: location || 'Unknown',
                    category: categorizeLocation(location)
                });
            }
        }
    }
    
    return employees;
}

function categorizeLocation(location) {
    if (!location) return 'remote';
    
    const loc = location.toLowerCase().trim();
    
    if (loc.includes('san francisco') || loc.includes('sf') || loc === 'san francisco') {
        return 'san-francisco';
    } else if (loc.includes('new york') || loc.includes('ny') || loc === 'new york') {
        return 'new-york';
    } else if (loc.includes('denver') || loc === 'denver') {
        return 'denver';
    } else {
        return 'remote';
    }
}

function showFilePreview(data, fileName) {
    const preview = document.getElementById('file-preview');
    const content = document.getElementById('preview-content');
    const count = document.getElementById('employee-count');
    
    // Show first 10 employees as preview
    const previewData = data.slice(0, 10);
    let previewHTML = `<strong>File:</strong> ${fileName}<br><br>`;
    previewHTML += '<strong>Sample employees:</strong><br>';
    
    previewData.forEach(emp => {
        previewHTML += `${emp.name} - ${emp.location}<br>`;
    });
    
    if (data.length > 10) {
        previewHTML += `<br>... and ${data.length - 10} more employees`;
    }
    
    content.innerHTML = previewHTML;
    count.textContent = data.length;
    preview.style.display = 'block';
}

// Employee selection functions
function populateEmployeeList() {
    const employeeList = document.getElementById('employee-list');
    const searchInput = document.getElementById('employee-search');
    
    function renderEmployees(employees = employeeData) {
        employeeList.innerHTML = '';
        
        employees.forEach((employee, index) => {
            const item = document.createElement('div');
            item.className = 'employee-item';
            
            const locationIcon = getLocationIcon(employee.category);
            const locationClass = `location-${employee.category}`;
            
            item.innerHTML = `
                <input type="checkbox" class="employee-checkbox" id="emp-${index}" 
                       data-index="${index}" onchange="updateSelection()">
                <div class="employee-info">
                    <label for="emp-${index}" class="employee-name">${employee.name}</label>
                    <div class="employee-location">
                        <span class="location-badge ${locationClass}">
                            ${locationIcon} ${employee.location}
                        </span>
                    </div>
                </div>
            `;
            
            employeeList.appendChild(item);
        });
    }
    
    // Initial render
    renderEmployees();
    
    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredEmployees = employeeData.filter(emp => 
            emp.name.toLowerCase().includes(searchTerm) ||
            emp.location.toLowerCase().includes(searchTerm)
        );
        renderEmployees(filteredEmployees);
    });
}

function getLocationIcon(category) {
    switch(category) {
        case 'san-francisco': return '🌉';
        case 'new-york': return '🗽';
        case 'denver': return '🏔️';
        case 'remote': return '💻';
        default: return '📍';
    }
}

function updateSelection() {
    const checkboxes = document.querySelectorAll('.employee-checkbox');
    selectedEmployees = [];
    
    let counts = {
        'san-francisco': 0,
        'new-york': 0,
        'denver': 0,
        'remote': 0
    };
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const index = parseInt(checkbox.dataset.index);
            const employee = employeeData[index];
            selectedEmployees.push(employee);
            counts[employee.category]++;
        }
    });
    
    // Update summary stats
    document.getElementById('selected-count').textContent = selectedEmployees.length;
    document.getElementById('sf-count').textContent = counts['san-francisco'];
    document.getElementById('ny-count').textContent = counts['new-york'];
    document.getElementById('denver-count').textContent = counts['denver'];
    document.getElementById('remote-count').textContent = counts['remote'];
}

function selectAll() {
    const checkboxes = document.querySelectorAll('.employee-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
    });
    updateSelection();
}

function clearAll() {
    const checkboxes = document.querySelectorAll('.employee-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    updateSelection();
}

// Navigation functions
function nextStep(stepNumber) {
    if (validateCurrentStep()) {
        // Special handling for step 3 (employee selection)
        if (stepNumber === 3) {
            populateEmployeeList();
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
    
    // Special validation for employee selection step
    if (stepId === 'step-3') {
        if (selectedEmployees.length === 0) {
            showError('Please select at least one employee for the off-site.');
            return false;
        }
        return true;
    }
    
    // Special validation for file upload step
    if (stepId === 'step-1') {
        if (employeeData.length === 0) {
            showError('Please upload a file with employee data first.');
            return false;
        }
        return true;
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
    
    // Save selected employees
    currentFormData.selectedEmployees = selectedEmployees;
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
    const days = parseInt(currentFormData.days);
    const employees = selectedEmployees;
    
    if (!location || !days || employees.length === 0) {
        showError('Please complete all steps before calculating costs.');
        return;
    }
    
    // Calculate attendee breakdown by category
    const attendeeBreakdown = {
        'san-francisco': 0,
        'new-york': 0,
        'denver': 0,
        'remote': 0
    };
    
    employees.forEach(emp => {
        attendeeBreakdown[emp.category]++;
    });
    
    // Calculate costs for all locations and find the cheapest
    const allLocationCosts = calculateAllLocationCosts(attendeeBreakdown, employees.length, days);
    const currentLocationCost = allLocationCosts[location];
    const cheapestLocation = findCheapestLocation(allLocationCosts);
    
    // Display results with comparison
    displayResults({
        location: COST_DATA[location],
        attendees: employees.length,
        localAttendees: currentLocationCost.localAttendees,
        travelingAttendees: currentLocationCost.travelingAttendees,
        attendeeBreakdown,
        selectedEmployees: employees,
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
                localAttendees = attendeeBreakdown['new-york'];
                travelingAttendees = attendeeBreakdown['san-francisco'] + attendeeBreakdown['denver'] + attendeeBreakdown['remote'];
                break;
            case 'san-francisco':
                localAttendees = attendeeBreakdown['san-francisco'];
                travelingAttendees = attendeeBreakdown['new-york'] + attendeeBreakdown['denver'] + attendeeBreakdown['remote'];
                break;
            case 'denver':
                localAttendees = attendeeBreakdown['denver'];
                travelingAttendees = attendeeBreakdown['new-york'] + attendeeBreakdown['san-francisco'] + attendeeBreakdown['remote'];
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
    const { location, attendees, localAttendees, travelingAttendees, attendeeBreakdown, selectedEmployees, days, costs, allLocationCosts, cheapestLocation, currentLocation, justSwitched } = data;
    
    // Create attendee breakdown display by location
    const breakdownDisplay = [];
    if (attendeeBreakdown['new-york'] > 0) breakdownDisplay.push(`🗽 ${attendeeBreakdown['new-york']} from New York`);
    if (attendeeBreakdown['san-francisco'] > 0) breakdownDisplay.push(`🌉 ${attendeeBreakdown['san-francisco']} from San Francisco`);
    if (attendeeBreakdown['denver'] > 0) breakdownDisplay.push(`🏔️ ${attendeeBreakdown['denver']} from Denver`);
    if (attendeeBreakdown['remote'] > 0) breakdownDisplay.push(`💻 ${attendeeBreakdown['remote']} remote`);
    
    // Check if there's a cheaper location
    const isCheapest = cheapestLocation === currentLocation;
    const savings = isCheapest ? 0 : costs.total - allLocationCosts[cheapestLocation].costs.total;
    const cheapestLocationData = COST_DATA[cheapestLocation];
    
    // Update summary with comparison
    const summaryHTML = `
        <div class="location-info">
            <h3>${location.icon} ${location.name} Off-Site</h3>
            <p><strong>${attendees}</strong> selected employees for <strong>${days}</strong> ${days === 1 ? 'day' : 'days'}</p>
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
        
        <div style="margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 10px; border: 1px solid #e2e8f0;">
            <h4 style="color: #374151; margin-bottom: 10px;">👥 Selected Employees (${selectedEmployees.length}):</h4>
            <div style="max-height: 200px; overflow-y: auto; font-size: 0.9rem; line-height: 1.4;">
                ${selectedEmployees.map(emp => `<div style="margin-bottom: 5px;">${getLocationIcon(emp.category)} ${emp.name} (${emp.location})</div>`).join('')}
            </div>
        </div>
    `;
    
    document.getElementById('cost-details').innerHTML = detailsHTML;
}

function startOver() {
    currentFormData = {};
    employeeData = [];
    selectedEmployees = [];
    document.getElementById('offsite-form').reset();
    document.getElementById('results').style.display = 'none';
    document.getElementById('file-preview').style.display = 'none';
    document.getElementById('continue-btn').style.display = 'none';
    showStep(1);
}

function exportResults() {
    const location = COST_DATA[currentFormData.location];
    const days = parseInt(currentFormData.days);
    const employees = selectedEmployees;
    
    // Calculate attendee breakdown by category
    const attendeeBreakdown = {
        'san-francisco': 0,
        'new-york': 0,
        'denver': 0,
        'remote': 0
    };
    
    employees.forEach(emp => {
        attendeeBreakdown[emp.category]++;
    });
    
    // Calculate local vs traveling attendees
    let localAttendees = 0;
    let travelingAttendees = 0;
    
    switch(currentFormData.location) {
        case 'new-york':
            localAttendees = attendeeBreakdown['new-york'];
            travelingAttendees = attendeeBreakdown['san-francisco'] + attendeeBreakdown['denver'] + attendeeBreakdown['remote'];
            break;
        case 'san-francisco':
            localAttendees = attendeeBreakdown['san-francisco'];
            travelingAttendees = attendeeBreakdown['new-york'] + attendeeBreakdown['denver'] + attendeeBreakdown['remote'];
            break;
        case 'denver':
            localAttendees = attendeeBreakdown['denver'];
            travelingAttendees = attendeeBreakdown['new-york'] + attendeeBreakdown['san-francisco'] + attendeeBreakdown['remote'];
            break;
    }
    
    // Calculate costs again for export
    const costs = COST_DATA[currentFormData.location];
    const flightCosts = costs.flight * travelingAttendees;
    const hotelCosts = costs.hotel * travelingAttendees * days;
    const mealCosts = costs.meals * employees.length * days;
    const uberCosts = costs.uber * travelingAttendees;
    const totalCost = flightCosts + hotelCosts + mealCosts + uberCosts;
    
    // Create attendee breakdown text
    const breakdownText = [];
    if (attendeeBreakdown['new-york'] > 0) breakdownText.push(`  • ${attendeeBreakdown['new-york']} from New York`);
    if (attendeeBreakdown['san-francisco'] > 0) breakdownText.push(`  • ${attendeeBreakdown['san-francisco']} from San Francisco`);
    if (attendeeBreakdown['denver'] > 0) breakdownText.push(`  • ${attendeeBreakdown['denver']} from Denver`);
    if (attendeeBreakdown['remote'] > 0) breakdownText.push(`  • ${attendeeBreakdown['remote']} remote`);
    
    const exportData = `
OFF-SITE COST ESTIMATE
=====================

Location: ${location.name}
Total Attendees: ${employees.length} people
Duration: ${days} ${days === 1 ? 'day' : 'days'}
Date Generated: ${new Date().toLocaleDateString()}

ATTENDEE BREAKDOWN:
------------------
${breakdownText.join('\n')}

Local attendees (no travel costs): ${localAttendees}
Traveling attendees: ${travelingAttendees}

SELECTED EMPLOYEES:
------------------
${employees.map(emp => `${emp.name} (${emp.location})`).join('\n')}

COST BREAKDOWN:
--------------
Flights (${travelingAttendees} traveling people): $${flightCosts.toLocaleString()}
Hotel (${travelingAttendees} people × ${days} nights): $${hotelCosts.toLocaleString()}
Meals (${employees.length} people × ${days} days): $${mealCosts.toLocaleString()}
Uber (${travelingAttendees} traveling people): $${uberCosts.toLocaleString()}

TOTAL COST: $${totalCost.toLocaleString()}
Cost per person: $${Math.round(totalCost / employees.length).toLocaleString()}

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

function switchToLocation(newLocation) {
    // Update the current form data
    currentFormData.location = newLocation;
    
    // Recalculate with the new location
    const days = parseInt(currentFormData.days);
    const employees = selectedEmployees;
    
    const attendeeBreakdown = {
        'san-francisco': 0,
        'new-york': 0,
        'denver': 0,
        'remote': 0
    };
    
    employees.forEach(emp => {
        attendeeBreakdown[emp.category]++;
    });
    
    // Calculate costs for all locations again
    const allLocationCosts = calculateAllLocationCosts(attendeeBreakdown, employees.length, days);
    const newLocationCost = allLocationCosts[newLocation];
    const cheapestLocation = findCheapestLocation(allLocationCosts);
    
    // Display results with the new location
    displayResults({
        location: COST_DATA[newLocation],
        attendees: employees.length,
        localAttendees: newLocationCost.localAttendees,
        travelingAttendees: newLocationCost.travelingAttendees,
        attendeeBreakdown,
        selectedEmployees: employees,
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
    initializeFileUpload();
    
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
    document.getElementById('days').addEventListener('input', function() {
        if (this.value < 1) this.value = 1;
        if (this.value > 14) this.value = 14;
    });
});