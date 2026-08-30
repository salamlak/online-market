import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { query, imageBase64, products } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured in .env.local' },
        { status: 500 }
      );
    }

    // System prompt instructing Gemini to match user request against product catalog
    const promptText = `
You are an intelligent e-commerce product search assistant for Salama Market.
You are given a product catalog in JSON format below:
${JSON.stringify(products, null, 2)}

User Search Query / Request: "${query || 'Identify the product in the image and find matching items'}"

Your Task:
1. Analyze the user query and/or the uploaded image carefully.
2. Select the matching product IDs from the catalog that best fit what the user is looking for.
3. Return ONLY a valid JSON object in this exact format (no markdown, no backticks, no extra text):
{
  "matchedIds": ["p1", "p2"],
  "reasoning": "Brief 1-sentence explanation of why these match"
}
`;

    // Prepare contents payload for Gemini 2.5 Flash
    const contentsParts: any[] = [];

    if (imageBase64) {
      // Clean base64 header if present
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      contentsParts.push({
        inline_data: {
          mime_type: 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    contentsParts.push({ text: promptText });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: contentsParts }],
        }),
      }
    );

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean up response if wrapped in backticks
    const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanedText);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI Search Error:', error);
    return NextResponse.json({ error: 'Failed to process AI search' }, { status: 500 });
  }
}
