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
async function sendToDiscord(webhookUrl, title, description, color = 13936951, imageUrl = null, files = []) {
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

  const form = new FormData();
  form.append('payload_json', JSON.stringify(payload));


  files.forEach((file, index) => {
    const fileExtension = path.extname(file.originalname) || '.png';
    const customFileName = `image_${index + 1}${fileExtension}`;
    form.append(`files[${index}]`, file.buffer, customFileName);
  });

  
  const response = await axios.post(webhookUrl, form, {
    headers: form.getHeaders()
  });

  if (response.status !== 200 && response.status !== 204) {
    throw new Error(`Discord error ${response.status}: ${response.statusText}`);
  }
  
  return { success: true };
}

// ─────────────────────────────────────────────────
// Route 1: الجرد الإداري
// ─────────────────────────────────────────────────
app.post('/api/reports/admin', upload.array('files', 5), async (req, res) => {
  const { userName, userRank, activationCount, problemSolvedCount } = req.body;

  if (!userName || !userRank) {
    return res.status(400).json({ error: 'يرجى ملء جميع الحقول المطلوبة.' });
  }

  const actCount  = parseInt(activationCount)    || 0;
  const probCount = parseInt(problemSolvedCount)  || 0;
  const actPoints  = Math.floor(actCount  / 30);
  const probPoints = Math.floor(probCount / 50);
 const successOverlay = document.getElementById('successOverlay');
    const closeSuccessBtn = document.getElementById('closeSuccessBtn');

    function setLoading(form, isLoading) {
        const btn = form.querySelector('.btn-submit');
        const span = btn.querySelector('span');
        const loader = btn.querySelector('.loader');
        btn.disabled = isLoading;
        span.style.opacity = isLoading ? '0.5' : '1';
        loader.style.display = isLoading ? 'block' : 'none';
    }

    async function submitReport(endpoint, form) {
        setLoading(form, true);
        try {
            const formData = new FormData(form); 

            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'حدث خطأ أثناء إرسال الجرد.');
            showSuccessPopup(result.mocked);
            form.reset();

            if (typeof calculatePoints === 'function') calculatePoints();
            if (typeof calculateTransportPoints === 'function') calculateTransportPoints();
            if (typeof calculateSupportPoints === 'function') calculateSupportPoints();
            
        } catch (error) {
            console.error('Submission error:', error);
            alert(`⚠️ فشل إرسال الجرد:\n${error.message}`);
        } finally {
            setLoading(form, false);
        }
    }

    function showSuccessPopup(isMocked) {
        const msg = successOverlay.querySelector('.success-message');
        if (isMocked) {
            msg.innerHTML = 'تم محاكاة الإرسال بنجاح! ⚠️ <strong>تنبيه:</strong> تحقق من ملف <code>.env</code> للويب هوكس.';
        } else {
            msg.innerHTML = 'تم تسجيل الجرد وإرساله بأمان إلى خوادم الإدارة في ديسكورد. نشكر مساهمتكم في تنظيم وتطوير مجتمع SQ9.';
        }
        successOverlay.classList.add('show');
    }

    if (closeSuccessBtn) closeSuccessBtn.addEventListener('click', () => successOverlay.classList.remove('show'));

    const adminForm = document.getElementById('adminReportForm');
    const actInput = document.getElementById('admin-activationCount');
    const probInput = document.getElementById('admin-problemSolvedCount');
    const actPointsSpan = document.getElementById('points-activation');
    const probPointsSpan = document.getElementById('points-problems');
    const totalPointsSpan = document.getElementById('points-total');

    function calculatePoints() {
        if (!actInput || !probInput) return;
        const activations = parseInt(actInput.value) || 0;
        const problems = parseInt(probInput.value) || 0;

        const actPoints = Math.floor(activations / 30);
        const probPoints = Math.floor(problems / 50);
        const totalPoints = actPoints + probPoints;

        if (actPointsSpan) actPointsSpan.textContent = `${actPoints} point 🏅`;
        if (probPointsSpan) probPointsSpan.textContent = `${probPoints} point 🏅`;
        if (totalPointsSpan) totalPointsSpan.textContent = `${totalPoints} point 🏅`;
    }

    if (actInput && probInput) {
        actInput.addEventListener('input', calculatePoints);
        probInput.addEventListener('input', calculatePoints);
        calculatePoints();
    }

    if (adminForm) {
        adminForm.addEventListener('submit', e => {
            e.preventDefault();
            submitReport('/api/reports/admin', adminForm);
        });
    }

    const transportForm = document.getElementById('transportReportForm');
    const transReportsInput = document.getElementById('trans-transportReports');
    const transPointsSpan = document.getElementById('points-transport');

    function calculateTransportPoints() {
        if (!transReportsInput) return;
        const reports = parseInt(transReportsInput.value) || 0;
        const points = Math.floor(reports / 30);
        if (transPointsSpan) transPointsSpan.textContent = `${points} point 🏅`;
    }

    if (transReportsInput) {
        transReportsInput.addEventListener('input', calculateTransportPoints);
        calculateTransportPoints();
    }

    if (transportForm) {
        transportForm.addEventListener('submit', e => {
            e.preventDefault();
            submitReport('/api/reports/transport', transportForm);
        });
    }
    
    const supportForm = document.getElementById('supportReportForm');
    const supportReportsInput = document.getElementById('supp-reports'); 
    const supportPointsSpan = document.getElementById('points-support');

    function calculateSupportPoints() {
        if (!supportReportsInput) return;
        const reports = parseInt(supportReportsInput.value) || 0;
        const points = Math.floor(reports / 30);
        if (supportPointsSpan) supportPointsSpan.textContent = `${points} point 🏅`;
    }

    if (supportReportsInput) {
        supportReportsInput.addEventListener('input', calculateSupportPoints);
    }

    if (supportForm) {
        supportForm.addEventListener('submit', e => {
            e.preventDefault();
            submitReport('/api/reports/support', supportForm);
        });
    }

    const oversightForm = document.getElementById('oversightReportForm');
    if (oversightForm) {
        oversightForm.addEventListener('submit', e => {
            e.preventDefault();
            submitReport('/api/reports/oversight', oversightForm);
        });
    }

    const reportForms = ['adminReportForm', 'transportReportForm', 'supportReportForm', 'oversightReportForm'];

    reportForms.forEach(formId => {
        const form = document.getElementById(formId);
        if (!form) return;

        const fileInput = form.querySelector('input[type="file"]');
        if (!fileInput) return;

        fileInput.addEventListener('change', function () {
            const targetElement = Array.from(form.querySelectorAll('label, span, div, p'))
                .find(el => el.textContent.includes('إرفق الصور') || el.textContent.includes('تم ارفاق') || el.textContent.includes('الحد الاقصى'));

            if (!targetElement) return;

            const filesCount = this.files.length;

            if (filesCount > 5) {
                let textNode = Array.from(targetElement.childNodes).find(node => node.nodeType === 3 && node.textContent.trim() !== '');
                if (textNode) {
                    textNode.textContent = 'فشل الحد الاقصى للصور';
                } else {
                    targetElement.innerText = 'فشل الحد الاقصى للصور';
                }
                
                this.value = ''; 
                alert('⚠️ عذراً، الحد الأقصى المسموح به هو 5 صور فقط للجرد الواحدة.');
                
            } else if (filesCount > 0) {
                let textNode = Array.from(targetElement.childNodes).find(node => node.nodeType === 3 && node.textContent.trim() !== '');
                if (textNode) {
                    textNode.textContent = `تم ارفاق صورة (${filesCount}-5)`;
                } else {
                    targetElement.innerText = `تم ارفاق صورة (${filesCount}-5)`;
                }
            } else {
                let textNode = Array.from(targetElement.childNodes).find(node => node.nodeType === 3 && node.textContent.trim() !== '');
                if (textNode) {
                    textNode.textContent = 'إرفق الصور هنا ( اجباري )';
                } else {
                    targetElement.innerText = 'إرفق الصور هنا ( اجباري )';
                }
            }
        });
    });

});