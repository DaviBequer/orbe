'use strict';
/* Orbe — tarefas, agenda e diário das áreas da vida. Dados ficam no aparelho (localStorage 'orbe.v1'). */

const KEY = 'orbe.v1';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const APP = $('#app');
const ic = (n, s = 20) => `<span class="ms" style="--s:${s}px" aria-hidden="true">${n}</span>`;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pl = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/* ---------- datas ---------- */
const WD = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const WDF = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const MO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MOF = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => ymd(new Date());
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
const monday = (s) => { const d = parse(s); const k = (d.getDay() + 6) % 7; d.setDate(d.getDate() - k); return ymd(d); };
const weekOf = (s) => { const m = monday(s); return [...Array(7)].map((_, i) => addDays(m, i)); };
const weekNo = (s) => { const d = parse(s); d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7)); const w1 = new Date(d.getFullYear(), 0, 4); return 1 + Math.round(((d - w1) / 864e5 - 3 + ((w1.getDay() + 6) % 7)) / 7); };
const dayDiff = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
function fmtDate(s, long) {
  const d = parse(s), t = today();
  const base = `${WD[d.getDay()]}, ${d.getDate()} ${MO[d.getMonth()]}`;
  if (s === t) return long ? `Hoje · ${base}` : 'hoje';
  if (s === addDays(t, 1)) return long ? `Amanhã · ${base}` : 'amanhã';
  if (s === addDays(t, -1)) return long ? `Ontem · ${base}` : 'ontem';
  return base;
}

/* ---------- dados ---------- */
const Q = { 1: { k: 'Fazer agora', d: 'Urgente e importante', s: 'Fazer' }, 2: { k: 'Agendar', d: 'Importante, sem pressa', s: 'Agendar' }, 3: { k: 'Delegar', d: 'Urgente, pouco importante', s: 'Delegar' }, 4: { k: 'Eliminar', d: 'Nem urgente, nem importante', s: 'Eliminar' } };
const SUBI = { Clientes: 'handshake', Projetos: 'folder_open', Estudos: 'school', Saúde: 'favorite', Casa: 'cottage', Finanças: 'account_balance_wallet', Leitura: 'menu_book', Oração: 'volunteer_activism', Igreja: 'church' };
const ICONS = ['work', 'person', 'self_improvement', 'fitness_center', 'family_restroom', 'savings', 'school', 'palette', 'rocket_launch', 'volunteer_activism', 'travel_explore', 'eco', 'favorite', 'home', 'menu_book', 'church', 'sports_soccer', 'music_note'];
const COLORS = ['#111214', '#0F5463', '#7A7D82', '#3F7F8C', '#5B5F66', '#A3A7AC'];
const DEFAULT = () => ({
  v: 1, name: 'Davi',
  areas: [
    { k: 'pro', n: 'Profissional', i: 'work', c: '#111214', subs: ['Clientes', 'Projetos', 'Estudos'] },
    { k: 'pes', n: 'Pessoal', i: 'person', c: '#0F5463', subs: ['Saúde', 'Casa', 'Finanças'] },
    { k: 'esp', n: 'Espiritual', i: 'self_improvement', c: '#7A7D82', subs: ['Leitura', 'Oração', 'Igreja'] },
  ],
  tasks: [], notes: [], habits: [],
});
let DB;
try { DB = JSON.parse(localStorage.getItem(KEY)) || DEFAULT(); } catch (e) { DB = DEFAULT(); }
DB.habits = DB.habits || [];
/* Cada mudança ganha um carimbo de tempo (u) e cada exclusão vira uma marca em DB.del, para juntar celular e computador. */
const COLS = [['tasks', 'id'], ['notes', 'id'], ['areas', 'k'], ['habits', 'id']];
const strip = (o) => { const { u, ...r } = o; return JSON.stringify(r); };
function snapshot() { const sn = { name: DB.name }; COLS.forEach(([c, id]) => { sn[c] = {}; (DB[c] || []).forEach((x) => (sn[c][x[id]] = strip(x))); }); return sn; }
let SNAP = snapshot();
function stamp() {
  const now = Date.now(); DB.del = DB.del || {};
  COLS.forEach(([c, id]) => {
    const cur = new Set();
    DB[c].forEach((x) => { cur.add(x[id]); if (SNAP[c][x[id]] !== strip(x)) x.u = now; });
    Object.keys(SNAP[c]).forEach((k) => { if (!cur.has(k)) DB.del[k] = now; });
  });
  if (DB.name !== SNAP.name) DB.nameU = now;
  SNAP = snapshot();
}
function save() {
  stamp();
  try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { toast('Não consegui salvar no aparelho.'); }
  scheduleSync();
}
const area = (k) => DB.areas.find((a) => a.k === k);
const areaName = (k) => (area(k) || { n: 'Sem área' }).n;
const subIcon = (s) => SUBI[s] || 'label';

/* ---------- estado da tela ---------- */
const UI = {
  tab: 'home', qf: 0, hview: 'semana', hoff: 0, habForm: null, view: 'semana', sel: today(), sview: 'semana', open: new Set(), det: null, dtab: 'tudo', adding: null,
  form: null, cm: null, areaForm: null,
};

/* ---------- utilidades ---------- */
let toastT;
function toast(msg) { const t = $('.toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2200); }
const mini = (q, s = 12) => `<svg class="mini q${q}" width="${s}" height="${s}" viewBox="0 0 14 14" aria-hidden="true">${[[0, 0], [8, 0], [0, 8], [8, 8]].map(([x, y], i) => `<rect x="${x + 0.5}" y="${y + 0.5}" width="5.5" height="5.5" rx="1.4"${i === q - 1 ? ' class="f"' : ''}/>`).join('')}</svg>`;
const byQ = (a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0) || a.q - b.q || ((a.time || '99') < (b.time || '99') ? -1 : 1);
const sig = (t) => (t.done ? '×' : t.time ? '○' : '•');
const isLate = (t) => !t.done && t.date && t.date < today();

function row(t) {
  const meta = [
    isLate(t) ? `<span class="late">${ic('history', 13)}atrasada · ${fmtDate(t.date)}</span>` : '',
    t.time ? `<span class="tm">${ic('schedule', 13)}${t.time}</span>` : '',
    `<span>${esc(areaName(t.a))}${t.s ? ' · ' + esc(t.s) : ''}</span>`,
    t.hist && t.hist.length ? `<span class="rm">${ic('event_repeat', 13)}remarcada ${t.hist.length}×</span>` : '',
  ].join('');
  return `<div class="task q${t.q}${t.done ? ' done' : ''}" data-id="${t.id}"><button class="ck" aria-label="${t.done ? 'Desmarcar' : 'Concluir'}">${ic('check', 15)}</button><div class="tb"><div class="tt">${esc(t.t)}</div><div class="tmeta">${meta}</div></div></div>`;
}

/* ---------- HOJE ---------- */
function greeting() { const h = new Date().getHours(); return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; }
function inTxt(time) {
  const [h, m] = time.split(':').map(Number), now = new Date(), mins = h * 60 + m - (now.getHours() * 60 + now.getMinutes());
  if (mins <= 0) return 'agora';
  if (mins < 60) return `em ${mins} min`;
  return `em ${Math.floor(mins / 60)}h${mins % 60 ? pad(mins % 60) : ''}`;
}
function home() {
  const t0 = today();
  const td = DB.tasks.filter((t) => t.date === t0 || isLate(t) || (t.done && t.doneAt && t.doneAt.slice(0, 10) === t0 && t.date && t.date < t0)).sort(byQ);
  const done = td.filter((t) => t.done).length, open = td.length - done, p = td.length ? Math.round((done / td.length) * 100) : 0;
  const cnt = (q) => td.filter((t) => t.q === q && !t.done).length;
  const d = new Date();
  const now = pad(d.getHours()) + ':' + pad(d.getMinutes());
  const n = td.filter((t) => t.date === t0 && t.time && t.q <= 2 && !t.done && t.time >= now).sort((a, b) => (a.time < b.time ? -1 : 1))[0];
  let h = `<div class="hero"><div class="logo">${ic('light_mode', 18)}Orbe${syncIcon()}<button data-settings aria-label="Configurações">${ic('settings', 19)}</button></div>
    <h2>${greeting()}${DB.name ? ', ' + esc(DB.name) : ''}</h2><p>${WDF[d.getDay()][0].toUpperCase() + WDF[d.getDay()].slice(1)}, ${d.getDate()} de ${MOF[d.getMonth()].toLowerCase()} · ${pl(open, 'aberta', 'abertas')} hoje</p>
    <div class="pl"><span>Progresso de hoje</span><b>${done} de ${td.length}</b></div><div class="prog"><i style="width:${p}%"></i></div>
    <div class="ht">${[1, 2, 3, 4].map((q) => `<button class="q${q}${UI.qf === q ? ' on' : ''}" data-qf="${q}"><span class="tn">${mini(q)}<b>${cnt(q)}</b></span><small>${Q[q].s}</small></button>`).join('')}</div></div>`;
  const nextH = n ? `<div class="next" data-id="${n.id}"><span class="ni">${ic('schedule', 22)}</span><div><small>Próximo importante</small><b>${n.time} · ${esc(n.t)}</b></div><span class="in">${inTxt(n.time)}</span></div>` : '';
  h += nextH.replace('class="next"', 'class="next m-only"') + '<div class="cols"><div class="ca">';
  h += `<div class="sec-h">Hoje por prioridade<small>${UI.qf ? 'filtrado · toque de novo para ver tudo' : pl(open, 'aberta', 'abertas')}</small></div>`;
  let any = false;
  [1, 2, 3, 4].filter((q) => !UI.qf || UI.qf === q).forEach((q) => {
    const l = td.filter((t) => t.q === q); if (!l.length) return; any = true;
    h += `<div class="qgroup q${q}"><h5>${mini(q)}${Q[q].k}<span>· ${Q[q].d}</span><span class="cnt">${l.filter((t) => !t.done).length}</span></h5>${l.map(row).join('')}</div>`;
  });
  if (!any) h += `<div class="empty-big">${ic('wb_sunny')}${UI.qf ? 'Nada nesta prioridade hoje.' : 'Nada para hoje.<br>Toque no + para criar uma tarefa.'}</div>`;
  h += '</div><div class="cb">' + nextH.replace('class="next"', 'class="next d-only"');
  const tmw = addDays(t0, 1), tm = DB.tasks.filter((t) => t.date === tmw).sort(byQ);
  if (tm.length) h += `<div class="sec-h">Amanhã<small>${fmtDate(tmw, true).split(' · ')[1]} · ${tm.length}</small></div><div class="qgroup plain">${tm.map(row).join('')}</div>`;
  else {
    const wk = DB.tasks.filter((t) => t.date && t.date > tmw && t.date <= addDays(t0, 7)).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : byQ(a, b)));
    if (wk.length) h += `<div class="sec-h">Próximos dias<small>${wk.length}</small></div><div class="qgroup plain">${wk.map((t) => row(t).replace('<div class="tmeta">', `<div class="tmeta"><span>${fmtDate(t.date)}</span>`)).join('')}</div>`;
  }
  const nd = DB.tasks.filter((t) => !t.date && !t.done).sort(byQ);
  if (nd.length) h += `<div class="sec-h">Sem data<small>${nd.length}</small></div><div class="qgroup plain">${nd.map(row).join('')}</div>`;
  h += habitsToday();
  return h + '</div></div>';
}

