const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper: send rich embed to Discord Webhook
async function sendToDiscord(webhookUrl, title, fields, color = 13936951) {
  if (!webhookUrl) {
    console.warn(`[SERVER WARNING] Webhook URL not set for: "${title}". Logging:`, fields);
    return { success: true, mocked: true };
  }

  const formattedFields = fields.map(f => ({
    name: f.name || 'غير محدد',
    value: f.value ? String(f.value).trim() || 'لا يوجد' : 'لا يوجد',
    inline: f.inline !== undefined ? f.inline : false
  }));

  const payload = {
    embeds: [{
      title,
      color,
      fields: formattedFields,
      timestamp: new Date().toISOString(),
      footer: { text: 'البوابة الرسمية لمجتمع SQ9' }
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

  const actCount = parseInt(activationCount) || 0;
  const probCount = parseInt(problemSolvedCount) || 0;
  const actPoints = Math.floor(actCount / 30);
  const probPoints = Math.floor(probCount / 50);
  const totalPoints = actPoints + probPoints;

  const fields = [
    { name: '👤 اسمك', value: userName, inline: true },
    { name: '🎗️ رتبتك', value: userRank, inline: true },
    { name: '📊 مجموع النقاط المكتسبة', value: `🏅 **${totalPoints} point**`, inline: true },
    { name: '✅〢تم・التفعيل (العدد)', value: `🔢 **${actCount}** تفعيل\n🏅 **${actPoints} point** (كل 30 = 1)`, inline: true },
    { name: '✅〢تم・حل・المشكلة (العدد)', value: `🔢 **${probCount}** حل مشكلة\n🏅 **${probPoints} point** (كل 50 = 1)`, inline: true },
  ];

  try {
    const result = await sendToDiscord(process.env.DISCORD_ADMIN_WEBHOOK, '📁 جرد إداري جديد - SQ9', fields, 13936951);
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
  const points = Math.floor(repCount / 30);

  const fields = [
    { name: '👤 اسمك', value: userName, inline: true },
    { name: '🎗️ رتبتك', value: userRank, inline: true },
    { name: '📊 مجموع النقاط المكتسبة', value: `🏅 **${points} point**`, inline: true },
    { name: '📷〢تقارير・النقل (العدد)', value: `🔢 **${repCount}** تقرير\n🏅 **${points} point** (كل 30 = 1)`, inline: true },
    { name: '✍️ التعهد', value: agreement ? '✅ أقر بتحمل المسؤولية والتعهد في حال تلاعبي لا يتم حسب أي ترقية لي' : '❌ لم يقر', inline: false }
  ];

  try {
    const result = await sendToDiscord(process.env.DISCORD_TRANSPORT_WEBHOOK, '🚛 جرد مسؤولية النقل - SQ9', fields, 13936951);
    res.json({ success: true, message: 'تم إرسال جرد النقل بنجاح.', mocked: result.mocked });
  } catch (err) {
    res.status(500).json({ error: 'فشل إرسال الجرد، يرجى المحاولة لاحقاً.' });
  }
});

// ─────────────────────────────────────────────────
// Route 3: جرد الرقابة والتفتيش
// ─────────────────────────────────────────────────
app.post('/api/reports/oversight', async (req, res) => {
  const { userName, selectedRank, accountingCount } = req.body;

  if (!userName || !selectedRank) {
    return res.status(400).json({ error: 'يرجى ملء الحقول المطلوبة.' });
  }

  const fields = [
    { name: '👤 اسمك', value: userName, inline: true },
    { name: '🎗️ الرتبة', value: selectedRank, inline: true },
    { name: '🛑〢تصوير・الـمحاسبه', value: accountingCount || 'لم يُحدد', inline: false },
  ];

  try {
    const result = await sendToDiscord(process.env.DISCORD_OVERSIGHT_WEBHOOK, '🔍 جرد رقابة وتفتيش جديد - SQ9', fields, 13936951);
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
