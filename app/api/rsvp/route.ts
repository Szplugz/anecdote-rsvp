import { NextRequest, NextResponse } from 'next/server';
import { addMultipleRSVPsToNotion, RSVPData } from '@/lib/notion';

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    if (!body || !body.day || !body.formData || !Array.isArray(body.formData)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      );
    }

    const { day, formData } = body;
    
    // Validate that we have at least one form entry
    if (formData.length === 0) {
      return NextResponse.json(
        { error: 'No form data provided' },
        { status: 400 }
      );
    }

    // Extract primary contact (first person) and friends
    const primaryContact = formData[0];
    const friends = formData.slice(1);

    // Validate primary contact data
    if (!primaryContact.name || !primaryContact.email || !primaryContact.phone || !primaryContact.about) {
      return NextResponse.json(
        { error: 'Primary contact information is incomplete' },
        { status: 400 }
      );
    }

    // Create primary contact data object
    const primaryData: RSVPData = {
      name: primaryContact.name,
      email: primaryContact.email,
      phone: primaryContact.phone,
      about: primaryContact.about,
      day: day,
      guestType: 'Primary',
    };

    // Create friends data objects
    const friendsData: RSVPData[] = friends.map((friend: any) => ({
      name: friend.name || 'Unknown',
      email: friend.email || '',
      phone: friend.phone || '',
      about: friend.about || '',
      day: day,
      guestType: 'Friend',
    }));

    // Add to Notion
    const result = await addMultipleRSVPsToNotion(primaryData, friendsData);

    return NextResponse.json(
      { 
        success: true, 
        message: 'RSVP submitted successfully',
        data: result
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error processing RSVP:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process RSVP',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