/* ---------- AGENDA ---------- */
const dayTasks = (s) => DB.tasks.filter((t) => t.date === s).sort(byQ);
const dayDots = (s) => dayTasks(s).filter((t) => !t.done).slice(0, 3).map((t) => `<i class="q${t.q}"></i>`).join('');
function monthGrid() {
  const sel = parse(UI.sel), y = sel.getFullYear(), m = sel.getMonth(), t0 = today(), wk = weekOf(UI.sel);
  let days;
  if (UI.view === 'semana') days = wk.map((s) => [s, 0]);
  else {
    const first = ymd(new Date(y, m, 1)), start = monday(first); days = [];
    for (let s = start; days.length < 42; s = addDays(s, 1)) { days.push([s, parse(s).getMonth() !== m ? 1 : 0]); if (days.length >= 35 && days.length % 7 === 0 && parse(addDays(s, 1)).getMonth() !== m) break; }
  }
  return `<div class="month">${['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((x) => `<span class="wd">${x}</span>`).join('')}${days.map(([s, o]) => `<button class="md${o ? ' o' : ''}${s === t0 ? ' today' : ''}${s === UI.sel ? ' sel' : ''}${wk.includes(s) && s !== UI.sel ? ' wk' : ''}" data-d="${s}" data-drop="${s}">${parse(s).getDate()}<span class="dots">${dayDots(s)}</span></button>`).join('')}</div>`;
}
function spread() {
  const t0 = today(), wk = weekOf(UI.sel);
  return `<div class="spread">${wk.map((s) => {
    const l = dayTasks(s), d = parse(s), wide = s === t0;
    return `<div class="sp${wide ? ' wide' : ''}${s === UI.sel ? ' sel' : ''}" data-drop="${s}" data-day="${s}"><h5><span>${wide ? 'Hoje · ' : ''}${WD[d.getDay()][0].toUpperCase() + WD[d.getDay()].slice(1)} ${d.getDate()}</span><span>${l.length || ''}</span></h5>${l.map((t) => `<p class="q${t.q}${t.done ? ' dn' : ''}" data-id="${t.id}" draggable="true"><span class="s">${sig(t)}</span><span class="t">${esc(t.t)}</span>${t.time ? `<small>${t.time}</small>` : ''}</p>`).join('') || '<span class="free">livre</span>'}</div>`;
  }).join('')}</div>`;
}
function agenda() {
  const sem = UI.view === 'semana', sel = parse(UI.sel), wk = weekOf(UI.sel);
  const title = sem ? `Semana ${weekNo(UI.sel)}` : `${MOF[sel.getMonth()]}`;
  const sub = sem ? `${parse(wk[0]).getDate()} ${MO[parse(wk[0]).getMonth()]} a ${parse(wk[6]).getDate()} ${MO[parse(wk[6]).getMonth()]}` : String(sel.getFullYear());
  let h = `<div class="ag-h"><b>${title}</b><div class="seg"><button data-view="semana" class="${sem ? 'on' : ''}">Semana</button><button data-view="mes" class="${!sem ? 'on' : ''}">Mês</button></div></div>
  <div class="ag-nav"><p class="sub-h">${sub}</p>${UI.sel !== today() ? `<button data-gotoday aria-label="Ir para hoje">${ic('today', 18)}</button>` : ''}<button data-agnav="-1" aria-label="Anterior">${ic('chevron_left', 20)}</button><button data-agnav="1" aria-label="Próximo">${ic('chevron_right', 20)}</button></div>`;
  h = '<div class="cols ag"><div class="ca">' + h + monthGrid();
  if (!sem) {
    const l = dayTasks(UI.sel);
    h += `<div class="sec-h">${fmtDate(UI.sel, true)}<small>${l.length}</small></div><div class="qgroup plain">${l.map(row).join('') || '<p class="empty">Dia livre. Toque no + para criar algo neste dia.</p>'}</div>`;
  }
  h += '</div><div class="cb">';
  h += `<div class="sec-h">Semana ${weekNo(UI.sel)}<small>${matchMedia('(pointer:fine)').matches ? 'arraste para mudar o dia' : 'toque para editar'}</small></div>` + spread();
  h += `<div class="legend"><span>• tarefa</span><span>○ compromisso</span><span>× feita</span><span><b>•</b> fazer agora</span></div>`;
  return h + '</div></div>';
}

/* ---------- VIDA ---------- */
function visual() {
  const A = DB.areas, wk = weekOf(today());
  if (!A.length) return '';
  const sh = A.map((a) => DB.tasks.filter((t) => t.a === a.k && t.date && wk.includes(t.date)).length);
  const tot = sh.reduce((x, y) => x + y, 0), pc = sh.map((x) => (tot ? Math.round((x / tot) * 100) : 0)), N = A.length;
  const W = 380, H = 320, cx = W / 2, cy = H / 2 + 4, R0 = N === 1 ? 0 : N === 2 ? 36 : 46;
  const rad = (i) => (tot ? Math.max(30, 34 + pc[i] * 0.38) : 46);
  const pos = A.map((a, i) => { const ang = ((-150 + (i * 360) / N) * Math.PI) / 180; return [cx + R0 * Math.cos(ang), cy + R0 * Math.sin(ang), ang]; });
  const circ = A.map((a, i) => `<circle cx="${pos[i][0]}" cy="${pos[i][1]}" r="${rad(i)}" fill="${a.c}" fill-opacity=".04" stroke="${a.c}" stroke-width="1.25"/>`).join('');
  const lab = A.map((a, i) => {
    const [x, y, ang] = pos[i], cs = Math.cos(ang), sn = Math.sin(ang), r = rad(i);
    const px = x + cs * r * 0.32, py = y + sn * r * 0.32 + 6;
    const d = r + 18, nx = x + cs * d, ny = y + sn * d + (sn > 0.3 ? 12 : sn < -0.3 ? -2 : 4);
    const anchor = cs > 0.35 ? 'start' : cs < -0.35 ? 'end' : 'middle';
    const nm = a.n.length > 16 ? a.n.slice(0, 15) + '…' : a.n;
    return `<text x="${px}" y="${py}" text-anchor="middle" class="v">${tot ? pc[i] + '%' : '–'}</text><text x="${nx}" y="${ny}" text-anchor="${anchor}" class="l">${esc(nm)}</text>`;
  }).join('');
  return `<div class="vis"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Equilíbrio entre as áreas">${circ}${lab}</svg><p class="cap">${tot ? 'Quanto das tarefas desta semana foi para cada área' : 'Quando tiver tarefas nesta semana, aqui aparece o equilíbrio entre as áreas'}</p></div>`;
}
function areas() {
  let h = `<div class="ag-h"><b>Vida</b><span class="muted" style="font-size:12px">${pl(DB.areas.length, 'área', 'áreas')}</span></div>` + '<div class="cols vida"><div class="ca">' + visual() + '</div><div class="cb">';
  DB.areas.forEach((a) => {
    const op = DB.tasks.filter((t) => t.a === a.k && !t.done).length, nts = DB.notes.filter((n) => n.a === a.k).length;
    h += `<div class="acc${UI.open.has(a.k) ? ' open' : ''}" data-acc="${a.k}"><button><span class="ai2" style="--c:${a.c}">${ic(a.i, 20)}</span><div><b>${esc(a.n)}</b><small>${pl(a.subs.length, 'parte', 'partes')} · ${pl(op, 'aberta', 'abertas')} · ${pl(nts, 'anotação', 'anotações')}</small></div>${ic('chevron_right', 18).replace('class="ms"', 'class="ms chev"')}</button><div class="in"><div>
    ${a.subs.map((s) => { const o = DB.tasks.filter((t) => t.a === a.k && t.s === s && !t.done).length, nt = DB.notes.filter((n) => n.a === a.k && n.s === s).length; return `<div class="srow" data-det="${a.k}" data-sub="${esc(s)}"><span class="si">${ic(subIcon(s), 19)}</span><div><b>${esc(s)}</b><small>${pl(o, 'tarefa', 'tarefas')} · ${pl(nt, 'anotação', 'anotações')}</small></div>${ic('chevron_right', 16)}</div>`; }).join('')}
    ${UI.adding === a.k ? `<div class="addrow"><span class="si2">${ic('label', 18)}</span><input id="newpart" placeholder="Nome da parte" aria-label="Nome da nova parte" enterkeyhint="done"><button class="ok" data-okp="${a.k}" aria-label="Criar parte">${ic('check', 16)}</button></div>` : `<button class="addrow" data-addp="${a.k}"><span class="si2">${ic('add', 18)}</span>Nova parte em ${esc(a.n)}</button>`}
    <div class="accedit"><button data-editarea="${a.k}">${ic('edit', 16)}Editar área</button></div>
    </div></div></div>`;
  });
  h += `<button class="newarea" data-newarea>${ic('add', 18)}Nova área</button>`;
  return h + '</div></div>';
}
function detail() {
  if (!UI.det) return '';
  const [k, s] = UI.det, a = area(k); if (!a) return '';
  const ts = DB.tasks.filter((t) => t.a === k && t.s === s).sort(byQ), ns = DB.notes.filter((n) => n.a === k && n.s === s).sort((x, y) => (x.at < y.at ? 1 : -1)), tab = UI.dtab;
  const open = ts.filter((t) => !t.done).length;
  let h = `<div class="dhd"><button class="rbtn" data-back aria-label="Voltar">${ic('arrow_back', 20)}</button><small>Vida › ${esc(a.n)}</small><button class="rbtn" data-delpart aria-label="Excluir parte">${ic('delete', 19)}</button></div>
  <div class="dtitle"><span class="si">${ic(subIcon(s), 24)}</span><div><h3>${esc(s)}</h3><p>${pl(open, 'tarefa aberta', 'tarefas abertas')} · ${pl(ns.length, 'anotação', 'anotações')}</p></div></div>
  <div class="seg" style="margin-top:10px">${[['tudo', 'Tudo'], ['tarefas', 'Tarefas'], ['notas', 'Anotações']].map(([v, l]) => `<button data-dtab="${v}" class="${tab === v ? 'on' : ''}">${l}</button>`).join('')}</div>
  <div class="wr2"><textarea id="newnote" rows="1" placeholder="Escrever uma anotação…" aria-label="Nova anotação"></textarea><button data-addnote>${ic('edit', 16)}Anotar</button></div>`;
  if (tab !== 'notas') h += `<div class="sec-h">Tarefas<small>por prioridade</small></div><div class="qgroup plain">${ts.map(row).join('') || '<p class="empty">Nenhuma tarefa aqui ainda.</p>'}</div>`;
  if (tab !== 'tarefas') h += `<div class="sec-h">Anotações<small>${ns.length}</small></div><div>${ns.map((n) => `<div class="dnote">${ic('sticky_note_2', 18)}<span>${esc(n.t).replace(/\n/g, '<br>')}<small>${fmtDate(n.at.slice(0, 10))}</small></span><button class="rm" data-delnote="${n.id}" aria-label="Apagar anotação">${ic('close', 16)}</button></div>`).join('') || '<p class="empty">Nada anotado ainda.</p>'}</div>`;
  h += `<div class="dacts"><button data-newtask>${ic('task_alt', 18)}Nova tarefa em ${esc(s)}</button></div>`;
  return h;
}

