# Off-Site Cost Calculator 🏢

A professional web application to help business partners calculate the costs of team off-sites across different locations.

## 🌟 Features

- **Location Selection**: Choose from Arizona, San Francisco, Denver, or New York
- **Dynamic Cost Calculation**: Automatically calculates costs based on:
  - Number of attendees
  - Duration of the off-site
  - Location-specific pricing
- **Comprehensive Cost Breakdown**: Includes flights, hotels, meals, and Uber rides
- **Professional UI**: Modern, responsive design that works on all devices
- **Export Functionality**: Download cost estimates as text files
- **Real-time Validation**: Input validation and error handling

## 💰 Cost Assumptions

The application uses realistic cost assumptions for each location:

### Arizona 🌵
- Flights: $450 per person (round-trip)
- Hotel: $250 per person per night
- Meals: $75 per person per day
- Uber: $100 per person (2 trips at $50 each)

### San Francisco 🌉
- Flights: $520 per person (round-trip)
- Hotel: $350 per person per night
- Meals: $75 per person per day
- Uber: $100 per person (2 trips at $50 each)

### Denver 🏔️
- Flights: $380 per person (round-trip)
- Hotel: $300 per person per night
- Meals: $75 per person per day
- Uber: $100 per person (2 trips at $50 each)

### New York 🗽
- Flights: $480 per person (round-trip)
- Hotel: $400 per person per night
- Meals: $75 per person per day
- Uber: $100 per person (2 trips at $50 each)

## 🚀 Deployment to GitHub Pages

This application is configured for automatic deployment to GitHub Pages. Follow these steps:

### 1. Create a GitHub Repository
1. Create a new repository on GitHub
2. Clone this code to your repository
3. Push the code to the `main` or `master` branch

### 2. Enable GitHub Pages
1. Go to your repository settings
2. Navigate to the "Pages" section
3. Under "Source", select "GitHub Actions"
4. The deployment workflow will automatically trigger

### 3. Access Your App
Once deployed, your app will be available at:
`https://[your-username].github.io/[repository-name]`

## 🛠️ Local Development

To run the application locally:

1. Clone the repository:
   ```bash
   git clone [your-repo-url]
   cd [repository-name]
   ```

2. Open `index.html` in your web browser, or serve it using a local web server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   ```

3. Navigate to `http://localhost:8000` in your browser

## 📁 File Structure

```
/
├── index.html          # Main HTML file
├── styles.css          # CSS styling
├── script.js           # JavaScript functionality
├── .github/
│   └── workflows/
│       └── deploy.yml  # GitHub Pages deployment workflow
└── README.md           # This file
```

## 🎨 Customization

You can easily customize the cost assumptions by modifying the `COST_DATA` object in `script.js`:

```javascript
const COST_DATA = {
    'location-key': {
        name: 'Location Name',
        icon: '🏙️',
        flight: 500,        // Flight cost per person
        hotel: 200,         // Hotel cost per night per person
        meals: 75,          // Meals per day per person (standardized)
        uber: 100          // Uber cost per person (2 trips at $50 each)
    }
};
```

## 📱 Responsive Design

The application is fully responsive and works seamlessly on:
- Desktop computers
- Tablets
- Mobile phones

## 🔧 Technologies Used

- **HTML5**: Semantic markup
- **CSS3**: Modern styling with gradients, animations, and grid layout
- **Vanilla JavaScript**: No external dependencies
- **GitHub Actions**: Automated deployment

## 📄 License

This project is open source and available under the MIT License.

---

Built with ❤️ for efficient off-site planning