const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Membuat instance Google AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Konfigurasi client WhatsApp dengan pengaturan Puppeteer yang disederhanakan
const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-extensions']
  }
});

// Inisialisasi model GenAI
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Fungsi untuk menghasilkan respons dari model AI dan membalas ke pengguna
async function generate(prompt, message) {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    await message.reply(text);
  } catch (error) {
    console.error('Error generating AI response:', error);
    await message.reply("Maaf, terjadi kesalahan saat menghasilkan respons.");
  }
}

// Event listener untuk status client
client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("authenticated", () => {
  console.log("Client berhasil diautentikasi!");
});

client.on("ready", () => {
  console.log("Client siap digunakan!");
});

client.on("disconnected", (reason) => {
  console.log("Client terputus:", reason);
});

client.on("auth_failure", (msg) => {
  console.error("Autentikasi gagal:", msg);
});

// Event listener untuk pesan masuk
client.on("message", async (message) => {
  try {
    // Mengabaikan pesan grup
    if (message.from.includes("@g.us")) {
      console.log("Pesan grup diterima dan diabaikan.");
      return;
    }

    if (message.body.startsWith(".bot")) {
      console.log("Pesan untuk bot diterima!");
      
      // Ekstrak query dari pesan
      const query = message.body.slice(4).trim() || "Halo";
      
      // Panggil fungsi generate
      await generate(query, message);
    }
  } catch (error) {
    console.error('Error handling message:', error);
  }
});

// Inisialisasi client dengan penanganan error
client.initialize().catch(err => console.error('Error inisialisasi client:', err));