/* ---------- NÚMEROS ---------- */
function period(kind, offset = 0) {
  const t0 = today();
  if (kind === 'semana') { const s = addDays(monday(t0), offset * 7); return [s, addDays(s, 6)]; }
  const d = parse(t0), s = new Date(d.getFullYear(), d.getMonth() + offset, 1), e = new Date(d.getFullYear(), d.getMonth() + offset + 1, 0);
  return [ymd(s), ymd(e)];
}
const due = (t) => t.orig || t.date;
function measure(a, b) {
  const t0 = today();
  const inP = DB.tasks.filter((t) => due(t) && due(t) >= a && due(t) <= b);
  const cons = inP.filter((t) => t.done || due(t) <= t0 || (t.date && t.date <= t0));
  const onTime = cons.filter((t) => t.done && (!t.hist || !t.hist.length) && t.doneAt && t.doneAt.slice(0, 10) <= due(t)).length;
  const rem = cons.filter((t) => t.hist && t.hist.length).length;
  const late = cons.filter((t) => isLate(t)).length;
  const doneL = inP.filter((t) => t.done && t.doneAt && t.created);
  const avg = doneL.length ? doneL.reduce((x, t) => x + Math.max(0, dayDiff(t.created.slice(0, 10), t.doneAt.slice(0, 10))), 0) / doneL.length : null;
  const n = cons.length, pc = (x) => (n ? Math.round((x / n) * 100) : null);
  const qs = [1, 2, 3, 4].map((q) => (inP.length ? Math.round((inP.filter((t) => t.q === q).length / inP.length) * 100) : 0));
  const ar = DB.areas.map((ar) => { const l = inP.filter((t) => t.a === ar.k); return [ar.n, l.length ? Math.round((l.filter((t) => t.done).length / l.length) * 100) : null]; });
  return { n, total: inP.length, ok: pc(onTime), rem: pc(rem), late: pc(late), avg, qs, ar };
}
function lineData(kind) {
  const t0 = today();
  if (kind === 'semana') return weekOf(t0).map((s) => { const p = s <= t0 ? measure(s, s) : null; return [WD[parse(s).getDay()][0].toUpperCase(), p && p.n ? p.ok : null]; });
  return [-5, -4, -3, -2, -1, 0].map((o) => { const [a, b] = period('mes', o), p = measure(a, b); return [MO[parse(a).getMonth()][0].toUpperCase() + MO[parse(a).getMonth()].slice(1), p.n ? p.ok : null]; });
}
function lineSvg(pts) {
  const W = 284, H = 96, xs = (i) => 12 + (i * (W - 24)) / (pts.length - 1), ys = (v) => H - (v / 100) * H;
  const valid = pts.map((p, i) => [i, p[1]]).filter((p) => p[1] !== null);
  if (valid.length < 2) return `<p class="empty">O gráfico aparece quando houver pelo menos dois ${UI.sview === 'semana' ? 'dias' : 'meses'} com tarefas vencidas.</p>`;
  const d = valid.map(([i, v], k) => `${k ? 'L' : 'M'}${xs(i).toFixed(1)},${ys(v).toFixed(1)}`).join('');
  const [li, lv] = valid[valid.length - 1];
  return `<div style="position:relative"><svg class="spark" viewBox="0 -6 ${W} ${H + 24}" role="img" aria-label="Tendência de tarefas feitas no dia certo">${[25, 50, 75].map((v) => `<line class="gd" x1="0" x2="${W}" y1="${ys(v)}" y2="${ys(v)}"/>`).join('')}<path class="ar" d="${d}L${xs(li)},${H}L${xs(valid[0][0])},${H}Z"/><path class="ln" d="${d}"/>${pts.map((p, i) => `<text x="${xs(i)}" y="${H + 16}" text-anchor="middle">${p[0]}</text>`).join('')}<circle class="pt" cx="${xs(li)}" cy="${ys(lv)}" r="4.5"/>${valid.map(([i, v]) => `<rect x="${xs(i) - 18}" y="-6" width="36" height="${H + 6}" fill="transparent" data-tip="${pts[i][0]}: ${v}% no dia certo" data-x="${(xs(i) / W) * 100}" data-y="${((ys(v) + 6) / (H + 24)) * 100}"/>`).join('')}</svg><span class="tip"></span></div>`;
}
function stats() {
  const per = UI.sview === 'semana', [a, b] = period(UI.sview), S = measure(a, b), [pa, pb] = period(UI.sview, -1), P = measure(pa, pb);
  const f = (v) => (v === null ? '–' : v + '%');
  let h = `<div class="ag-h"><b>Números</b><div class="seg"><button data-sview="semana" class="${per ? 'on' : ''}">Semana</button><button data-sview="mes" class="${!per ? 'on' : ''}">Mês</button></div></div>`;
  if (!S.total && !DB.tasks.length) return h + `<div class="empty-big">${ic('monitoring')}Os números aparecem conforme tu cria e conclui tarefas.<br>Eles mostram quanto tu faz no dia marcado, quanto remarca e o que mais volta.</div>`;
  h += `<div class="kpis"><div class="kpi dk"><small>No dia certo</small><b>${f(S.ok)}</b></div><div class="kpi"><small>Remarcadas</small><b>${f(S.rem)}</b></div><div class="kpi"><small>Atrasadas</small><b>${f(S.late)}</b></div><div class="kpi"><small>Tempo até fazer</small><b>${S.avg === null ? '–' : S.avg.toFixed(1).replace('.', ',')}<span> dias</span></b></div></div>`;
  let delta = '';
  if (S.ok !== null && P.ok !== null) { const dd = S.ok - P.ok; delta = `${dd >= 0 ? '+' : ''}${dd}% que ${per ? 'a semana passada' : 'o mês passado'}`; }
  h += '<div class="sgrid">';
  h += `<div class="card"><h6><span>Feitas no dia certo</span><b>${delta}</b></h6>${lineSvg(lineData(UI.sview))}</div>`;
  if (S.total) {
    const top = S.qs[1] >= S.qs[0];
    h += `<div class="card"><h6>Onde vai teu tempo</h6><div class="qd">${S.qs.map((p, i) => `<div class="q${i + 1}"><b>${p}%</b><small>${Q[i + 1].k}</small></div>`).join('')}</div><p class="ins">A maior parte está em <b>${top ? 'Agendar' : 'Fazer agora'}</b>${top ? ': importante sem ser urgente. Bom sinal.' : ': muita coisa está virando urgente.'}</p></div>`;
  }
  const rep = DB.tasks.filter((t) => t.hist && t.hist.length).sort((x, y) => y.hist.length - x.hist.length).slice(0, 3);
  h += `<div class="card"><h6>Tarefas que mais voltam</h6>${rep.map((t) => `<div class="rep"><span>${esc(t.t)}</span><b>${t.hist.length}×</b></div>`).join('') || '<p class="empty" style="padding:4px 0">Nenhuma tarefa remarcada até agora.</p>'}${S.avg !== null ? `<p class="ins">Uma tarefa leva em média <b>${S.avg.toFixed(1).replace('.', ',')} dias</b> entre ser criada e ser feita.</p>` : ''}</div>`;
  h += `<div class="card"><h6>Por área</h6><div class="bars">${S.ar.map(([n, p]) => `<div><div class="bar-l"><span>${esc(n)}</span><b>${p === null ? '–' : p + '%'}</b></div><div class="bar"><i data-w="${p || 0}"></i></div></div>`).join('')}</div></div>`;
  return h + '</div>';
}

