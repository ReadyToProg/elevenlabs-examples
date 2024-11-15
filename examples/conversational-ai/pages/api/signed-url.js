import fetch from 'node-fetch';

export const config = {
  runtime: 'edge', // це важливо для Vercel Edge Functions
};

export default async function handler(req) {
  // Логуємо запит
  console.log('API Route triggered');

  // Підготовка відповіді з CORS headers
  const headers = {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS,POST',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Обробка OPTIONS запиту
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204,
      headers 
    });
  }

  try {
    const XI_API_KEY = process.env.XI_API_KEY;
    const AGENT_ID = process.env.AGENT_ID;

    if (!XI_API_KEY || !AGENT_ID) {
      throw new Error('Missing required environment variables');
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${AGENT_ID}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': XI_API_KEY,
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data }), 
        { 
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            ...headers
          }
        }
      );
    }

    return new Response(
      JSON.stringify({ signedUrl: data.signed_url }), 
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }
    );

  } catch (error) {
    console.error('Server error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message
      }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      }
    );
  }
} 