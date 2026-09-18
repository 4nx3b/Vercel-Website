export async function onRequestGet({ env }) {
  return Response.json({ googleClientId: env.GOOGLE_CLIENT_ID || '' });
}
