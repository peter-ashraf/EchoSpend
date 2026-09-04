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

    // 4. Construct strict financial extraction prompt for Egyptian Arabic
    const systemPrompt = `You are a financial transaction data extractor specializing in conversational Egyptian Arabic (اللهجة المصرية العامية) and Arabic numerals.
Your task is to parse conversational voice logs of daily spending (such as: 'صرفت ٧٠ ج.م في كارفور على البقالة', 'دفعت ميتين جنيه في فودافون فاتورة', 'اشتريت بنزين بستين جنيه من موبيل', 'كوفي بـ ٤٥ جنيه من كوستا').

Extract the following fields accurately:
1. amount: The numeric value spent. Convert Eastern Arabic numerals (٠, ١, ٢, ٣, ٤, ٥, ٦, ٧, ٨, ٩) and Egyptian verbal numbers ('سبعين' -> 70, 'ميتين' / 'مائتين' -> 200, 'خمسين' -> 50, 'ألف' -> 1000, 'ألف ونص' -> 1500, 'باكو' -> 1000, 'نص باكو' -> 500) into a standard positive JavaScript number.
2. currency: Strictly the string "EGP".
3. merchant: The store, brand, or service name if mentioned (e.g., 'كارفور', 'فودافون', 'أوبر', 'سوبرماركت', 'صيدلية العزبي', 'كوستا', 'بنزينة'). If not explicitly mentioned, provide a short descriptive vendor or 'General'.
4. category: Classify the expense into one of these standard categories:
   - "Food & Dining" (groceries, restaurants, cafes, supermarkets, food items, meat, vegetables, coffee)
   - "Transportation" (Uber, Careem, metro, taxi, petrol/gas, bus, parking)
   - "Shopping" (clothing, electronics, retail, hardware, gifts, personal items)
   - "Subscriptions & Bills" (mobile bills, internet, electricity, water, gas, telecom, Vodafone, Orange, WE, Etisalat)
   - "Entertainment" (cinema, gaming, events, hobbies)
   - "Health & Fitness" (pharmacy, doctor, medicine, gym, clinic)
   - "Other" (uncategorized or miscellaneous)

CRITICAL INSTRUCTIONS:
- You MUST return ONLY a raw, valid JSON object matching this exact schema:
  {
    "amount": number,
    "currency": "EGP",
    "merchant": string,
    "category": string
  }
- Do NOT wrap in markdown code blocks (\`\`\`json or \`\`\`).
- Do NOT output any preamble, comments, or explanations.
- Output ONLY the raw JSON object.`;

    // 5. Call Google Gemini API (gemini-1.5-flash with structured JSON response)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

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
      return new Response(
        JSON.stringify({
          error: `Gemini API returned error: ${geminiResponse.statusText}`,
          details: errText,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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

    const parsed = JSON.parse(cleanJson);

    // 7. Ensure strict schema compliance
    const result: ParsedExpenseResponse = {
      amount: typeof parsed.amount === 'number' ? parsed.amount : parseFloat(parsed.amount) || 0,
      currency: 'EGP',
      merchant: typeof parsed.merchant === 'string' && parsed.merchant.trim() ? parsed.merchant.trim() : 'General',
      category: typeof parsed.category === 'string' && parsed.category.trim() ? parsed.category.trim() : 'Food & Dining',
    };

    // 8. Return structured JSON with CORS headers
    return new Response(JSON.stringify(result), {
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
