const { Telegraf } = require('telegraf');
const { GoogleGenAI } = require('@google/genai');

// Masukkan token lo di sini (Saran: nanti pake .env ya biar aman)
// Ganti baris token lo yang tadinya teks biasa, jadi seperti ini:
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const bot = new Telegraf(TELEGRAM_TOKEN);
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Biar Gemini berakting jadi temen virtual, kita kasih "System Instruction"
const systemInstruction = 
  "Kamu adalah seorang teman virtual yang asyik. " +
  "Gunakan bahasa gaul Indonesia (pake gue-lu, dll). " +
  "Jangan kaku seperti robot, jawab dengan empati dan seru seperti gebetan.";

bot.start((ctx) => ctx.reply('Halo..'));

// Menangkap semua pesan teks dari user
bot.on('text', async (ctx) => {
    try {
        // Kasih efek "typing..." di Telegram biar berasa ngetik beneran
        await ctx.sendChatAction('typing');

        // Panggil Gemini API (pake model gemini-2.5-flash udah kenceng dan hemat)
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: ctx.message.text,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.7, // Makin tinggi makin kreatif/luwes bahasanya
            }
        });

        // Kirim balik jawaban Gemini ke user Telegram
        await ctx.reply(response.text);

    } catch (error) {
        console.error('Error nih:', error);
        await ctx.reply('Aduh sori, otak gue lagi nge-lag bentar...');
    }
});

// Jalankan bot
bot.launch().then(() => console.log('udah ready nih!'));

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Kode pancingan biar Render gak error nyari Port website
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot Online!'));
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