/* ---------- HÁBITOS ---------- */
// Grade dia × hábito (como o rastreador do bullet journal) e uma nota de 0 a 100 por hábito.
// Cada marca guarda quando foi feita: days[data] = { at: ISO }. Marcas antigas (valor 1) contam como feitas no dia.
const HICONS = ['water_drop', 'fitness_center', 'menu_book', 'self_improvement', 'bedtime', 'directions_run', 'restaurant', 'local_cafe', 'spa', 'volunteer_activism', 'edit_note', 'savings', 'smoke_free', 'no_drinks', 'phone_android', 'sports_esports', 'fastfood', 'music_note'];
const HGOALS = [21, 30, 66, 90];
const HLEVELS = ['Semente', 'Broto', 'Raiz', 'Caule', 'Folhas', 'Galhos', 'Tronco', 'Copa', 'Árvore', 'Automático'];
const ALPHA = 1 - Math.pow(0.2, 1 / 30); // suavização: 30 dias perfeitos ≈ 80% de força, 60 dias ≈ 96%
const f1 = (n) => n.toFixed(1).replace('.', ',');
const hStart = (h) => ymd(new Date(h.created || Date.now()));
const hMarked = (h, s) => !!(h.days && h.days[s]);
const hGoal = (h) => h.goal || 66;
function hLag(h, s) { const v = h.days && h.days[s]; if (!v || typeof v !== 'object' || !v.at) return 0; return Math.max(0, dayDiff(s, ymd(new Date(v.at)))); }
function hState(h, s) {
  const t0 = today();
  if (s > t0) return 'fut';
  if (s < hStart(h)) return 'off';
  if (h.type === 'bad') return hMarked(h, s) ? 'x' : s < t0 ? 'ok' : 'wait';
  return hMarked(h, s) ? (hLag(h, s) ? 'ok late' : 'ok') : s < t0 ? 'miss' : 'wait';
}
function hScore(h) {
  const t0 = today(), bad = h.type === 'bad', st = hStart(h);
  const end = hMarked(h, t0) ? t0 : addDays(t0, -1);
  const list = []; for (let d = st; d <= end; d = addDays(d, 1)) list.push(d);
  const x = (d) => (bad ? (hMarked(h, d) ? 0 : 1) : hMarked(h, d) ? 1 : 0);
  let cur = 0, best = 0, run = 0;
  list.forEach((d) => { run = x(d) ? run + 1 : 0; best = Math.max(best, run); });
  for (let i = list.length - 1; i >= 0 && x(list[i]); i--) cur++;
  const doneDays = list.filter((d) => x(d)).length;
  const marks = Object.keys(h.days || {}).filter((d) => d >= st && d <= t0);
  const lags = marks.map((d) => hLag(h, d)), late = lags.filter((l) => l > 0);
  const info = { n: list.length, cur, best, doneDays, late: late.length, avgLag: late.length ? late.reduce((a, c) => a + c, 0) / late.length : 0, formation: Math.min(1, list.length / 66) };
  if (!list.length) return { score: null, parts: [], info };
  // 1. Força: média com mais peso nos dias recentes (suavização exponencial)
  let f = 0; list.forEach((d) => { f += ALPHA * (x(d) - f); });
  // 2. Últimos 14 dias
  const last = list.slice(-14), recent = last.filter((d) => x(d)).length / last.length;
  // 3. Pontualidade: marcar no mesmo dia vale tudo; 1 dia depois 60%; 2 dias 30%; 3 ou mais 10%
  const lw = (l) => (l <= 0 ? 1 : l === 1 ? 0.6 : l === 2 ? 0.3 : 0.1);
  const recentMarks = marks.filter((d) => d >= addDays(t0, -30));
  const punct = recentMarks.length ? recentMarks.reduce((a, d) => a + lw(hLag(h, d)), 0) / recentMarks.length : 0;
  // 4. Meta: dias feitos (bom) ou sequência atual sem cair (ruim) em relação à meta
  const meta = Math.min(1, (bad ? cur : doneDays) / hGoal(h));
  // 5. Recuperação: depois de falhar, voltou no dia seguinte?
  let falls = 0, back = 0; list.forEach((d, i) => { if (!x(d) && i < list.length - 1) { falls++; if (x(list[i + 1])) back++; } });
  const recov = falls ? back / falls : list.length > 1 ? 1 : 0.5;
  // 6. Horário regular (só bons, marcados no mesmo dia)
  let reg = 0.5;
  if (!bad) {
    const hrs = recentMarks.filter((d) => hLag(h, d) === 0 && h.days[d] && h.days[d].at).map((d) => { const t = new Date(h.days[d].at); return t.getHours() + t.getMinutes() / 60; });
    if (hrs.length >= 3) { const m = hrs.reduce((a, c) => a + c, 0) / hrs.length, sd = Math.sqrt(hrs.reduce((a, c) => a + (c - m) ** 2, 0) / hrs.length); reg = Math.max(0, Math.min(1, 1 - (sd - 1) / 3)); }
  }
  const parts = bad
    ? [['forca', 'Força do hábito', 40, f], ['recente', 'Dias limpos (últimos 14)', 25, recent], ['meta', `Sequência sem cair × meta de ${hGoal(h)}`, 20, meta], ['recup', 'Recuperação depois de cair', 15, recov]]
    : [['forca', 'Força do hábito', 35, f], ['recente', 'Constância (últimos 14 dias)', 20, recent], ['pontual', 'Marcou no mesmo dia', 15, punct], ['meta', `Progresso na meta de ${hGoal(h)} dias`, 15, meta], ['recup', 'Voltou no dia seguinte a uma falha', 10, recov], ['horario', 'Horário regular', 5, reg]];
  const score = parts.reduce((a, p) => a + p[2] * p[3], 0);
  return { score, parts, info };
}
const TIPS = {
  forca: 'Repetir todo dia é o que mais pesa. A força sobe rápido no começo e devagar depois.',
  recente: 'Os últimos 14 dias contam muito: emende mais dias seguidos.',
  pontual: 'Marque no mesmo dia em que fez. Marcar depois vale menos.',
  meta: '', recup: 'Depois de uma falha, volte no dia seguinte. Nunca falhe dois dias seguidos.',
  horario: 'Fazer sempre no mesmo horário ajuda o hábito a ficar automático.',
};
function hRange() {
  const t0 = today();
  if (UI.hview === 'semana') return weekOf(addDays(monday(t0), UI.hoff * 7));
  const d = parse(t0), y = d.getFullYear(), m = d.getMonth() + UI.hoff, n = new Date(y, m + 1, 0).getDate();
  return [...Array(n)].map((_, i) => ymd(new Date(y, m, i + 1)));
}
function hMatrix(days) {
  const t0 = today(), wd = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const head = `<tr><th class="hn"></th>${days.map((s) => `<th class="${s === t0 ? 't' : ''}"><span>${wd[parse(s).getDay()]}</span>${parse(s).getDate()}</th>`).join('')}</tr>`;
  const rowH = (h) => {
    const sc = hScore(h).score;
    return `<tr class="${h.type === 'bad' ? 'bad' : ''}"><th class="hn" data-edithab="${h.id}"><span class="hi">${ic(h.i || 'check', 17)}</span><span class="nm">${esc(h.n)}<small>${sc === null ? 'novo' : f1(sc)}</small></span></th>${days.map((s) => {
      const k = hState(h, s), off = k === 'fut' || k === 'off';
      const inner = k === 'x' ? ic('close', 15) : k.startsWith('ok') && h.type !== 'bad' ? ic('check', 15) : k === 'ok' ? '' : '';
      return `<td><button class="hcell ${k}${s === t0 ? ' today' : ''}" data-hday="${s}" data-hid="${h.id}"${off ? ' disabled' : ''} aria-label="${esc(h.n)}, ${fmtDate(s, true)}">${inner}</button></td>`;
    }).join('')}</tr>`;
  };
  const good = DB.habits.filter((x) => x.type !== 'bad'), bad = DB.habits.filter((x) => x.type === 'bad');
  const grp = (l, t) => (l.length ? `<tr class="grp"><th class="hn" colspan="${days.length + 1}"><span>${t}</span></th></tr>${l.map(rowH).join('')}` : '');
  return `<div class="hmx-wrap${UI.hview === 'mes' ? ' month' : ''}"><table class="hmx"><thead>${head}</thead><tbody>${grp(good, 'Bons · quero fazer')}${grp(bad, 'Ruins · quero evitar (× = fiz)')}</tbody></table></div>
  <div class="legend hleg"><span><i class="lg ok"></i>feito no dia</span><span><i class="lg ok late"></i>marcado depois</span><span><i class="lg okb"></i>evitado</span><span><i class="lg x"></i>caí</span></div>`;
}
function hAnalysis(h) {
  const r = hScore(h), bad = h.type === 'bad', i = r.info;
  if (r.score === null) return `<div class="hcard"><div class="hcard-h"><span class="hi">${ic(h.i || 'check', 20)}</span><div><b>${esc(h.n)}</b><small>${bad ? 'Ruim' : 'Bom'} · meta de ${hGoal(h)} dias</small></div></div><p class="empty">A nota aparece a partir de amanhã.</p></div>`;
  const lv = Math.min(9, Math.floor(r.score / 10));
  const gap = r.parts.map((p) => [p[0], p[2] * (1 - p[3])]).sort((a, c) => c[1] - a[1])[0];
  const left = Math.max(0, hGoal(h) - (bad ? i.cur : i.doneDays));
  const tip = gap && gap[1] > 0.5 ? (gap[0] === 'meta' ? `Faltam ${pl(left, 'dia', 'dias')} para a meta de ${hGoal(h)}.` : TIPS[gap[0]]) : 'Tudo em dia. Continue assim.';
  return `<div class="hcard${bad ? ' bad' : ''}">
  <div class="hcard-h"><span class="hi">${ic(h.i || 'check', 20)}</span><div data-edithab="${h.id}"><b>${esc(h.n)}</b><small>${bad ? 'Ruim · quero evitar' : 'Bom · quero fazer'} · meta de ${hGoal(h)} dias</small></div></div>
  <div class="hscore"><b>${f1(r.score)}</b><div><span>${HLEVELS[lv]}</span><small>nível ${lv + 1} de 10</small></div></div>
  <div class="hbar"><i style="width:${r.score}%"></i>${[10, 20, 30, 40, 50, 60, 70, 80, 90].map((v) => `<em style="left:${v}%"></em>`).join('')}</div>
  <div class="hparts">${r.parts.map((p) => `<div><div class="bar-l"><span>${p[1]}</span><b>${f1(p[2] * p[3])} / ${p[2]}</b></div><div class="bar"><i data-w="${Math.round(p[3] * 100)}"></i></div></div>`).join('')}</div>
  <div class="hstats"><span><b>${i.cur}</b>${bad ? 'dias sem cair' : 'seguidos agora'}</span><span><b>${i.best}</b>melhor sequência</span><span><b>${bad ? i.n - i.doneDays : i.doneDays}</b>${bad ? 'vezes que caí' : 'dias feitos'}</span>${bad ? '' : `<span><b>${i.late}</b>marcados depois${i.late ? ` · atraso médio ${f1(i.avgLag)} dia${i.avgLag >= 2 ? 's' : ''}` : ''}</span>`}</div>
  <p class="ins">Dia ${i.n} de formação${i.n < 66 ? ` · a pesquisa mostra que um hábito leva em média 66 dias para ficar automático` : ' · já passou da média de 66 dias para ficar automático'}.</p>
  <p class="htip">${ic('trending_up', 16)}<span><b>Para subir:</b> ${tip}</span></p></div>`;
}
function habits() {
  const days = hRange(), sem = UI.hview === 'semana', d0 = parse(days[0]), d1 = parse(days[days.length - 1]);
  const lbl = sem ? `${d0.getDate()} ${MO[d0.getMonth()]} a ${d1.getDate()} ${MO[d1.getMonth()]}` : `${MOF[d0.getMonth()]} ${d0.getFullYear()}`;
  let h = `<div class="ag-h"><b>Hábitos</b><div class="seg"><button data-hview="semana" class="${sem ? 'on' : ''}">Semana</button><button data-hview="mes" class="${!sem ? 'on' : ''}">Mês</button></div></div>
  <div class="ag-nav"><p class="sub-h">${lbl}</p>${UI.hoff ? `<button data-hnav="0" aria-label="Voltar para agora">${ic('today', 18)}</button>` : ''}<button data-hnav="-1" aria-label="Anterior">${ic('chevron_left', 20)}</button><button data-hnav="1" aria-label="Próximo"${UI.hoff >= 0 ? ' disabled' : ''}>${ic('chevron_right', 20)}</button></div>`;
  if (!DB.habits.length) return h + `<div class="empty-big">${ic('checklist')}Acompanhe o que tu quer fazer todo dia (ler, treinar, orar)<br>e o que quer evitar (celular na cama, doce).<br>Cada hábito ganha uma linha na grade e uma nota de 0 a 100.</div><button class="newarea" data-newhab>${ic('add', 18)}Novo hábito</button>`;
  const good = DB.habits.filter((x) => x.type !== 'bad'), bad = DB.habits.filter((x) => x.type === 'bad'), t0 = today();
  h += `<p class="hsum">${good.length ? `${good.filter((x) => hMarked(x, t0)).length} de ${good.length} bons feitos hoje` : ''}${good.length && bad.length ? ' · ' : ''}${bad.length ? `${bad.filter((x) => !hMarked(x, t0)).length} de ${bad.length} ruins evitados` : ''}</p>`;
  h += hMatrix(days) + `<button class="newarea" data-newhab>${ic('add', 18)}Novo hábito</button>`;
  h += `<div class="sec-h">Análise de cada hábito<small>nota de 0 a 100</small></div><div class="hlist">${DB.habits.map(hAnalysis).join('')}</div>`;
  h += `<details class="hhow"><summary>${ic('info', 18)}Como a nota é calculada</summary><div>
  <p><b>Força do hábito</b> (até 35 pontos; 40 nos ruins): uma média que dá mais peso aos dias recentes. Com todos os dias feitos, chega a cerca de 80% em um mês e 96% em dois. Uma falha isolada pesa pouco; falhas frequentes derrubam.</p>
  <p><b>Constância dos últimos 14 dias</b> (20; 25 nos ruins): quantos dos últimos 14 dias tu fez (ou evitou).</p>
  <p><b>Marcou no mesmo dia</b> (15, só nos bons): marcar no dia vale 100%; no dia seguinte, 60%; dois dias depois, 30%; três ou mais, 10%. Registro feito na hora é mais confiável do que de memória.</p>
  <p><b>Meta</b> (15; 20 nos ruins): dias feitos em relação à meta do hábito. Nos ruins, é a sequência atual sem cair.</p>
  <p><b>Recuperação</b> (10; 15 nos ruins): quantas vezes, depois de falhar, tu voltou já no dia seguinte.</p>
  <p><b>Horário regular</b> (5, só nos bons): fazer mais ou menos na mesma hora todo dia.</p>
  <p>Os níveis vão de 1 (Semente, 0 a 9,9) a 10 (Automático, 90 a 100), a cada 10 pontos. O dia de hoje só entra na conta depois de marcado.</p></div></details>`;
  return h;
}
function habitsToday() {
  if (!DB.habits.length) return '';
  const t0 = today();
  return `<div class="sec-h">Hábitos de hoje<small>toque para marcar</small></div><div class="hchips">${DB.habits.map((x) => { const on = hMarked(x, t0), bad = x.type === 'bad'; return `<button class="hchip${bad ? ' bad' : ''}${on ? ' on' : ''}" data-htoday="${x.id}" aria-pressed="${on}">${ic(on ? (bad ? 'close' : 'check') : x.i || 'check', 16)}${esc(x.n)}</button>`; }).join('')}</div>`;
}
function habSheet() {
  const F = UI.habForm;
  return `<div class="bd"></div><div class="pn"><span class="grab"></span><h4>${F.id ? 'Editar hábito' : 'Novo hábito'}<button class="rbtn" data-closehab aria-label="Fechar">${ic('close', 18)}</button></h4>
  <input class="ttl" id="hname" placeholder="Ex.: Ler 10 páginas" value="${esc(F.n)}" autocomplete="off" enterkeyhint="done">
  <div class="lbl">Tipo</div><div class="htype"><button data-htype="good" class="${F.type !== 'bad' ? 'on' : ''}">${ic('check_circle', 20)}<b>Bom</b><small>Quero fazer</small></button><button data-htype="bad" class="${F.type === 'bad' ? 'on' : ''}">${ic('block', 20)}<b>Ruim</b><small>Quero evitar</small></button></div>
  <div class="lbl">Meta em dias</div><div class="hgoal">${HGOALS.map((g) => `<button class="chip${F.goal === g ? ' on' : ''}" data-hgoal="${g}">${g}</button>`).join('')}<div class="step"><button data-hstep="-1" aria-label="Menos um dia">${ic('remove', 18)}</button><b id="hgoalv">${F.goal}</b><button data-hstep="1" aria-label="Mais um dia">${ic('add', 18)}</button></div></div>
  <div class="lbl">Ícone</div><div class="icgrid">${HICONS.map((n) => `<button data-hic="${n}" class="${F.i === n ? 'on' : ''}" aria-label="${n}">${ic(n, 22)}</button>`).join('')}</div>
  <div class="save-row">${F.id ? `<button class="del" data-delhab>${ic('delete', 18)}</button>` : ''}<button class="save" data-savehab>${F.id ? 'Salvar' : 'Criar hábito'}</button></div></div>`;
}
function toggleHab(id, s) {
  const h = DB.habits.find((x) => x.id === id); if (!h) return;
  h.days = { ...(h.days || {}) };
  if (h.days[s]) delete h.days[s]; else h.days[s] = { at: new Date().toISOString() };
  if (navigator.vibrate) navigator.vibrate(10);
  if (s !== today() && h.days[s] && h.type !== 'bad') toast('Marcado depois: conta menos na nota do que marcar no dia.');
  UI.hkeep = true; save(); render('habits'); render('home');
}

