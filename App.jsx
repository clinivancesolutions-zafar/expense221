import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Home, Plus, List as ListIcon, PieChart as PieChartIcon, BarChart3, Wallet, Sparkles,
  Settings as SettingsIcon, Search, X, Camera, Trash2, Edit2, Download, Upload, Sun, Moon,
  AlertTriangle, TrendingUp, IndianRupee, FileSpreadsheet, Printer, Send, MessageCircle,
  Store, Menu, Image as ImageIcon, ChevronRight, Cloud, CloudUpload, CloudDownload, Check,
  CalendarDays, Filter as FilterIcon
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, LineChart, Line
} from "recharts";
import * as XLSX from "xlsx";

/* ---------------------------------- THEME ---------------------------------- */
const THEME = {
  light: { bg: "#EFF5FC", surface: "#FFFFFF", surfaceAlt: "#E4EFFA", border: "#CFDFF0",
    ink: "#0E2A43", muted: "#5B7A97", shadow: "rgba(13,58,97,0.10)" },
  dark: { bg: "#071523", surface: "#0D2136", surfaceAlt: "#122A44", border: "#1D3B58",
    ink: "#EAF3FC", muted: "#7FA0C0", shadow: "rgba(0,0,0,0.45)" },
};
const BRAND = { blue: "#1768B0", blueDeep: "#0B4778", sky: "#3FA0E8", skyLight: "#8FCBF5",
  hazard: "#E8940C", hazardDeep: "#BE7A05", rust: "#D64545", fern: "#1AA574", fernDeep: "#13805A" };
const FONT_DISPLAY = "'Sora', ui-sans-serif, system-ui, sans-serif";
const FONT_BODY = "'Inter', ui-sans-serif, system-ui, sans-serif";
const FONT_MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const numStyle = (extra) => ({ fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums", ...extra });

const DEFAULT_CATEGORIES = [
  { name: "Cement", color: "#8A8880" }, { name: "Sand", color: "#C79A4B" },
  { name: "Bricks", color: "#B04E2C" }, { name: "Steel", color: "#4E7691" },
  { name: "Stone", color: "#726657" }, { name: "Marble", color: "#A39D8E" },
  { name: "Tiles", color: "#357587" }, { name: "Paint", color: "#B8451A" },
  { name: "Plumbing", color: "#2B5A6C" }, { name: "Electrical", color: "#DD7B12" },
  { name: "Wood", color: "#7A5430" }, { name: "Labour", color: "#4C7A3D" },
  { name: "Transportation", color: "#54606B" }, { name: "Machinery", color: "#7A6A1E" },
  { name: "Interior", color: "#805A96" }, { name: "Kitchen", color: "#AD733F" },
  { name: "Bathroom", color: "#3E7EA0" }, { name: "Miscellaneous", color: "#79766B" },
];
const PAYMENT_MODES = ["Cash", "UPI", "Card", "Bank"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ---------------------------------- STORAGE ---------------------------------- */
const store = {
  async get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
  async set(key, value) { try { localStorage.setItem(key, value); return true; } catch (e) { console.error("storage set failed", e); return null; } },
  async del(key) { try { localStorage.removeItem(key); return true; } catch (e) { return null; } },
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const todayStr = () => new Date().toISOString().slice(0, 10);
const inr = (n) => "₹" + Math.round(n || 0).toLocaleString("en-IN");
const inrFull = (n) => "₹" + (n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const monthKey = (d) => d.slice(0, 7);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const maxW = 720;
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.6));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function downloadBlob(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ---------------------------------- SMALL UI PRIMITIVES ---------------------------------- */
function Btn({ children, onClick, variant = "secondary", c, style, className = "", type = "button", disabled }) {
  const base = { border: "none", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
    fontWeight: 700, letterSpacing: "0.01em", fontFamily: FONT_BODY, transition: "transform .08s ease, box-shadow .15s ease, filter .15s ease" };
  const variants = {
    primary: { background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.sky})`, color: "#fff", boxShadow: `0 4px 12px ${BRAND.blue}40` },
    blue: { background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.sky})`, color: "#fff", boxShadow: `0 4px 12px ${BRAND.blue}40` },
    ghost: { background: c.surfaceAlt, color: c.ink },
    outline: { background: "transparent", color: c.ink, border: `1.5px solid ${c.border}` },
    danger: { background: "transparent", color: BRAND.rust, border: `1.5px solid ${BRAND.rust}` },
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(0.97)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.filter = "brightness(1.05)"; }}
      className={`px-4 py-2.5 rounded-xl text-sm inline-flex items-center justify-center gap-2 ${className}`}
      style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

function Card({ c, children, style, className = "", hover = false }) {
  return (
    <div className={`rounded-2xl ${className}`}
      onMouseEnter={hover ? (e) => { e.currentTarget.style.boxShadow = `0 10px 26px ${c.shadow}`; e.currentTarget.style.transform = "translateY(-2px)"; } : undefined}
      onMouseLeave={hover ? (e) => { e.currentTarget.style.boxShadow = `0 1px 3px ${c.shadow}`; e.currentTarget.style.transform = "translateY(0)"; } : undefined}
      style={{ background: c.surface, border: `1px solid ${c.border}`, boxShadow: `0 1px 3px ${c.shadow}`,
        transition: "box-shadow .2s ease, transform .2s ease", ...style }}>
      {children}
    </div>
  );
}

function Field({ label, children, c }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-bold uppercase tracking-wide" style={{ color: c.muted, fontFamily: FONT_BODY, letterSpacing: "0.04em" }}>{label}</span>
      {children}
    </label>
  );
}

function inputStyle(c) {
  return {
    background: c.bg, border: `1.5px solid ${c.border}`, color: c.ink, fontFamily: FONT_BODY,
    borderRadius: 10, padding: "10px 12px", fontSize: 15, outline: "none", width: "100%",
    transition: "border-color .15s ease, box-shadow .15s ease",
  };
}

function Badge({ text, color, textColor }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ background: color + "1A", color: textColor || color, border: `1px solid ${color}33` }}>{text}</span>
  );
}

