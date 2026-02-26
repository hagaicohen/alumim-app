const DEFAULTS = {
  single:       1838,
  single80:     1941,
  couple:       2762,
  couple80:     2865,
  singleChild1: 2419,
  coupleChild1: 3343,
  singleChild2: 3000,
  coupleChild2: 3924,
};

export default async () => {
  try {
    const res = await fetch(
      'https://www.btl.gov.il/benefits/old_age/Shum/Pages/Shum.aspx',
      {
        headers: {
          'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept':          'text/html,application/xhtml+xml',
          'Accept-Language': 'he-IL,he;q=0.9',
        },
      }
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();

    // Strip scripts/styles/tags, normalize whitespace
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&[^;]{1,10};/g, ' ')
      .replace(/\s+/g, ' ');

    // Find the section of the page that contains the pension table
    const markers = ['יחיד/ה', 'הרכב משפחה', 'סכום הקצבה'];
    let section = '';
    for (const marker of markers) {
      const idx = text.indexOf(marker);
      if (idx >= 0) {
        section = text.substring(idx, idx + 3000);
        break;
      }
    }

    if (!section) throw new Error('Table section not found');

    // Extract all amounts in the expected range (1500–5000 ₪)
    const amounts = [];
    const numRegex = /\b(\d{1,2},\d{3})\b/g;
    let m;
    while ((m = numRegex.exec(section)) !== null) {
      const n = parseInt(m[1].replace(',', ''), 10);
      if (n >= 1500 && n <= 5000) amounts.push(n);
    }

    if (amounts.length < 8) throw new Error(`Only found ${amounts.length} amounts`);

    return new Response(
      JSON.stringify({
        single:       amounts[0],
        single80:     amounts[1],
        couple:       amounts[2],
        couple80:     amounts[3],
        singleChild1: amounts[4],
        coupleChild1: amounts[5],
        singleChild2: amounts[6],
        coupleChild2: amounts[7],
      }),
      {
        status: 200,
        headers: {
          'Content-Type':  'application/json',
          'Cache-Control': 'public, max-age=3600',
        },
      }
    );
  } catch (e) {
    console.error('BTL fetch/parse failed:', e.message, '— using defaults');
    return new Response(JSON.stringify(DEFAULTS), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
