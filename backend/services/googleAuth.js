import { OAuth2Client } from "google-auth-library";

export const googleClient = new OAuth2Client();

export async function verifyGoogleCredential(credential) {
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
}
