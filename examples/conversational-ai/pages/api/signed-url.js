import fetch from 'node-fetch';

export default async function handler(req, res) {
    // Налаштовуємо CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    console.log('API Route викликано');

    // Опрацьовуємо OPTIONS запит
    if (req.method === 'OPTIONS') {
        return res.status(200).json({});
    }

    try {
        console.log('Перевірка змінних середовища:', {
            hasApiKey: !!process.env.XI_API_KEY,
            hasAgentId: !!process.env.AGENT_ID
        });

        if (!process.env.XI_API_KEY || !process.env.AGENT_ID) {
            throw new Error('Missing API key or Agent ID');
        }

        const url = `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${process.env.AGENT_ID}`;
        console.log('Sending request to:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'xi-api-key': process.env.XI_API_KEY,
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('ElevenLabs API error:', errorText);
            throw new Error(`API responded with status ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log('Success response:', data);
        return res.json({ signedUrl: data.signed_url });
        
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ error: error.message });
    }
} 