/* ---------- render ---------- */
const R = { home, agenda, areas, habits, stats };
function anim(el) { requestAnimationFrame(() => requestAnimationFrame(() => $$('.bar i[data-w]', el).forEach((b) => (b.style.width = b.dataset.w + '%')))); }
function render(s, keep = true) {
  if (s === 'habits') { const w0 = $('.hmx-wrap'); const sl = w0 ? w0.scrollLeft : null, keepX = UI.hkeep; UI.hkeep = false; setTimeout(() => { const w = $('.hmx-wrap.month'); if (!w) return; if (keepX && sl !== null) { w.scrollLeft = sl; return; } const t = w.querySelector('th.t'); if (t) w.scrollLeft = t.offsetLeft - w.clientWidth / 2; }, 0); } const el = $(`[data-s="${s}"]`); const sc = el.scrollTop; el.innerHTML = R[s](); if (keep) el.scrollTop = sc; anim(el); }
function renderAll() { Object.keys(R).forEach((s) => render(s)); if (UI.det) renderDet(); }
function renderDet(keep = true) { const el = $('.detail'); const sc = el.scrollTop; el.innerHTML = detail(); if (keep) el.scrollTop = sc; }
function go(tab) {
  UI.tab = tab;
  $$('.nav button').forEach((b) => b.classList.toggle('on', b.dataset.go === tab));
  $$('.screen').forEach((s) => s.classList.toggle('on', s.dataset.s === tab));
  closeDetail();
  render(tab, false);
  saveUI();
}

/* ---------- voltar do Android ---------- */
const layers = [];
let ignorePop = 0, exitArmed = 0, guardArmed = false;
function pushLayer(close) { layers.push(close); history.pushState({ orbe: layers.length }, ''); }
function popLayer() { if (!layers.length) return; layers.pop(); ignorePop++; history.back(); }
// O Chrome ignora entradas do histórico criadas sem toque do usuário; por isso a "trava" do voltar
// é recolocada no primeiro toque depois de cada voltar.
function pushGuard() { history.pushState({ orbe: 'guard' }, ''); }
function armGuard() { if (!guardArmed) { guardArmed = true; pushGuard(); } }
document.addEventListener('pointerdown', armGuard, { capture: true });
document.addEventListener('keydown', armGuard, { capture: true });
window.addEventListener('popstate', () => {
  if (ignorePop) { ignorePop--; return; }
  if (Date.now() - exitArmed < 2500 && !layers.length && UI.tab === 'home') { history.back(); return; }
  guardArmed = false;
  if (layers.length) { const close = layers.pop(); close(); pushGuard(); return; }
  if (UI.tab !== 'home') { go('home'); pushGuard(); return; }
  exitArmed = Date.now(); toast('Toque em voltar de novo para sair'); pushGuard();
});
history.replaceState({ orbe: 'base' }, ''); pushGuard();

/* ---------- voltar de onde parou ---------- */
// Guarda aba, rolagem, filtros, dia da agenda, parte aberta e a tarefa sendo escrita; restaura ao reabrir (até 12 h).
const UI_KEY = 'orbe.ui';
function saveUI() {
  try {
    const taskOpen = $('[data-sh="task"]').classList.contains('open');
    if (taskOpen) readTitle();
    const scroll = {}; $$('.screen').forEach((el) => (scroll[el.dataset.s] = el.scrollTop));
    localStorage.setItem(UI_KEY, JSON.stringify({ at: Date.now(), tab: UI.tab, hview: UI.hview, qf: UI.qf, view: UI.view, sel: UI.sel, sview: UI.sview, open: [...UI.open], det: UI.det, dtab: UI.dtab, scroll, detScroll: $('.detail').scrollTop, form: taskOpen ? UI.form : null }));
  } catch (e) { /* ignora */ }
}
function restoreUI() {
  let st; try { st = JSON.parse(localStorage.getItem(UI_KEY)); } catch (e) { return; }
  if (!st || Date.now() - st.at > 12 * 3600000) return;
  Object.assign(UI, { hview: st.hview || 'semana', qf: st.qf || 0, view: st.view || 'semana', sel: st.sel || today(), sview: st.sview || 'semana', open: new Set(st.open || []) });
  go(st.tab || 'home');
  Object.keys(R).forEach((x) => render(x, false));
  requestAnimationFrame(() => { $$('.screen').forEach((el) => { if (st.scroll && st.scroll[el.dataset.s]) el.scrollTop = st.scroll[el.dataset.s]; }); });
  if (st.det && area(st.det[0])) { openDetail(st.det[0], st.det[1]); UI.dtab = st.dtab || 'tudo'; renderDet(false); requestAnimationFrame(() => ($('.detail').scrollTop = st.detScroll || 0)); }
  if (st.form) openTask(st.form);
}
document.addEventListener('visibilitychange', () => { if (document.hidden) saveUI(); });
window.addEventListener('pagehide', saveUI);

/* ---------- janelas ---------- */
function openSheet(name, html) {
  const sh = $(`[data-sh="${name}"]`); sh.innerHTML = html;
  requestAnimationFrame(() => sh.classList.add('open'));
  pushLayer(() => sh.classList.remove('open'));
}
function closeSheet(name) { const sh = $(`[data-sh="${name}"]`); if (!sh.classList.contains('open')) return; sh.classList.remove('open'); popLayer(); }
function openPop(html) {
  const p = $('.pop'); p.innerHTML = `<div class="pbd"></div><div class="pc">${html}</div>`;
  requestAnimationFrame(() => p.classList.add('open'));
  pushLayer(() => p.classList.remove('open'));
}
function closePop() { const p = $('.pop'); if (!p.classList.contains('open')) return; p.classList.remove('open'); popLayer(); }
function openDetail(k, s) { UI.det = [k, s]; UI.dtab = 'tudo'; renderDet(false); $('.detail').classList.add('open'); pushLayer(() => { $('.detail').classList.remove('open'); UI.det = null; }); }
function closeDetail() { if (!$('.detail').classList.contains('open')) return; $('.detail').classList.remove('open'); UI.det = null; popLayer(); }

let confirmCb = null;
function askConfirm(msg, okLabel, cb) { confirmCb = cb; openPop(`<div class="calh"><b>${esc(msg)}</b></div><p class="msg">Isso não pode ser desfeito.</p><div class="pact"><button data-pclose>Cancelar</button><button class="pri" data-confirm>${esc(okLabel)}</button></div>`); }

