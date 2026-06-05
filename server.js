const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
const upload = multer(); 
const PORT = process.env.PORT || 3000;

app.use(cors());

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper: send rich embed to Discord Webhook
async function sendToDiscord(webhookUrl, title, description, color = 13936951, imageUrl = null) {
  if (!webhookUrl) {
    console.warn(`[SERVER WARNING] Webhook URL not set for: "${title}". Logging:`, description);
    return { success: true, mocked: true };
  }

  const finalImage = imageUrl || process.env.DISCORD_EMBED_IMAGE_URL || null;

  const payload = {
    embeds: [{
      title,
      description,
      color,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'موقع الجرد الاداري SQ9',
        icon_url: 'https://sq9-platform.onrender.com/assets/logo.png'
      },
      image: finalImage ? { url: finalImage } : undefined
    }]
  };

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Discord error ${response.status}: ${err}`);
  }
  return { success: true };
}

// ─────────────────────────────────────────────────
// Route 1: الجرد الإداري
// ─────────────────────────────────────────────────
app.post('/api/reports/admin', async (req, res) => {
  const { userName, userRank, activationCount, problemSolvedCount } = req.body;

  if (!userName || !userRank) {
    return res.status(400).json({ error: 'يرجى ملء جميع الحقول المطلوبة.' });
  }

  const actCount  = parseInt(activationCount)    || 0;
  const probCount = parseInt(problemSolvedCount)  || 0;
  const actPoints  = Math.floor(actCount  / 30);
  const probPoints = Math.floor(probCount / 50);
  const totalPoints = actPoints + probPoints;

  const description = [
    `👤 **الاسم :** ${userName}`,
    ``,
    `🎗️ **الرتبة :** ${userRank}`,
    ``,
    `✅ **تم حل مشكلة ؟ (العدد) :** ${probCount} حل مشكلة`,

    `🏅 **البوينتات ( الناتج ) :** ${probPoints} point (كل 50 = 1)`,
    ``,
    ``,
    `✅ **تم تفعيل (العدد) :** ${actCount} تفعيل`,

    `🏅 **البوينتات ( الناتج ) :** ${actPoints} point (كل 30 = 1)`,
    ``,
    ``,
    `📊 **مجموع البوينتات :** ${totalPoints} point`
  ].join('\n');

  try {
    const result = await sendToDiscord(
      process.env.DISCORD_ADMIN_WEBHOOK,
      'جرد الادارة | SQ9 📨',
      description,
      13936951,
      process.env.DISCORD_EMBED_IMAGE_URL || null
    );
    res.json({ success: true, message: 'تم إرسال الجرد الإداري بنجاح.', mocked: result.mocked });
  } catch (err) {
    res.status(500).json({ error: 'فشل إرسال الجرد، يرجى المحاولة لاحقاً.' });
  }
});

// ─────────────────────────────────────────────────
// Route 2: جرد مسؤولية النقل
// ─────────────────────────────────────────────────
app.post('/api/reports/transport', async (req, res) => {
  const { userName, userRank, transportReports, agreement } = req.body;

  if (!userName || !userRank || !agreement) {
    return res.status(400).json({ error: 'يرجى ملء الحقول الإلزامية والموافقة على التعهد.' });
  }

  const repCount = parseInt(transportReports) || 0;
  const points   = Math.floor(repCount / 30);

  const description = [
    `👤 **الاسم :** ${userName}`,
    ``,
    `🎗️ **الرتبة :** ${userRank}`,
    ``,
    `📷 **تقارير النقل (العدد) :** ${repCount} تقرير`,
    
    `🏅 **البوينتات ( الناتج ) :** ${points} point (كل 30 = 1)`,
    ``,
    ``,
    `✍️ **التعهد :** ${agreement ? '✅ أقر بتحمل المسؤولية والتعهد في حال تلاعبي لا يتم حسب أي ترقية لي' : '❌ لم يقر'}`
  ].join('\n');

  try {
    const result = await sendToDiscord(
      process.env.DISCORD_TRANSPORT_WEBHOOK,
      'جرد مسوؤل النقل | SQ9 📸',
      description,
      13936951,
      process.env.DISCORD_EMBED_IMAGE_URL || null
    );
    res.json({ success: true, message: 'تم إرسال جرد النقل بنجاح.', mocked: result.mocked });
  } catch (err) {
    res.status(500).json({ error: 'فشل إرسال الجرد، يرجى المحاولة لاحقاً.' });
  }
});

// ─────────────────────────────────────────────────
// Route 3: جرد مسؤولية الدعم الفني
// ─────────────────────────────────────────────────
app.post('/api/reports/support', async (req, res) => {
  const { userName, userRank, supportReports, agreement } = req.body;

  if (!userName || !userRank || !agreement) {
    return res.status(400).json({ error: 'يرجى ملء الحقول الإلزامية والموافقة على التعهد.' });
  }

  const repCount = parseInt(supportReports) || 0;
  const points   = Math.floor(repCount / 30);

  const description = [
    `👤 **الاسم :** ${userName}`,
    ``,
    `🎗️ **الرتبة :** ${userRank}`,
    ``,
    `📷 **🚫〢الانذارات・الادارية  :** ${repCount} محاسبة`,
    
    `🏅 **البوينتات ( الناتج ) :** ${points} point (كل 30 = 1)`,
    ``,
    ``,
    `✍️ **التعهد :** ${agreement ? '✅ أقر بتحمل المسؤولية والتعهد في حال تلاعبي لا يتم حسب أي ترقية لي' : '❌ لم يقر'}`
  ].join('\n');

  try {
    const result = await sendToDiscord(
      process.env.DISCORD_TRANSPORT_WEBHOOK,
      'جرد مسوؤل الدعم الفني | SQ9 ⚠️',
      description,
      13936951,
      process.env.DISCORD_EMBED_IMAGE_URL || null
    );
    res.json({ success: true, message: 'تم إرسال جرد الدعم بنجاح.', mocked: result.mocked });
  } catch (err) {
    res.status(500).json({ error: 'فشل إرسال الجرد، يرجى المحاولة لاحقاً.' });
  }
});

// ─────────────────────────────────────────────────
// Route 4: جرد الرقابة والتفتيش
// ─────────────────────────────────────────────────
app.post('/api/reports/oversight', async (req, res) => {
  const { userName, selectedRank, accountingCount } = req.body;

  if (!userName || !selectedRank) {
    return res.status(400).json({ error: 'يرجى ملء الحقول المطلوبة.' });
  }

  // Dark red color: #8B0000 = 9109504
  const OVERSIGHT_COLOR = 9109504;

  const description = [
    `👤 **الاسم :** ${userName}`,
    ``,
    ``,
    `🎗️ **الرتبة :** ${selectedRank}`,
    ``,
    ``,
    `🛑 **تصوير المحاسبة (العدد) :** ${accountingCount || 'لم يُحدد'}`
  ].join('\n');

  try {
    const result = await sendToDiscord(
      process.env.DISCORD_OVERSIGHT_WEBHOOK,
      'جرد الرقابة والتفتيش | SQ9 🕵️‍♂️',
      description,
      OVERSIGHT_COLOR,
      process.env.DISCORD_OVERSIGHT_IMAGE_URL || process.env.DISCORD_EMBED_IMAGE_URL || null
    );
    res.json({ success: true, message: 'تم إرسال جرد الرقابة والتفتيش بنجاح.', mocked: result.mocked });
  } catch (err) {
    res.status(500).json({ error: 'فشل إرسال الجرد، يرجى المحاولة لاحقاً.' });
  }
});

// Fallback SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[SERVER OK] SQ9 Platform running on http://localhost:${PORT}`);
});
