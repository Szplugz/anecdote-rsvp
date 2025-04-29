import { RSVPService } from "../services/rsvp";
import { RSVPData } from "../types/notion";

jest.setTimeout(30000); // Set global timeout to 30 seconds

describe("RSVP System", () => {
  let rsvpService: RSVPService;

  beforeEach(async () => {
    rsvpService = new RSVPService();
    await rsvpService.clearAllRSVPs();
  });

  describe("Duplicate Prevention", () => {
    it("should reject RSVP with duplicate email", async () => {
      const rsvpData: RSVPData = {
        name: "Test User",
        email: "test@example.com",
        phone: "123-456-7890",
        about: "Test about",
        guestType: "Primary",
      };

      await rsvpService.addRSVP(rsvpData);

      const duplicateData: RSVPData = {
        name: "Another User",
        email: "test@example.com", // Same email
        phone: "987-654-3210",
        about: "Another test",

        guestType: "Primary",
      };

      await expect(rsvpService.addRSVP(duplicateData)).rejects.toThrow(
        "This email is already registered"
      );
    });

    it("should reject RSVP with duplicate phone", async () => {
      const rsvpData: RSVPData = {
        name: "Test User",
        email: "test@example.com",
        phone: "123-456-7890",
        about: "Test about",
        guestType: "Primary",
      };

      await rsvpService.addRSVP(rsvpData);

      const duplicateData: RSVPData = {
        name: "Another User",
        email: "another@example.com",
        phone: "123-456-7890", // Same phone
        about: "Another test",

        guestType: "Primary",
      };

      await expect(rsvpService.addRSVP(duplicateData)).rejects.toThrow(
        "This phone is already registered"
      );
    });

    it("should accept RSVP with unique email and phone", async () => {
      const rsvpData: RSVPData = {
        name: "Test User",
        email: "test@example.com",
        phone: "123-456-7890",
        about: "Test about",
        guestType: "Primary",
      };

      await expect(rsvpService.addRSVP(rsvpData)).resolves.toBeDefined();
    });

    it("should check duplicates across all days", async () => {
      const testRSVP: RSVPData = {
        name: "Test User",
        email: "test@example.com",
        phone: "123-456-7890",
        about: "Test about",
        guestType: "Primary",
      };

      await rsvpService.addRSVP(testRSVP);

      const anotherRSVP: RSVPData = {
        name: "Another User",
        email: "test@example.com", // Same email
        phone: "987-654-3210",
        about: "Another test",
        guestType: "Primary",
      };

      await expect(rsvpService.addRSVP(anotherRSVP)).rejects.toThrow(
        "This email is already registered"
      );
    });
  });

  describe("Total RSVP Limit", () => {
    it("should accept RSVP when total count is below limit", async () => {
      const rsvpData: RSVPData = {
        name: "Test User",
        email: "test@example.com",
        phone: "123-456-7890",
        about: "Test about",
        guestType: "Primary",
      };

      await expect(rsvpService.addRSVP(rsvpData)).resolves.toBeDefined();
    });

    it("should reject RSVP when total count would exceed limit", async () => {
      // Add RSVPs up to the limit
      for (let i = 0; i < 5; i++) {
        const rsvpData: RSVPData = {
          name: `Test User ${i}`,
          email: `test${i}@example.com`,
          phone: `123-456-${i}`,
          about: "Test about",

          guestType: "Primary",
        };

        await rsvpService.addRSVP(rsvpData);
      }

      // Try to add one more
      const extraRSVP: RSVPData = {
        name: "Extra User",
        email: "extra@example.com",
        phone: "999-999-9999",
        about: "Extra test",

        guestType: "Primary",
      };

      await expect(rsvpService.addRSVP(extraRSVP)).rejects.toThrow(
        "RSVP limit"
      );
    });

    it("should handle multiple guests in single RSVP against limit", async () => {
      // Add a primary RSVP with multiple guests
      const primaryRSVP: RSVPData = {
        name: "Primary User",
        email: "primary@example.com",
        phone: "123-456-7890",
        about: "Primary test",
        guestType: "Primary",
        guests: [
          {
            name: "Guest 1",
            email: "guest1@example.com",
            phone: "123-456-7891",
            about: "Guest 1 info",
          },
          {
            name: "Guest 2",
            email: "guest2@example.com",
            phone: "123-456-7892",
            about: "Guest 2 info",
          },
          {
            name: "Guest 3",
            email: "guest3@example.com",
            phone: "123-456-7893",
            about: "Guest 3 info",
          },
        ], // 4 total guests
      };

      await rsvpService.addRSVP(primaryRSVP);

      // Try to add another RSVP that would exceed the limit
      const extraRSVP: RSVPData = {
        name: "Extra User",
        email: "extra@example.com",
        phone: "999-999-9999",
        about: "Extra test",
        guestType: "Primary",
        guests: [
          {
            name: "Guest 4",
            email: "guest4@example.com",
            phone: "123-456-7894",
            about: "Guest 4 info",
          },
          {
            name: "Guest 5",
            email: "guest5@example.com",
            phone: "123-456-7895",
            about: "Guest 5 info",
          },
        ], // 3 more guests
      };

      await expect(rsvpService.addRSVP(extraRSVP)).rejects.toThrow(
        "RSVP limit"
      );
    });
  });
});
