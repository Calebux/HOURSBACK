const BASE_URL = process.env.SMOKE_BASE_URL || 'https://www.hoursback.xyz';

const routes = [
  '/',
  '/auth/callback?code=smoke-test&next=%2Fhome',
  '/home',
  '/capture',
  '/operations',
  '/workflows',
  '/whatsapp',
  '/orders',
  '/settings',
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function fetchText(path) {
  const url = new URL(path, BASE_URL);
  const response = await fetch(url, { redirect: 'follow' });
  const text = await response.text();
  return { url: response.url, status: response.status, text };
}

for (const route of routes) {
  const { url, status, text } = await fetchText(route);

  assert(status >= 200 && status < 300, `${route} returned HTTP ${status}`);
  assert(text.includes('<div id="root"></div>'), `${route} did not return the SPA shell`);
  assert(!text.includes('src="./assets/'), `${route} uses relative script assets`);
  assert(!text.includes('href="./assets/'), `${route} uses relative stylesheet assets`);
  assert(!text.includes('access_token='), `${route} HTML contains access_token`);
  assert(!text.includes('refresh_token='), `${route} HTML contains refresh_token`);
  assert(!text.includes('provider_token='), `${route} HTML contains provider_token`);

  console.log(`ok ${route} -> ${url}`);
}

console.log(`Production smoke checks passed for ${BASE_URL}`);
