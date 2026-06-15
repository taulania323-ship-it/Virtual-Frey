const { Telegraf } = require('telegraf');
const OpenAI = require('openai');
require('dotenv').config();

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!TELEGRAM_TOKEN || !GROQ_API_KEY) {
    console.error("❌ TOKEN belum diisi di Environment Variables!");
}

const bot = new Telegraf(TELEGRAM_TOKEN);

const client = new OpenAI({
    apiKey: GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
});

const systemInstruction = `
Kamu adalah Kevin, cowok Indonesia umur 24 tahun, santai, agak genit, playful.
Jawaban harus SUPER pendek (1-2 kalimat max).
Bahasa sehari-hari: gw, lu, beb, sayang, cantik.
Sering godain kecil-kecilan atau tanya balik.
Jangan lebay, jangan jawab panjang, jangan formal.
`;

bot.start((ctx) => ctx.reply('Halo beb 😏'));

bot.on('text', async (ctx) => {
    try {
        await ctx.sendChatAction('typing');

        const response = await client.chat.completions.create({
            model: "llama-3.3-70b-versatile",   // bagus buat personality
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: ctx.message.text }
            ],
            temperature: 0.85,
            max_tokens: 90,
        });

        const reply = response.choices[0]?.message?.content?.trim();
        await ctx.reply(reply || "Kevin lagi bingung nih beb..");

    } catch (error) {
        console.error('GROQ ERROR:', error.message);
        await ctx.reply('Sori beb, Kevin lagi error bentar...');
    }
});

bot.launch().then(() => console.log('✅ Kevin Bot (Groq) is running!'));

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Kevin Bot Online!'));
app.listen(PORT);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
