(function () {
  'use strict';

  const SITE = window.SITE || {};

  // ─── Formatting ──────────────────────────────────────────────────────────

  const fmt = n => Math.round(n).toLocaleString('he-IL');
  const fmtDec = (n, d = 1) => n.toLocaleString('he-IL', { minimumFractionDigits: d, maximumFractionDigits: d });
  const shekel = n => `₪${fmt(n)}`;
  // "+₪7,598", kept left-to-right inside the Hebrew text so the plus sign stays in front
  const gainHtml = n => `<bdi dir="ltr">+${shekel(n)}</bdi>`;
  // Axis ticks: "₪500K", "₪1.5M"
  const shekelShort = n => {
    if (n >= 1e6) return `₪${+(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `₪${Math.round(n / 1e3)}K`;
    return `₪${Math.round(n)}`;
  };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Same thresholds as AmoSight
  const scoreColor = s => (s >= 70 ? '#10B981' : s >= 50 ? '#3B82F6' : s >= 30 ? '#F59E0B' : '#EF4444');
  const percentileColor = p => (p >= 60 ? '#10B981' : p >= 30 ? '#F59E0B' : '#EF4444');
  const RISK = {
    low:    { label: 'נמוכה',   range: 'עד 25% מניות',    color: '#10B981' },
    medium: { label: 'בינונית', range: 'בין 25% ל-75% מניות', color: '#3B82F6' },
    high:   { label: 'גבוהה',   range: 'מעל 75% מניות',  color: '#F59E0B' },
  };

  // ─── Site details from config.js ─────────────────────────────────────────

  function applyConfig() {
    document.querySelectorAll('[data-site]').forEach(el => {
      const value = SITE[el.dataset.site];
      if (value) el.textContent = value;
      else if (value === '') el.hidden = true;
    });
    document.querySelectorAll('[data-site-row]').forEach(el => {
      if (!SITE[el.dataset.siteRow]) el.hidden = true;
    });
    const hrefs = {
      tel: SITE.phone && `tel:${SITE.phone.replace(/[^\d+]/g, '')}`,
      whatsapp: SITE.whatsapp && `https://wa.me/${SITE.whatsapp}`,
      mailto: SITE.email && `mailto:${SITE.email}`,
    };
    document.querySelectorAll('[data-site-href]').forEach(el => {
      const href = hrefs[el.dataset.siteHref];
      if (href) el.href = href;
    });
    if (SITE.advisorName) {
      document.title = [SITE.advisorName, SITE.role].filter(Boolean).join(' · ');
    }
    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();
  }

  // ─── The sample client ───────────────────────────────────────────────────
  // An invented client. Returns are 1-year net returns in percent; alternatives are the
  // top three in the same risk level. `rw` is just the width of the hidden name.

  const SAMPLE = {
    provident: {
      listTitle: 'הקופות שלכם',
      unit: 'קופה', units: 'קופות', yours: 'הקופה שלכם', feeLabel: 'דמי ניהול',
      holdings: [
        {
          product: 'קרן השתלמות', track: 'מסלול כללי', since: '2016',
          amount: 186400, r1: 10.4, r3: 7.1, fee: 0.74, equity: 46, israel: 58,
          score: 38.6, rank: 41, total: 58, risk: 'medium',
          alts: [{ r1: 14.9, score: 91.2, rw: 118 }, { r1: 14.2, score: 88.7, rw: 92 }, { r1: 13.6, score: 86.1, rw: 104 }],
          golden: { r1: 21.3, score: 94.0, rw: 110 },
          note: 'באותה רמת סיכון ובאותם דמי ניהול, שלוש הקופות המובילות הניבו בין 3.2 ל-4.5 נקודות אחוז יותר בשנה. ניוד בין קרנות השתלמות שומר על הוותק.',
        },
        {
          product: 'קופת גמל להשקעה', track: 'מסלול מניות', since: '2021',
          amount: 94300, r1: 18.6, r3: 11.2, fee: 0.55, equity: 88, israel: 41,
          score: 83.4, rank: 6, total: 41, risk: 'high',
          alts: [{ r1: 19.9, score: 93.8, rw: 100 }, { r1: 19.4, score: 90.1, rw: 120 }, { r1: 19.1, score: 87.5, rw: 88 }],
          golden: null,
          note: 'מקום 6 מתוך 41, והפער מהמובילה קטן. הקופה הזו נשארת במקומה: לא כל קופה צריכה לזוז.',
        },
      ],
    },
    pension: {
      listTitle: 'מסלולי הפנסיה שלכם',
      unit: 'מסלול', units: 'מסלולים', yours: 'המסלול שלכם', feeLabel: 'עלות שנתית',
      holdings: [
        {
          product: 'קרן פנסיה מקיפה', track: 'מסלול לבני 50 ומטה', since: '2009',
          amount: 342700, r1: 11.2, r3: 7.8, fee: 0.41, equity: 52, israel: 55,
          feeDetail: '0.22% מהצבירה · 1.49% מההפקדות', actuarial: 0.3,
          score: 44.1, rank: 19, total: 31, risk: 'medium',
          alts: [{ r1: 14.6, score: 90.4, rw: 112 }, { r1: 14.1, score: 87.9, rw: 96 }, { r1: 13.8, score: 85.2, rw: 120 }],
          golden: { r1: 19.8, score: 92.7, rw: 104 },
          note: 'בפנסיה בודקים גם את דמי הניהול מההפקדות ואת הכיסויים הביטוחיים, לא רק את התשואה. החלפת מסלול השקעה בתוך אותה קרן לא משנה את הכיסוי.',
        },
      ],
    },
    insurance: {
      listTitle: 'פוליסות ביטוח המנהלים שלכם',
      unit: 'מסלול', units: 'מסלולים', yours: 'המסלול שלכם', feeLabel: 'דמי ניהול',
      holdings: [
        {
          product: 'ביטוח מנהלים', track: 'מסלול כללי', since: '2012',
          amount: 128900, r1: 8.9, r3: 6.4, fee: 1.05, equity: 44, israel: 62,
          score: 31.7, rank: 27, total: 34, risk: 'medium',
          alts: [{ r1: 13.1, score: 89.6, rw: 108 }, { r1: 12.7, score: 86.3, rw: 90 }, { r1: 12.2, score: 83.0, rw: 116 }],
          golden: null,
          note: 'בפוליסות ותיקות בודקים מקדם קצבה מובטח לפני כל מעבר. כאן אפשר להחליף רק את מסלול ההשקעה ולהשאיר את הפוליסה עצמה.',
        },
      ],
    },
  };

  // What the balance would be today had it sat in a fund that returned r1 instead
  const potentialOf = (h, r1) => (h.amount / (1 + h.r1 / 100)) * (1 + r1 / 100);
  const percentileOf = h => Math.round(((h.total - h.rank) / (h.total - 1)) * 100);
  const allHoldings = () => Object.values(SAMPLE).flatMap(s => s.holdings);

  // ─── Report rendering ────────────────────────────────────────────────────

  const state = { tab: 'provident', index: 0 };

  function renderOverall() {
    const holdings = allHoldings();
    const total = holdings.reduce((s, h) => s + h.amount, 0);
    const potential = holdings.reduce((s, h) => s + potentialOf(h, h.alts[0].r1), 0);
    const missed = potential - total;
    document.getElementById('report-overall').innerHTML = `
      <div class="overall-cell">
        <span class="overall-label">הצבירה שלכם היום</span>
        <span class="overall-value">${shekel(total)}</span>
        <span class="overall-note">${holdings.length} מוצרים בשלושה תחומים</span>
      </div>
      <div class="overall-cell">
        <span class="overall-label">לו כל מוצר היה בחלופה המובילה</span>
        <span class="overall-value">${shekel(potential)}</span>
        <span class="overall-note">לפני שנה, באותה רמת סיכון</span>
      </div>
      <div class="overall-cell">
        <span class="overall-label">השנה החמצתם</span>
        <span class="overall-value overall-value--gain">${gainHtml(missed)}</span>
        <span class="overall-note">${fmtDec((missed / total) * 100)}% מהצבירה</span>
      </div>`;
    document.querySelectorAll('.report-tab').forEach(tab => {
      tab.querySelector('.tab-count').textContent = SAMPLE[tab.dataset.tab].holdings.length;
    });
  }

  function gauge(pct) {
    const r = 52, cx = 65, cy = 65;
    const a = (pct / 100) * Math.PI;
    const ex = cx + r * Math.cos(Math.PI - a);
    const ey = cy - r * Math.sin(Math.PI - a);
    return `
      <svg class="gauge" viewBox="0 0 130 75" aria-hidden="true">
        <path d="M 13 65 A 52 52 0 0 1 117 65" fill="none" stroke="#1E293B" stroke-width="10" stroke-linecap="round"></path>
        <path d="M 13 65 A 52 52 0 0 1 ${ex.toFixed(2)} ${ey.toFixed(2)}" fill="none" stroke="${percentileColor(pct)}" stroke-width="10" stroke-linecap="round"></path>
        <text class="g-num" x="65" y="52">${pct}</text>
        <text class="g-cap" x="65" y="68">אחוזון ${pct}</text>
      </svg>`;
  }

  const redacted = (w, label = 'שם מוסתר') =>
    `<span class="redacted" style="--rw:${w}px" role="img" aria-label="${label}"></span>`;

  const appleIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#F59E0B" d="M12 7c-1-2.6-3.6-3.4-5.6-2.2C4 6.2 3.6 9.6 5 13c1.3 3.2 3.6 6 5.4 6 .7 0 1-.4 1.6-.4s.9.4 1.6.4c1.8 0 4.1-2.8 5.4-6 1.4-3.4 1-6.8-1.4-8.2C15.6 3.6 13 4.4 12 7Z"></path><path d="M12 7c0-2 .8-3.6 2.4-4.4" fill="none" stroke="#F59E0B" stroke-width="1.6" stroke-linecap="round"></path></svg>`;
  const boltIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#FCD34D" d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"></path></svg>`;

  function holdingsList(section) {
    const { holdings } = section;
    let head = `<div class="r-card-title">${section.listTitle}</div>`;
    if (holdings.length > 1) {
      const total = holdings.reduce((s, h) => s + h.amount, 0);
      const now = holdings.reduce((s, h) => s + h.score * h.amount, 0) / total;
      const best = holdings.reduce((s, h) => s + h.alts[0].score * h.amount, 0) / total;
      head += `<div class="holdings-score">ציון משוקלל לפי הכסף:
        <strong style="color:${scoreColor(now)}">${fmtDec(now)}</strong> ←
        <strong style="color:${scoreColor(best)}">${fmtDec(best)}</strong> בחלופות המובילות</div>`;
    }
    const rows = holdings.map((h, i) => `
      <button type="button" class="holding" data-index="${i}" aria-pressed="${i === state.index}">
        <span class="holding-name">${h.product}<small>${h.track}</small></span>
        <span class="holding-amount">${shekel(h.amount)}</span>
        <span class="score-chip" style="color:${scoreColor(h.score)}" title="AmoScore">${fmtDec(h.score)}</span>
        <span class="holding-rank">מקום ${h.rank} מתוך ${h.total}</span>
      </button>`).join('');
    return `<div class="r-card"><div class="holdings-head">${head}</div><div class="holdings">${rows}</div></div>`;
  }

  function clientCard(section, h) {
    const risk = RISK[h.risk];
    const pct = percentileOf(h);
    const good = pct >= 50;
    const profile = [
      `<span>חשיפה למניות: <strong>${h.equity}%</strong></span>`,
      `<span>נכסים: <strong>${h.israel}% בארץ · ${100 - h.israel}% בחו״ל</strong></span>`,
      h.feeDetail && `<span>דמי ניהול: <strong>${h.feeDetail}</strong></span>`,
      h.actuarial != null && `<span>איזון אקטוארי לשנה האחרונה: <strong style="color:#10B981">+${fmtDec(h.actuarial)}%</strong></span>`,
    ].filter(Boolean).join('');
    return `
      <div class="r-card client" style="--accent:${risk.color}">
        <div>
          <div class="client-pills">
            <span class="pill pill--risk">● רמת סיכון ${risk.label} (${risk.range})</span>
            <span class="pill ${good ? 'pill--good' : 'pill--bad'}">מקום ${h.rank} מתוך ${h.total}</span>
          </div>
          <div class="client-name">${h.product} · ${h.track}</div>
          <div class="client-meta">הגוף המנהל שלכם · ותק מ-${h.since}</div>
          <div class="client-stats">
            <div class="cstat"><span class="cstat-label">צבירה</span><span class="cstat-val">${shekel(h.amount)}</span></div>
            <div class="cstat"><span class="cstat-label">תשואה בשנה האחרונה</span><span class="cstat-val" style="color:#FCD34D">${fmtDec(h.r1)}%</span></div>
            <div class="cstat"><span class="cstat-label">ממוצע 3 שנים</span><span class="cstat-val">${fmtDec(h.r3)}%</span></div>
            <div class="cstat"><span class="cstat-label">${section.feeLabel}</span><span class="cstat-val">${fmtDec(h.fee, 2)}%</span></div>
          </div>
          <div class="client-profile">${profile}</div>
        </div>
        <div class="client-score">
          <span class="client-score-label">AmoScore</span>
          <span class="client-score-val" style="color:${scoreColor(h.score)}">${fmtDec(h.score)}</span>
          ${gauge(pct)}
          <span class="verdict ${good ? 'verdict--good' : 'verdict--bad'}">${good ? '✓ מעל הממוצע' : '⚠ מתחת לממוצע'}</span>
        </div>
      </div>`;
  }

  function barsCard(section, h) {
    const risk = RISK[h.risk];
    const good = percentileOf(h) >= 50;
    const max = Math.max(h.r1, ...h.alts.map(a => a.r1));
    const rankColors = ['#F59E0B', '#94A3B8', '#C084FC'];
    const you = `
      <div class="bar-row">
        <div class="bar-label">
          <span class="bar-rank" style="color:${good ? '#10B981' : '#EF4444'}">#${h.rank}</span>
          <span class="bar-you">${section.yours}</span>
        </div>
        <div class="bar-track"><div class="bar-fill ${good ? 'bar-fill--you-good' : 'bar-fill--you'}" style="--w:${(h.r1 / max) * 100}%"><span>${fmtDec(h.r1)}%</span></div></div>
      </div>`;
    const alts = h.alts.map((a, i) => `
      <div class="bar-row">
        <div class="bar-label">
          <span class="bar-rank" style="color:${rankColors[i]}">#${i + 1}</span>
          ${redacted(a.rw, `${section.unit} במקום ${i + 1}, השם מוסתר`)}
        </div>
        <div class="bar-track"><div class="bar-fill bar-fill--a${i}" style="--w:${(a.r1 / max) * 100}%"><span>${fmtDec(a.r1)}%</span></div></div>
      </div>`).join('');
    return `
      <div class="r-card">
        <div class="r-card-title">תשואה בשנה האחרונה מול השוק</div>
        <div class="r-card-sub">${h.total} ${section.units} ברמת סיכון ${risk.label} · בניכוי דמי הניהול שלכם</div>
        <div class="bars">${you}${alts}</div>
      </div>`;
  }

  function movesCard(section, h) {
    const best = h.alts[0];
    const bestPot = potentialOf(h, best.r1);
    const missed = `
      <div class="r-card move--missed">
        <div class="move-title">${boltIcon}מה החמצתם?</div>
        <div class="move-desc">עם מעבר ל${section.unit} המובילה לפני שנה, הצבירה הייתה גדלה ב-<strong>${fmtDec((bestPot / h.amount - 1) * 100)}%</strong></div>
        <div class="move-amounts">
          <div class="move-amount"><span class="move-amount-label">היום</span><span class="move-amount-val">${shekel(h.amount)}</span><span class="move-amount-sub">${fmtDec(h.r1)}% תשואה</span></div>
          <span class="move-arrow" aria-hidden="true">←</span>
          <div class="move-amount"><span class="move-amount-label">פוטנציאל</span><span class="move-amount-val move-gain">${shekel(bestPot)}</span><span class="move-amount-sub">${fmtDec(best.r1)}% תשואה</span></div>
        </div>
      </div>`;
    if (!h.golden) return `<div class="moves moves--single">${missed}</div>`;
    const gold = h.golden;
    const goldPot = potentialOf(h, gold.r1);
    return `
      <div class="moves">
        ${missed}
        <div class="r-card move--gold">
          <div class="move-title">${appleIcon}תפוח הזהב</div>
          <div class="move-desc">המקום הראשון ברמת סיכון גבוהה. עם מעבר אליו, הצבירה הייתה גדלה ב-<strong>${fmtDec((goldPot / h.amount - 1) * 100)}%</strong></div>
          <div class="move-amounts">
            <div class="move-amount"><span class="move-amount-label">היום</span><span class="move-amount-val">${shekel(h.amount)}</span></div>
            <span class="move-arrow" aria-hidden="true">←</span>
            <div class="move-amount"><span class="move-amount-label">פוטנציאל</span><span class="move-amount-val move-gain">${shekel(goldPot)}</span><span class="move-amount-sub">${fmtDec(gold.r1)}% תשואה</span></div>
          </div>
          <div class="move-fund">${section.unit}: ${redacted(gold.rw)}</div>
        </div>
      </div>`;
  }

  function advisorNote(h) {
    const name = (SITE.advisorName || 'עמוס עטיה').split(' ');
    const initials = name.map(w => w[0]).join('״');
    return `
      <div class="advisor-note">
        <span class="advisor-avatar" aria-hidden="true">${esc(initials)}</span>
        <p><b>הערה של ${esc(name[0])}</b>${h.note}</p>
      </div>`;
  }

  function renderLocked(section, h) {
    const rows = h.alts.map((a, i) => `
      <div class="locked-row"><span>${i + 1}</span><span>${h.track} · גוף מנהל</span><span>${fmtDec(a.r1)}%</span><span>${fmtDec(a.score)}</span><span>${shekel(potentialOf(h, a.r1))}</span></div>`).join('');
    document.querySelector('.locked-table').innerHTML = `
      <div class="locked-row locked-row--head"><span>#</span><span>שם ה${section.unit}</span><span>תשואה</span><span>AmoScore</span><span>פוטנציאל</span></div>
      ${rows}
      <div class="locked-row locked-row--you"><span>${h.rank}</span><span>${section.yours}</span><span>${fmtDec(h.r1)}%</span><span>${fmtDec(h.score)}</span><span>${shekel(h.amount)}</span></div>`;
  }

  function renderPanel(animate = true) {
    const section = SAMPLE[state.tab];
    const h = section.holdings[state.index];
    const panel = document.getElementById('report-panel');
    panel.innerHTML = holdingsList(section) + clientCard(section, h) + barsCard(section, h) + movesCard(section, h) + advisorNote(h);
    panel.setAttribute('aria-labelledby', `tab-${state.tab}`);
    renderLocked(section, h);
    if (animate) replayBars();
  }

  function replayBars() {
    const panel = document.getElementById('report-panel');
    panel.classList.remove('is-animating');
    void panel.offsetWidth;
    panel.classList.add('is-animating');
  }

  function selectTab(tabEl, focus = false) {
    document.querySelectorAll('.report-tab').forEach(t => {
      const on = t === tabEl;
      t.setAttribute('aria-selected', on);
      t.tabIndex = on ? 0 : -1;
    });
    if (focus) tabEl.focus();
    state.tab = tabEl.dataset.tab;
    state.index = 0;
    renderPanel();
  }

  function initReport() {
    if (!document.getElementById('report')) return;
    renderOverall();
    renderPanel(false);

    const tabs = [...document.querySelectorAll('.report-tab')];
    tabs.forEach(tab => tab.addEventListener('click', () => selectTab(tab)));
    // Right-to-left tab list: the left arrow moves forward
    document.querySelector('.report-tabs').addEventListener('keydown', e => {
      const i = tabs.indexOf(document.activeElement);
      if (i < 0) return;
      const step = { ArrowLeft: 1, ArrowRight: -1 }[e.key];
      if (step) {
        e.preventDefault();
        selectTab(tabs[(i + step + tabs.length) % tabs.length], true);
      } else if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        selectTab(tabs[e.key === 'Home' ? 0 : tabs.length - 1], true);
      }
    });

    document.getElementById('report-panel').addEventListener('click', e => {
      const btn = e.target.closest('.holding');
      if (!btn) return;
      state.index = +btn.dataset.index;
      renderPanel();
      document.querySelector(`.holding[data-index="${state.index}"]`)?.focus();
    });

    // Grow the bars once, when the report first scrolls into view
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        if (entries.some(en => en.isIntersecting)) {
          replayBars();
          io.disconnect();
        }
      }, { threshold: 0.25 });
      io.observe(document.getElementById('report-panel'));
    }
  }

  // ─── Calculator ──────────────────────────────────────────────────────────

  const BASE_RATE = 4;

  // Balance at the end of each year, compounding monthly with a deposit every month
  function growth(balance, monthly, years, annualRate) {
    const i = Math.pow(1 + annualRate / 100, 1 / 12) - 1;
    const out = [balance];
    let b = balance;
    for (let m = 1; m <= years * 12; m++) {
      b = b * (1 + i) + monthly;
      if (m % 12 === 0) out.push(b);
    }
    return out;
  }

  function niceTicks(max, count = 4) {
    if (max <= 0) return [0];
    const raw = max / count;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw);
    const ticks = [];
    for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(v);
    if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
    return ticks;
  }

  function initCalculator() {
    const form = document.getElementById('calc-form');
    if (!form) return;
    const el = id => document.getElementById(id);
    const inputs = { balance: el('calc-balance'), deposit: el('calc-deposit'), years: el('calc-years'), gap: el('calc-gap') };
    const svg = el('calc-svg');
    const tip = el('calc-tip');
    const chartBox = el('calc-chart');
    let series = { base: [], better: [] };
    let geom = null;

    function paintFill(input) {
      const pct = ((input.value - input.min) / (input.max - input.min)) * 100;
      input.style.setProperty('--fill', `${pct}%`);
    }

    function update() {
      const balance = +inputs.balance.value;
      const deposit = +inputs.deposit.value;
      const years = +inputs.years.value;
      const gap = +inputs.gap.value;
      Object.values(inputs).forEach(paintFill);

      el('calc-balance-out').textContent = shekel(balance);
      el('calc-deposit-out').textContent = shekel(deposit);
      el('calc-years-out').textContent = `${years} שנים`;
      el('calc-gap-out').textContent = `${+gap.toFixed(2)}%`;
      el('calc-legend-rate').textContent = `${+(BASE_RATE + gap).toFixed(2)}%`;

      series = { base: growth(balance, deposit, years, BASE_RATE), better: growth(balance, deposit, years, BASE_RATE + gap) };
      const a = series.base[years];
      const b = series.better[years];
      el('calc-diff').innerHTML = gainHtml(b - a);
      el('calc-sub').textContent = `${shekel(b)} במקום ${shekel(a)}, בעוד ${years} שנים`;
      draw();
    }

    function draw() {
      const W = chartBox.clientWidth || 600;
      const H = svg.clientHeight || 240;
      const pad = { top: 16, right: 50, bottom: 30, left: 100 };
      const years = series.base.length - 1;
      const max = Math.max(...series.better, 1);
      const ticks = niceTicks(max);
      const yMax = ticks[ticks.length - 1];
      // Time runs right to left, like the reading direction: today on the right
      const x = yr => W - pad.right - (yr / years) * (W - pad.left - pad.right);
      const y = v => pad.top + (1 - v / yMax) * (H - pad.top - pad.bottom);
      geom = { x, y, years, W, H, pad };

      const path = arr => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
      const area = `${path(series.better)} ${series.base.map((v, i) => `L${x(years - i).toFixed(1)},${y(series.base[years - i]).toFixed(1)}`).join('')} Z`;

      const grid = ticks.map(t => `
        <line class="grid-line" x1="${pad.left}" x2="${W - pad.right}" y1="${y(t)}" y2="${y(t)}"></line>
        <text class="axis-text" x="${W - pad.right + 8}" y="${y(t) + 4}" text-anchor="start">${shekelShort(t)}</text>`).join('');

      const endB = y(series.better[years]);
      const endA = y(series.base[years]);
      // Keep the two labels at least a line apart
      const labelB = Math.min(endB + 4, endA + 4 - 16);
      const labelA = Math.max(endA + 4, labelB + 16);

      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.setAttribute('direction', 'ltr');
      svg.innerHTML = `
        <title id="calc-svg-title">צמיחת החיסכון בשני המסלולים</title>
        ${grid}
        <path class="gap-area" d="${area}"></path>
        <path class="line-base" d="${path(series.base)}"></path>
        <path class="line-better" d="${path(series.better)}"></path>
        <circle class="end-dot-base" cx="${x(years)}" cy="${endA}" r="5"></circle>
        <circle class="end-dot-better" cx="${x(years)}" cy="${endB}" r="5"></circle>
        <text class="end-label" x="${x(years) - 10}" y="${labelB}" text-anchor="end">${shekel(series.better[years])}</text>
        <text class="end-label end-label--base" x="${x(years) - 10}" y="${labelA}" text-anchor="end">${shekel(series.base[years])}</text>
        <text class="axis-text" x="${W - pad.right}" y="${H - 8}" text-anchor="end">היום</text>
        <text class="axis-text" x="${pad.left}" y="${H - 8}" text-anchor="start">בעוד ${years} שנים</text>
        <g id="calc-cross" visibility="hidden">
          <line class="cross" y1="${pad.top}" y2="${H - pad.bottom}"></line>
          <circle class="end-dot-base" r="4.5"></circle>
          <circle class="end-dot-better" r="4.5"></circle>
        </g>
        <rect id="calc-hit" x="${pad.left}" y="0" width="${W - pad.left - pad.right}" height="${H}" fill="transparent"></rect>`;
      tip.hidden = true;
    }

    function hover(e) {
      if (!geom) return;
      const rect = svg.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * geom.W;
      const span = geom.W - geom.pad.left - geom.pad.right;
      const yr = Math.round(((geom.W - geom.pad.right - px) / span) * geom.years);
      const year = Math.max(0, Math.min(geom.years, yr));
      const cx = geom.x(year);
      const cross = svg.querySelector('#calc-cross');
      cross.setAttribute('visibility', 'visible');
      const [line, dotA, dotB] = cross.children;
      line.setAttribute('x1', cx);
      line.setAttribute('x2', cx);
      dotA.setAttribute('cx', cx);
      dotA.setAttribute('cy', geom.y(series.base[year]));
      dotB.setAttribute('cx', cx);
      dotB.setAttribute('cy', geom.y(series.better[year]));
      const a = series.base[year];
      const b = series.better[year];
      tip.innerHTML = `<b>${year === 0 ? 'היום' : `בעוד ${year} שנים`}</b><br>מסלול טוב יותר: ${shekel(b)}<br>המסלול הנוכחי: ${shekel(a)}<br><b>הפרש: ${shekel(b - a)}</b>`;
      tip.hidden = false;
      const left = (cx / geom.W) * rect.width;
      const half = tip.offsetWidth / 2;
      tip.style.left = `${Math.max(half, Math.min(rect.width - half, left))}px`;
    }

    function leave() {
      const cross = svg.querySelector('#calc-cross');
      if (cross) cross.setAttribute('visibility', 'hidden');
      tip.hidden = true;
    }

    form.addEventListener('input', update);
    form.addEventListener('submit', e => e.preventDefault());
    svg.addEventListener('pointermove', hover);
    svg.addEventListener('pointerleave', leave);
    if ('ResizeObserver' in window) new ResizeObserver(() => draw()).observe(chartBox);
    else window.addEventListener('resize', draw);
    update();
  }

  // ─── Lead form ───────────────────────────────────────────────────────────

  // Israeli mobile or landline, with or without +972
  const validPhone = s => {
    const d = s.replace(/\D/g, '');
    return /^0\d{8,9}$/.test(d) || /^972\d{8,9}$/.test(d);
  };

  function initForm() {
    const form = document.getElementById('lead-form');
    if (!form) return;
    const name = document.getElementById('lead-name');
    const phone = document.getElementById('lead-phone');
    const status = document.getElementById('lead-status');
    const submit = document.getElementById('lead-submit');

    function check(input, ok) {
      const err = document.getElementById(`${input.id}-error`);
      input.setAttribute('aria-invalid', String(!ok));
      if (ok) input.removeAttribute('aria-describedby');
      else input.setAttribute('aria-describedby', err.id);
      err.hidden = ok;
      return ok;
    }

    name.addEventListener('blur', () => name.value && check(name, name.value.trim().length > 1));
    phone.addEventListener('blur', () => phone.value && check(phone, validPhone(phone.value)));

    function showStatus(text, error = false) {
      status.textContent = text;
      status.classList.toggle('form-status--error', error);
      status.hidden = false;
    }

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const okName = check(name, name.value.trim().length > 1);
      const okPhone = check(phone, validPhone(phone.value));
      if (!okName || !okPhone) {
        (okName ? phone : name).focus();
        return;
      }
      const products = [...form.querySelectorAll('input[name="products"]:checked')].map(c => c.value);
      const note = document.getElementById('lead-note').value.trim();
      const lead = { name: name.value.trim(), phone: phone.value.trim(), products, note };
      const first = (SITE.advisorName || '').split(' ')[0];

      if (SITE.formEndpoint) {
        submit.disabled = true;
        submit.textContent = 'שולח...';
        try {
          // Form-encoded, not JSON: a JSON body needs a CORS preflight, which Google Apps Script never answers
          const res = await fetch(SITE.formEndpoint, {
            method: 'POST',
            headers: { Accept: 'application/json' },
            body: new URLSearchParams({ ...lead, products: products.join(', ') }),
          });
          if (!res.ok) throw new Error(String(res.status));
          form.reset();
          showStatus(`תודה, ${lead.name.split(' ')[0]}! הפרטים התקבלו, ו${first} יחזור אליכם.`);
        } catch {
          showStatus(`הפרטים לא נשלחו. נסו שוב, או התקשרו ל-${SITE.phone}.`, true);
        } finally {
          submit.disabled = false;
          submit.textContent = 'שלחו לי פרטים';
        }
        return;
      }

      const text = [
        `שלום${first ? ` ${first}` : ''}, אשמח לקבל דוח אישי.`,
        `שם: ${lead.name}`,
        `טלפון: ${lead.phone}`,
        products.length && `מה יש לי: ${products.join(', ')}`,
        note && `הערה: ${note}`,
      ].filter(Boolean).join('\n');
      const url = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
      const win = window.open(url, '_blank');
      if (win) win.opener = null;
      else window.location.href = url;
      showStatus('ההודעה מוכנה בוואטסאפ. לחצו שם על "שליחה" כדי שתגיע אלינו.');
    });
  }

  // ─── Boot ────────────────────────────────────────────────────────────────

  applyConfig();
  initReport();
  initCalculator();
  initForm();
})();
