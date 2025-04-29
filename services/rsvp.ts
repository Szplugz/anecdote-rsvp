import { DataStore, RSVPData, DuplicateCheckResult, RSVPStatus } from '../types/notion';
import { NotionStore } from '../stores/notion';

export class RSVPService {
  private store: DataStore;
  private readonly GUEST_LIMIT = 5; // Using smaller limit for testing

  constructor(store?: DataStore) {
    this.store = store || new NotionStore();
  }

  async addRSVP(data: RSVPData): Promise<{ id: string; status: RSVPStatus }> {
    // Check for duplicates first
    const duplicateCheck = await this.store.checkForDuplicates(data.email, data.phone);
    if (duplicateCheck.isDuplicate) {
      throw new Error(`This ${duplicateCheck.field} is already registered`);
    }

    // Check total RSVP count
    const totalGuests = await this.store.getTotalGuests();
    const newGuests = this.countNewGuests(data);

    if (totalGuests + newGuests > this.GUEST_LIMIT) {
      data.status = 'Waitlist';
    } else {
      data.status = 'Confirmed';
    }

    // Create the RSVP
    const result = await this.store.createRSVP(data);
    return result;
  }

  private countNewGuests(data: RSVPData): number {
    // Count primary guest
    let count = 1;

    // Add additional guests if this is a primary contact
    if (data.guestType === 'Primary' && data.guests) {
      count += data.guests.length;
    }

    return count;
  }

  async clearAllRSVPs() {
    await this.store.deleteAllRSVPs();
  }
}
