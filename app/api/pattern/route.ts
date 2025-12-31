import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const patternName = searchParams.get('name');

  if (!patternName) {
    return NextResponse.json({ error: 'Pattern name required' }, { status: 400 });
  }

  try {
    // Proxy the SVG request to bypass CORS
    const svgUrl = `https://cdn.architextures.org/patterns/${patternName}.svg`;
    const response = await fetch(svgUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pattern: ${response.status}`);
    }

    const svgText = await response.text();

    // Return SVG with proper CORS headers
    return new NextResponse(svgText, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error fetching pattern:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pattern' },
      { status: 500 }
    );
  }
}

