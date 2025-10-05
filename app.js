// NASA Earth Observation Dashboard - Tesseract
class EarthObservationDashboard {
    constructor() {
        this.currentLocation = { lat: 40.7128, lng: -74.0060, name: 'New York, United States' };
        this.nasaApiKey = '';
        this.map = null;
        this.marker = null;
        this.charts = {};
        this.citiesDatabase = this.getCitiesDatabase();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setDefaultDates();
        this.loadStoredApiKeys();
        this.initializeCharts();
        this.setupMap();
        this.updateLocationDisplay();
    }

    getCitiesDatabase() {
        return [
            // United States
            { name: "New York", country: "United States", lat: 40.7128, lng: -74.0060 },
            { name: "Los Angeles", country: "United States", lat: 34.0522, lng: -118.2437 },
            { name: "Chicago", country: "United States", lat: 41.8781, lng: -87.6298 },
            { name: "Houston", country: "United States", lat: 29.7604, lng: -95.3698 },
            { name: "Phoenix", country: "United States", lat: 33.4484, lng: -112.0740 },
            { name: "Philadelphia", country: "United States", lat: 39.9526, lng: -75.1652 },
            { name: "San Antonio", country: "United States", lat: 29.4241, lng: -98.4936 },
            { name: "San Diego", country: "United States", lat: 32.7157, lng: -117.1611 },
            { name: "Dallas", country: "United States", lat: 32.7767, lng: -96.7970 },
            { name: "San Jose", country: "United States", lat: 37.3382, lng: -121.8863 },
            
            // Canada
            { name: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832 },
            { name: "Vancouver", country: "Canada", lat: 49.2827, lng: -123.1207 },
            { name: "Montreal", country: "Canada", lat: 45.5017, lng: -73.5673 },
            
            // Europe
            { name: "London", country: "United Kingdom", lat: 51.5074, lng: -0.1278 },
            { name: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
            { name: "Berlin", country: "Germany", lat: 52.5200, lng: 13.4050 },
            { name: "Madrid", country: "Spain", lat: 40.4168, lng: -3.7038 },
            { name: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964 },
            
            // Asia
            { name: "Tokyo", country: "Japan", lat: 35.6762, lng: 139.6503 },
            { name: "Beijing", country: "China", lat: 39.9042, lng: 116.4074 },
            { name: "Mumbai", country: "India", lat: 19.0760, lng: 72.8777 },
            { name: "Singapore", country: "Singapore", lat: 1.3521, lng: 103.8198 },
            
            // Australia
            { name: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
            { name: "Melbourne", country: "Australia", lat: -37.8136, lng: 144.9631 },
            
            // South America
            { name: "São Paulo", country: "Brazil", lat: -23.5505, lng: -46.6333 },
            { name: "Buenos Aires", country: "Argentina", lat: -34.6037, lng: -58.3816 },
            
            // Africa
            { name: "Cairo", country: "Egypt", lat: 30.0444, lng: 31.2357 },
            { name: "Johannesburg", country: "South Africa", lat: -26.2041, lng: 28.0473 }
        ];
    }

    setupEventListeners() {
        // API Key Management
        document.getElementById('save-api-key').addEventListener('click', () => this.saveNasaApiKey());

        // Location Search
        document.getElementById('location-search').addEventListener('input', (e) => this.handleAutocomplete(e));
        document.getElementById('location-search').addEventListener('focus', () => this.showAutocomplete());
        document.getElementById('map-pin-btn').addEventListener('click', () => this.activateMapPinMode());

        // Date Selection
        document.querySelectorAll('input[name="date-type"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handleDateTypeChange(e.target.value));
        });

        // Analysis
        document.getElementById('analyze-btn').addEventListener('click', () => this.analyzeConditions());
        document.getElementById('download-report').addEventListener('click', () => this.downloadPDFReport());

        // Close autocomplete when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideAutocomplete();
            }
        });
    }

    loadStoredApiKeys() {
        this.nasaApiKey = localStorage.getItem('nasa_api_key') || '';
        document.getElementById('nasa-api-key').value = this.nasaApiKey;
    }

    saveNasaApiKey() {
        this.nasaApiKey = document.getElementById('nasa-api-key').value.trim();
        localStorage.setItem('nasa_api_key', this.nasaApiKey);
        this.showNotification('NASA API Key saved successfully!', 'success');
    }

    setupMap() {
        const mapElement = document.getElementById('map');
        
        try {
            // Initialize Leaflet map with OpenStreetMap
            this.map = L.map('map').setView([this.currentLocation.lat, this.currentLocation.lng], 10);

            // Add OpenStreetMap tiles - COMPLETELY FREE, NO API KEY NEEDED
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 18
            }).addTo(this.map);

            // Create custom marker
            this.createCustomMarker();

            // Add click event to map
            this.map.on('click', (e) => {
                this.handleMapClick(e.latlng.lat, e.latlng.lng);
            });

            // Update coordinates when map moves
            this.map.on('move', () => {
                const center = this.map.getCenter();
                this.updateMapCoordinates(center.lat, center.lng);
            });

            this.showNotification('🗺️ OpenStreetMap loaded successfully!', 'success');

        } catch (error) {
            console.error('Map initialization error:', error);
            mapElement.innerHTML = `
                <div class="map-placeholder">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Map Loading Failed</h3>
                    <p>Please check your internet connection</p>
                    <div class="coordinates-display">
                        <span>Lat: <span id="map-lat">${this.currentLocation.lat.toFixed(4)}</span></span>
                        <span>Lng: <span id="map-lng">${this.currentLocation.lng.toFixed(4)}</span></span>
                    </div>
                </div>
            `;
        }
    }

    createCustomMarker() {
        // Remove existing marker
        if (this.marker) {
            this.map.removeLayer(this.marker);
        }

        // Create custom marker icon
        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `
                <div class="marker-pulse"></div>
                <div class="marker-pin">
                    <i class="fas fa-map-marker-alt"></i>
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 40]
        });

        // Add marker to map
        this.marker = L.marker([this.currentLocation.lat, this.currentLocation.lng], {
            icon: customIcon
        }).addTo(this.map);
    }

    activateMapPinMode() {
        if (!this.map) {
            this.showNotification('Map is not loaded yet', 'error');
            return;
        }
        
        this.showNotification('🎯 Click anywhere on the map to select a location', 'info');
        
        // Change cursor to indicate pin mode
        this.map.getContainer().style.cursor = 'crosshair';
        
        // Auto-disable after 15 seconds
        setTimeout(() => {
            if (this.map) {
                this.map.getContainer().style.cursor = '';
            }
        }, 15000);
    }

    handleMapClick(lat, lng) {
        this.currentLocation = { lat, lng, name: `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
        
        // Update marker position
        if (this.marker) {
            this.marker.setLatLng([lat, lng]);
        }
        
        // Center map on new location with smooth animation
        if (this.map) {
            this.map.setView([lat, lng], this.map.getZoom(), {
                animate: true,
                duration: 1
            });
        }
        
        this.updateLocationDisplay();
        this.updateMapCoordinates(lat, lng);
        this.showNotification(`📍 Location set to ${this.currentLocation.name}`, 'success');
        
        // Reset cursor
        if (this.map) {
            this.map.getContainer().style.cursor = '';
        }
    }

    updateLocationDisplay() {
        document.getElementById('current-location').textContent = this.currentLocation.name;
    }

    updateMapCoordinates(lat, lng) {
        document.getElementById('map-lat').textContent = lat.toFixed(4);
        document.getElementById('map-lng').textContent = lng.toFixed(4);
    }

    handleAutocomplete(e) {
        const query = e.target.value.toLowerCase();
        if (query.length < 2) {
            this.hideAutocomplete();
            return;
        }

        const results = this.searchLocations(query);
        this.showAutocompleteResults(results);
    }

    searchLocations(query) {
        return this.citiesDatabase.filter(location =>
            location.name.toLowerCase().includes(query) ||
            location.country.toLowerCase().includes(query)
        ).slice(0, 8);
    }

    showAutocompleteResults(results) {
        const dropdown = document.getElementById('autocomplete-results');
        dropdown.innerHTML = '';

        if (results.length === 0) {
            dropdown.innerHTML = '<div class="autocomplete-item"><i class="fas fa-search"></i><div>No locations found</div></div>';
        } else {
            results.forEach(result => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                item.innerHTML = `
                    <i class="fas fa-city"></i>
                    <div>
                        <div>${result.name}</div>
                        <div style="font-size: 0.8rem; color: var(--text-light);">${result.country}</div>
                    </div>
                `;
                item.addEventListener('click', () => this.selectLocation(result));
                dropdown.appendChild(item);
            });
        }

        dropdown.style.display = 'block';
    }

    selectLocation(location) {
        document.getElementById('location-search').value = `${location.name}, ${location.country}`;
        this.hideAutocomplete();
        
        this.currentLocation = location;
        
        // Update map view
        if (this.map) {
            this.map.setView([location.lat, location.lng], 10, {
                animate: true,
                duration: 1
            });
            
            // Update marker
            if (this.marker) {
                this.marker.setLatLng([location.lat, location.lng]);
            }
        }
        
        this.updateLocationDisplay();
        this.updateMapCoordinates(location.lat, location.lng);
        this.showNotification(`📍 Location set to ${location.name}, ${location.country}`, 'success');
    }

    showAutocomplete() {
        const query = document.getElementById('location-search').value;
        if (query.length >= 2) {
            const results = this.searchLocations(query);
            this.showAutocompleteResults(results);
        }
    }

    hideAutocomplete() {
        document.getElementById('autocomplete-results').style.display = 'none';
    }

    handleDateTypeChange(type) {
        const singleDate = document.querySelector('.single-date');
        const dateRange = document.querySelector('.date-range');
        
        if (type === 'single') {
            singleDate.style.display = 'block';
            dateRange.style.display = 'none';
        } else {
            singleDate.style.display = 'none';
            dateRange.style.display = 'block';
        }
    }

    setDefaultDates() {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        document.getElementById('single-date').valueAsDate = yesterday;
        document.getElementById('start-date').valueAsDate = yesterday;
        document.getElementById('end-date').valueAsDate = today;
    }

    initializeCharts() {
        this.createTemperatureChart();
        this.createPrecipitationChart();
        this.createTrendsChart();
    }

    createTemperatureChart() {
        const ctx = document.getElementById('temp-chart').getContext('2d');
        this.charts.temperature = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Above 30°C', 'Normal', 'Below 15°C'],
                datasets: [{
                    data: [65, 25, 10],
                    backgroundColor: ['#ef4444', '#3b82f6', '#60a5fa'],
                    borderWidth: 0
                }]
            },
            options: {
                cutout: '70%',
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                },
                animation: { animateScale: true, duration: 1000 }
            }
        });
    }

    createPrecipitationChart() {
        const ctx = document.getElementById('precip-chart').getContext('2d');
        this.charts.precipitation = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Heavy Rain', 'Light Rain', 'No Rain'],
                datasets: [{
                    data: [40, 35, 25],
                    backgroundColor: ['#1e40af', '#3b82f6', '#bfdbfe'],
                    borderWidth: 0
                }]
            },
            options: {
                cutout: '70%',
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                },
                animation: { animateScale: true, duration: 1000 }
            }
        });
    }

    createTrendsChart() {
        const ctx = document.getElementById('trends-chart').getContext('2d');
        this.charts.trends = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Temperature Trend',
                    data: [12, 19, 15, 22, 18, 25],
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#94a3b8' }
                    },
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    }

    async analyzeConditions() {
        if (!this.nasaApiKey) {
            this.showNotification('Please enter NASA POWER API key first', 'error');
            return;
        }

        this.showLoading(true);

        try {
            // Simulate NASA API call
            await this.simulateNasaApiCall();
            
            // Update UI with smooth animations
            await this.updateWeatherDataWithAnimation();
            this.updateActivityRecommendations();
            this.updateProbabilityAnalysis();
            
            this.showNotification('🌤️ Weather analysis complete! Data updated.', 'success');
        } catch (error) {
            this.showNotification('Analysis failed: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    simulateNasaApiCall() {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    temperature: 22.5 + (Math.random() * 10 - 5),
                    precipitation: 15 + (Math.random() * 20),
                    humidity: 65 + (Math.random() * 20 - 10),
                    windspeed: 8 + (Math.random() * 6)
                });
            }, 2000);
        });
    }

    async updateWeatherDataWithAnimation() {
        const temp = 22.5 + (Math.random() * 10 - 5);
        const precip = 15 + (Math.random() * 20);
        const humidity = 65 + (Math.random() * 20 - 10);
        const wind = 8 + (Math.random() * 6);
        
        // Animate value changes
        await this.animateValue('temp-value', `${temp.toFixed(1)}°C`);
        await this.animateValue('precip-value', `${precip.toFixed(1)}mm`);
        await this.animateValue('humidity-value', `${humidity.toFixed(0)}%`);
        await this.animateValue('wind-value', `${wind.toFixed(1)}m/s`);
        
        // Update probabilities
        document.getElementById('temp-prob').textContent = `${Math.round(60 + Math.random() * 30)}% above normal`;
        document.getElementById('precip-prob').textContent = `${Math.round(40 + Math.random() * 40)}% chance rain`;
        document.getElementById('humidity-prob').textContent = `${Math.round(70 + Math.random() * 25)}% comfort level`;
        document.getElementById('wind-prob').textContent = `${Math.round(20 + Math.random() * 30)}% gust probability`;
    }

    animateValue(elementId, newValue) {
        return new Promise((resolve) => {
            const element = document.getElementById(elementId);
            element.classList.add('value-updating');
            
            setTimeout(() => {
                element.textContent = newValue;
                setTimeout(() => {
                    element.classList.remove('value-updating');
                    resolve();
                }, 300);
            }, 300);
        });
    }

    updateActivityRecommendations() {
        const hikingScore = Math.floor(20 + Math.random() * 80);
        const travelScore = Math.floor(20 + Math.random() * 80);
        
        this.updateActivityCard('hiking', hikingScore);
        this.updateActivityCard('travel', travelScore);
    }

    updateActivityCard(activity, score) {
        const card = document.getElementById(`${activity}-card`);
        const scoreElement = card.querySelector('.score-value');
        const scoreCircle = card.querySelector('.score-circle');
        const recElement = document.getElementById(`${activity}-rec`);
        
        // Animate score change
        this.animateScore(scoreElement, score);
        
        // Update score circle
        scoreCircle.style.background = `conic-gradient(var(--accent) 0% ${score}%, transparent ${score}% 100%)`;
        
        // Update recommendation message
        let message, icon, color;
        if (score >= 80) {
            message = '🎉 Perfect conditions! Ideal for this activity.';
            icon = 'fa-check-circle';
            color = '#10b981';
        } else if (score >= 60) {
            message = '👍 Good conditions. Generally suitable.';
            icon = 'fa-thumbs-up';
            color = '#f59e0b';
        } else if (score >= 40) {
            message = '⚠️ Fair conditions. Some limitations may apply.';
            icon = 'fa-exclamation-triangle';
            color = '#f59e0b';
        } else {
            message = '❌ Poor conditions. Not recommended at this time.';
            icon = 'fa-times-circle';
            color = '#ef4444';
        }
        
        recElement.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
        recElement.style.borderLeftColor = color;
        recElement.style.background = color + '20';
        
        // Animate factor bars
        this.animateFactorBars(activity, score);
        
        // Add hover effect
        card.style.transform = 'translateY(-5px)';
        setTimeout(() => {
            card.style.transform = 'translateY(0)';
        }, 500);
    }

    animateScore(element, targetScore) {
        let currentScore = parseInt(element.textContent) || 0;
        const increment = targetScore > currentScore ? 1 : -1;
        
        const timer = setInterval(() => {
            currentScore += increment;
            element.textContent = currentScore;
            
            if (currentScore === targetScore) {
                clearInterval(timer);
            }
        }, 20);
    }

    animateFactorBars(activity, overallScore) {
        const factors = document.querySelectorAll(`#${activity}-factors .factor-fill`);
        
        factors.forEach((factor, index) => {
            const delay = index * 200;
            const randomScore = Math.floor(overallScore * (0.8 + Math.random() * 0.4));
            
            setTimeout(() => {
                factor.style.width = `${randomScore}%`;
                factor.setAttribute('data-score', randomScore);
            }, delay);
        });
    }

    updateProbabilityAnalysis() {
        document.getElementById('temp-threshold').textContent = `${Math.round(60 + Math.random() * 30)}% > 30°C`;
        document.getElementById('precip-threshold').textContent = `${Math.round(40 + Math.random() * 40)}% heavy rain`;
        
        // Update charts with animation
        this.animateChartUpdate(this.charts.temperature, [65 + Math.random() * 20, 25, 10]);
        this.animateChartUpdate(this.charts.precipitation, [40 + Math.random() * 20, 35, 25]);
    }

    animateChartUpdate(chart, newData) {
        chart.data.datasets[0].data = newData;
        chart.update('active');
    }

    downloadPDFReport() {
        const reportData = {
            location: this.currentLocation,
            timestamp: new Date().toLocaleString(),
            weather: {
                temperature: document.getElementById('temp-value').textContent,
                precipitation: document.getElementById('precip-value').textContent,
                humidity: document.getElementById('humidity-value').textContent,
                wind: document.getElementById('wind-value').textContent
            },
            recommendations: {
                hiking: document.getElementById('hiking-rec').textContent,
                travel: document.getElementById('travel-rec').textContent
            },
            probabilities: {
                temperature: document.getElementById('temp-threshold').textContent,
                precipitation: document.getElementById('precip-threshold').textContent
            }
        };
        
        // Create PDF content
        const pdfContent = `
            TESSERACT EARTH OBSERVATION REPORT
            =================================
            
            Location: ${reportData.location.name}
            Coordinates: ${reportData.location.lat.toFixed(4)}, ${reportData.location.lng.toFixed(4)}
            Generated: ${reportData.timestamp}
            
            WEATHER SUMMARY
            ---------------
            Temperature: ${reportData.weather.temperature}
            Precipitation: ${reportData.weather.precipitation}
            Humidity: ${reportData.weather.humidity}
            Wind Speed: ${reportData.weather.wind}
            
            ACTIVITY RECOMMENDATIONS
            ------------------------
            Hiking: ${reportData.recommendations.hiking}
            Travel: ${reportData.recommendations.travel}
            
            PROBABILITY ANALYSIS
            --------------------
            ${reportData.probabilities.temperature}
            ${reportData.probabilities.precipitation}
            
            ---
            Generated by Tesseract NASA Dashboard
            Powered by NASA POWER API
        `;
        
        const blob = new Blob([pdfContent], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tesseract-report-${this.currentLocation.name.replace(/\s+/g, '-')}-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('📄 PDF report downloaded successfully!', 'success');
    }

    showLoading(show) {
        document.getElementById('loading-overlay').classList.toggle('active', show);
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation-triangle' : 'info'}"></i>
            <span>${message}</span>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: var(--shadow);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }
}

