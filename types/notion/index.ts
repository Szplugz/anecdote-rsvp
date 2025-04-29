import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export type RSVPStatus = 'Confirmed' | 'Waitlist';

export interface RSVPData {
  name: string;
  email: string;
  phone: string;
  about: string;
  guestType: 'Primary' | 'Friend';
  primaryContact?: string;
  guests?: RSVPGuest[];
  status?: RSVPStatus;
}

export interface RSVPGuest {
  name: string;
  email: string;
  phone: string;
  about: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  field: string | null;
}

export interface DataStore {
  getTotalGuests(): Promise<number>;
  checkForDuplicates(email: string, phone: string): Promise<DuplicateCheckResult>;
  createRSVP(data: RSVPData): Promise<{ id: string; status: RSVPStatus }>;
  deleteAllRSVPs(): Promise<void>;
}
