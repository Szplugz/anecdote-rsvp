import { Client } from '@notionhq/client';

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const databaseId = process.env.NOTION_DATABASE_ID;

export interface RSVPData {
  name: string;
  email: string;
  phone: string;
  about: string;
  day: 'thursday' | 'friday' | 'saturday';
  guestType: 'Primary' | 'Friend';
  primaryContact?: string;
  guests?: string[];
}

export async function addRSVPToNotion(data: RSVPData) {
  try {
    if (!databaseId) {
      throw new Error('Database ID is not defined');
    }

    // Create properties object for Notion
    const properties: any = {
      Name: {
        title: [
          {
            text: {
              content: data.name,
            },
          },
        ],
      },
      Email: {
        email: data.email || null,
      },
      Phone: {
        phone_number: data.phone || null,
      },
      About: {
        rich_text: [
          {
            text: {
              content: data.about || '',
            },
          },
        ],
      },
      Day: {
        select: {
          name: data.day.charAt(0).toUpperCase() + data.day.slice(1),
        },
      },
      "Guest Type": {
        select: {
          name: data.guestType,
        },
      },
    };

    // Add primary contact if this is a friend
    if (data.guestType === 'Friend' && data.primaryContact) {
      properties["Primary Contact"] = {
        rich_text: [
          {
            text: {
              content: data.primaryContact,
            },
          },
        ],
      };
    }

    // Add guests if this is a primary contact
    if (data.guestType === 'Primary' && data.guests && data.guests.length > 0) {
      properties["Guests"] = {
        rich_text: [
          {
            text: {
              content: data.guests.join(', '),
            },
          },
        ],
      };
    }

    // Create page in Notion database
    const response = await notion.pages.create({
      parent: {
        database_id: databaseId,
      },
      properties,
    });

    return response;
  } catch (error) {
    console.error('Error adding RSVP to Notion:', error);
    throw error;
  }
}

export async function addMultipleRSVPsToNotion(primaryData: RSVPData, friendsData: RSVPData[] = []) {
  try {
    // Add primary contact first
    const primaryResponse = await addRSVPToNotion({
      ...primaryData,
      guestType: 'Primary',
      guests: friendsData.map(friend => friend.name),
    });

    // Add friends with reference to primary contact
    const friendResponses = await Promise.all(
      friendsData.map(friend => 
        addRSVPToNotion({
          ...friend,
          guestType: 'Friend',
          primaryContact: primaryData.name,
        })
      )
    );

    return {
      primary: primaryResponse,
      friends: friendResponses,
    };
  } catch (error) {
    console.error('Error adding multiple RSVPs to Notion:', error);
    throw error;
  }
}