/* ---------- formulário de tarefa ---------- */
function newForm(over = {}) {
  const a = over.a || (DB.areas[0] && DB.areas[0].k) || '';
  const ar = area(a);
  return Object.assign({ id: null, t: '', a, s: ar && ar.subs[0] ? ar.subs[0] : '', q: 2, date: today(), time: null }, over);
}
function taskSheet() {
  const F = UI.form, A = area(F.a);
  return `<div class="bd"></div><div class="pn"><span class="grab"></span><h4>${F.id ? 'Editar tarefa' : 'Nova tarefa'}<button class="rbtn" data-closetask aria-label="Fechar">${ic('close', 18)}</button></h4>
  <input class="ttl" id="ttl" placeholder="O que precisa ser feito?" value="${esc(F.t)}" autocomplete="off" enterkeyhint="done">
  <div class="dts"><button class="dt${F.date ? ' set' : ''}" data-pick="date">${ic('calendar_month', 18)}<span>${F.date ? fmtDate(F.date, true) : 'Data'}</span></button><button class="dt${F.time ? ' set' : ''}" data-pick="time">${ic('schedule', 18)}<span>${F.time || 'Hora'}</span>${F.time ? `<span class="x" data-clrtime>${ic('close', 16)}</span>` : ''}</button></div>
  <div class="lbl">Área</div><div class="chips">${DB.areas.map((v) => `<button class="chip${v.k === F.a ? ' on' : ''}" data-farea="${v.k}">${ic(v.i, 16)}${esc(v.n)}</button>`).join('')}</div>
  ${A && A.subs.length ? `<div class="chips">${A.subs.map((s) => `<button class="chip sub${s === F.s ? ' on' : ''}" data-fsub="${esc(s)}">${esc(s)}</button>`).join('')}</div>` : ''}
  <div class="lbl">Prioridade</div>
  <div class="mx"><span></span><span class="ax">Urgente</span><span class="ax">Não urgente</span><span class="ay">Importante</span>${[1, 2].map(qcell).join('')}<span class="ay">Não importante</span>${[3, 4].map(qcell).join('')}</div>
  <div class="save-row">${F.id ? `<button class="del" data-deltask>${ic('delete', 18)}</button>` : ''}<button class="save" data-savetask>Salvar</button></div></div>`;
}
const qcell = (q) => `<button class="qc q${q}${UI.form.q === q ? ' on' : ''}" data-q="${q}"><b>${Q[q].k}</b><small>${Q[q].d}</small></button>`;
function readTitle() { const i = $('#ttl'); if (i && UI.form) UI.form.t = i.value; }
function rerenderTask() { readTitle(); $('[data-sh="task"]').innerHTML = taskSheet(); }
function openTask(form) { UI.form = form; openSheet('task', taskSheet()); }
function setDate(t, newDate) {
  if (t.date === newDate) return;
  if (t.date && !t.done) { t.hist = t.hist || []; t.hist.push({ from: t.date, to: newDate, at: new Date().toISOString() }); }
  if (!t.orig && t.date) t.orig = t.date;
  t.date = newDate;
}
function saveTask() {
  readTitle();
  const F = UI.form, title = F.t.trim();
  if (!title) { toast('Escreva o que precisa ser feito.'); $('#ttl').focus(); return; }
  if (F.id) {
    const t = DB.tasks.find((x) => x.id === F.id); if (!t) return;
    setDate(t, F.date); Object.assign(t, { t: title, a: F.a, s: F.s, q: F.q, time: F.time });
    toast('Tarefa atualizada.');
  } else {
    DB.tasks.push({ id: uid(), t: title, a: F.a, s: F.s, q: F.q, date: F.date, time: F.time, done: false, doneAt: null, created: new Date().toISOString(), hist: [] });
    toast('Tarefa criada.');
  }
  save(); closeSheet('task'); renderAll();
}

/* calendário */
function calPop() {
  const y = UI.cm.getFullYear(), m = UI.cm.getMonth(), first = (new Date(y, m, 1).getDay() + 6) % 7, n = new Date(y, m + 1, 0).getDate(), t0 = today();
  let cells = ''; for (let i = 0; i < first; i++) cells += '<span></span>';
  for (let d = 1; d <= n; d++) { const s = ymd(new Date(y, m, d)); cells += `<button class="cd${s === t0 ? ' today' : ''}${s === UI.form.date ? ' sel' : ''}${s < t0 ? ' past' : ''}" data-cd="${s}">${d}</button>`; }
  let k = 1; while (parse(addDays(t0, k)).getDay() !== 1) k++;
  return `<div class="calh"><button data-cm="-1" aria-label="Mês anterior">${ic('chevron_left', 20)}</button><b>${MOF[m]} <span class="muted">${y}</span></b><button data-cm="1" aria-label="Próximo mês">${ic('chevron_right', 20)}</button></div>
  <div class="cal">${['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((x) => `<span class="wd">${x}</span>`).join('')}${cells}</div>
  <div class="quick"><button data-quick="0">Hoje</button><button data-quick="1">Amanhã</button><button data-quick="${k}">Próx. segunda</button></div>
  <div class="pact"><button data-nodate>Sem data</button><button class="pri" data-pclose>Fechar</button></div>`;
}
/* hora em colunas que rolam */
const HRS = [...Array(24).keys()], MINS = [0, 10, 20, 30, 40, 50], IH = 40;
function timePop() {
  const col = (arr) => `<div class="wheel"><span class="pad"></span>${arr.map((v, i) => `<div data-wi="${i}">${pad(v)}</div>`).join('')}<span class="pad"></span></div>`;
  return `<div class="calh"><b>Hora</b><span class="muted" style="font-size:12px">arraste para escolher</span></div>
  <div class="wlab"><span>Hora</span><span></span><span>Minutos</span></div>
  <div class="wheels">${col(HRS)}<span class="wsep">:</span>${col(MINS)}</div>
  <div class="pact"><button data-notime>Sem hora</button><button class="pri" data-tset>Definir</button></div>`;
}
const wIdx = (w) => Math.max(0, Math.min($$('[data-wi]', w).length - 1, Math.round(w.scrollTop / IH)));
function initWheels() {
  let [h, mi] = (UI.form.time || '09:00').split(':').map(Number);
  $$('.pop .wheel').forEach((w, k) => {
    const mark = () => { const i = wIdx(w); $$('[data-wi]', w).forEach((e) => e.classList.toggle('on', +e.dataset.wi === i)); };
    w.scrollTop = (k === 0 ? h : MINS.indexOf(mi - (mi % 10))) * IH; mark();
    w.addEventListener('scroll', mark, { passive: true });
    let sy = null, st = 0, moved = false;
    w.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') return; sy = e.clientY; st = w.scrollTop; moved = false; w.style.scrollSnapType = 'none'; w.classList.add('drag'); w.setPointerCapture(e.pointerId); });
    w.addEventListener('pointermove', (e) => { if (sy === null) return; const dy = e.clientY - sy; if (Math.abs(dy) > 3) moved = true; w.scrollTop = st - dy; });
    const up = () => { if (sy === null) return; sy = null; w.style.scrollSnapType = ''; w.classList.remove('drag'); w.scrollTo({ top: wIdx(w) * IH, behavior: 'smooth' }); if (moved) w.addEventListener('click', (ev) => ev.stopPropagation(), { capture: true, once: true }); };
    w.addEventListener('pointerup', up); w.addEventListener('pointercancel', up);
  });
}

/* área: criar / editar */
function areaSheet() {
  const F = UI.areaForm;
  return `<div class="bd"></div><div class="pn"><span class="grab"></span><h4>${F.k ? 'Editar área' : 'Nova área'}<button class="rbtn" data-closearea aria-label="Fechar">${ic('close', 18)}</button></h4>
  <input class="ttl" id="aname" placeholder="Nome da área" value="${esc(F.n)}" autocomplete="off">
  <div class="lbl">Ícone</div><div class="icgrid">${ICONS.map((n) => `<button data-fai="${n}" class="${F.i === n ? 'on' : ''}" aria-label="${n}">${ic(n, 22)}</button>`).join('')}</div>
  <div class="lbl">Cor no gráfico</div><div class="clrs">${COLORS.map((c) => `<button data-fac="${c}" class="${F.c === c ? 'on' : ''}" style="--c:${c}" aria-label="Cor ${c}"></button>`).join('')}</div>
  <div class="save-row">${F.k ? `<button class="del" data-delarea>${ic('delete', 18)}</button>` : ''}<button class="save" data-savearea>${F.k ? 'Salvar' : 'Criar área'}</button></div></div>`;
}
function settingsSheet() {
  return `<div class="bd"></div><div class="pn"><span class="grab"></span><h4>Configurações<button class="rbtn" data-closeset aria-label="Fechar">${ic('close', 18)}</button></h4>
  <div class="lbl">Teu nome na saudação</div><input class="ttl" id="uname" value="${esc(DB.name)}" placeholder="Teu nome" autocomplete="off">
  <div class="set-row"><span>Tarefas guardadas</span><small>${DB.tasks.length}</small></div>
  ${syncSection()}
  <div class="set-row"><span>Versão</span><small>v${self.APP_VERSION}</small></div>
  <div class="save-row"><button class="save" data-saveset>Salvar</button></div></div>`;
}

