const { Telegraf } = require('telegraf');
const OpenAI = require('openai');

// Ambil dari .env (WAJIB pake dotenv biar aman)
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const XAI_API_KEY = process.env.XAI_API_KEY;   // Grok API key

const bot = new Telegraf(TELEGRAM_TOKEN);

const client = new OpenAI({
    apiKey: XAI_API_KEY,
    baseURL: 'https://api.x.ai/v1',
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
            model: "grok-4.3",           // atau "grok-4.3-latest"
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: ctx.message.text }
            ],
            temperature: 0.75,
            max_tokens: 120,          // ← Ini yang paling penting biar ga manjang!
            presence_penalty: 0.3,
        });

        const replyText = response.choices[0]?.message?.content?.trim();

        if (replyText) {
            await ctx.reply(replyText);
        } else {
            await ctx.reply('Aduh, Kevin lagi lemot nih..');
        }

    } catch (error) {
        console.error('Error:', error);
        await ctx.reply('Sori beb, lagi error bentar..');
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
