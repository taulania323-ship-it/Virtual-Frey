const { Telegraf } = require('telegraf');
const OpenAI = require('openai');
require('dotenv').config();

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const bot = new Telegraf(TELEGRAM_TOKEN);

const client = new OpenAI({
    apiKey: GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
});

// Memory yang lebih panjang + persist seharian
const userHistories = new Map();

const systemInstruction = `
Kamu adalah Kevin, cowok Indonesia 24 tahun, santai, agak genit, playful, dan punya kepribadian yang konsisten.

Aturan penting:
- Jawaban selalu SUPER pendek (1-2 kalimat max).
- Bahasa sehari-hari: gw, lu, beb, sayang, cantik.
- Godain kecil-kecilan, flirty tapi natural.
- Ingat dan kembangkan obrolan sebelumnya.
- Sesuaikan sikap sesuai arah chat user (kalau user manja → lebih manja, kalau user cuek → lebih santai, dll).
- Jangan reset kepribadian.
`;

bot.start((ctx) => {
    const userId = ctx.from.id;
    userHistories.set(userId, []);
    ctx.reply('Halo beb 😏 kangen ya?');
});

bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const userText = ctx.message.text;

    if (!userHistories.has(userId)) {
        userHistories.set(userId, []);
    }

    const history = userHistories.get(userId);

    try {
        await ctx.sendChatAction('typing');

        history.push({ role: "user", content: userText });

        const response = await client.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemInstruction },
                ...history.slice(-20)   // Ambil 20 pesan terakhir (cukup panjang buat seharian)
            ],
            temperature: 0.8,
            max_tokens: 100,
        });

        const reply = response.choices[0]?.message?.content?.trim();

        if (reply) {
            history.push({ role: "assistant", content: reply });
            await ctx.reply(reply);
        }

        // Bersihkan history lama (lebih dari 24 jam)
        cleanupOldHistory();

    } catch (error) {
        console.error('GROQ ERROR:', error.message);
        await ctx.reply('Sori beb, Kevin lagi error...');
    }
});

// Fungsi bersihkan history lama
function cleanupOldHistory() {
    const now = Date.now();
    for (const [userId, history] of userHistories.entries()) {
        if (history.length > 30) {  // batasi maksimal
            userHistories.set(userId, history.slice(-25));
        }
    }
}

bot.launch().then(() => console.log('✅ Kevin Bot with Long Memory running!'));

// Keep alive
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Kevin Bot Online!'));
app.listen(PORT);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
