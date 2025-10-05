const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// NASA POWER API proxy endpoint
app.get('/api/nasa-power', async (req, res) => {
    try {
        const { lat, lon, start, end, parameters } = req.query;
        
        // NASA POWER API endpoint
        const nasaUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${parameters || 'T2M,PRECTOT,RH2M,WS2M'}&community=RE&longitude=${lon}&latitude=${lat}&start=${start}&end=${end}&format=JSON`;
        
        // In a real implementation, you would make the API call here
        // const response = await axios.get(nasaUrl);
        // res.json(response.data);
        
        // For now, return mock data
        res.json({
            properties: {
                parameter: {
                    T2M: { [start]: 22.5 },
                    PRECTOT: { [start]: 15.2 },
                    RH2M: { [start]: 65 },
                    WS2M: { [start]: 8.3 }
                }
            }
        });
        
    } catch (error) {
        console.error('NASA API Error:', error);
        res.status(500).json({ error: 'Failed to fetch NASA data' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Tesseract NASA Dashboard running on http://localhost:${PORT}`);
    console.log('🌍 Ready for Earth observation analysis!');
});