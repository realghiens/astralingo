const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load Environment Variables (.env)
dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// PENTING: Menggunakan model stabil umum untuk publik
const MODEL_NAME = "gemini-1.5-flash";

app.post("/analyze", async (req, res) => {
  try {
    const { story, systemPrompt } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      console.error("❌ ERROR: GEMINI_API_KEY tidak ditemukan di file .env!");
      return res
        .status(500)
        .json({ error: "API Key belum terpasang di server (.env)" });
    }

    console.log("🛰️ Menerima transmisi dari Cadet... Menghubungi Google AI...");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: story }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7,
          },
        }),
      },
    );

    const data = await response.json();

    if (data.error) {
      console.error("❌ Google API Error:", data.error);
      return res.status(400).json({ error: data.error.message });
    }

    // Ambil text response mentah dari Gemini
    let aiRawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiRawText) {
      throw new Error("Objek teks tidak ditemukan dalam respons Gemini");
    }

    console.log("🔮 Respons mentah AI diterima. Memproses JSON...");

    // Proteksi: Bersihkan markdown ```json jika model tidak sengaja menyertakannya
    aiRawText = aiRawText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    // Parse teks menjadi JSON bersih dan kirim ke frontend
    const cleanJsonOutput = JSON.parse(aiRawText);
    res.json(cleanJsonOutput);

    console.log("✅ Analisis sukses dikirim kembali ke browser!");
  } catch (err) {
    console.error("💥 SYSTEM CRASH:", err.message);
    res.status(500).json({
      error: "Gagal memproses data log",
      message: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log("\n==================================================");
  console.log(`🚀 ASTRALINGO BACKEND CORE ACTIVE`);
  console.log(`📡 Membuka antena di: http://localhost:${PORT}`);
  console.log(`🗺️ Rute aktif: POST http://localhost:${PORT}/analyze`);
  console.log("==================================================\n");
});
