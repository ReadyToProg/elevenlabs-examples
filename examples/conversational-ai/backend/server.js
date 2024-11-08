const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../dist')));

app.get('/api/signed-url', async (req, res) => {
    try {
        if (!process.env.XI_API_KEY || !process.env.AGENT_ID) {
            throw new Error('Missing API key or Agent ID');
        }

        const response = await fetch(
            `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${process.env.AGENT_ID}`,
            {
                method: 'GET',
                headers: {
                    'xi-api-key': process.env.XI_API_KEY,
                }
            }
        );

        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }

        const data = await response.json();
        res.json({ signedUrl: data.signed_url });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});