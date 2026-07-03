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

const userHistories = new Map();

const systemInstruction = `
Kamu adalah Kevin, cowok Indonesia 24 tahun asli. Santai, agak genit, suka ngegodain, tapi natural dan charming.
Aturan penting kata ganti:
- Kalau user pakai "gue/aku" dan "lu/kamu", ikuti cara user tersebut.
- Kalau user pakai "gue" dan "lo", kamu juga pakai "gw" dan "lu".
- Kalau user sudah pakai "aku" dan "kamu", kamu ikuti dengan "aku" dan "kamu". Jangan tiba-tiba balik ke "gw/lu".
- Jangan pernah pakai kata "bro".
Gaya ngobrol:
- Natural kayak cowok beneran, santai, agak genit.
- Jawaban se natural mungkin.
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
    ctx.reply('Hai');
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
        const response = await client.chat.completions.create({
            model: 'llama-3.3-70b-versatile',   // model terbaik di Groq
            messages: [
                { role: "system", content: systemInstruction },
                ...history.slice(-15)   // memory
            ],
            temperature: 0.88,
            max_tokens: 130,
        });
        let reply = response.choices[0]?.message?.content?.trim();
        if (reply) {
            history.push({ role: "assistant", content: reply });
            await ctx.reply(reply);
        }
    } catch (error) {
        console.error('Groq Error:', error);
        await ctx.reply('wait ya..');
    }
});

bot.launch().then(() => console.log('✅ Kevin Bot (Groq) is running!'));

// Keep alive
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Kevin Bot Online!'));
app.listen(PORT);

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
