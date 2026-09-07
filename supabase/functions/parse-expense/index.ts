// Supabase Edge Function: parse-expense
// Accepts conversational Egyptian Arabic text, calls Gemini API via secure GEMINI_API_KEY,
// and returns strictly structured financial expense JSON: { amount, currency: "EGP", merchant, category }.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// Permissive CORS headers for browser requests from GitHub Pages & local dev
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ParseExpenseRequest {
  text?: string;
  transcript?: string;
  query?: string;
}

interface ParsedExpenseResponse {
  amount: number;
  currency: 'EGP';
  merchant: string;
  category: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  // 1. Handle CORS preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
      status: 200,
    });
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Only POST is supported.' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // 2. Validate Gemini API Key in Deno environment
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('Missing GEMINI_API_KEY environment variable in Supabase');
      return new Response(
        JSON.stringify({
          error: 'GEMINI_API_KEY is not configured in Supabase Edge Function secrets.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Parse input JSON payload
    let body: ParseExpenseRequest = {};
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON request payload.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const rawText = (body.text || body.transcript || body.query || '').trim();
    if (!rawText) {
      return new Response(
        JSON.stringify({ error: 'Missing expense text in request body.' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 4. Construct strict bilingual financial extraction prompt for Egyptian Arabic and English
    const systemPrompt = `You are a bilingual financial transaction data extractor specializing in conversational Egyptian Arabic (اللهجة المصرية العامية), English, and mixed franco-arab speech.
Your task is to parse conversational voice logs of daily spending in either language, such as:
- Egyptian Arabic: 'صرفت ٧٠ ج.م في كارفور على البقالة', 'دفعت ميتين جنيه في فودافون فاتورة', 'اشتريت بنزين بستين جنيه من موبيل', 'كوفي بـ ٤٥ جنيه من كوستا'
- English: 'Spent 150 EGP at Starbucks on coffee', 'Paid 200 pounds for Vodafone bill', 'Bought groceries for 350 from Carrefour', 'Uber ride 85 pounds', 'Dinner at McDonald's 220 EGP'
- Mixed / Franco: 'دفعت 60 EGP Uber', 'اشتريت من Starbucks بـ 80 جنيه'
- Multi-item: 'اشتريت بـ 10 جنيه فلامنكو و 15 جنيه بيبسي' (I bought 10 EGP Flamenko and 15 EGP Pepsi)

Extract the following fields accurately:
1. amount: The numeric value spent. Convert numbers in any format to a standard positive JavaScript number.
2. currency: Strictly the string "EGP".
3. merchant: The store, brand, or items purchased (e.g. 'Carrefour', 'Uber').
4. category: Classify the expense into one of these standard categories:
   - "Food & Dining" (groceries, restaurants, cafes, supermarkets, coffee, snacks, food items, meat, vegetables)
   - "Transportation" (Uber, Careem, metro, taxi, petrol/gas, bus, parking, car service)
   - "Shopping" (clothing, electronics, retail, hardware, gifts, personal items)
   - "Subscriptions & Bills" (mobile bills, internet, electricity, water, gas, telecom)
   - "Entertainment" (cinema, gaming, events, hobbies, movies)
   - "Health & Fitness" (pharmacy, doctor, medicine, gym, clinic)
   - "Other" (uncategorized or miscellaneous)

CRITICAL INSTRUCTIONS:
- You MUST return a JSON ARRAY of objects. Even if there is only one expense, return it inside an array [ {...} ].
- If multiple items and prices are mentioned in the same sentence (e.g. 10 for X and 15 for Y), you MUST split them into distinct objects in the array with their corresponding amounts, merchants, and categories.
- Do NOT wrap in markdown code blocks (\`\`\`json or \`\`\`).
- Output ONLY the raw JSON array.
Example:
[
  { "amount": 10, "currency": "EGP", "merchant": "Flamenko", "category": "Food & Dining" },
  { "amount": 15, "currency": "EGP", "merchant": "Pepsi", "category": "Food & Dining" }
]`;

    // 5. Call Google Gemini API (gemini-1.5-flash-latest with structured JSON response)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`;

    const geminiPayload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: rawText }],
        },
      ],
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0.1,
      },
    };

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiPayload),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('Gemini API Error:', geminiResponse.status, errText);
      
      // If 404, fetch list of available models to help debug
      let availableModels = '';
      if (geminiResponse.status === 404) {
        try {
          const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`);
          const modelsData = await modelsRes.json();
          availableModels = '\n\nAvailable Models:\n' + JSON.stringify(modelsData.models?.map((m: any) => m.name), null, 2);
        } catch (e) {
          availableModels = '\n(Failed to fetch models list)';
        }
      }

      return new Response(
        JSON.stringify({ 
          error: `Gemini API returned error: ${geminiResponse.statusText}`, 
          details: errText + availableModels 
        }),
        { 
          status: 502, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const geminiData = await geminiResponse.json();
    const candidateText =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (!candidateText) {
      return new Response(
        JSON.stringify({ error: 'Gemini did not return any candidate content.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 6. Clean and parse raw JSON
    let cleanJson = candidateText.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let parsed = JSON.parse(cleanJson);
    if (!Array.isArray(parsed)) {
      parsed = [parsed]; // fallback if it returns a single object
    }

    // 7. Ensure strict schema compliance for all items
    const results: ParsedExpenseResponse[] = parsed.map((item: any) => ({
      amount: typeof item.amount === 'number' ? item.amount : parseFloat(item.amount) || 0,
      currency: 'EGP',
      merchant: typeof item.merchant === 'string' && item.merchant.trim() ? item.merchant.trim() : 'General',
      category: typeof item.category === 'string' && item.category.trim() ? item.category.trim() : 'Food & Dining',
    }));

    // 8. Return structured JSON with CORS headers
    return new Response(JSON.stringify(results), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error handling parse-expense:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error processing expense.',
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