// Add CSS for Leaflet customizations
const leafletStyles = document.createElement('style');
leafletStyles.textContent = `
    /* Leaflet Map Container */
    .leaflet-container {
        background: var(--primary) !important;
        border-radius: var(--border-radius) !important;
    }
    
    /* Leaflet Controls */
    .leaflet-control-zoom a {
        background: var(--card-bg) !important;
        color: var(--text) !important;
        border: 1px solid var(--card-border) !important;
    }
    
    .leaflet-control-zoom a:hover {
        background: rgba(59, 130, 246, 0.1) !important;
    }
    
    /* Custom Marker */
    .custom-marker {
        position: relative;
        width: 40px;
        height: 40px;
    }
    
    .marker-pulse {
        position: absolute;
        top: 0;
        left: 0;
        width: 40px;
        height: 40px;
        background: rgba(59, 130, 246, 0.3);
        border-radius: 50%;
        animation: pulse 2s infinite;
    }
    
    .marker-pin {
        position: absolute;
        top: 4px;
        left: 4px;
        width: 32px;
        height: 32px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 14px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    
    @keyframes pulse {
        0% { transform: scale(0.8); opacity: 1; }
        70% { transform: scale(1.2); opacity: 0.7; }
        100% { transform: scale(0.8); opacity: 1; }
    }
    
    /* Remove Mapbox controls from HTML */
    .map-controls {
        display: none !important;
    }
`;
document.head.appendChild(leafletStyles);

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    new EarthObservationDashboard();
});