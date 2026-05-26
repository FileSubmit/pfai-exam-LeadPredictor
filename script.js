const SVG_NS = "http://www.w3.org/2000/svg";

const translations = {
  en: {
    language: "Language",
    currency: "Currency",
    campaignStart: "Campaign Start",
    campaignEnd: "Campaign End",
    totalRevenue: "Total Revenue",
    avgOrderValue: "Avg. Order Value",
    leadRate: "Lead Response Rate",
    prospectRate: "Prospect Response Rate",
    months: "Months",
    month: "Month",
    prospects: "Prospects",
    leads: "Leads",
    customers: "Customers",
    people: "people",
    english: "English",
    spanish: "Spanish",
    german: "German",
    french: "French",
    usDollar: "US Dollar",
    euro: "Euro",
    britishPound: "British Pound",
    japaneseYen: "Japanese Yen",
  },
  es: {
    language: "Idioma",
    currency: "Moneda",
    campaignStart: "Inicio de campaña",
    campaignEnd: "Fin de campaña",
    totalRevenue: "Ingresos totales",
    avgOrderValue: "Valor medio del pedido",
    leadRate: "Tasa de respuesta de clientes potenciales",
    prospectRate: "Tasa de respuesta de prospectos",
    months: "Meses",
    month: "Mes",
    prospects: "Prospectos",
    leads: "Clientes potenciales",
    customers: "Clientes",
    people: "personas",
    english: "Inglés",
    spanish: "Español",
    german: "Alemán",
    french: "Francés",
    usDollar: "Dólar estadounidense",
    euro: "Euro",
    britishPound: "Libra esterlina",
    japaneseYen: "Yen japonés",
  },
  de: {
    language: "Sprache",
    currency: "Währung",
    campaignStart: "Kampagnenstart",
    campaignEnd: "Kampagnenende",
    totalRevenue: "Gesamtumsatz",
    avgOrderValue: "Durchschn. Bestellwert",
    leadRate: "Anfragen-Antwortrate",
    prospectRate: "Interessenten-Antwortrate",
    months: "Monate",
    month: "Monat",
    prospects: "Interessenten",
    leads: "Anfragen",
    customers: "Kunden",
    people: "Personen",
    english: "Englisch",
    spanish: "Spanisch",
    german: "Deutsch",
    french: "Französisch",
    usDollar: "US-Dollar",
    euro: "Euro",
    britishPound: "Britisches Pfund",
    japaneseYen: "Japanischer Yen",
  },
  fr: {
    language: "Langue",
    currency: "Devise",
    campaignStart: "Début de campagne",
    campaignEnd: "Fin de campagne",
    totalRevenue: "Revenu total",
    avgOrderValue: "Valeur moy. de commande",
    leadRate: "Taux de réponse des pistes",
    prospectRate: "Taux de réponse des prospects",
    months: "Mois",
    month: "Mois",
    prospects: "Prospects",
    leads: "Pistes",
    customers: "Clients",
    people: "personnes",
    english: "Anglais",
    spanish: "Espagnol",
    german: "Allemand",
    french: "Français",
    usDollar: "Dollar américain",
    euro: "Euro",
    britishPound: "Livre sterling",
    japaneseYen: "Yen japonais",
  },
};

let currentLang = "en";

function t(key) {
  return (translations[currentLang] && translations[currentLang][key]) || translations.en[key] || key;
}

const els = {
  language: document.getElementById("language"),
  currency: document.getElementById("currency"),
  campaignStart: document.getElementById("campaignStart"),
  campaignEnd: document.getElementById("campaignEnd"),
  totalRevenue: document.getElementById("totalRevenue"),
  avgOrderValue: document.getElementById("avgOrderValue"),
  leadRate: document.getElementById("leadRate"),
  prospectRate: document.getElementById("prospectRate"),
  leadRateValue: document.getElementById("leadRateValue"),
  prospectRateValue: document.getElementById("prospectRateValue"),
  prospectsValue: document.getElementById("prospectsValue"),
  leadsValue: document.getElementById("leadsValue"),
  customersValue: document.getElementById("customersValue"),
  prospectsPercent: document.getElementById("prospectsPercent"),
  leadsPercent: document.getElementById("leadsPercent"),
  customersPercent: document.getElementById("customersPercent"),
  prospectsBar: document.getElementById("prospectsBar"),
  leadsBar: document.getElementById("leadsBar"),
  customersBar: document.getElementById("customersBar"),
  leadRateFill: document.getElementById("leadRateFill"),
  prospectRateFill: document.getElementById("prospectRateFill"),
  chart: document.getElementById("chart"),
  tooltip: document.getElementById("tooltip"),
};