/* ---------- cliques ---------- */
APP.addEventListener('click', (e) => {
  const c = (s) => e.target.closest(s); let x;
  // janelinhas
  if ((x = c('[data-cm]'))) { UI.cm = new Date(UI.cm.getFullYear(), UI.cm.getMonth() + +x.dataset.cm, 1); $('.pop .pc').innerHTML = calPop(); return; }
  if ((x = c('[data-cd]'))) { UI.form.date = x.dataset.cd; closePop(); rerenderTask(); return; }
  if ((x = c('[data-quick]'))) { UI.form.date = addDays(today(), +x.dataset.quick); closePop(); rerenderTask(); return; }
  if (c('[data-nodate]')) { UI.form.date = null; closePop(); rerenderTask(); return; }
  if (c('[data-notime]')) { UI.form.time = null; closePop(); rerenderTask(); return; }
  if (c('[data-tset]')) { const w = $$('.pop .wheel'); UI.form.time = pad(HRS[wIdx(w[0])]) + ':' + pad(MINS[wIdx(w[1])]); closePop(); rerenderTask(); return; }
  if ((x = c('.wheel [data-wi]'))) { x.parentNode.scrollTo({ top: +x.dataset.wi * IH, behavior: 'smooth' }); return; }
  if (c('[data-confirm]')) { const cb = confirmCb; confirmCb = null; closePop(); if (cb) setTimeout(cb, 50); return; }
  if (c('.pbd') || c('[data-pclose]')) { closePop(); return; }
  // formulário de tarefa
  if (c('[data-clrtime]')) { UI.form.time = null; rerenderTask(); return; }
  if ((x = c('[data-pick]'))) { readTitle(); if (x.dataset.pick === 'date') { const b = parse(UI.form.date || today()); UI.cm = new Date(b.getFullYear(), b.getMonth(), 1); openPop(calPop()); } else { openPop(timePop()); initWheels(); } return; }
  if ((x = c('[data-farea]'))) { readTitle(); UI.form.a = x.dataset.farea; const A = area(UI.form.a); UI.form.s = A.subs[0] || ''; rerenderTask(); return; }
  if ((x = c('[data-fsub]'))) { UI.form.s = x.dataset.fsub; $$('[data-fsub]').forEach((y) => y.classList.toggle('on', y === x)); return; }
  if ((x = c('.qc'))) { UI.form.q = +x.dataset.q; $$('.qc').forEach((y) => y.classList.toggle('on', y === x)); return; }
  if (c('[data-savetask]')) { saveTask(); return; }
  if (c('[data-deltask]')) { const id = UI.form.id; askConfirm('Excluir esta tarefa?', 'Excluir', () => { DB.tasks = DB.tasks.filter((t) => t.id !== id); save(); closeSheet('task'); renderAll(); toast('Tarefa excluída.'); }); return; }
  if (c('[data-closetask]')) { closeSheet('task'); return; }
  if (c('[data-sh="area"] .bd') || c('[data-closearea]')) { closeSheet('area'); return; }
  if (c('[data-sh="set"] .bd') || c('[data-closeset]')) { closeSheet('set'); return; }
  // área
  if ((x = c('[data-fai]'))) { UI.areaForm.i = x.dataset.fai; $$('[data-fai]').forEach((y) => y.classList.toggle('on', y === x)); return; }
  if ((x = c('[data-fac]'))) { UI.areaForm.c = x.dataset.fac; $$('[data-fac]').forEach((y) => y.classList.toggle('on', y === x)); return; }
  if (c('[data-savearea]')) {
    const F = UI.areaForm, n = $('#aname').value.trim(); if (!n) { toast('Dê um nome para a área.'); return; }
    if (F.k) Object.assign(area(F.k), { n, i: F.i, c: F.c }); else { const k = 'a' + uid(); DB.areas.push({ k, n, i: F.i, c: F.c, subs: [] }); UI.open.add(k); }
    save(); closeSheet('area'); render('areas'); toast(F.k ? 'Área atualizada.' : 'Área criada.'); return;
  }
  if (c('[data-delarea]')) {
    const k = UI.areaForm.k, used = DB.tasks.filter((t) => t.a === k).length;
    askConfirm(`Excluir a área ${area(k).n}?`, 'Excluir', () => { DB.areas = DB.areas.filter((a) => a.k !== k); DB.tasks = DB.tasks.filter((t) => t.a !== k); DB.notes = DB.notes.filter((n) => n.a !== k); save(); closeSheet('area'); renderAll(); toast(used ? `Área e ${pl(used, 'tarefa excluída', 'tarefas excluídas')}.` : 'Área excluída.'); });
    return;
  }
  if ((x = c('[data-eye]'))) { const i = $('#spass'), show = i.type === 'password'; i.type = show ? 'text' : 'password'; x.innerHTML = ic(show ? 'visibility_off' : 'visibility', 22); x.setAttribute('aria-pressed', show); x.setAttribute('aria-label', show ? 'Esconder senha' : 'Mostrar senha'); i.focus(); return; }
  if (c('[data-login]') || c('[data-signup]')) { auth(c('[data-signup]') ? 'signup' : 'login'); return; }
  if (c('[data-logout]')) { SYNC.client.auth.signOut().then(() => { toast('Desconectado. As tarefas continuam neste aparelho.'); refreshSet(); }); return; }
  if (c('[data-syncnow]')) { sync(true); return; }
  if (c('[data-saveset]')) { DB.name = $('#uname').value.trim(); save(); closeSheet('set'); render('home'); return; }
  // navegação
  if ((x = c('[data-go]'))) { go(x.dataset.go); return; }
  if (c('.fab') || c('[data-new]')) {
    const over = {};
    if (UI.det) { over.a = UI.det[0]; over.s = UI.det[1]; }
    else if (UI.tab === 'agenda') over.date = UI.sel;
    openTask(newForm(over)); return;
  }
  if (c('[data-settings]')) { openSheet('set', settingsSheet()); return; }
  // tarefas
  if ((x = c('.ck'))) {
    const r = x.closest('[data-id]'), t = DB.tasks.find((y) => y.id === r.dataset.id); if (!t) return;
    t.done = !t.done; t.doneAt = t.done ? new Date().toISOString() : null; save();
    $$(`.task[data-id="${t.id}"]`).forEach((y) => y.classList.toggle('done', t.done));
    if (t.done && navigator.vibrate) navigator.vibrate(12);
    setTimeout(renderAll, 480); return;
  }
  if ((x = c('.task[data-id], .next[data-id], .sp p[data-id]'))) {
    const t = DB.tasks.find((y) => y.id === x.dataset.id); if (!t) return;
    openTask({ id: t.id, t: t.t, a: t.a, s: t.s, q: t.q, date: t.date, time: t.time }); return;
  }
  if ((x = c('[data-qf]'))) { const q = +x.dataset.qf; UI.qf = UI.qf === q ? 0 : q; render('home'); return; }
  // agenda
  if ((x = c('[data-view]'))) { UI.view = x.dataset.view; render('agenda'); return; }
  if ((x = c('[data-agnav]'))) { const k = +x.dataset.agnav; if (UI.view === 'semana') UI.sel = addDays(UI.sel, 7 * k); else { const d = parse(UI.sel); UI.sel = ymd(new Date(d.getFullYear(), d.getMonth() + k, 1)); } render('agenda'); return; }
  if (c('[data-gotoday]')) { UI.sel = today(); render('agenda'); return; }
  if ((x = c('[data-d]'))) { UI.sel = x.dataset.d; render('agenda'); return; }
  if ((x = c('.sp[data-day]'))) { UI.sel = x.dataset.day; render('agenda'); return; }
  if ((x = c('[data-sview]'))) { UI.sview = x.dataset.sview; render('stats'); return; }
  // vida
  if ((x = c('[data-acc]>button'))) { const k = x.parentNode.dataset.acc; UI.open.has(k) ? UI.open.delete(k) : UI.open.add(k); x.parentNode.classList.toggle('open'); return; }
  if ((x = c('[data-det]'))) { openDetail(x.dataset.det, x.dataset.sub); return; }
  if (c('[data-back]')) { closeDetail(); return; }
  if ((x = c('[data-dtab]'))) { UI.dtab = x.dataset.dtab; renderDet(); return; }
  if (c('[data-addnote]')) { addNote(); return; }
  if ((x = c('[data-delnote]'))) { const id = x.dataset.delnote; askConfirm('Apagar esta anotação?', 'Apagar', () => { DB.notes = DB.notes.filter((n) => n.id !== id); save(); renderDet(); render('areas'); }); return; }
  if (c('[data-newtask]')) { openTask(newForm({ a: UI.det[0], s: UI.det[1] })); return; }
  if (c('[data-delpart]')) {
    const [k, s] = UI.det, used = DB.tasks.filter((t) => t.a === k && t.s === s).length;
    askConfirm(`Excluir a parte ${s}?`, 'Excluir', () => { const a = area(k); a.subs = a.subs.filter((y) => y !== s); DB.tasks.forEach((t) => { if (t.a === k && t.s === s) t.s = ''; }); DB.notes = DB.notes.filter((n) => !(n.a === k && n.s === s)); save(); closeDetail(); renderAll(); toast(used ? 'Parte excluída. As tarefas continuam na área.' : 'Parte excluída.'); });
    return;
  }
  if ((x = c('[data-addp]'))) { UI.adding = x.dataset.addp; render('areas'); const i = $('#newpart'); if (i) i.focus(); return; }
  if ((x = c('[data-okp]'))) { addPart(x.dataset.okp); return; }
  // hábitos
  if ((x = c('[data-htoday]'))) { toggleHab(x.dataset.htoday, today()); return; }
  if ((x = c('[data-hday]'))) { toggleHab(x.dataset.hid, x.dataset.hday); return; }
  if ((x = c('[data-hview]'))) { UI.hview = x.dataset.hview; UI.hoff = 0; render('habits'); return; }
  if ((x = c('[data-hnav]'))) { const k = +x.dataset.hnav; UI.hoff = k === 0 ? 0 : Math.min(0, UI.hoff + k); render('habits'); return; }
  if (c('[data-newhab]')) { UI.habForm = { id: null, n: '', type: 'good', i: 'water_drop', goal: 66 }; openSheet('habit', habSheet()); setTimeout(() => $('#hname') && $('#hname').focus(), 350); return; }
  if ((x = c('[data-edithab]'))) { const hb = DB.habits.find((y) => y.id === x.dataset.edithab); UI.habForm = { id: hb.id, n: hb.n, type: hb.type, i: hb.i, goal: hGoal(hb) }; openSheet('habit', habSheet()); return; }
  if ((x = c('[data-htype]'))) { UI.habForm.type = x.dataset.htype; $$('[data-htype]').forEach((y) => y.classList.toggle('on', y === x)); return; }
  if ((x = c('[data-hgoal]'))) { UI.habForm.goal = +x.dataset.hgoal; $('#hgoalv').textContent = UI.habForm.goal; $$('[data-hgoal]').forEach((y) => y.classList.toggle('on', y === x)); return; }
  if ((x = c('[data-hstep]'))) { UI.habForm.goal = Math.max(1, Math.min(365, UI.habForm.goal + +x.dataset.hstep)); $('#hgoalv').textContent = UI.habForm.goal; $$('[data-hgoal]').forEach((y) => y.classList.toggle('on', +y.dataset.hgoal === UI.habForm.goal)); return; }
  if ((x = c('[data-hic]'))) { UI.habForm.i = x.dataset.hic; $$('[data-hic]').forEach((y) => y.classList.toggle('on', y === x)); return; }
  if (c('[data-sh="habit"] .bd') || c('[data-closehab]')) { closeSheet('habit'); return; }
  if (c('[data-savehab]')) {
    const F = UI.habForm, n = $('#hname').value.trim(); if (!n) { toast('Dê um nome para o hábito.'); return; }
    if (F.id) Object.assign(DB.habits.find((y) => y.id === F.id), { n, type: F.type, i: F.i, goal: F.goal });
    else DB.habits.push({ id: uid(), n, type: F.type, i: F.i, goal: F.goal, created: new Date().toISOString(), days: {} });
    save(); closeSheet('habit'); render('habits'); render('home'); toast(F.id ? 'Hábito atualizado.' : 'Hábito criado.'); return;
  }
  if (c('[data-delhab]')) { const id = UI.habForm.id; askConfirm('Excluir este hábito?', 'Excluir', () => { DB.habits = DB.habits.filter((y) => y.id !== id); save(); closeSheet('habit'); render('habits'); render('home'); toast('Hábito excluído.'); }); return; }
  if (c('[data-newarea]')) { UI.areaForm = { k: null, n: '', i: 'fitness_center', c: COLORS[(DB.areas.length + 3) % COLORS.length] }; openSheet('area', areaSheet()); return; }
  if ((x = c('[data-editarea]'))) { const a = area(x.dataset.editarea); UI.areaForm = { k: a.k, n: a.n, i: a.i, c: a.c }; openSheet('area', areaSheet()); return; }
});
function addPart(k) {
  const i = $('#newpart'), v = i && i.value.trim(); const a = area(k);
  if (!v) { UI.adding = null; render('areas'); return; }
  if (a.subs.includes(v)) { toast('Essa parte já existe.'); return; }
  a.subs.push(v); UI.adding = null; save(); render('areas'); toast('Parte criada.');
}
function addNote() {
  const i = $('#newnote'), v = i && i.value.trim(); if (!v) return;
  DB.notes.push({ id: uid(), a: UI.det[0], s: UI.det[1], t: v, at: new Date().toISOString() });
  save(); UI.dtab = UI.dtab === 'tarefas' ? 'tudo' : UI.dtab; renderDet(); render('areas'); toast('Anotação salva.');
}
document.addEventListener('keydown', (e) => {
  const typing = /INPUT|TEXTAREA/.test((document.activeElement || {}).tagName || '');
  if (e.key === 'Escape' && layers.length) { e.preventDefault(); history.back(); return; }
  if (!typing && !layers.length && (e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); $('.fab').click(); }
});
APP.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  if (e.target.id === 'newpart') { e.preventDefault(); addPart(UI.adding); }
  if (e.target.id === 'ttl') { e.preventDefault(); e.target.blur(); }
  if (e.target.id === 'newnote' && !e.shiftKey && matchMedia('(pointer:fine)').matches) { e.preventDefault(); addNote(); }
});
APP.addEventListener('input', (e) => { if (e.target.id === 'newnote') { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; } });

