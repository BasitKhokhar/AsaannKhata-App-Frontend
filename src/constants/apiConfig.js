// Backend has NO /api prefix — routes are mounted at root (see app.js).
//
// 10.0.2.2 is the standard alias the Android emulator uses to reach the
// host machine's localhost. For a physical device, replace this with your
// machine's LAN IP (e.g. http://192.168.1.50:5000) — Wi-Fi must be on the
// same network. For production, point this at your deployed API domain.
export const API_BASE_URL = 'http://10.0.2.2:5000';
