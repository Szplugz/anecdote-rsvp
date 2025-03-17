// API configuration
// Updated URL for Railway deployment with fallbacks
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
  'https://anecdote-rsvp-backend-production.up.railway.app' || 
  'https://anecdote-rsvp-production.up.railway.app';
