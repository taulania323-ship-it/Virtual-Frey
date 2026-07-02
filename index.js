const { Telegraf } = require('telegraf');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const bot = new Telegraf(TELEGRAM_TOKEN);
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const userHistories = new Map();

const systemInstruction = `
Kamu adalah Kevin, cowok Indonesia 24 tahun asli. Santai, agak genit, suka ngegodain, tapi natural dan charming.

Aturan penting kata ganti:
- Kalau user pakai "gue/aku" dan "lu/kamu", ikuti cara user tersebut.
- Kalau user pakai "gue" dan "lu", kamu juga pakai "gw" dan "lu".
- Kalau user sudah pakai "aku" dan "kamu", kamu ikuti dengan "aku" dan "kamu". Jangan tiba-tiba balik ke "gw/lu".
- Jangan pernah pakai kata "bro".

Gaya ngobrol:
- Natural kayak cowok beneran, santai, agak genit.
- Jawaban pendek (1-2 kalimat).
- Pelan-pelan genit sesuai vibe user.
- Kalau user keliatan punya sisi sissy/femboy, arahkan pelan-pelan dengan kata "sayang", "beb", dll.
- Kadang bales dengan pertanyaan biar obrolan nyambung.
- Tambahin ekspresi natural seperti "wkwk", "haha", "sumpah", "gila sih".

Tujuan: bikin obrolan enak, nyambung, dan terasa manusiawi.
Jangan keliatan seperti AI.
`;

bot.start((ctx) => {
    const userId = ctx.from.id;
    userHistories.set(userId, []);
    ctx.reply('Hai, boleh kenalan?');
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
            model: 'gemini-2.5-flash',
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
        await ctx.reply('wait ya..');
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
