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
  chart: document.getElementById("chart"),
  tooltip: document.getElementById("tooltip"),
};

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

  renderChart(monthData, prospects);
}

function renderChart(data, maxProspects) {
  const svg = els.chart;
  svg.innerHTML = "";

  const rect = svg.getBoundingClientRect();
  const W = rect.width;
  const H = rect.height;

  const margin = { top: 10, right: 30, bottom: 36, left: 36 };
  const innerW = W - margin.left - margin.right;
  const innerH = H - margin.top - margin.bottom;

  const ticks = niceTicks(maxProspects);
  const xMax = ticks[ticks.length - 1];
  const xScale = (v) => margin.left + (v / xMax) * innerW;

  const rows = data.length;
  const rowHeight = innerH / rows;
  const barHeight = Math.min(34, rowHeight * 0.7);

  // Gridlines + x-axis labels
  for (const tick of ticks) {
    const x = xScale(tick);
    const line = document.createElementNS(SVG_NS, "line");
    line.setAttribute("x1", x);
    line.setAttribute("x2", x);
    line.setAttribute("y1", margin.top);
    line.setAttribute("y2", margin.top + innerH);
    line.setAttribute("stroke", "#3a4555");
    line.setAttribute("stroke-width", "1");
    line.setAttribute("stroke-dasharray", tick === 0 ? "0" : "0");
    line.setAttribute("opacity", tick === 0 ? "0.6" : "0.25");
    svg.appendChild(line);

    const label = document.createElementNS(SVG_NS, "text");
    label.setAttribute("x", x);
    label.setAttribute("y", margin.top + innerH + 20);
    label.setAttribute("fill", "#8b95a5");
    label.setAttribute("font-size", "10");
    label.setAttribute("text-anchor", "middle");
    label.textContent = `${tick} ${t("people")}`;
    svg.appendChild(label);
  }

  // Bars per month (overlapping: prospects > leads > customers)
  data.forEach((d, i) => {
    const yCenter = margin.top + rowHeight * (i + 0.5);
    const y = yCenter - barHeight / 2;

    const layers = [
      { value: d.prospects, color: "var(--bar-prospects)", fill: "#b8c2d0" },
      { value: d.leads, color: "var(--bar-leads)", fill: "#6f7a8d" },
      { value: d.customers, color: "var(--bar-customers)", fill: "#475164" },
    ];

    layers.forEach((layer) => {
      const w = Math.max(0, xScale(layer.value) - margin.left);
      const bar = document.createElementNS(SVG_NS, "rect");
      bar.setAttribute("x", margin.left);
      bar.setAttribute("y", y);
      bar.setAttribute("width", w);
      bar.setAttribute("height", barHeight);
      bar.setAttribute("fill", layer.fill);
      bar.setAttribute("rx", "2");
      svg.appendChild(bar);
    });

    // Y-axis label (month number)
    const label = document.createElementNS(SVG_NS, "text");
    label.setAttribute("x", margin.left - 8);
    label.setAttribute("y", yCenter + 3);
    label.setAttribute("fill", "#8b95a5");
    label.setAttribute("font-size", "10");
    label.setAttribute("text-anchor", "end");
    label.textContent = d.month;
    svg.appendChild(label);

    // Invisible hover row
    const hover = document.createElementNS(SVG_NS, "rect");
    hover.setAttribute("x", margin.left);
    hover.setAttribute("y", margin.top + rowHeight * i);
    hover.setAttribute("width", innerW);
    hover.setAttribute("height", rowHeight);
    hover.setAttribute("fill", "transparent");
    hover.style.cursor = "pointer";
    hover.addEventListener("mousemove", (e) => showTooltip(e, d));
    hover.addEventListener("mouseleave", hideTooltip);
    svg.appendChild(hover);
  });
}

function showTooltip(e, d) {
  const containerRect = els.chart.parentElement.getBoundingClientRect();
  els.tooltip.innerHTML =
    `${t("month")} #${d.month}<br>` +
    `${t("prospects")}: ${d.prospects}<br>` +
    `${t("leads")}: ${d.leads}<br>` +
    `${t("customers")}: ${d.customers}`;
  els.tooltip.classList.add("visible");

  const left = e.clientX - containerRect.left + 14;
  const top = e.clientY - containerRect.top - els.tooltip.offsetHeight / 2;
  els.tooltip.style.left = left + "px";
  els.tooltip.style.top = top + "px";
}

function hideTooltip() {
  els.tooltip.classList.remove("visible");
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
  els.leadRate,
  els.prospectRate,
].forEach((el) => el.addEventListener("input", calculate));

els.currency.addEventListener("change", () => {
  updateCurrencyPrefix();
  calculate();
});

els.language.addEventListener("change", () => {
  currentLang = els.language.value || "en";
  applyTranslations();
  calculate();
});

window.addEventListener("resize", calculate);

applyTranslations();
updateCurrencyPrefix();
calculate();