/* dica no gráfico */
APP.addEventListener('pointermove', (e) => {
  const r = e.target.closest('[data-tip]');
  $$('.tip').forEach((tp) => { if (!r || !tp.parentNode.contains(r)) { tp.style.opacity = 0; return; } tp.textContent = r.dataset.tip; tp.style.left = r.dataset.x + '%'; tp.style.top = r.dataset.y + '%'; tp.style.opacity = 1; });
});

/* arrastar tarefa para outro dia (computador) */
let dragId = null;
APP.addEventListener('dragstart', (e) => { const p = e.target.closest && e.target.closest('.sp p[data-id]'); if (!p) return; dragId = p.dataset.id; p.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragId); } catch (_) {} });
APP.addEventListener('dragend', () => { dragId = null; $$('.dragging, .over, .drop').forEach((x) => x.classList.remove('dragging', 'over', 'drop')); });
APP.addEventListener('dragover', (e) => { if (!dragId) return; const z = e.target.closest('[data-drop]'); if (!z) return; e.preventDefault(); $$('.over, .drop').forEach((x) => x !== z && x.classList.remove('over', 'drop')); z.classList.add(z.classList.contains('sp') ? 'over' : 'drop'); });
APP.addEventListener('drop', (e) => {
  const z = e.target.closest('[data-drop]'); if (!z || !dragId) return; e.preventDefault();
  const t = DB.tasks.find((x) => x.id === dragId); if (!t) return;
  const to = z.dataset.drop; if (t.date !== to) { setDate(t, to); save(); toast(`Movida para ${fmtDate(to, true).toLowerCase()}.`); }
  dragId = null; renderAll();
});

/* atualiza ao voltar para o app (virada do dia, contagem "em 1h20") */
document.addEventListener('visibilitychange', () => { if (!document.hidden) renderAll(); });
setInterval(() => { if (!document.hidden && UI.tab === 'home') render('home'); }, 60000);

/* ---------- sincronização (Supabase) ---------- */
// Projeto Supabase do Orbe. A chave publishable pode ficar no app:
// a tabela é protegida por RLS, cada pessoa só lê e grava a própria linha.
const SUPA_URL = 'https://ydfupdkaxtuczuhxbspq.supabase.co';
const SUPA_KEY = 'sb_publishable_wmqbNAqI5GuqjzPAQyCdJg_tnGgKzKk';
const SUPA_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.99.1/dist/umd/supabase.js';
const SYNC = { client: null, user: null, state: 'off', last: null, timer: null, busy: false, again: false };
const SYNC_IC = { ok: ['cloud_done', 'Sincronizado'], sync: ['sync', 'Sincronizando…'], err: ['cloud_off', 'Não consegui sincronizar'], offline: ['cloud_off', 'Sem internet: salvo no aparelho'] };
function syncIcon() { const v = SYNC_IC[SYNC.state]; return v ? `<span class="syncic" data-syncic title="${v[1]}">${ic(v[0], 18)}</span>` : ''; }
function setSync(st) {
  SYNC.state = st;
  $$('[data-syncic]').forEach((el) => el.remove());
  const logo = $('[data-s="home"] .logo'); const btn = logo && logo.querySelector('[data-settings]');
  if (btn && SYNC_IC[st]) btn.insertAdjacentHTML('beforebegin', syncIcon());
  const last = $('[data-synclast]'); if (last && SYNC.last) last.textContent = agoTxt(SYNC.last);
}
function agoTxt(t) { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'agora' : m < 60 ? `há ${m} min` : `há ${Math.round(m / 60)} h`; }
function merge(L, Rm) {
  const out = { ...L }, del = { ...(Rm.del || {}) };
  Object.entries(L.del || {}).forEach(([k, v]) => { if (!del[k] || del[k] < v) del[k] = v; });
  out.del = del;
  COLS.forEach(([c, id]) => {
    const m = new Map(), order = [];
    const add = (x) => { const k = x[id], prev = m.get(k); if (!prev) { order.push(k); m.set(k, x); } else if ((x.u || 0) > (prev.u || 0)) m.set(k, x); };
    (L[c] || []).forEach(add); (Rm[c] || []).forEach(add);
    out[c] = order.map((k) => m.get(k)).filter((x) => !(del[x[id]] && del[x[id]] >= (x.u || 0)));
  });
  if ((Rm.nameU || 0) > (L.nameU || 0)) { out.name = Rm.name; out.nameU = Rm.nameU; }
  return out;
}
function scheduleSync() { if (!SYNC.user) return; clearTimeout(SYNC.timer); SYNC.timer = setTimeout(sync, 1200); }
async function sync(manual) {
  if (!SYNC.client || !SYNC.user) return;
  if (SYNC.busy) { SYNC.again = true; return; }
  SYNC.busy = true; setSync('sync');
  try {
    const { data, error } = await SYNC.client.from('orbe_data').select('data').eq('user_id', SYNC.user.id).maybeSingle();
    if (error) throw error;
    const remote = data && data.data, merged = remote ? merge(DB, remote) : DB;
    if (JSON.stringify(merged) !== JSON.stringify(DB)) { DB = merged; localStorage.setItem(KEY, JSON.stringify(DB)); SNAP = snapshot(); renderAll(); }
    if (!remote || JSON.stringify(remote) !== JSON.stringify(merged)) {
      const { error: e2 } = await SYNC.client.from('orbe_data').upsert({ user_id: SYNC.user.id, data: merged, updated_at: new Date().toISOString() });
      if (e2) throw e2;
    }
    SYNC.last = Date.now(); setSync('ok'); if (manual) toast('Sincronizado.');
  } catch (e) {
    console.warn('Orbe sync', e); setSync(navigator.onLine ? 'err' : 'offline');
    if (manual) toast(navigator.onLine ? 'Não consegui sincronizar. Tente de novo.' : 'Sem internet. Salvo no aparelho.');
  }
  SYNC.busy = false; if (SYNC.again) { SYNC.again = false; sync(); }
}
function syncSection() {
  if (!SUPA_URL || !SUPA_KEY) return '<div class="set-row"><span>Os dados ficam</span><small>só neste aparelho</small></div>';
  if (!SYNC.client) return '<div class="set-row"><span>Sincronização</span><small>sem conexão com o servidor</small></div>';
  if (SYNC.user) return `<div class="lbl">Sincronização</div><div class="set-row"><span>Conectado como</span><small>${esc(SYNC.user.email)}</small></div><div class="set-row"><span>Última sincronização</span><small data-synclast>${SYNC.last ? agoTxt(SYNC.last) : '–'}</small></div><div class="save-row"><button class="del" data-syncnow>${ic('sync', 18)}Sincronizar agora</button><button class="del" data-logout>${ic('logout', 18)}Sair</button></div>`;
  return `<div class="lbl">Sincronizar celular e computador</div><p class="hint">Entre com o mesmo e-mail e senha nos dois aparelhos para ver as mesmas tarefas. O que já está aqui é mantido.</p>
  <input class="ttl in2" id="semail" type="email" placeholder="E-mail" autocomplete="email" inputmode="email">
  <div class="pw"><input class="ttl in2" id="spass" type="password" placeholder="Senha (mínimo 6 caracteres)" autocomplete="current-password"><button type="button" class="eye" data-eye aria-label="Mostrar senha" aria-pressed="false">${ic('visibility', 22)}</button></div>
  <div class="save-row"><button class="del" data-signup>Criar conta</button><button class="save" data-login>Entrar</button></div>`;
}
function refreshSet() { const sh = $('[data-sh="set"]'); if (!sh.classList.contains('open')) return; const n = $('#uname'); const v = n ? n.value : DB.name; sh.innerHTML = settingsSheet(); if ($('#uname')) $('#uname').value = v; }
function authMsg(e) {
  const m = (e && e.message) || '';
  if (/invalid login/i.test(m)) return 'E-mail ou senha incorretos.';
  if (/not confirmed/i.test(m)) return 'Confirme o e-mail pelo link que chegou e tente de novo.';
  if (/already registered|already been registered/i.test(m)) return 'Já existe conta com esse e-mail. Toque em Entrar.';
  if (/password/i.test(m) && /6/.test(m)) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (/email/i.test(m) && /invalid/i.test(m)) return 'E-mail inválido.';
  return 'Não deu certo: ' + m;
}
async function auth(kind) {
  const email = ($('#semail').value || '').trim(), password = $('#spass').value || '';
  if (!email || !password) { toast('Preencha e-mail e senha.'); return; }
  try {
    const fn = kind === 'signup' ? SYNC.client.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname } }) : SYNC.client.auth.signInWithPassword({ email, password });
    const { data, error } = await fn;
    if (error) { toast(authMsg(error)); return; }
    if (kind === 'signup' && !data.session) { toast('Conta criada. Confirme pelo link no e-mail e depois toque em Entrar.'); return; }
    toast('Conectado. Sincronizando…');
  } catch (e) { toast(navigator.onLine ? authMsg(e) : 'Sem internet.'); }
}
function initSync() {
  if (!SUPA_URL || !SUPA_KEY || !window.supabase) return;
  SYNC.client = window.supabase.createClient(SUPA_URL, SUPA_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'orbe.auth' } });
  SYNC.client.auth.onAuthStateChange((ev, session) => {
    SYNC.user = session ? session.user : null;
    setSync(SYNC.user ? SYNC.state === 'off' ? 'sync' : SYNC.state : 'off');
    if (SYNC.user && (ev === 'SIGNED_IN' || ev === 'INITIAL_SESSION')) setTimeout(sync, 0);
    refreshSet();
  });
}
if (SUPA_URL && SUPA_KEY) {
  const sc = document.createElement('script'); sc.src = SUPA_JS; sc.async = true; sc.onload = initSync; sc.onerror = () => setSync(navigator.onLine ? 'err' : 'offline'); document.head.appendChild(sc);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) sync(); });
  window.addEventListener('online', () => sync());
  setInterval(() => { if (!document.hidden) sync(); }, 60000);
}

renderAll();
restoreUI();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
