import fetch from 'node-fetch';

export default async function handler(req, res) {
    // Додаємо детальне логування
    console.log('API Route triggered', {
        method: req.method,
        headers: req.headers,
        env: {
            hasApiKey: !!process.env.XI_API_KEY,
            hasAgentId: !!process.env.AGENT_ID
        }
    });

    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        if (!process.env.XI_API_KEY || !process.env.AGENT_ID) {
            throw new Error('Missing required environment variables');
        }

        const elevenlabsResponse = await fetch(
            `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${process.env.AGENT_ID}`,
            {
                method: 'GET',
                headers: {
                    'xi-api-key': process.env.XI_API_KEY,
                }
            }
        );

        const data = await elevenlabsResponse.json();
        
        if (!elevenlabsResponse.ok) {
            console.error('ElevenLabs API error:', data);
            return res.status(elevenlabsResponse.status).json(data);
        }

        return res.status(200).json({ signedUrl: data.signed_url });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ 
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
} 