function readChartColors() {
  const s = getComputedStyle(document.documentElement);
  return {
    prospects: s.getPropertyValue("--bar-prospects").trim(),
    leads: s.getPropertyValue("--bar-leads").trim(),
    customers: s.getPropertyValue("--bar-customers").trim(),
    grid: s.getPropertyValue("--border").trim(),
    axis: s.getPropertyValue("--text-dim").trim(),
  };
}

function getCurrencySymbol() {
  const opt = els.currency.options[els.currency.selectedIndex];
  return opt.getAttribute("data-symbol") || "$";
}

function monthsBetween(startStr, endStr) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start) || isNaN(end) || end <= start) return 1;
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  return Math.max(1, months);
}

function sigmoidProgress(month, totalMonths) {
  // S-curve: slow start, accelerates mid, plateaus end. Anchored so month 1 ≈ 0 and totalMonths = 1.
  const k = 5 / totalMonths;
  const mid = (totalMonths + 1) / 2;
  const raw = (m) => 1 / (1 + Math.exp(-k * (m - mid)));
  const min = raw(1);
  const max = raw(totalMonths);
  return (raw(month) - min) / (max - min);
}

function niceTicks(maxValue) {
  // Returns array of tick values ending at a "nice" number ≥ maxValue.
  if (maxValue <= 0) return [0, 1];
  const steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
  const targetTicks = 6;
  const rawStep = maxValue / targetTicks;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;
  let step;
  for (const s of steps) {
    if (s >= normalized) { step = s * magnitude; break; }
  }
  if (!step) step = 1000 * magnitude;
  const ticks = [];
  for (let v = 0; v <= maxValue + step * 0.0001; v += step) {
    ticks.push(Math.round(v * 1000) / 1000);
  }
  return ticks;
}

let nextRenderAnimates = false;

function calculate() {
  const totalRevenue = Math.max(0, parseFloat(els.totalRevenue.value) || 0);
  const aov = Math.max(0.0001, parseFloat(els.avgOrderValue.value) || 1);
  const leadRate = parseFloat(els.leadRate.value) / 100;
  const prospectRate = parseFloat(els.prospectRate.value) / 100;

  const customers = Math.ceil(totalRevenue / aov);
  const leads = leadRate > 0 ? Math.ceil(customers / leadRate) : 0;
  const prospects = prospectRate > 0 ? Math.ceil(leads / prospectRate) : 0;

  const leadsPct = prospects > 0 ? (leads / prospects) * 100 : 0;
  const customersPct = prospects > 0 ? (customers / prospects) * 100 : 0;

  els.prospectsValue.textContent = prospects.toLocaleString();
  els.leadsValue.textContent = leads.toLocaleString();
  els.customersValue.textContent = customers.toLocaleString();

  els.prospectsPercent.textContent = "100%";
  els.leadsPercent.textContent = `${Math.round(leadsPct)}%`;
  els.customersPercent.textContent = `${Math.round(customersPct)}%`;

  els.prospectsBar.style.width = "100%";
  els.leadsBar.style.width = leadsPct + "%";
  els.customersBar.style.width = customersPct + "%";

  els.leadRateValue.textContent = (leadRate * 100).toFixed(2) + "%";
  els.prospectRateValue.textContent = (prospectRate * 100).toFixed(2) + "%";

  const totalMonths = monthsBetween(els.campaignStart.value, els.campaignEnd.value);

  const monthData = [];
  for (let m = 1; m <= totalMonths; m++) {
    const p = sigmoidProgress(m, totalMonths);
    monthData.push({
      month: m,
      prospects: Math.round(prospects * p),
      leads: Math.round(leads * p),
      customers: Math.round(customers * p),
    });
  }

  renderChart(monthData, prospects, nextRenderAnimates);
  nextRenderAnimates = false;
}

let chartAnimRaf = null;
let chartAnimQueue = [];

function cancelChartAnimation() {
  if (chartAnimRaf !== null) {
    cancelAnimationFrame(chartAnimRaf);
    chartAnimRaf = null;
  }
  chartAnimQueue = [];
}

