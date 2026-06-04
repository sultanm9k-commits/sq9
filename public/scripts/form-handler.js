// Form Handler - SQ9 Official Platform | sq9.sa

document.addEventListener('DOMContentLoaded', () => {

    // ─── Mobile Navigation ───────────────────────────────
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('open');
            navToggle.classList.toggle('active');
            const spans = navToggle.querySelectorAll('span');
            if (navToggle.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu && navMenu.classList.contains('open')) navToggle.click();
        });
    });

    // ─── Sticky Header ───────────────────────────────────
    const header = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
        let current = '';
        document.querySelectorAll('section').forEach(sec => {
            if (window.scrollY >= sec.offsetTop - 120) current = sec.getAttribute('id');
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-scroll') === current) link.classList.add('active');
        });
    });

    // ─── Card & Tab Routing ──────────────────────────────
    const reportCards = document.querySelectorAll('.report-card');
    const formsSection = document.getElementById('forms-section');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const formContainers = document.querySelectorAll('.form-container');

    function activateForm(targetFormId) {
        formsSection.style.display = 'block';
        formContainers.forEach(c => c.style.display = 'none');
        const target = document.getElementById(targetFormId);
        if (target) target.style.display = 'block';
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-target') === targetFormId) btn.classList.add('active');
        });
        setTimeout(() => formsSection.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }

    reportCards.forEach(card => {
        card.addEventListener('click', () => activateForm(card.getAttribute('data-form')));
    });

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => activateForm(btn.getAttribute('data-target')));
    });

    // ─── Start Now → show reporting hub cards ────────────
    const startNowBtn = document.getElementById('startNowBtn');
    if (startNowBtn) {
        startNowBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const hub = document.getElementById('reporting-hub');
            if (hub) hub.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    // ─── Success Overlay ─────────────────────────────────
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

    async function submitReport(endpoint, data, form) {
        setLoading(form, true);
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'حدث خطأ أثناء إرسال الجرد.');
            showSuccessPopup(result.mocked);
            form.reset();
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

    // ─── Form 1: الجرد الإداري ───────────────────────────
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
            const activationCount = parseInt(actInput.value) || 0;
            const problemSolvedCount = parseInt(probInput.value) || 0;

            submitReport('/api/reports/admin', {
                userName:           document.getElementById('admin-userName').value,
                userRank:           document.getElementById('admin-userRank').value,
                activationCount:    activationCount,
                problemSolvedCount: problemSolvedCount,
            }, adminForm);
        });
    }

    // ─── Form 2: جرد مسؤولية النقل ──────────────────────
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
            submitReport('/api/reports/transport', {
                userName:         document.getElementById('trans-userName').value,
                userRank:         document.getElementById('trans-userRank').value,
                transportReports: parseInt(transReportsInput.value) || 0,
                agreement:        document.getElementById('trans-agreement').checked,
            }, transportForm);
        });
    }

    // ─── Form 3: جرد الرقابة والتفتيش ───────────────────
    const oversightForm = document.getElementById('oversightReportForm');
    if (oversightForm) {
        oversightForm.addEventListener('submit', e => {
            e.preventDefault();
            submitReport('/api/reports/oversight', {
                userName:        document.getElementById('over-userName').value,
                selectedRank:    document.getElementById('over-selectedRank').value,
                accountingCount: document.getElementById('over-accountingCount').value,
            }, oversightForm);
        });
    }

});
