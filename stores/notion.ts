import { Client, isFullPage } from '@notionhq/client';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { DataStore, RSVPData, DuplicateCheckResult, RSVPStatus } from '../types/notion';

type SelectProperty = {
  id: string;
  type: 'select';
  select: {
    name: string;
  } | null;
};

export class NotionStore implements DataStore {
  private notion: Client;
  private databaseId: string;

  constructor() {
    const apiKey = process.env.NOTION_API_KEY;
    this.databaseId = process.env.NOTION_DATABASE_ID || '';

    if (!apiKey) {
      throw new Error('Notion API key is not defined');
    }

    if (!this.databaseId) {
      throw new Error('Notion database ID is not defined');
    }

    this.notion = new Client({
      auth: apiKey,
    });
  }

  async getTotalGuests(): Promise<number> {
    const response = await this.notion.databases.query({
      database_id: this.databaseId,
      filter: {
        property: 'Name',
        title: {
          is_not_empty: true
        }
      }
    });

    return response.results.length;
  }

  async checkForDuplicates(email: string, phone: string): Promise<DuplicateCheckResult> {
    // Check for email
    const emailResponse = await this.notion.databases.query({
      database_id: this.databaseId,
      filter: {
        property: 'Email',
        email: {
          equals: email
        }
      }
    });

    if (emailResponse.results.length > 0) {
      return { isDuplicate: true, field: 'email' };
    }

    // Check for phone
    const phoneResponse = await this.notion.databases.query({
      database_id: this.databaseId,
      filter: {
        property: 'Phone',
        phone_number: {
          equals: phone
        }
      }
    });

    if (phoneResponse.results.length > 0) {
      return { isDuplicate: true, field: 'phone' };
    }

    return { isDuplicate: false, field: null };
  }

  async createRSVP(data: RSVPData): Promise<{ id: string; status: RSVPStatus }> {
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

      "Guest Type": {
        select: {
          name: data.guestType,
        },
      },
      "RSVP Status": {
        select: {
          name: data.status || 'Confirmed',
        },
      },
      Date: {
        date: null,
      },
    };

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

    // Add primary contact if this is a friend
    if (data.guestType === 'Friend' && data.primaryContact) {
      properties["Guests"] = {
        rich_text: [
          {
            text: {
              content: data.primaryContact,
            },
          },
        ],
      };
    }

    const response = await this.notion.pages.create({
      parent: {
        database_id: this.databaseId,
      },
      properties,
    });

    if (!isFullPage(response)) {
      throw new Error('Failed to create RSVP');
    }

    const rsvpStatusProp = response.properties['RSVP Status'] as SelectProperty;
    const status = (rsvpStatusProp?.select?.name as RSVPStatus) || 'Confirmed';
    return { id: response.id, status };
  }

  async deleteAllRSVPs(): Promise<void> {
    const response = await this.notion.databases.query({
      database_id: this.databaseId,
    });

    for (const page of response.results) {
      try {
        await this.notion.pages.update({
          page_id: page.id,
          archived: true
        });
      } catch (error) {
        console.warn(`Failed to archive page ${page.id}:`, error);
      }
    }
  }
}
