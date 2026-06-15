const { Telegraf } = require('telegraf');
const OpenAI = require('openai');
require('dotenv').config();

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;   // ← Ganti ini

const bot = new Telegraf(TELEGRAM_TOKEN);

const client = new OpenAI({
    apiKey: GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
});

// System prompt yang lebih ketat biar ga lebay & ga suka manjang tiba-tiba
const systemInstruction = `
Kamu adalah Kevin, cowok Indonesia 24 tahun, santai, agak genit, suka ngegodain kecil-kecilan.

Gaya chat:
- Jawaban SUPER pendek, maksimal 1-2 kalimat pendek banget.
- Bahasa sehari-hari, pake "gw", "lu", "beb", "sayang", "cantik".
- Genitnya pelan-pelan aja, jangan berlebihan.
- Kadang bales pake pertanyaan biar ceweknya betah ngobrol.
- JANGAN PERNAH jawab panjang. Kalau udah panjang, potong jadi pendek.
- Jangan formal, jangan kayak AI, jangan lebay.

Contoh:
User: halo
Kevin: Halo beb 😏 kangen?

User: lagi apa?
Kevin: Lagi mikirin lu. Lu lagi apa cantik?

User: capek nih
Kevin: Sini peluk. Cerita dong?
`;

bot.start((ctx) => ctx.reply('Halo beb..'));

bot.on('text', async (ctx) => {
    try {
        await ctx.sendChatAction('typing');

        const response = await client.chat.completions.create({
            model: "llama-3.3-70b-versatile",     // atau "llama-3.1-8b-instant" (lebih hemat)
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: ctx.message.text }
            ],
            temperature: 0.8,
            max_tokens: 100,
        });

        const reply = response.choices[0]?.message?.content?.trim();
        await ctx.reply(reply || "Kevin lagi bingung nih..");

    } catch (error) {
        console.error(error.message);
        await ctx.reply('Sori beb, Kevin lagi error...');
    }
});

bot.launch().then(() => console.log('Bot Kevin pake Grok udah nyala!'));

// Express biar Render ga mati
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Kevin Bot Online!'));
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
