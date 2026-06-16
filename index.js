const { Telegraf } = require('telegraf');
const OpenAI = require('openai');
const axios = require('axios');
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

Kalau user kirim foto, deskripsikan apa yang lu lihat dengan natural dan santai. Bisa godain penampilan, baju, tempat, ekspresi, dll.

Jawab seperti cowok beneran: kadang mikir dulu, ga buru-buru.
`;

const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

bot.start((ctx) => {
    const userId = ctx.from.id;
    userHistories.set(userId, []);
    ctx.reply('Hai, apa kabar?');
});

// Text Handler
bot.on('text', async (ctx) => {
    const userId = ctx.from.id;
    const userText = ctx.message.text;

    if (!userHistories.has(userId)) userHistories.set(userId, []);

    const history = userHistories.get(userId);

    try {
        await ctx.sendChatAction('typing');
        await new Promise(resolve => setTimeout(resolve, 800));

        history.push({ role: "user", content: userText });

        const response = await client.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemInstruction },
                ...history.slice(-16)
            ],
            temperature: 0.85,
            max_tokens: 130,
        });

        const reply = response.choices[0]?.message?.content?.trim();

        if (reply) {
            history.push({ role: "assistant", content: reply });
            await ctx.reply(reply);
        }

    } catch (error) {
        console.error('Text Error:', error.message);
        await ctx.reply('Sori, lagi error...');
    }
});

// Photo Handler
bot.on('photo', async (ctx) => {
    const userId = ctx.from.id;
    if (!userHistories.has(userId)) userHistories.set(userId, []);

    const history = userHistories.get(userId);

    try {
        await ctx.sendChatAction('typing');
        await new Promise(resolve => setTimeout(resolve, 1000));

        const photo = ctx.message.photo.pop();
        const file = await ctx.telegram.getFile(photo.file_id);
        const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_TOKEN}/${file.file_path}`;

        const caption = ctx.message.caption || "Liat foto ini dong";

        const response = await axios.get(fileUrl, { responseType: 'arraybuffer' });
        const base64 = Buffer.from(response.data).toString('base64');

        history.push({
            role: "user",
            content: [
                { type: "text", text: caption },
                { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } }
            ]
        });

        const result = await client.chat.completions.create({
            model: VISION_MODEL,
            messages: [
                { role: "system", content: systemInstruction },
                ...history.slice(-12)
            ],
            temperature: 0.85,
            max_tokens: 200,
        });

        const reply = result.choices[0]?.message?.content?.trim();

        if (reply) {
            history.push({ role: "assistant", content: reply });
            await ctx.reply(reply);
        }

    } catch (error) {
        console.error('Photo Error:', error.message);
        await ctx.reply('Foto nya ga kebaca, coba kirim ulang ya');
    }
});

bot.launch().then(() => console.log('✅ Kevin Bot v4 (Vision Fixed) running'));

// Keep alive
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Kevin Bot Online!'));
app.listen(PORT);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
