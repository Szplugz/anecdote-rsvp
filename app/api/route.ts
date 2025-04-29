import { NextRequest, NextResponse } from 'next/server';
import { RSVPService } from '../../../services/rsvp';
import { RSVPData } from '../../../types/notion';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json() as RSVPData;
    const rsvpService = new RSVPService();
    const response = await rsvpService.addRSVP(data);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error adding RSVP:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 400 }
    );
  }
}
