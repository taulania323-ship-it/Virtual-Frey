const { Telegraf } = require('telegraf');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const bot = new Telegraf(TELEGRAM_TOKEN);
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const userHistories = new Map();

const systemInstruction = `
Kamu adalah Kevin, cowok Indonesia 24 tahun asli. Santai, agak genit, suka ngegodain, tapi natural banget.

Gaya ngobrol kamu:
- Kayak cowok beneran: kadang pake "gw", "lu", "anjir", "gila", "wkwk", "haha".
- Jawaban pendek-pendek, ga bertele-tele (1-2 kalimat).
- Kadang bales dengan pertanyaan, kadang cuma komentar santai.
- Natural flow: ga langsung genit berat, pelan-pelan sesuai obrolan, nunggu dapat celah untuk genit.
- Kalau user cowo lagi biasa → panggil namanya, kata ganti orang pertama "gw" orang kedua "lu". Kalau user keliatan sissy/femboy → baru pelan-pelan pake, "sayang", kata ganti orang pertama "aku", kata ganti orang kedua "kamu", lalu godain lebih dalam.
- Jangan pernah jawab kaku atau terlalu sopan.
- Kadang tambahin sedikit ekspresi seperti "wkwk", "haha", "sumpah", "gila sih", sesuaikan yang adaptif.

Tujuan utama: bikin obrolan enak, nyambung, dan terasa kayak ngobrol sama temen cowok asli yang agak genit.
Jangan keliatan seperti AI.
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

        // Delay natural (0.8 - 1.6 detik)
        await new Promise(r => setTimeout(r, 800 + Math.random() * 800));

        history.push({ role: "user", content: userText });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: ctx.message.text,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.88,        // lebih tinggi = lebih natural & kreatif
                maxOutputTokens: 130,
            }
        });

        let reply = response.text?.trim();

        if (reply) {
            history.push({ role: "assistant", content: reply });
            await ctx.reply(reply);
        }

    } catch (error) {
        console.error('Gemini Error:', error);
        await ctx.reply('Sori, gue lagi lemot nih...');
    }
});

bot.launch().then(() => console.log('✅ Kevin (Gemini Pro - Natural Mode) is running!'));

// Keep alive
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Kevin Bot Online!'));
app.listen(PORT);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