/* ---------------------------------- BUDGET TAPE (signature element) ---------------------------------- */
function BudgetTape({ c, spent, budget, dark }) {
  const pct = budget > 0 ? clamp((spent / budget) * 100, 0, 999) : 0;
  const overshoot = pct > 100;
  const fillPct = clamp(pct, 0, 100);
  const ticks = Array.from({ length: 21 }, (_, i) => i * 5);
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: c.muted }}>Budget measuring tape</span>
        <span className="text-xs font-bold" style={{ color: overshoot ? BRAND.rust : BRAND.fern, fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums" }}>
          {pct.toFixed(1)}% {overshoot ? "over" : "used"}
        </span>
      </div>
      <div className="relative rounded-lg overflow-hidden" style={{ height: 36, background: c.surfaceAlt, border: `1.5px solid ${c.border}`, boxShadow: `inset 0 1px 3px ${c.shadow}` }}>
        <div className="absolute inset-y-0 left-0 transition-all duration-500"
          style={{ width: `${fillPct}%`, background: overshoot ? `linear-gradient(90deg, ${BRAND.rust}, #E8735A)` : `linear-gradient(90deg, ${BRAND.blueDeep}, ${BRAND.blue}, ${BRAND.sky})` }} />
        <div className="absolute inset-0 flex items-center">
          {ticks.map((t) => (
            <div key={t} className="absolute top-0 bottom-0" style={{ left: `${t}%` }}>
              <div style={{ width: 1, height: t % 20 === 0 ? "100%" : "45%", background: t <= fillPct ? "rgba(255,255,255,0.4)" : (dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)") }} />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex items-center justify-between px-2.5 text-[11px] font-bold"
          style={{ fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums", color: dark ? "#fff" : "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}>
          <span>{inr(spent)}</span>
          <span style={{ color: c.ink, textShadow: "none" }}>{budget > 0 ? inr(budget) : "no budget set"}</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- MAIN APP ---------------------------------- */
export default function App() {
  const [ready, setReady] = useState(false);
  const [theme, setTheme] = useState("light");
  const [tab, setTab] = useState("dashboard");
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [budgets, setBudgets] = useState({ overall: 0, categories: {} });
  const [settings, setSettings] = useState({ supabaseUrl: "", supabaseKey: "", supabaseTable: "expenses" });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [toast, setToast] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [filters, setFilters] = useState({ search: "", from: "", to: "", category: "All", paymentMode: "All" });
  const fileInputRef = useRef(null);

  const c = theme === "dark" ? THEME.dark : THEME.light;
  const dark = theme === "dark";

  const showToast = (msg, kind = "ok") => { setToast({ msg, kind }); setTimeout(() => setToast(null), 2600); };

  /* ---- Load from persistent storage ---- */
  useEffect(() => {
    (async () => {
      const [expRaw, budRaw, catRaw, setRaw, themeRaw] = await Promise.all([
        store.get("expenses"), store.get("budgets"), store.get("categories"), store.get("settings"), store.get("theme"),
      ]);
      if (expRaw) { try { setExpenses(JSON.parse(expRaw)); } catch (e) {} }
      if (budRaw) { try { setBudgets(JSON.parse(budRaw)); } catch (e) {} }
      if (catRaw) { try { setCategories(JSON.parse(catRaw)); } catch (e) {} }
      if (setRaw) { try { setSettings(JSON.parse(setRaw)); } catch (e) {} }
      if (themeRaw) setTheme(themeRaw);
      setReady(true);
    })();
  }, []);

  const persistExpenses = useCallback(async (list) => { setExpenses(list); await store.set("expenses", JSON.stringify(list)); }, []);
  const persistBudgets = useCallback(async (b) => { setBudgets(b); await store.set("budgets", JSON.stringify(b)); }, []);
  const persistCategories = useCallback(async (cats) => { setCategories(cats); await store.set("categories", JSON.stringify(cats)); }, []);
  const persistSettings = useCallback(async (s) => { setSettings(s); await store.set("settings", JSON.stringify(s)); }, []);
  const toggleTheme = async () => { const t = theme === "dark" ? "light" : "dark"; setTheme(t); await store.set("theme", t); };

  const catColor = (name) => (categories.find((x) => x.name === name) || {}).color || BRAND.blue;

  /* ---- CRUD ---- */
  const saveExpense = async (data, billFile, removeBill) => {
    const id = editingExpense ? editingExpense.id : uid();
    const amount = (parseFloat(data.qty) || 0) * (parseFloat(data.unitPrice) || 0);
    let hasBill = editingExpense ? !!editingExpense.hasBill : false;
    if (removeBill && editingExpense?.hasBill) { await store.del("bill:" + id); hasBill = false; }
    if (billFile) { const dataUrl = await resizeImage(billFile); await store.set("bill:" + id, dataUrl); hasBill = true; }
    const record = { id, date: data.date, category: data.category, item: data.item, vendor: data.vendor,
      qty: parseFloat(data.qty) || 0, unitPrice: parseFloat(data.unitPrice) || 0, amount,
      paymentMode: data.paymentMode, notes: data.notes || "", hasBill };
    let list;
    if (editingExpense) list = expenses.map((e) => (e.id === id ? record : e));
    else list = [record, ...expenses];
    await persistExpenses(list);
    setModalOpen(false); setEditingExpense(null);
    showToast(editingExpense ? "Expense updated" : "Expense added");
  };

  const deleteExpense = async (id) => {
    const exp = expenses.find((e) => e.id === id);
    if (exp?.hasBill) await store.del("bill:" + id);
    await persistExpenses(expenses.filter((e) => e.id !== id));
    showToast("Expense deleted", "warn");
  };

  const addCategory = async (name, color) => {
    if (!name.trim()) return;
    if (categories.some((cc) => cc.name.toLowerCase() === name.trim().toLowerCase())) { showToast("Category already exists", "warn"); return; }
    await persistCategories([...categories, { name: name.trim(), color, custom: true }]);
    showToast("Category added");
  };
  const removeCategory = async (name) => {
    await persistCategories(categories.filter((cc) => cc.name !== name));
  };

  /* ---- Derived data ---- */
  const totalSpent = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const todaySpend = useMemo(() => expenses.filter((e) => e.date === todayStr()).reduce((s, e) => s + e.amount, 0), [expenses]);
  const monthSpend = useMemo(() => {
    const mk = monthKey(todayStr());
    return expenses.filter((e) => monthKey(e.date) === mk).reduce((s, e) => s + e.amount, 0);
  }, [expenses]);
  const remaining = budgets.overall - totalSpent;
  const utilization = budgets.overall > 0 ? (totalSpent / budgets.overall) * 100 : 0;

  const categoryTotals = useMemo(() => {
    const m = {};
    expenses.forEach((e) => { m[e.category] = (m[e.category] || 0) + e.amount; });
    return Object.entries(m).map(([name, value]) => ({ name, value, color: catColor(name) })).sort((a, b) => b.value - a.value);
  }, [expenses, categories]);

  const monthlyTotals = useMemo(() => {
    const m = {};
    expenses.forEach((e) => { const k = monthKey(e.date); m[k] = (m[k] || 0) + e.amount; });
    return Object.entries(m).sort((a, b) => a[0].localeCompare(b[0])).map(([k, v]) => {
      const [y, mo] = k.split("-"); return { key: k, label: MONTH_NAMES[parseInt(mo, 10) - 1] + " '" + y.slice(2), value: v };
    });
  }, [expenses]);

  const vendorTotals = useMemo(() => {
    const m = {};
    expenses.forEach((e) => { const v = e.vendor || "Unknown"; m[v] = (m[v] || 0) + e.amount; });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [expenses]);

  const topItems = useMemo(() => [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 10), [expenses]);
  const highestMonth = monthlyTotals.length ? [...monthlyTotals].sort((a, b) => b.value - a.value)[0] : null;

  const overBudgetCats = useMemo(() => {
    return Object.entries(budgets.categories || {}).map(([cat, bud]) => {
      const spent = categoryTotals.find((x) => x.name === cat)?.value || 0;
      return { cat, bud, spent, pct: bud > 0 ? (spent / bud) * 100 : 0 };
    }).filter((x) => x.bud > 0 && x.spent > x.bud);
  }, [budgets, categoryTotals]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!(e.item.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || (e.vendor || "").toLowerCase().includes(q))) return false;
      }
      if (filters.from && e.date < filters.from) return false;
      if (filters.to && e.date > filters.to) return false;
      if (filters.category !== "All" && e.category !== filters.category) return false;
      if (filters.paymentMode !== "All" && e.paymentMode !== filters.paymentMode) return false;
      return true;
    }).sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [expenses, filters]);

  const recentExpenses = useMemo(() => [...expenses].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5), [expenses]);

  /* ---- Backup ---- */
  const exportJSON = () => {
    const payload = { expenses, budgets, categories, settings, exportedAt: new Date().toISOString(), app: "Zafar's Construction Expense" };
    downloadBlob(`zafars-construction-expense-backup-${todayStr()}.json`, JSON.stringify(payload, null, 2), "application/json");
    showToast("Backup exported");
  };
  const importJSON = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.expenses) await persistExpenses(data.expenses);
        if (data.budgets) await persistBudgets(data.budgets);
        if (data.categories) await persistCategories(data.categories);
        if (data.settings) await persistSettings(data.settings);
        showToast("Backup imported");
      } catch (err) { showToast("Invalid backup file", "warn"); }
    };
    reader.readAsText(file);
  };

  const exportExcel = (rows, filename, sheetName = "Report") => {
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
    showToast("Excel exported");
  };

  const exportPDF = (title, rows, columns) => {
    const w = window.open("", "_blank");
    const rowsHtml = rows.map((r) => `<tr>${columns.map((col) => `<td style="padding:6px 10px;border-bottom:1px solid #ddd;font-size:13px;">${r[col] ?? ""}</td>`).join("")}</tr>`).join("");
    const headHtml = columns.map((col) => `<th style="padding:8px 10px;text-align:left;font-size:12px;text-transform:uppercase;color:#555;border-bottom:2px solid #333;">${col}</th>`).join("");
    w.document.write(`<html><head><title>${title}</title></head><body style="font-family:Arial,sans-serif;padding:24px;">
      <h2 style="margin:0 0 4px;">${title}</h2>
      <p style="color:#777;font-size:12px;margin:0 0 16px;">Zafar's Construction Expense — generated ${new Date().toLocaleString("en-IN")}</p>
      <table style="width:100%;border-collapse:collapse;"><thead><tr>${headHtml}</tr></thead><tbody>${rowsHtml}</tbody></table>
    </body></html>`);
    w.document.close(); w.focus();
    setTimeout(() => { w.print(); }, 400);
  };

  /* ---- Supabase (optional) ---- */
  const supabaseHeaders = () => ({ "Content-Type": "application/json", apikey: settings.supabaseKey, Authorization: `Bearer ${settings.supabaseKey}` });
  const supabaseBackup = async () => {
    if (!settings.supabaseUrl || !settings.supabaseKey) { showToast("Add Supabase URL and key first", "warn"); return; }
    try {
      const url = `${settings.supabaseUrl.replace(/\/$/, "")}/rest/v1/${settings.supabaseTable || "expenses"}`;
      const res = await fetch(url, { method: "POST", headers: { ...supabaseHeaders(), Prefer: "resolution=merge-duplicates" }, body: JSON.stringify(expenses) });
      if (!res.ok) throw new Error(await res.text());
      showToast("Backed up to Supabase");
    } catch (e) { showToast("Supabase backup failed — check settings", "warn"); }
  };
  const supabaseRestore = async () => {
    if (!settings.supabaseUrl || !settings.supabaseKey) { showToast("Add Supabase URL and key first", "warn"); return; }
    try {
      const url = `${settings.supabaseUrl.replace(/\/$/, "")}/rest/v1/${settings.supabaseTable || "expenses"}?select=*`;
      const res = await fetch(url, { headers: supabaseHeaders() });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (Array.isArray(data)) { await persistExpenses(data); showToast("Restored from Supabase"); }
    } catch (e) { showToast("Supabase restore failed — check settings", "warn"); }
  };

  /* ---- AI assistant (offline, rule-based) ---- */
  const answerQuestion = (raw) => {
    const q = raw.toLowerCase().trim();
    const findCategory = () => categories.find((cat) => q.includes(cat.name.toLowerCase()));
    const findVendor = () => vendorTotals.find((v) => q.includes(v.name.toLowerCase()));

    if (/(over ?budget|exceed|overspend)/.test(q)) {
      if (overBudgetCats.length === 0) return "No categories are exceeding their budget right now. Everything is within limits.";
      return "These categories are over budget:\n" + overBudgetCats.map((x) => `• ${x.cat}: spent ${inr(x.spent)} vs budget ${inr(x.bud)} (${x.pct.toFixed(0)}%)`).join("\n");
    }
    if (/(highest|most expensive|top).*(month)/.test(q) || /(month).*(highest|most)/.test(q)) {
      if (!highestMonth) return "There isn't enough data yet to determine the highest spending month.";
      return `Your highest spending month is ${highestMonth.label} with ${inr(highestMonth.value)} spent.`;
    }
    if (/(remaining|left|estimate).*(cost|budget|spend)/.test(q) || /(how much).*(left)/.test(q)) {
      if (budgets.overall <= 0) return "You haven't set an overall project budget yet, so I can't estimate what's remaining. Set one in the Budget tab.";
      const months = monthlyTotals.length || 1;
      const avgMonthly = totalSpent / months;
      const monthsLeft = avgMonthly > 0 ? Math.max(0, remaining / avgMonthly) : 0;
      return `You've spent ${inr(totalSpent)} of your ${inr(budgets.overall)} budget, leaving ${inr(remaining)}. At your current average pace of ${inr(avgMonthly)}/month, that's roughly ${monthsLeft.toFixed(1)} more months of spending at this rate.`;
    }
    const vendorMatch = findVendor();
    if (/(vendor|shop|supplier|paid to)/.test(q) && vendorMatch) {
      return `You've paid ${inr(vendorMatch.value)} in total to ${vendorMatch.name}.`;
    }
    if (/(vendor|shop|supplier)/.test(q) && /(biggest|top|most)/.test(q)) {
      if (!vendorTotals.length) return "No vendor data yet.";
      return "Your top vendors by spend:\n" + vendorTotals.slice(0, 5).map((v, i) => `${i + 1}. ${v.name} — ${inr(v.value)}`).join("\n");
    }
    const catMatch = findCategory();
    if (catMatch) {
      const total = categoryTotals.find((x) => x.name === catMatch.name)?.value || 0;
      const bud = budgets.categories?.[catMatch.name];
      let out = `You've spent ${inr(total)} on ${catMatch.name} so far.`;
      if (bud) out += ` That's ${((total / bud) * 100).toFixed(0)}% of the ${inr(bud)} budget for this category.`;
      return out;
    }
    if (/(total|overall).*(spent|spend)/.test(q)) return `You've spent ${inr(totalSpent)} out of a total budget of ${inr(budgets.overall)}. Remaining: ${inr(remaining)}.`;
    if (/(today)/.test(q)) return `You've spent ${inr(todaySpend)} today.`;
    if (/(this month)/.test(q)) return `You've spent ${inr(monthSpend)} this month.`;
    return "I can help with things like: spending on a category (\"how much on cement\"), vendor payments, the highest spending month, categories exceeding budget, or estimating remaining construction cost. Try asking one of those.";
  };

  useEffect(() => {
    if (document.getElementById("cet-fonts")) return;
    const link = document.createElement("link");
    link.id = "cet-fonts"; link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&display=swap";
    document.head.appendChild(link);
    const style = document.createElement("style");
    style.id = "cet-global-style";
    style.textContent = `
      * { scrollbar-width: thin; scrollbar-color: ${BRAND.skyLight} transparent; }
      *::-webkit-scrollbar { width: 8px; height: 8px; }
      *::-webkit-scrollbar-thumb { background: ${BRAND.skyLight}; border-radius: 8px; }
      *::-webkit-scrollbar-track { background: transparent; }
      button, select, input { font-family: ${FONT_BODY}; }
      button:focus-visible, select:focus-visible, input:focus-visible, textarea:focus-visible {
        outline: 2px solid ${BRAND.sky}; outline-offset: 2px;
      }
      @keyframes cetFadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      .cet-animate { animation: cetFadeUp .35s ease both; }
      @keyframes cetSpin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);
  }, []);

  if (!ready) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full py-24 gap-3"
        style={{ color: THEME.light.muted, fontFamily: FONT_BODY, background: `linear-gradient(180deg, ${THEME.light.bg}, #fff)` }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", border: `3px solid ${THEME.light.border}`,
          borderTopColor: BRAND.blue, animation: "cetSpin 0.8s linear infinite" }} />
        <span className="text-sm font-semibold">Loading Zafar's Construction Expense…</span>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full" style={{ background: dark ? c.bg : `linear-gradient(180deg, #F7FBFF 0%, ${c.bg} 320px)`, color: c.ink, fontFamily: FONT_BODY }}>
      <div className="flex w-full" style={{ minHeight: 640 }}>
        {/* Sidebar (desktop) */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 p-4 gap-1" style={{ borderRight: `1px solid ${c.border}`, background: dark ? c.surface : `linear-gradient(180deg, #FFFFFF, ${c.surfaceAlt})` }}>
          <Brand c={c} />
          <nav className="flex flex-col gap-1 mt-6">
            <NavItem icon={Home} label="Dashboard" active={tab === "dashboard"} onClick={() => setTab("dashboard")} c={c} />
            <NavItem icon={ListIcon} label="Expenses" active={tab === "expenses"} onClick={() => setTab("expenses")} c={c} />
            <NavItem icon={BarChart3} label="Reports" active={tab === "reports"} onClick={() => setTab("reports")} c={c} />
            <NavItem icon={Wallet} label="Budget" active={tab === "budget"} onClick={() => setTab("budget")} c={c} />
            <NavItem icon={PieChartIcon} label="Analytics" active={tab === "analytics"} onClick={() => setTab("analytics")} c={c} />
            <NavItem icon={Sparkles} label="Assistant" active={tab === "assistant"} onClick={() => setTab("assistant")} c={c} />
            <NavItem icon={SettingsIcon} label="Settings" active={tab === "settings"} onClick={() => setTab("settings")} c={c} />
          </nav>
          <div className="mt-auto flex flex-col gap-2">
            <Btn c={c} variant="primary" onClick={() => { setEditingExpense(null); setModalOpen(true); }} className="w-full">
              <Plus size={18} /> Add expense
            </Btn>
            <Btn c={c} variant="ghost" onClick={toggleTheme} className="w-full">
              {dark ? <Sun size={16} /> : <Moon size={16} />} {dark ? "Light mode" : "Dark mode"}
            </Btn>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Mobile top bar */}
          <div className="md:hidden flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${c.border}`, background: c.surface }}>
            <Brand c={c} compact />
            <button onClick={toggleTheme} className="p-2 rounded-lg" style={{ background: c.surfaceAlt }}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>

          <main className="flex-1 p-4 md:p-8 pb-28 md:pb-8 max-w-6xl w-full mx-auto">
            {tab === "dashboard" && (
              <Dashboard c={c} dark={dark} budgets={budgets} totalSpent={totalSpent} remaining={remaining}
                utilization={utilization} todaySpend={todaySpend} monthSpend={monthSpend}
                categoryTotals={categoryTotals} monthlyTotals={monthlyTotals} recentExpenses={recentExpenses}
                onEdit={(e) => { setEditingExpense(e); setModalOpen(true); }} onAdd={() => { setEditingExpense(null); setModalOpen(true); }} />
            )}
            {tab === "expenses" && (
              <ExpensesView c={c} dark={dark} expenses={filteredExpenses} categories={categories} filters={filters}
                setFilters={setFilters} onEdit={(e) => { setEditingExpense(e); setModalOpen(true); }}
                onDelete={deleteExpense} />
            )}
            {tab === "reports" && (
              <ReportsView c={c} dark={dark} expenses={expenses} categoryTotals={categoryTotals}
                vendorTotals={vendorTotals} exportExcel={exportExcel} exportPDF={exportPDF} />
            )}
            {tab === "budget" && (
              <BudgetView c={c} dark={dark} budgets={budgets} categories={categories} categoryTotals={categoryTotals}
                totalSpent={totalSpent} overBudgetCats={overBudgetCats} persistBudgets={persistBudgets} showToast={showToast} />
            )}
            {tab === "analytics" && (
              <AnalyticsView c={c} dark={dark} categoryTotals={categoryTotals} monthlyTotals={monthlyTotals}
                topItems={topItems} vendorTotals={vendorTotals} highestMonth={highestMonth} />
            )}
            {tab === "assistant" && <AssistantView c={c} dark={dark} answerQuestion={answerQuestion} />}
            {tab === "settings" && (
              <SettingsView c={c} dark={dark} categories={categories} addCategory={addCategory} removeCategory={removeCategory}
                exportJSON={exportJSON} importJSON={importJSON} settings={settings} persistSettings={persistSettings}
                supabaseBackup={supabaseBackup} supabaseRestore={supabaseRestore}
                clearAll={async () => { await persistExpenses([]); await persistBudgets({ overall: 0, categories: {} }); showToast("All expense data cleared", "warn"); }} />
            )}
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 flex items-stretch z-30"
        style={{ background: c.surface, borderTop: `1px solid ${c.border}`, boxShadow: `0 -2px 8px ${c.shadow}` }}>
        <BottomTab icon={Home} label="Home" active={tab === "dashboard"} onClick={() => setTab("dashboard")} c={c} />
        <BottomTab icon={ListIcon} label="Expenses" active={tab === "expenses"} onClick={() => setTab("expenses")} c={c} />
        <button onClick={() => { setEditingExpense(null); setModalOpen(true); }}
          className="flex-1 flex flex-col items-center justify-center -mt-5">
          <span className="rounded-full flex items-center justify-center" style={{ width: 54, height: 54, background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.sky})`, boxShadow: `0 6px 16px ${BRAND.blue}66`, border: `3px solid ${c.bg}` }}>
            <Plus color="#fff" size={26} />
          </span>
        </button>
        <BottomTab icon={PieChartIcon} label="Analytics" active={tab === "analytics"} onClick={() => setTab("analytics")} c={c} />
        <button onClick={() => setMobileNavOpen(true)} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2">
          <Menu size={20} color={c.muted} /><span className="text-[10px] font-bold" style={{ color: c.muted }}>More</span>
        </button>
      </div>

      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex items-end" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setMobileNavOpen(false)}>
          <div className="w-full rounded-t-2xl p-4" style={{ background: c.surface }} onClick={(e) => e.stopPropagation()}>
            {[["reports","Reports",BarChart3],["budget","Budget",Wallet],["assistant","Assistant",Sparkles],["settings","Settings",SettingsIcon]].map(([key,label,Icon]) => (
              <button key={key} onClick={() => { setTab(key); setMobileNavOpen(false); }}
                className="w-full flex items-center gap-3 py-3.5 px-2 text-left" style={{ color: c.ink, borderBottom: `1px solid ${c.border}` }}>
                <Icon size={20} /> <span className="font-semibold">{label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {modalOpen && (
        <ExpenseModal c={c} dark={dark} categories={categories} editingExpense={editingExpense}
          onClose={() => { setModalOpen(false); setEditingExpense(null); }} onSave={saveExpense} onAddCategory={addCategory} />
      )}

      {toast && (
        <div className="cet-animate fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl text-sm font-semibold"
          style={{ background: toast.kind === "warn" ? `linear-gradient(135deg, ${BRAND.rust}, #E8735A)` : `linear-gradient(135deg, ${BRAND.blueDeep}, ${BRAND.blue})`, color: "#fff", boxShadow: "0 6px 20px rgba(11,71,120,0.35)", fontFamily: FONT_BODY }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- NAV BITS ---------------------------------- */
function Brand({ c, compact }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-center justify-center rounded-xl" style={{ width: 34, height: 34, background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.sky})`, boxShadow: `0 3px 10px ${BRAND.blue}55` }}>
        <span style={{ color: "#fff", fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums", fontWeight: 700, fontSize: 15 }}>₹</span>
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="font-extrabold text-sm tracking-tight" style={{ color: c.ink, fontFamily: FONT_DISPLAY }}>ZAFAR'S CONSTRUCTION</div>
          <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: c.muted }}>Expense Tracker</div>
        </div>
      )}
    </div>
  );
}
function NavItem({ icon: Icon, label, active, onClick, c }) {
  return (
    <button onClick={onClick} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left"
      style={{ background: active ? `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.sky})` : "transparent",
        color: active ? "#fff" : c.ink, boxShadow: active ? `0 4px 12px ${BRAND.blue}45` : "none",
        transition: "background .15s ease, box-shadow .15s ease" }}>
      <Icon size={18} /> {label}
    </button>
  );
}
function BottomTab({ icon: Icon, label, active, onClick, c }) {
  return (
    <button onClick={onClick} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2">
      <Icon size={20} color={active ? BRAND.blue : c.muted} />
      <span className="text-[10px] font-bold" style={{ color: active ? BRAND.blue : c.muted }}>{label}</span>
    </button>
  );
}

/* ---------------------------------- DASHBOARD ---------------------------------- */
function StatCard({ c, label, value, sub, accent }) {
  return (
    <Card c={c} hover className="p-4" style={{ borderLeft: `3px solid ${accent || BRAND.blue}` }}>
      <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: c.muted, letterSpacing: "0.04em" }}>{label}</div>
      <div className="text-xl font-extrabold" style={{ fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums", color: accent || c.ink }}>{value}</div>
      {sub && <div className="text-xs mt-1" style={{ color: c.muted }}>{sub}</div>}
    </Card>
  );
}

function Dashboard({ c, dark, budgets, totalSpent, remaining, utilization, todaySpend, monthSpend, categoryTotals, monthlyTotals, recentExpenses, onEdit, onAdd }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: FONT_DISPLAY, color: c.ink }}>Dashboard</h1>
          <p className="text-sm" style={{ color: c.muted }}>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
        <div className="hidden sm:block"><Btn c={c} variant="primary" onClick={onAdd}><Plus size={18} /> Add expense</Btn></div>
      </div>

      <Card c={c} className="p-4">
        <BudgetTape c={c} dark={dark} spent={totalSpent} budget={budgets.overall} />
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard c={c} label="Total budget" value={inr(budgets.overall)} />
        <StatCard c={c} label="Total spent" value={inr(totalSpent)} accent={BRAND.hazardDeep} />
        <StatCard c={c} label="Remaining" value={inr(remaining)} accent={remaining < 0 ? BRAND.rust : BRAND.fernDeep} />
        <StatCard c={c} label="Utilization" value={utilization.toFixed(1) + "%"} />
        <StatCard c={c} label="Today's spending" value={inr(todaySpend)} />
        <StatCard c={c} label="This month" value={inr(monthSpend)} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card c={c} className="p-4">
          <h3 className="font-bold text-sm mb-3" style={{ fontFamily: FONT_DISPLAY, letterSpacing: "0.01em" }}>Spend by category</h3>
          {categoryTotals.length === 0 ? <Empty c={c} text="No expenses logged yet." /> : (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryTotals} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {categoryTotals.map((entry, i) => <Cell key={i} fill={entry.color} stroke={c.surface} />)}
                  </Pie>
                  <Tooltip formatter={(v) => inr(v)} contentStyle={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, fontSize: 12, fontFamily: FONT_BODY, boxShadow: `0 4px 14px ${c.shadow}` }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {categoryTotals.slice(0, 6).map((cat) => (
              <span key={cat.name} className="text-[11px] font-semibold flex items-center gap-1" style={{ color: c.muted }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: cat.color, display: "inline-block" }} />{cat.name}
              </span>
            ))}
          </div>
        </Card>
        <Card c={c} className="p-4">
          <h3 className="font-bold text-sm mb-3" style={{ fontFamily: FONT_DISPLAY, letterSpacing: "0.01em" }}>Monthly spending trend</h3>
          {monthlyTotals.length === 0 ? <Empty c={c} text="No trend data yet." /> : (
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTotals}>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.border} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: c.muted }} axisLine={{ stroke: c.border }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: c.muted }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => (v >= 1000 ? (v/1000)+"k" : v)} />
                  <Tooltip formatter={(v) => inr(v)} contentStyle={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, fontSize: 12, fontFamily: FONT_BODY, boxShadow: `0 4px 14px ${c.shadow}` }} />
                  <Bar dataKey="value" fill={BRAND.blue} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <Card c={c} className="p-4">
        <h3 className="font-bold text-sm mb-3" style={{ fontFamily: FONT_DISPLAY, letterSpacing: "0.01em" }}>Recent expenses</h3>
        {recentExpenses.length === 0 ? <Empty c={c} text="Your first entry will show up here." /> : (
          <div className="flex flex-col divide-y" style={{ borderColor: c.border }}>
            {recentExpenses.map((e) => (
              <button key={e.id} onClick={() => onEdit(e)} className="flex items-center justify-between py-2.5 text-left" style={{ borderColor: c.border }}>
                <div className="flex items-center gap-3 min-w-0">
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: e.category ? undefined : c.border, flexShrink: 0 }} />
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{e.item}</div>
                    <div className="text-xs truncate" style={{ color: c.muted }}>{e.category} · {e.vendor || "—"} · {e.date}</div>
                  </div>
                </div>
                <div className="font-bold text-sm shrink-0 ml-2" style={{ fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums" }}>{inr(e.amount)}</div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Empty({ c, text }) {
  return (
    <div className="text-sm py-8 text-center flex flex-col items-center gap-2" style={{ color: c.muted, fontFamily: FONT_BODY }}>
      <div className="rounded-full flex items-center justify-center" style={{ width: 40, height: 40, background: c.surfaceAlt }}>
        <FilterIcon size={18} color={c.muted} />
      </div>
      {text}
    </div>
  );
}

/* ---------------------------------- EXPENSES VIEW ---------------------------------- */
function ExpensesView({ c, dark, expenses, categories, filters, setFilters, onEdit, onDelete }) {
  const [showFilters, setShowFilters] = useState(false);
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: FONT_DISPLAY }}>Expenses</h1>
        <span className="text-sm font-bold" style={{ fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums", color: c.muted }}>{expenses.length} entries · {inr(total)}</span>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 rounded-xl" style={{ background: c.surface, border: `1.5px solid ${c.border}`, boxShadow: `0 1px 3px ${c.shadow}` }}>
          <Search size={16} color={BRAND.blue} />
          <input value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Search item, category, vendor…" className="flex-1 py-2.5 bg-transparent outline-none text-sm" style={{ color: c.ink, fontFamily: FONT_BODY }} />
        </div>
        <Btn c={c} variant={showFilters ? "blue" : "outline"} onClick={() => setShowFilters((s) => !s)}><FilterIcon size={16} /></Btn>
      </div>

      {showFilters && (
        <Card c={c} className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="From" c={c}><input type="date" style={inputStyle(c)} value={filters.from} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))} /></Field>
          <Field label="To" c={c}><input type="date" style={inputStyle(c)} value={filters.to} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))} /></Field>
          <Field label="Category" c={c}>
            <select style={inputStyle(c)} value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}>
              <option>All</option>{categories.map((cat) => <option key={cat.name}>{cat.name}</option>)}
            </select>
          </Field>
          <Field label="Payment mode" c={c}>
            <select style={inputStyle(c)} value={filters.paymentMode} onChange={(e) => setFilters((f) => ({ ...f, paymentMode: e.target.value }))}>
              <option>All</option>{PAYMENT_MODES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <div className="col-span-2 md:col-span-4">
            <Btn c={c} variant="ghost" onClick={() => setFilters({ search: "", from: "", to: "", category: "All", paymentMode: "All" })}>Clear filters</Btn>
          </div>
        </Card>
      )}

      <Card c={c}>
        {expenses.length === 0 ? <div className="p-8"><Empty c={c} text="No expenses match your search." /></div> : (
          <div className="flex flex-col divide-y" style={{ borderColor: c.border }}>
            {expenses.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 p-4 transition-colors"
                style={{ borderColor: c.border }}
                onMouseEnter={(ev) => { ev.currentTarget.style.background = c.surfaceAlt; }}
                onMouseLeave={(ev) => { ev.currentTarget.style.background = "transparent"; }}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm">{e.item}</span>
                    <Badge text={e.category} color={(categories.find((cc) => cc.name === e.category) || {}).color || BRAND.blue} />
                    {e.hasBill && <ImageIcon size={13} color={c.muted} />}
                  </div>
                  <div className="text-xs mt-1" style={{ color: c.muted }}>
                    {e.date} · <Store size={11} className="inline -mt-0.5" /> {e.vendor || "—"} · {e.qty} × {inrFull(e.unitPrice)} · {e.paymentMode}
                  </div>
                  {e.notes && <div className="text-xs mt-1 italic" style={{ color: c.muted }}>{e.notes}</div>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="font-extrabold text-sm" style={{ fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums" }}>{inr(e.amount)}</div>
                  <button onClick={() => onEdit(e)} className="p-2 rounded-lg" style={{ background: c.surfaceAlt }}><Edit2 size={15} /></button>
                  <button onClick={() => { if (window.confirm("Delete this expense?")) onDelete(e.id); }} className="p-2 rounded-lg" style={{ background: c.surfaceAlt, color: BRAND.rust }}><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ---------------------------------- REPORTS VIEW ---------------------------------- */
function aggregateBy(expenses, keyFn) {
  const m = {};
  expenses.forEach((e) => { const k = keyFn(e); m[k] = (m[k] || 0) + e.amount; });
  return Object.entries(m).sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([k, v]) => ({ period: k, amount: v }));
}

function ReportsView({ c, dark, expenses, categoryTotals, vendorTotals, exportExcel, exportPDF }) {
  const [mode, setMode] = useState("daily");
  const data = useMemo(() => {
    if (mode === "daily") return aggregateBy(expenses, (e) => e.date);
    if (mode === "weekly") return aggregateBy(expenses, (e) => { const d = new Date(e.date); const onejan = new Date(d.getFullYear(), 0, 1); const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay() + 1) / 7); return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`; });
    if (mode === "monthly") return aggregateBy(expenses, (e) => monthKey(e.date));
    if (mode === "category") return categoryTotals.map((x) => ({ period: x.name, amount: x.value }));
    if (mode === "vendor") return vendorTotals.map((x) => ({ period: x.name, amount: x.value }));
    return [];
  }, [mode, expenses, categoryTotals, vendorTotals]);

  const labelFor = { daily: "Date", weekly: "Week", monthly: "Month", category: "Category", vendor: "Vendor" }[mode];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: FONT_DISPLAY }}>Reports</h1>
      <div className="flex gap-2 flex-wrap">
        {["daily","weekly","monthly","category","vendor"].map((m) => (
          <Btn key={m} c={c} variant={mode === m ? "blue" : "outline"} onClick={() => setMode(m)} className="capitalize">{m}</Btn>
        ))}
      </div>
      <div className="flex gap-2">
        <Btn c={c} variant="ghost" onClick={() => exportExcel(data.map((d) => ({ [labelFor]: d.period, "Amount (INR)": d.amount })), `${mode}-report.xlsx`, mode)}>
          <FileSpreadsheet size={16} /> Export Excel
        </Btn>
        <Btn c={c} variant="ghost" onClick={() => exportPDF(`${mode[0].toUpperCase() + mode.slice(1)} spending report`, data.map((d) => ({ [labelFor]: d.period, Amount: inr(d.amount) })), [labelFor, "Amount"])}>
          <Printer size={16} /> Export PDF
        </Btn>
      </div>
      <Card c={c}>
        {data.length === 0 ? <div className="p-8"><Empty c={c} text="No data for this report yet." /></div> : (
          <table className="w-full text-sm">
            <thead><tr style={{ borderBottom: `1.5px solid ${c.border}`, background: c.surfaceAlt }}>
              <th className="text-left p-3 font-bold text-xs uppercase rounded-tl-2xl" style={{ color: BRAND.blueDeep, letterSpacing: "0.04em" }}>{labelFor}</th>
              <th className="text-right p-3 font-bold text-xs uppercase rounded-tr-2xl" style={{ color: BRAND.blueDeep, letterSpacing: "0.04em" }}>Amount</th>
            </tr></thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${c.border}` }}>
                  <td className="p-3">{d.period}</td>
                  <td className="p-3 text-right font-bold" style={{ fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums", color: BRAND.blueDeep }}>{inr(d.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

/* ---------------------------------- BUDGET VIEW ---------------------------------- */
function BudgetView({ c, dark, budgets, categories, categoryTotals, totalSpent, overBudgetCats, persistBudgets, showToast }) {
  const [overall, setOverall] = useState(budgets.overall || "");
  const [catBudgets, setCatBudgets] = useState(budgets.categories || {});

  useEffect(() => { setOverall(budgets.overall || ""); setCatBudgets(budgets.categories || {}); }, [budgets]);

  const save = async () => {
    await persistBudgets({ overall: parseFloat(overall) || 0, categories: catBudgets });
    showToast("Budget saved");
  };

  const chartData = categories.map((cat) => ({
    name: cat.name, budget: parseFloat(catBudgets[cat.name]) || 0, actual: categoryTotals.find((x) => x.name === cat.name)?.value || 0,
  })).filter((d) => d.budget > 0 || d.actual > 0);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: FONT_DISPLAY }}>Budget</h1>

      {overBudgetCats.length > 0 && (
        <Card c={c} className="p-4" style={{ borderColor: BRAND.rust, background: dark ? "#3A1418" : "#FDF1F0" }}>
          <div className="flex items-center gap-2 font-bold text-sm mb-2" style={{ color: BRAND.rust }}><AlertTriangle size={16} /> Overspending alerts</div>
          <div className="flex flex-col gap-1.5">
            {overBudgetCats.map((x) => (
              <div key={x.cat} className="text-sm flex justify-between"><span>{x.cat}</span><span style={{ fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums", color: BRAND.rust, fontWeight: 700 }}>{inr(x.spent)} / {inr(x.bud)} ({x.pct.toFixed(0)}%)</span></div>
            ))}
          </div>
        </Card>
      )}

      <Card c={c} className="p-4">
        <h3 className="font-bold text-sm mb-3" style={{ fontFamily: FONT_DISPLAY, letterSpacing: "0.01em" }}>Overall project budget</h3>
        <div className="flex gap-2">
          <input type="number" inputMode="decimal" style={inputStyle(c)} value={overall} onChange={(e) => setOverall(e.target.value)} placeholder="e.g. 3500000" />
        </div>
      </Card>

      <Card c={c} className="p-4">
        <h3 className="font-bold text-sm mb-3" style={{ fontFamily: FONT_DISPLAY, letterSpacing: "0.01em" }}>Category budgets</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          {categories.map((cat) => (
            <div key={cat.name} className="flex items-center gap-2">
              <span style={{ width: 8, height: 8, borderRadius: 2, background: cat.color, flexShrink: 0 }} />
              <span className="text-sm flex-1">{cat.name}</span>
              <input type="number" inputMode="decimal" style={{ ...inputStyle(c), width: 120 }} value={catBudgets[cat.name] || ""}
                onChange={(e) => setCatBudgets((cb) => ({ ...cb, [cat.name]: e.target.value }))} placeholder="0" />
            </div>
          ))}
        </div>
        <div className="mt-4"><Btn c={c} variant="primary" onClick={save}><Check size={16} /> Save budget</Btn></div>
      </Card>

      {chartData.length > 0 && (
        <Card c={c} className="p-4">
          <h3 className="font-bold text-sm mb-3" style={{ fontFamily: FONT_DISPLAY, letterSpacing: "0.01em" }}>Budget vs actual</h3>
          <div style={{ height: Math.max(220, chartData.length * 34) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={c.border} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: c.muted }} tickFormatter={(v) => (v >= 1000 ? (v/1000)+"k" : v)} axisLine={{ stroke: c.border }} tickLine={false} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: c.muted }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => inr(v)} contentStyle={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, fontSize: 12, fontFamily: FONT_BODY, boxShadow: `0 4px 14px ${c.shadow}` }} />
                <Bar dataKey="budget" fill={BRAND.skyLight} radius={[0, 4, 4, 0]} name="Budget" />
                <Bar dataKey="actual" fill={BRAND.hazard} radius={[0, 4, 4, 0]} name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}

/* ---------------------------------- ANALYTICS VIEW ---------------------------------- */
function AnalyticsView({ c, dark, categoryTotals, monthlyTotals, topItems, vendorTotals, highestMonth }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: FONT_DISPLAY }}>Analytics</h1>

      {highestMonth && (
        <Card c={c} className="p-4 flex items-center gap-3" style={{ background: dark ? `linear-gradient(135deg, ${c.surface}, ${BRAND.blueDeep}22)` : `linear-gradient(135deg, #fff, ${BRAND.skyLight}22)` }}>
          <div className="p-2.5 rounded-xl" style={{ background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.sky})` }}><TrendingUp color="#fff" size={20} /></div>
          <div><div className="text-xs font-bold uppercase" style={{ color: c.muted }}>Highest spending month</div><div className="font-extrabold" style={{ fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums", color: BRAND.blueDeep }}>{highestMonth.label} — {inr(highestMonth.value)}</div></div>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card c={c} className="p-4">
          <h3 className="font-bold text-sm mb-3" style={{ fontFamily: FONT_DISPLAY, letterSpacing: "0.01em" }}>Category breakdown</h3>
          {categoryTotals.length === 0 ? <Empty c={c} text="No data yet." /> : (
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryTotals} dataKey="value" nameKey="name" outerRadius={90} label={(d) => d.name}>
                    {categoryTotals.map((entry, i) => <Cell key={i} fill={entry.color} stroke={c.surface} />)}
                  </Pie>
                  <Tooltip formatter={(v) => inr(v)} contentStyle={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, fontSize: 12, fontFamily: FONT_BODY, boxShadow: `0 4px 14px ${c.shadow}` }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
        <Card c={c} className="p-4">
          <h3 className="font-bold text-sm mb-3" style={{ fontFamily: FONT_DISPLAY, letterSpacing: "0.01em" }}>Monthly spending</h3>
          {monthlyTotals.length === 0 ? <Empty c={c} text="No data yet." /> : (
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTotals}>
                  <CartesianGrid strokeDasharray="3 3" stroke={c.border} vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: c.muted }} axisLine={{ stroke: c.border }} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: c.muted }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => (v >= 1000 ? (v/1000)+"k" : v)} />
                  <Tooltip formatter={(v) => inr(v)} contentStyle={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 10, fontSize: 12, fontFamily: FONT_BODY, boxShadow: `0 4px 14px ${c.shadow}` }} />
                  <Line type="monotone" dataKey="value" stroke={BRAND.hazard} strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card c={c} className="p-4">
          <h3 className="font-bold text-sm mb-3" style={{ fontFamily: FONT_DISPLAY, letterSpacing: "0.01em" }}>Top 10 most expensive items</h3>
          {topItems.length === 0 ? <Empty c={c} text="No data yet." /> : (
            <div className="flex flex-col divide-y" style={{ borderColor: c.border }}>
              {topItems.map((e, i) => (
                <div key={e.id} className="flex justify-between py-2 text-sm">
                  <span className="truncate"><span style={{ color: c.muted, fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums" }}>{i + 1}.</span> {e.item} <span style={{ color: c.muted }}>({e.category})</span></span>
                  <span className="font-bold shrink-0 ml-2" style={{ fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums" }}>{inr(e.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card c={c} className="p-4">
          <h3 className="font-bold text-sm mb-3" style={{ fontFamily: FONT_DISPLAY, letterSpacing: "0.01em" }}>Biggest vendors</h3>
          {vendorTotals.length === 0 ? <Empty c={c} text="No data yet." /> : (
            <div className="flex flex-col divide-y" style={{ borderColor: c.border }}>
              {vendorTotals.slice(0, 10).map((v, i) => (
                <div key={v.name} className="flex justify-between py-2 text-sm">
                  <span><span style={{ color: c.muted, fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums" }}>{i + 1}.</span> {v.name}</span>
                  <span className="font-bold" style={{ fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums" }}>{inr(v.value)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ---------------------------------- ASSISTANT VIEW ---------------------------------- */
function AssistantView({ c, dark, answerQuestion }) {
  const [messages, setMessages] = useState([{ role: "assistant", text: "Ask me about your construction spending — cement costs, vendor payments, budget overruns, or a remaining-cost estimate. I work fully offline using your own data." }]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = (text) => {
    const q = (text ?? input).trim();
    if (!q) return;
    const answer = answerQuestion(q);
    setMessages((m) => [...m, { role: "user", text: q }, { role: "assistant", text: answer }]);
    setInput("");
  };

  const quick = ["How much have I spent on cement?", "Which month had the highest expenses?", "Which category is exceeding budget?", "Estimate my remaining construction cost"];

  return (
    <div className="flex flex-col gap-4 h-full">
      <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2" style={{ fontFamily: FONT_DISPLAY }}><Sparkles size={22} color={BRAND.blue} /> Assistant</h1>
      <Card c={c} className="p-4 flex flex-col gap-3" style={{ minHeight: 380 }}>
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: 420 }}>
          {messages.map((m, i) => (
            <div key={i} className={`cet-animate max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-line ${m.role === "user" ? "self-end" : "self-start"}`}
              style={{ background: m.role === "user" ? `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.sky})` : c.surfaceAlt,
                color: m.role === "user" ? "#fff" : c.ink, boxShadow: m.role === "user" ? `0 3px 10px ${BRAND.blue}40` : "none", fontFamily: FONT_BODY }}>
              {m.text}
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="flex flex-wrap gap-2">
          {quick.map((q) => <button key={q} onClick={() => send(q)} className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
            style={{ background: c.surfaceAlt, color: BRAND.blueDeep, border: `1px solid ${BRAND.blue}22` }}>{q}</button>)}
        </div>
        <div className="flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask a question about your spending…" style={inputStyle(c)} className="flex-1" />
          <Btn c={c} variant="primary" onClick={() => send()}><Send size={16} /></Btn>
        </div>
      </Card>
    </div>
  );
}

/* ---------------------------------- SETTINGS VIEW ---------------------------------- */
function SettingsView({ c, dark, categories, addCategory, removeCategory, exportJSON, importJSON, settings, persistSettings, supabaseBackup, supabaseRestore, clearAll }) {
  const [newCat, setNewCat] = useState("");
  const [newColor, setNewColor] = useState(BRAND.blue);
  const importRef = useRef(null);
  const [sbUrl, setSbUrl] = useState(settings.supabaseUrl || "");
  const [sbKey, setSbKey] = useState(settings.supabaseKey || "");
  const [sbTable, setSbTable] = useState(settings.supabaseTable || "expenses");
  const swatches = [BRAND.blue, BRAND.sky, BRAND.hazard, BRAND.fern, "#805A96", "#357587", "#B04E2C", BRAND.rust];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: FONT_DISPLAY }}>Settings</h1>

      <Card c={c} className="p-4">
        <h3 className="font-bold text-sm mb-3" style={{ fontFamily: FONT_DISPLAY, letterSpacing: "0.01em" }}>Categories</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {categories.map((cat) => (
            <span key={cat.name} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: cat.color + "22", color: cat.color }}>
              {cat.name}
              {cat.custom && <button onClick={() => removeCategory(cat.name)}><X size={12} /></button>}
            </span>
          ))}
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <input value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="New category name" style={{ ...inputStyle(c), width: 200 }} />
          <div className="flex gap-1">
            {swatches.map((s) => (
              <button key={s} onClick={() => setNewColor(s)} style={{ width: 22, height: 22, borderRadius: "50%", background: s, border: newColor === s ? `2px solid ${c.ink}` : `2px solid transparent`, boxShadow: newColor === s ? `0 0 0 2px ${c.surface}, 0 0 0 4px ${s}55` : "none", transition: "box-shadow .15s ease" }} />
            ))}
          </div>
          <Btn c={c} variant="ghost" onClick={() => { addCategory(newCat, newColor); setNewCat(""); }}><Plus size={15} /> Add</Btn>
        </div>
      </Card>

      <Card c={c} className="p-4">
        <h3 className="font-bold text-sm mb-3" style={{ fontFamily: FONT_DISPLAY, letterSpacing: "0.01em" }}>Backup and restore</h3>
        <p className="text-xs mb-3" style={{ color: c.muted }}>Export everything as a JSON file you can keep safe, or restore from a previous export.</p>
        <div className="flex gap-2 flex-wrap">
          <Btn c={c} variant="ghost" onClick={exportJSON}><Download size={16} /> Export JSON backup</Btn>
          <Btn c={c} variant="ghost" onClick={() => importRef.current?.click()}><Upload size={16} /> Import JSON backup</Btn>
          <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files[0] && importJSON(e.target.files[0])} />
        </div>
      </Card>

      <Card c={c} className="p-4">
        <h3 className="font-bold text-sm mb-1 flex items-center gap-2" style={{ fontFamily: FONT_DISPLAY }}><Cloud size={16} color={BRAND.blue} /> Optional Supabase cloud backup</h3>
        <p className="text-xs mb-3" style={{ color: c.muted }}>The app works fully offline. Fill this in only if you want an extra cloud copy of your expenses in your own Supabase project.</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Project URL" c={c}><input style={inputStyle(c)} value={sbUrl} onChange={(e) => setSbUrl(e.target.value)} placeholder="https://xxxx.supabase.co" /></Field>
          <Field label="Anon key" c={c}><input style={inputStyle(c)} value={sbKey} onChange={(e) => setSbKey(e.target.value)} type="password" placeholder="eyJhbGciOi…" /></Field>
          <Field label="Table name" c={c}><input style={inputStyle(c)} value={sbTable} onChange={(e) => setSbTable(e.target.value)} placeholder="expenses" /></Field>
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          <Btn c={c} variant="ghost" onClick={() => persistSettings({ supabaseUrl: sbUrl, supabaseKey: sbKey, supabaseTable: sbTable })}><Check size={16} /> Save settings</Btn>
          <Btn c={c} variant="outline" onClick={supabaseBackup}><CloudUpload size={16} /> Backup now</Btn>
          <Btn c={c} variant="outline" onClick={supabaseRestore}><CloudDownload size={16} /> Restore from cloud</Btn>
        </div>
      </Card>

      <Card c={c} className="p-4" style={{ borderColor: BRAND.rust, background: dark ? "#3A1418" : "#FDF1F0" }}>
        <h3 className="font-bold text-sm mb-2" style={{ color: BRAND.rust, fontFamily: FONT_DISPLAY }}>Danger zone</h3>
        <Btn c={c} variant="danger" onClick={() => { if (window.confirm("This will permanently delete all expenses and budgets on this device. Continue?")) clearAll(); }}>
          <Trash2 size={16} /> Clear all expense data
        </Btn>
      </Card>
    </div>
  );
}

/* ---------------------------------- EXPENSE MODAL ---------------------------------- */
function ExpenseModal({ c, dark, categories, editingExpense, onClose, onSave, onAddCategory }) {
  const [date, setDate] = useState(editingExpense?.date || todayStr());
  const [category, setCategory] = useState(editingExpense?.category || categories[0]?.name || "");
  const [item, setItem] = useState(editingExpense?.item || "");
  const [vendor, setVendor] = useState(editingExpense?.vendor || "");
  const [qty, setQty] = useState(editingExpense?.qty ?? 1);
  const [unitPrice, setUnitPrice] = useState(editingExpense?.unitPrice ?? "");
  const [paymentMode, setPaymentMode] = useState(editingExpense?.paymentMode || "Cash");
  const [notes, setNotes] = useState(editingExpense?.notes || "");
  const [billFile, setBillFile] = useState(null);
  const [billPreview, setBillPreview] = useState(null);
  const [removeBill, setRemoveBill] = useState(false);
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (editingExpense?.hasBill) { (async () => { const v = await store.get("bill:" + editingExpense.id); if (v) setBillPreview(v); })(); }
  }, [editingExpense]);

  const total = (parseFloat(qty) || 0) * (parseFloat(unitPrice) || 0);

  const handleFile = (f) => {
    if (!f) return;
    setBillFile(f); setRemoveBill(false);
    const reader = new FileReader();
    reader.onload = (e) => setBillPreview(e.target.result);
    reader.readAsDataURL(f);
  };

  const submit = async () => {
    if (!item.trim()) { window.alert("Please enter an item name."); return; }
    setSaving(true);
    await onSave({ date, category, item, vendor, qty, unitPrice, paymentMode, notes }, billFile, removeBill);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(6,26,44,0.55)", backdropFilter: "blur(2px)" }} onClick={onClose}>
      <div className="cet-animate w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-5 max-h-[92vh] overflow-y-auto"
        style={{ background: c.surface, color: c.ink, boxShadow: `0 20px 50px ${c.shadow}`, fontFamily: FONT_BODY }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold" style={{ fontFamily: FONT_DISPLAY }}>{editingExpense ? "Edit expense" : "Add expense"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: c.surfaceAlt }}><X size={18} /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" c={c}><input type="date" style={inputStyle(c)} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Payment mode" c={c}>
            <select style={inputStyle(c)} value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
              {PAYMENT_MODES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
          <div className="col-span-2">
            <Field label="Category" c={c}>
              <div className="flex gap-2">
                <select style={inputStyle(c)} value={category} onChange={(e) => setCategory(e.target.value)} className="flex-1">
                  {categories.map((cat) => <option key={cat.name}>{cat.name}</option>)}
                </select>
                <Btn c={c} variant="ghost" onClick={() => setShowNewCat((s) => !s)}><Plus size={16} /></Btn>
              </div>
            </Field>
            {showNewCat && (
              <div className="flex gap-2 mt-2">
                <input style={inputStyle(c)} placeholder="New category name" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
                <Btn c={c} variant="blue" onClick={() => { onAddCategory(newCatName, BRAND.blue); setCategory(newCatName); setNewCatName(""); setShowNewCat(false); }}>Add</Btn>
              </div>
            )}
          </div>
          <div className="col-span-2"><Field label="Item name" c={c}><input style={inputStyle(c)} value={item} onChange={(e) => setItem(e.target.value)} placeholder="e.g. OPC 53 grade cement" /></Field></div>
          <div className="col-span-2"><Field label="Shop / vendor name" c={c}><input style={inputStyle(c)} value={vendor} onChange={(e) => setVendor(e.target.value)} placeholder="e.g. Balaji Building Materials" /></Field></div>
          <Field label="Quantity" c={c}><input type="number" inputMode="decimal" style={inputStyle(c)} value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
          <Field label="Unit price" c={c}><input type="number" inputMode="decimal" style={inputStyle(c)} value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} /></Field>
        </div>

        <div className="mt-3 p-3 rounded-xl flex items-center justify-between" style={{ background: c.surfaceAlt, border: `1px solid ${BRAND.blue}33` }}>
          <span className="text-sm font-bold" style={{ color: c.muted }}>Total amount</span>
          <span className="text-xl font-extrabold" style={{ fontFamily: FONT_MONO, fontVariantNumeric: "tabular-nums", color: BRAND.blueDeep }}>{inr(total)}</span>
        </div>

        <div className="mt-3"><Field label="Notes" c={c}><textarea style={{ ...inputStyle(c), minHeight: 60 }} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" /></Field></div>

        <div className="mt-3">
          <span className="text-xs font-bold uppercase tracking-wide" style={{ color: c.muted }}>Bill / invoice photo</span>
          <div className="mt-1.5 flex items-center gap-3">
            {billPreview ? (
              <div className="relative">
                <img src={billPreview} alt="Bill preview" className="rounded-lg object-cover" style={{ width: 72, height: 72 }} />
                <button onClick={() => { setBillPreview(null); setBillFile(null); setRemoveBill(true); }}
                  className="absolute -top-2 -right-2 rounded-full p-1" style={{ background: BRAND.rust, color: "#fff" }}><X size={12} /></button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} className="flex flex-col items-center justify-center rounded-lg gap-1"
                style={{ width: 72, height: 72, background: c.surfaceAlt, border: `1.5px dashed ${c.border}` }}>
                <Camera size={20} color={c.muted} /><span className="text-[10px] font-bold" style={{ color: c.muted }}>Add</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <Btn c={c} variant="outline" onClick={onClose} className="flex-1">Cancel</Btn>
          <Btn c={c} variant="primary" onClick={submit} disabled={saving} className="flex-1">{saving ? "Saving…" : editingExpense ? "Save changes" : "Add expense"}</Btn>
        </div>
      </div>
    </div>
  );
}
