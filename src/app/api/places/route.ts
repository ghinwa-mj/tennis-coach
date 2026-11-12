import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query');
  const location = searchParams.get('location');
  const radius = searchParams.get('radius');
  const type = searchParams.get('type');

  const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  try {
    let url = '';

    // If we have a query, use Places Text Search
    if (query) {
      url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
      console.log('Text Search URL:', url);
    }
    // If we have location and radius, use Nearby Search
    else if (location && radius) {
      const searchType = type || 'tennis_court';
      const keyword = searchParams.get('keyword') || 'tennis';
      url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location}&radius=${radius}&type=${searchType}&keyword=${encodeURIComponent(keyword)}&key=${apiKey}`;
      console.log('Nearby Search URL:', url);
      console.log('Search type:', searchType, 'Keyword:', keyword);
    }
    // Otherwise, use Geocoding
    else {
      const address = searchParams.get('address');
      if (!address) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
      }
      url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    // Log the response for debugging
    if (data.results) {
      console.log(`Places API returned ${data.results.length} results`);
      if (data.results.length > 0) {
        console.log('First result types:', data.results[0].types);
        console.log('First result name:', data.results[0].name);
      }
    }

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google API error:', data);
      return NextResponse.json(
        { error: data.error_message || data.status, status: data.status },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Places API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch places data' },
      { status: 500 }
    );
  }
}
