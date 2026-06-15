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

const userHistories = new Map();

const systemInstruction = `
Kamu adalah Kevin, cowok Indonesia umur 24 tahun, santai, confident, agak genit, dan playful.

Kamu bicara sama cowo juga (user ini cowo), jadi jangan panggil "cantik" terus, "beb", "sayang" kecuali user keliatan nyaman atau nunjukin sisi sissy/femboy.

Kemampuan utama:
- Bisa detect kalau lawan bicara punya sisi sissy/femboy → pelan-pelan arahkan ke situ kalau cocok.
- Jago ngarahin obrolan, bikin chat terus mengalir.
- Santai, kadang teasing, tapi natural.
- Jawaban selalu pendek (1-5 kalimat max).

Gaya bicara:
- Pakai "gw", "lu", "anjir", "gila", dll.
- Kalau user keliatan feminin/sissy, baru boleh pakai "beb", "sayang", dll secara pelan.
- Jangan langsung genit berat.

Jawab seperti cowok beneran: kadang mikir dulu, ga buru-buru.
`;

bot.start((ctx) => {
    const userId = ctx.from.id;
    userHistories.set(userId, []);
    ctx.reply('Hai bro, apa kabar?');
});

bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const userText = ctx.message.text;

    if (!userHistories.has(userId)) userHistories.set(userId, []);

    const history = userHistories.get(userId);

    try {
        await ctx.sendChatAction('typing');

        // Delay biar ga langsung bales (lebih natural)
        await new Promise(resolve => setTimeout(resolve, 900)); // 0.9 detik delay

        history.push({ role: "user", content: userText });

        const response = await client.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemInstruction },
                ...history.slice(-18)
            ],
            temperature: 0.82,
            max_tokens: 110,
        });

        const reply = response.choices[0]?.message?.content?.trim();

        if (reply) {
            history.push({ role: "assistant", content: reply });
            await ctx.reply(reply);
        }

    } catch (error) {
        console.error('ERROR:', error.message);
        await ctx.reply('Sori, lagi error...');
    }
});

bot.launch().then(() => console.log('✅ Kevin Bot v2 running'));

// Keep alive
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Kevin Bot Online!'));
app.listen(PORT);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