function runChartAnimation(duration) {
  const startTime = performance.now();
  const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

  function frame(now) {
    let active = false;
    for (const a of chartAnimQueue) {
      const elapsed = now - startTime - a.delay;
      let p;
      if (elapsed <= 0) {
        p = 0;
        active = true;
      } else if (elapsed >= duration) {
        p = 1;
      } else {
        p = easeOutQuart(elapsed / duration);
        active = true;
      }
      a.bar.setAttribute("width", a.target * p);
    }
    if (active) {
      chartAnimRaf = requestAnimationFrame(frame);
    } else {
      chartAnimRaf = null;
    }
  }
  chartAnimRaf = requestAnimationFrame(frame);
}

function renderChart(data, maxProspects, animate) {
  const svg = els.chart;
  cancelChartAnimation();
  svg.innerHTML = "";

  const colors = readChartColors();

  const rect = svg.getBoundingClientRect();
  const W = rect.width;
  const H = rect.height;

  const margin = { top: 12, right: 36, bottom: 38, left: 42 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const ticks = niceTicks(maxProspects);
  const xMax = ticks[ticks.length - 1];
  const xScale = (v) => margin.left + (v / xMax) * innerW;

  const rows = data.length;
  const rowHeight = innerH / rows;
  const barHeight = Math.min(28, rowHeight * 0.62);

  // Gridlines + x-axis labels
  for (const tick of ticks) {
    const x = xScale(tick);
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", x);
    line.setAttribute("x2", x);
    line.setAttribute("y1", margin.top);
    line.setAttribute("y2", margin.top + innerH);
    line.setAttribute("stroke", colors.grid);
    line.setAttribute("stroke-width", "1");
    line.setAttribute("opacity", tick === 0 ? "1" : "0.55");
    svg.appendChild(line);

    const label = document.createElementNS(SVG_NS, "text");
    label.setAttribute("x", x);
    label.setAttribute("y", margin.top + innerH + 22);
    label.setAttribute("fill", colors.axis);
    label.setAttribute("font-size", "10");
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("font-family", "inherit");
    label.textContent = `${tick} ${t("people")}`;
    svg.appendChild(label);
  }

  // Bars per month (largest first so smaller bars sit on top)
  data.forEach((d, i) => {
    const yCenter = margin.top + rowHeight * (i + 0.5);
    const y = yCenter - barHeight / 2;

    // Invisible hover row (added first so it sits under bars for hit testing via overlay)
    const hover = document.createElementNS(SVG_NS, "rect");
    hover.setAttribute("x", margin.left);
    hover.setAttribute("y", margin.top + rowHeight * i);
    hover.setAttribute("width", innerW);
    hover.setAttribute("height", rowHeight);
    hover.setAttribute("class", "hover-row");
    svg.appendChild(hover);

    const layers = [
      { key: "prospects", value: d.prospects },
      { key: "leads", value: d.leads },
      { key: "customers", value: d.customers },
    ];

    layers.forEach((layer) => {
      const targetW = Math.max(0, xScale(layer.value) - margin.left);
      const bar = document.createElementNS(SVG_NS, "rect");
      bar.setAttribute("x", margin.left);
      bar.setAttribute("y", y);
      bar.setAttribute("width", animate ? 0 : targetW);
      bar.setAttribute("height", barHeight);
      bar.setAttribute("fill", colors[layer.key]);
      bar.setAttribute("rx", "3");
      bar.setAttribute("class", "bar");
      svg.appendChild(bar);

      if (animate) {
        chartAnimQueue.push({ bar, target: targetW, delay: i * 35 });
      }
    });

    // Y-axis label (month number)
    const label = document.createElementNS(SVG_NS, "text");
    label.setAttribute("x", margin.left - 10);
    label.setAttribute("y", yCenter + 3);
    label.setAttribute("fill", colors.axis);
    label.setAttribute("font-size", "10");
    label.setAttribute("text-anchor", "end");
    label.setAttribute("font-family", "inherit");
    label.textContent = d.month;
    svg.appendChild(label);

    hover.addEventListener("mousemove", (e) => {
      hover.classList.add("active");
      showTooltip(e, d);
    });
    hover.addEventListener("mouseleave", () => {
      hover.classList.remove("active");
      hideTooltip();
    });
  });

  if (animate && chartAnimQueue.length) {
    runChartAnimation(700);
  }
}

function showTooltip(e, d) {
  const containerRect = els.chart.parentElement.getBoundingClientRect();
  const rows = [
    { key: "prospects", value: d.prospects },
    { key: "leads", value: d.leads },
    { key: "customers", value: d.customers },
  ];
  els.tooltip.innerHTML =
    `<div class="tooltip-title">${t("month")} ${d.month}</div>` +
    rows.map((r) =>
      `<div class="tooltip-row">` +
        `<span class="dot" style="background: var(--bar-${r.key})"></span>` +
        `<span class="label">${t(r.key)}</span>` +
        `<span class="value">${r.value.toLocaleString()}</span>` +
      `</div>`
    ).join("");
  els.tooltip.classList.add("visible");

  const tooltipW = els.tooltip.offsetWidth;
  const tooltipH = els.tooltip.offsetHeight;
  const cursorX = e.clientX - containerRect.left;
  const cursorY = e.clientY - containerRect.top;

  let left = cursorX + 16;
  if (left + tooltipW > containerRect.width - 4) {
    left = cursorX - tooltipW - 16;
  }
  let top = cursorY - tooltipH / 2;
  top = Math.max(4, Math.min(top, containerRect.height - tooltipH - 4));

  els.tooltip.style.left = left + "px";
  els.tooltip.style.top = top + "px";
}

function hideTooltip() {
  els.tooltip.classList.remove("visible");
}

function updateRangeFill(input, fill) {
  const min = parseFloat(input.min) || 0;
  const max = parseFloat(input.max) || 100;
  const val = parseFloat(input.value);
  const pct = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));
  fill.style.width = pct + "%";
}

