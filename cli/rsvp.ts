#!/usr/bin/env node

import { config } from "dotenv";
import { RSVPService } from "../services/rsvp";

config();
import { RSVPData, RSVPGuest } from "../types/notion";
import * as readline from "readline";
import { stdin as input, stdout as output } from "process";

const rl = readline.createInterface({ input, output });

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  // Only allow digits, spaces, dashes, and parentheses in input
  if (!/^[\d\s\-()]+$/.test(phone)) {
    return false;
  }
  // Extract just the digits
  const digits = phone.replace(/\D/g, "");
  // Must have exactly 10 digits
  return digits.length === 10;
};

const formatPhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
};

async function promptForGuest(
  isPrimary: boolean = false
): Promise<RSVPData | RSVPGuest> {
  console.log(
    `\n${isPrimary ? "Primary Guest" : "Additional Guest"} Information:`
  );

  let name = await question("Name: ");
  while (!name.trim()) {
    console.log("Name is required.");
    name = await question("Name: ");
  }

  let email = await question("Email: ");
  while (!validateEmail(email)) {
    console.log("Please enter a valid email address.");
    email = await question("Email: ");
  }

  console.log("\nPhone number must have exactly 10 digits");
  console.log("Accepted formats:");
  console.log("  • (123) 456-7890");
  console.log("  • 123-456-7890");
  console.log("  • 1234567890");
  let phone = await question("Phone: ");
  while (!validatePhone(phone)) {
    console.log("Please enter a valid phone number.");
    console.log("\nPhone number must have exactly 10 digits");
    console.log("Accepted formats:");
    console.log("  • (123) 456-7890");
    console.log("  • 123-456-7890");
    console.log("  • 1234567890");
    phone = await question("Phone: ");
  }

  console.log("\nTell us about yourself");
  console.log(
    "This helps us plan better and make the event more enjoyable for everyone!"
  );
  let about = await question("About: ");
  while (!about.trim()) {
    console.log("This field is required.");
    console.log("\nTell us about yourself");
    console.log(
      "This helps us plan better and make the event more enjoyable for everyone!"
    );
    about = await question("About: ");
  }

  const guest = {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: formatPhone(phone),
    about: about.trim(),
  };

  if (isPrimary) {
    return {
      ...guest,
      guestType: "Primary" as const,
    };
  }

  return guest;
}

async function main() {
  try {
    const rsvpService = new RSVPService();

    console.log("Welcome to the RSVP System!");
    console.log("Please provide your information below.");
    const primaryGuest = (await promptForGuest(true)) as RSVPData;

    const addMoreGuests = await question(
      "\nWould you like to add additional guests? (y/n): "
    );
    const guests: RSVPGuest[] = [];

    if (addMoreGuests.toLowerCase() === "y") {
      let addAnother = true;
      while (addAnother) {
        const guest = (await promptForGuest()) as RSVPGuest;
        guests.push(guest);

        const another = await question("\nAdd another guest? (y/n): ");
        addAnother = another.toLowerCase() === "y";
      }
      primaryGuest.guests = guests;
    }

    console.log("\nSubmitting RSVP...");
    const result = await rsvpService.addRSVP(primaryGuest);
    if (result.status === "Waitlist") {
      console.log("\nYour RSVP has been added to the waitlist.");
      console.log("We will contact you if a spot becomes available.");
    } else {
      console.log("\nYour RSVP has been confirmed!");
      console.log("We look forward to seeing you at the event.");
    }
  } catch (error) {
    console.error(
      "Error:",
      error instanceof Error ? error.message : "An unknown error occurred"
    );
  } finally {
    rl.close();
  }
}

main();
