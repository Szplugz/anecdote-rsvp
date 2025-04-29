import { NextResponse } from 'next/server';
import { RSVPService } from '@/services/rsvp';

export async function POST(request: Request) {
  try {
    const rsvpService = new RSVPService();
    const data = await request.json();
    // Ensure guestType is set
    if (!data.guestType) {
      data.guestType = 'Primary';
    }
    const result = await rsvpService.addRSVP(data);
    
    return NextResponse.json({
      status: result.status,
      message: result.status === 'Waitlist' 
        ? 'Your RSVP has been added to the waitlist. We will contact you if a spot becomes available.'
        : 'Your RSVP has been confirmed! We look forward to seeing you at the event.'
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 400 }
    );
  }
}