function updateCurrencyPrefix() {
  const symbol = getCurrencySymbol();
  document.querySelectorAll(".input-with-prefix .prefix").forEach((el) => {
    el.textContent = symbol;
  });
}

function applyTranslations() {
  document.documentElement.lang = currentLang;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const translated = t(key);

    if (el.tagName === "OPTION") {
      const flag = el.getAttribute("data-flag");
      const symbol = el.getAttribute("data-symbol");
      if (flag) {
        el.textContent = `${flag} ${translated}`;
      } else if (symbol) {
        el.textContent = `${symbol} ${translated}`;
      } else {
        el.textContent = translated;
      }
    } else {
      el.textContent = translated;
    }
  });
}

// Wire up
[
  els.totalRevenue,
  els.avgOrderValue,
  els.campaignStart,
  els.campaignEnd,
].forEach((el) => el.addEventListener("input", calculate));

els.leadRate.addEventListener("input", () => {
  updateRangeFill(els.leadRate, els.leadRateFill);
  calculate();
});

els.prospectRate.addEventListener("input", () => {
  updateRangeFill(els.prospectRate, els.prospectRateFill);
  calculate();
});

els.currency.addEventListener("change", () => {
  updateCurrencyPrefix();
  calculate();
});

els.language.addEventListener("change", () => {
  currentLang = els.language.value || "en";
  applyTranslations();
  nextRenderAnimates = true;
  calculate();
});

let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(calculate, 80);
});

// Theme handling
const THEME_KEY = "leadpredictor-theme";
const systemThemeQuery = window.matchMedia("(prefers-color-scheme: light)");
let themePref = localStorage.getItem(THEME_KEY) || "system";

function effectiveTheme() {
  if (themePref === "system") {
    return systemThemeQuery.matches ? "light" : "dark";
  }
  return themePref;
}

function applyTheme(animate) {
  document.documentElement.setAttribute("data-theme", effectiveTheme());
  document.querySelectorAll(".theme-option").forEach((btn) => {
    const active = btn.dataset.themeValue === themePref;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });
  if (animate) {
    nextRenderAnimates = true;
    calculate();
  }
}

document.querySelectorAll(".theme-option").forEach((btn) => {
  btn.addEventListener("click", () => {
    themePref = btn.dataset.themeValue;
    if (themePref === "system") {
      localStorage.removeItem(THEME_KEY);
    } else {
      localStorage.setItem(THEME_KEY, themePref);
    }
    applyTheme(true);
  });
});

systemThemeQuery.addEventListener("change", () => {
  if (themePref === "system") applyTheme(true);
});

applyTheme(false);
applyTranslations();
updateCurrencyPrefix();
updateRangeFill(els.leadRate, els.leadRateFill);
updateRangeFill(els.prospectRate, els.prospectRateFill);
nextRenderAnimates = true;
calculate();
