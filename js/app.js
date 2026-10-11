/* 「把自己收回来」V0.1 —— 纯前端，本地保存，无后端 */
(function () {
  "use strict";
  var C = window.SHOUHUI_CONTENT;
  var KEY = "shouhui.v1";            // 本应用数据
  var SCHEMA = 1;                    // 数据结构版本号；以后升级只增不删字段
  var NICK_KEY = "rk.v1.nickname";   // 与用户其它测评共用的昵称（同域共享）
  var app = document.getElementById("app");
  var tabbar = document.getElementById("tabbar");
  var CARD = {}; C.cards.forEach(function (c) { CARD[c.id] = c; });

  /* ---------------- 工具 ---------------- */
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dstr(t) { var d = new Date(t); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function today() { return dstr(Date.now()); }
  function dayNum(s) { var p = String(s).split("-"); return Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000); }
  function fromDayNum(n) { var d = new Date(n * 86400000); return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()); }
  function cnDate(s) { var p = String(s).split("-"); return (+p[1]) + "月" + (+p[2]) + "日"; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function cardTitle(c, inList) { return inList && c.listTitle ? c.listTitle : c.title; }

  /* ---------------- 存储（带版本号，向后兼容） ---------------- */
  function blank() {
    return { schema: SCHEMA, firstUse: null, nickname: "", draft: null, assessments: [], draws: [], currentDrawId: null };
  }
  function migrate(d) {
    if (!d || typeof d !== "object" || Array.isArray(d)) d = blank();
    var b = blank(), k;
    for (k in b) if (!(k in d)) d[k] = b[k];               // 补齐新字段，保留未知字段
    if (typeof d.schema !== "number" || d.schema < SCHEMA) d.schema = SCHEMA;  // 不降级更高版本写入的数据
    if (!Array.isArray(d.assessments)) d.assessments = [];
    if (!Array.isArray(d.draws)) d.draws = [];
    d.assessments = d.assessments.filter(function (a) { return a && a.scores && Array.isArray(a.top); });
    d.draws = d.draws.filter(function (x) { return x && CARD[x.cardId] && /^\d{4}-\d{2}-\d{2}$/.test(x.date || ""); });
    if (d.draft && !(Array.isArray(d.draft.answers) && d.draft.answers.length === C.questions.length)) d.draft = null;
    return d;
  }
  var memStore = null, storeOk = true;
  function load() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { storeOk = false; raw = memStore; }
    var d = null;
    try { d = raw ? JSON.parse(raw) : null; } catch (e) { d = null; }
    return migrate(d);
  }
  var S = load();
  function save() {
    var s = JSON.stringify(S);
    memStore = s;
    try { localStorage.setItem(KEY, s); storeOk = true; } catch (e) { storeOk = false; }
  }
  function ensureFirstUse() { if (!S.firstUse) { S.firstUse = today(); save(); } }
  ensureFirstUse();
  window.addEventListener("storage", function (e) { if (e.key === KEY) { S = load(); route(); } });

  /* ---------------- 昵称 ---------------- */
  function cleanNick(s) {
    s = String(s == null ? "" : s).replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202f\u2060-\u206f\ufeff]/g, " ");
    s = s.replace(/[<>&"'`\\]/g, "").replace(/\s+/g, " ").trim();
    var a = Array.from(s); if (a.length > 12) a = a.slice(0, 12);
    return a.join("").trim();
  }
  function getNick() {
    var v = S.nickname;
    if (!v) { try { v = localStorage.getItem(NICK_KEY) || ""; } catch (e) { v = ""; } }
    return cleanNick(v);
  }
  function setNick(n) {
    n = cleanNick(n); S.nickname = n; save();
    try { localStorage.setItem(NICK_KEY, n); } catch (e) {}
    return n;
  }

  /* ---------------- 计分：维度得分 =（4题平均分 − 1）÷ 4 × 100，取整 ---------------- */
  function scoreAnswers(ans) {
    var r = {};
    C.dimOrder.forEach(function (k) {
      var sum = 0, n = 0;
      C.questions.forEach(function (q, i) { if (q.dim === k) { sum += +ans[i]; n++; } });
      r[k] = Math.round(((sum / n) - 1) / 4 * 100);
    });
    return r;
  }
  function rankDims(sc) {
    return C.dimOrder.slice().sort(function (a, b) { return (sc[b] - sc[a]) || (C.dimOrder.indexOf(a) - C.dimOrder.indexOf(b)); });
  }
  function band(v) { for (var i = 0; i < C.bands.length; i++) if (v >= C.bands[i].min && v <= C.bands[i].max) return C.bands[i].key; return "steady"; }
  function latestAssessment() { return S.assessments.length ? S.assessments[S.assessments.length - 1] : null; }

  /* ---------------- 选卡 ---------------- */
  function recentShown() {          // 7 天内（含今天）出现过的卡 → 最近一次出现时间
    var t = dayNum(today()), m = {};
    S.draws.forEach(function (d) {
      var g = t - dayNum(d.date);
      if (g >= 0 && g < 7) m[d.cardId] = Math.max(m[d.cardId] || 0, d.at || 0);
    });
    return m;
  }
  function pickCard(dim, rng) {
    rng = rng || Math.random;
    var pool = C.cards.filter(function (c) { return c.dim === dim; });
    var used = recentShown();
    var avail = pool.filter(function (c) { return !(c.id in used); });
    if (!avail.length) {           // 这一维 6 张 7 天内都出现过：取最久之前出现的那张
      pool.sort(function (a, b) { return used[a.id] - used[b.id]; });
      return pool[0];
    }
    return avail[Math.floor(rng() * avail.length)];
  }
  function pickDim(rng) {          // 「随便给我一张」：做过测评 → 60% 第一 / 30% 第二 / 10% 其他
    rng = rng || Math.random;
    var a = latestAssessment(), r = rng();
    if (!a) return C.dimOrder[Math.min(3, Math.floor(r * 4))];
    if (r < 0.6) return a.top[0];
    if (r < 0.9) return a.top[1];
    var others = C.dimOrder.filter(function (k) { return a.top.indexOf(k) < 0; });
    return others[Math.min(others.length - 1, Math.floor((r - 0.9) / 0.1 * others.length))];
  }
  function newDraw(dim, via) {
    ensureFirstUse();
    var d = dim || pickDim();
    var c = pickCard(d);
    var rec = { id: uid(), at: Date.now(), date: today(), cardId: c.id, dim: c.dim, via: via || (dim ? "state" : "random"),
      reaction: null, note: "", boxes: null, done: false, doneAt: null };
    S.draws.push(rec); S.currentDrawId = rec.id; save();
    justDone = null;
    return rec;
  }
  function findDraw(id) { for (var i = S.draws.length - 1; i >= 0; i--) if (S.draws[i].id === id) return S.draws[i]; return null; }

  /* ---------------- 7 天小结 ---------------- */
  function weekly() {
    var t = dayNum(today()), first = S.firstUse ? dayNum(S.firstUse) : t;
    S.draws.forEach(function (d) { first = Math.min(first, dayNum(d.date)); });
    S.assessments.forEach(function (a) { if (a.date) first = Math.min(first, dayNum(a.date)); });
    var span = t - first + 1;
    if (span < 7) return { ok: false, reason: "days", days: Math.max(1, span) };
    var from = t - 6;
    var list = S.draws.filter(function (d) { var n = dayNum(d.date); return d.done && n >= from && n <= t; });
    if (!list.length) return { ok: false, reason: "empty" };
    function top(keyFn) {
      var cnt = {}, last = {}, best = null;
      list.forEach(function (d) { var k = keyFn(d); cnt[k] = (cnt[k] || 0) + 1; last[k] = Math.max(last[k] || 0, d.doneAt || d.at || 0); });
      Object.keys(cnt).forEach(function (k) { if (!best || cnt[k] > cnt[best] || (cnt[k] === cnt[best] && last[k] > last[best])) best = k; });
      return best;
    }
    var cardId = top(function (d) { return d.cardId; }), dim = top(function (d) { return d.dim; });
    var noted = S.draws.filter(function (d) { var n = dayNum(d.date); return n >= from && n <= t && d.note && d.note.trim(); })
      .sort(function (a, b) { return (b.doneAt || b.at) - (a.doneAt || a.at); })[0];
    return { ok: true, from: fromDayNum(from), to: fromDayNum(t), card: CARD[cardId], dim: dim, n: list.length,
      note: noted ? noted.note.trim() : "", next: C.dims[dim].nextWeek };
  }

  /* ---------------- 视图辅助 ---------------- */
  var ICON = {
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6.5 18.5 12 13 17.5"/></svg>',
    save: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11M7 10.5l5 5 5-5M5 19.5h14"/></svg>',
    redo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12a7 7 0 1 0 2.1-5"/><path d="M5 4.5V9h4.5"/></svg>',
    seal: '<svg class="seal" viewBox="0 0 40 40" aria-hidden="true"><rect x="3" y="3" width="34" height="34" rx="4"/><text x="20" y="27.6" text-anchor="middle">收</text></svg>'
  };
  function stateButtons() {
    return '<div class="states">' + C.ui.states.map(function (s, i) {
      return '<button type="button" class="state' + (s.dim ? "" : " rand") + '" data-state="' + (s.dim || "") + '"><span class="state-no">' +
        (s.dim ? ["壹", "贰", "叁", "肆"][i] : "随") + '</span><span class="state-t">' + esc(s.label) + "</span>" + ICON.arrow + "</button>";
    }).join("") + "</div>";
  }
  function bindStates(root) {
    Array.prototype.forEach.call(root.querySelectorAll("[data-state]"), function (b) {
      b.addEventListener("click", function () {
        var dim = b.getAttribute("data-state") || null;
        newDraw(dim, dim ? "state" : "random");
        go("#/card");
      });
    });
  }
  function todayDoneCount() { var t = today(); return S.draws.filter(function (d) { return d.done && d.date === t; }).length; }
  function credit() { return '<p class="credit">' + esc(C.app.credit) + "</p>"; }

  var toastTimer = null;
  function toast(msg, ms) {
    var t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer);
    if (ms !== 0) toastTimer = setTimeout(function () { t.classList.remove("show"); }, ms || 2200);
  }
  function hideToast() { var t = document.querySelector(".toast"); if (t) t.classList.remove("show"); }

  /* ---------------- 首页 ---------------- */
  function viewHome() {
    var a = latestAssessment(), dr = S.draft, n = todayDoneCount();
    var test;
    if (dr) {
      var answered = dr.answers.filter(function (x) { return x > 0; }).length;
      test = '<p class="lead">上次答到第 ' + (Math.min(dr.idx, 15) + 1) + " / 16 题，已答 " + answered + ' 题。</p>' +
        '<div class="row"><a class="btn primary" href="#/quiz" data-act="continue">继续答题</a><button type="button" class="btn ghost" data-act="restart">重新开始</button></div>';
    } else if (!a) {
      test = '<p class="lead">16 个小问题，大约 3 分钟，看看自己最近最容易卡在哪里。</p>' +
        '<div class="row"><a class="btn primary" href="#/quiz" data-act="start">开始测评</a></div>';
    } else {
      test = '<p class="lead">' + cnDate(a.date) + " 的测评里，你更值得留意的是<b>" + esc(C.dims[a.top[0]].name) + "</b>和<b>" + esc(C.dims[a.top[1]].name) + "</b>。</p>" +
        '<div class="row"><a class="btn" href="#/result/' + esc(a.id) + '">查看结果</a><button type="button" class="btn ghost" data-act="restart">重新测试</button></div>';
    }
    app.innerHTML =
      '<header class="brand">' + ICON.seal + "<h1>" + esc(C.app.name) + '</h1><p class="sub">' + esc(C.app.subtitle) + "</p></header>" +
      '<section class="panel" aria-labelledby="h-test"><h2 id="h-test" class="sec-h"><span>一</span>开始测评</h2>' + test + "</section>" +
      '<section class="panel" aria-labelledby="h-today"><h2 id="h-today" class="sec-h"><span>二</span>今日觉察</h2>' +
      '<p class="ask">' + esc(C.ui.homeAsk) + "</p>" + stateButtons() +
      (n ? '<p class="muted small">今天已经完成 ' + n + " 次觉察。</p>" : "") + "</section>" + credit();
    bindStates(app);
    var rs = app.querySelectorAll('[data-act="restart"]');
    Array.prototype.forEach.call(rs, function (b) { b.addEventListener("click", function () { S.draft = null; save(); go("#/quiz"); }); });
  }

  /* ---------------- 测评 ---------------- */
  var quizLock = false;
  function viewQuiz() {
    if (!S.draft) return viewNick();
    var dr = S.draft, i = Math.max(0, Math.min(15, dr.idx | 0)), q = C.questions[i], cur = dr.answers[i];
    var pct = Math.round((i) / 16 * 100);
    app.innerHTML =
      '<div class="quiz">' +
      '<div class="quiz-top"><button type="button" class="icon-btn" data-act="prev" aria-label="上一题"' + (i === 0 ? " disabled" : "") + ">" + ICON.back + "<span>上一题</span></button>" +
      '<span class="count" aria-live="polite">' + (i + 1) + " / 16</span>" +
      '<a class="icon-btn" href="#/" data-act="exit" aria-label="先离开，下次接着答">' + ICON.close + "<span>先离开</span></a></div>" +
      '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="16" aria-valuenow="' + i + '"><i style="width:' + pct + '%"></i></div>' +
      '<p class="q-no">第 ' + (i + 1) + " 题</p>" +
      '<h1 class="q-text">' + esc(q.text) + "</h1>" +
      '<div class="opts" role="radiogroup" aria-label="选择最接近你最近状态的一项">' + C.options.map(function (o, k) {
        var v = k + 1;
        return '<button type="button" role="radio" class="opt' + (cur === v ? " on" : "") + '" aria-checked="' + (cur === v) + '" data-v="' + v + '"><i class="dotv"></i><span>' + esc(o) + "</span></button>";
      }).join("") + "</div>" +
      '<p class="muted small center">选一个最接近你最近状态的。中途离开，下次可以接着答。</p></div>';
    quizLock = false;
    Array.prototype.forEach.call(app.querySelectorAll(".opt"), function (b) {
      b.addEventListener("click", function () {
        if (quizLock) return; quizLock = true;
        var v = +b.getAttribute("data-v");
        S.draft.answers[i] = v; save();
        Array.prototype.forEach.call(app.querySelectorAll(".opt"), function (x) { x.classList.toggle("on", x === b); x.setAttribute("aria-checked", x === b); });
        setTimeout(function () {
          if (!S.draft) return;
          if (i < 15) { S.draft.idx = i + 1; save(); viewQuiz(); window.scrollTo(0, 0); }
          else finishQuiz();
        }, 200);
      });
    });
    app.querySelector('[data-act="prev"]').addEventListener("click", function () { if (i > 0) { S.draft.idx = i - 1; save(); viewQuiz(); } });
  }
  function viewNick() {
    var nick = getNick();
    app.innerHTML =
      '<div class="quiz nick">' +
      '<div class="quiz-top"><a class="icon-btn" href="#/" aria-label="返回首页">' + ICON.back + "<span>返回</span></a><span></span><span></span></div>" +
      '<h1 class="page-h">开始之前</h1>' +
      '<p class="lead">16 个小问题，没有对错。按你<b>最近一段时间</b>的真实状态选就好。</p>' +
      '<label class="field"><span class="field-t">先告诉我怎么称呼你</span>' +
      '<input id="nick" type="text" maxlength="24" autocomplete="nickname" enterkeyhint="go" placeholder="你的昵称（1–12 个字）" value="' + esc(nick) + '"></label>' +
      '<p class="hint" id="nick-hint" role="status"></p>' +
      '<p class="muted small">昵称会写在你的结果和保存的图片上，只存在这台设备里，不会上传。</p>' +
      '<div class="row"><button type="button" class="btn primary wide" id="nick-go">开始测评</button></div></div>';
    var inp = app.querySelector("#nick"), btn = app.querySelector("#nick-go"), hint = app.querySelector("#nick-hint");
    function check() {
      var raw = inp.value, v = cleanNick(raw), len = Array.from(raw.trim()).length;
      var h = "";
      if (!v) h = raw && !/\S/.test(raw) ? "昵称不能只有空格。" : "";
      else if (len > 12) h = "最多 12 个字，多出来的会被省略。";
      hint.textContent = h; btn.disabled = !v;
      return v;
    }
    inp.addEventListener("input", check);
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); btn.click(); } });
    btn.addEventListener("click", function () {
      var v = check();
      if (!v) { hint.textContent = "先填一个昵称（1–12 个字）。"; inp.focus(); return; }
      setNick(v); ensureFirstUse();
      S.draft = { nick: v, answers: C.questions.map(function () { return 0; }), idx: 0, startedAt: Date.now() };
      save(); viewQuiz(); window.scrollTo(0, 0);
    });
    check();
  }
  function finishQuiz() {
    var dr = S.draft; if (!dr) return;
    if (dr.answers.some(function (x) { return !(x >= 1 && x <= 5); })) {      // 理论上不会发生：跳到第一道没答的题
      dr.idx = dr.answers.findIndex(function (x) { return !(x >= 1 && x <= 5); }); save(); return viewQuiz();
    }
    var sc = scoreAnswers(dr.answers), rk = rankDims(sc);
    var a = { id: uid(), at: Date.now(), date: today(), nick: dr.nick || getNick(), answers: dr.answers.slice(), scores: sc, top: rk.slice(0, 2), schema: SCHEMA };
    S.assessments.push(a); S.draft = null; save();
    go("#/result/" + a.id);
  }

  /* ---------------- 结果 ---------------- */
  function bars(a) {
    return '<div class="bars">' + C.dimOrder.map(function (k) {
      var v = a.scores[k], hi = a.top.indexOf(k);
      return '<div class="bar' + (hi >= 0 ? " hi" : "") + '"><span class="bar-n">' + esc(C.dims[k].name) + '</span><span class="bar-t"><i style="width:' + Math.max(2, v) + '%"></i></span><span class="bar-v">' + v + "</span></div>";
    }).join("") + "</div>";
  }
  function viewResult(id) {
    var a = null;
    if (id) S.assessments.forEach(function (x) { if (x.id === id) a = x; });
    if (!a) a = latestAssessment();
    if (!a) {
      app.innerHTML = '<div class="empty">' + ICON.seal + '<h1 class="page-h">还没有测评结果</h1><p class="lead">花 3 分钟答 16 个小问题，就能看到自己最近最容易卡住的地方。</p><div class="row center"><a class="btn primary" href="#/quiz">开始测评</a></div></div>';
      return;
    }
    var isLatest = a === latestAssessment();
    var t1 = a.top[0], t2 = a.top[1];
    app.innerHTML =
      '<article class="result">' +
      '<p class="eyebrow">' + esc(a.nick || "你") + " · " + cnDate(a.date) + (isLatest ? "" : " 的记录") + "</p>" +
      '<h1 class="page-h">' + esc(C.ui.resultTitle) + "</h1>" + bars(a) +
      (band(a.scores[t1]) === "steady" ? '<p class="muted">' + esc(C.ui.resultAllSteady) + "</p>" : "") +
      '<p class="lead">' + esc(C.ui.resultTopLead) + "</p>" +
      '<div class="tops">' + [t1, t2].map(function (k, i) {
        return '<div class="top"><p class="top-h"><span class="num">' + (i ? "②" : "①") + "</span>" + esc(C.dims[k].name) + ' <b>' + a.scores[k] + "</b></p><p>" + esc(C.dims[k].desc) + "</p></div>";
      }).join("") + "</div>" +
      '<div class="practice"><p>' + esc(C.ui.resultPracticeLead) + "</p><p class=\"practice-q\">“" + esc(C.dims[t1].practice) + "”</p></div>" +
      '<div class="row col"><button type="button" class="btn primary wide" data-act="begin">' + esc(C.ui.resultCta) + "</button>" +
      '<div class="row two"><button type="button" class="btn" data-act="export">' + ICON.save + '保存图片</button><button type="button" class="btn ghost" data-act="retest">' + ICON.redo + "重新测试</button></div></div>" +
      '<p class="muted small center">结果只保存在这台设备上，可以在「我的觉察」里看历史记录。</p>' +
      "</article>";
    app.querySelector('[data-act="begin"]').addEventListener("click", function () { newDraw(t1, "recommend"); go("#/card"); });
    app.querySelector('[data-act="retest"]').addEventListener("click", function () { S.draft = null; save(); go("#/quiz"); });
    app.querySelector('[data-act="export"]').addEventListener("click", function () { exportResult(a); });
  }

  /* ---------------- 保存图片 ---------------- */
  var exporting = false;
  function previewMode() {
    var ua = navigator.userAgent || "";
    var ios = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    var standalone = navigator.standalone === true || (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches);
    var wechat = /MicroMessenger/i.test(ua);
    return ios || standalone || wechat;
  }
  function exportResult(a) {
    if (exporting) return; exporting = true;
    toast("正在生成图片…", 0);
    window.ShouhuiExport.render(a, C).then(function (blob) {
      exporting = false; hideToast();
      var url = URL.createObjectURL(blob);
      var name = ((a.nick ? a.nick + "-" : "") + "把自己收回来-" + a.date.replace(/-/g, "") + ".png").replace(/\s+/g, "");
      if (previewMode()) return showPreview(url);
      var l = document.createElement("a"); l.href = url; l.download = name; l.rel = "noopener";
      document.body.appendChild(l); l.click(); document.body.removeChild(l);
      toast("图片已开始下载。");
      setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    }).catch(function () { exporting = false; toast("这台设备没能生成图片，可以直接截屏保存。", 3200); });
  }
  function showPreview(url) {
    var ov = document.createElement("div");
    ov.className = "overlay"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "保存图片");
    ov.innerHTML = '<div class="sheet"><p class="sheet-tip"><b>长按下面的图片</b>，选择「保存到相册」或「保存图片」。</p>' +
      '<div class="sheet-img"><img src="' + url + '" alt="把自己收回来 · 结果长图"></div>' +
      '<button type="button" class="btn primary wide" data-close>关闭</button></div>';
    document.body.appendChild(ov); document.body.classList.add("noscroll");
    function close() { if (!ov.parentNode) return; ov.parentNode.removeChild(ov); document.body.classList.remove("noscroll"); URL.revokeObjectURL(url); document.removeEventListener("keydown", onKey); }
    function onKey(e) { if (e.key === "Escape") close(); }
    ov.querySelector("[data-close]").addEventListener("click", close);
    ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    document.addEventListener("keydown", onKey);
    ov.querySelector("[data-close]").focus();
  }

  /* ---------------- 今日卡牌 ---------------- */
  var justDone = null;
  function cardHtml(c) {
    var boxes = c.boxes ? '<div class="boxes">' + C.ui.taskBoxes.map(function (b) {
      return '<label class="box"><span>' + esc(b.label) + '</span><textarea rows="2" maxlength="80" data-box="' + b.key + '" placeholder="写在这里"></textarea></label>';
    }).join("") + "</div>" : "";
    return '<article class="paper"><i class="corner tl"></i><i class="corner br"></i>' +
      '<p class="paper-dim">' + esc(C.dims[c.dim].name) + "</p>" +
      '<h1 class="paper-title">' + esc(c.title) + "</h1>" +
      '<div class="paper-sec"><h2>今日提醒</h2><p class="remind">' + esc(c.remind) + "</p></div>" +
      '<div class="paper-sec"><h2>问问自己</h2><p>' + esc(c.ask) + "</p></div>" +
      '<div class="paper-sec"><h2>今天试一次</h2><p>' + esc(c.try) + "</p>" + boxes + "</div></article>";
  }
  function viewCard() {
    var d = S.currentDrawId ? findDraw(S.currentDrawId) : null;
    if (justDone) {
      var jd = findDraw(justDone), jc = jd && CARD[jd.cardId];
      app.innerHTML = '<div class="done">' + ICON.seal + '<p class="done-line">' + esc(C.ui.cardDone) + "</p>" +
        (jc ? '<p class="muted center">「' + esc(jc.title) + "」已记在「我的觉察」里。</p>" : "") +
        '<div class="row center two"><a class="btn" href="#/">回首页</a><a class="btn primary" href="#/journal">去我的觉察</a></div></div>';
      return;
    }
    if (!d || d.done || d.date !== today()) {
      var n = todayDoneCount();
      app.innerHTML = '<p class="eyebrow">今日卡牌</p><h1 class="page-h">' + esc(C.ui.homeAsk) + "</h1>" +
        '<p class="lead">' + (n ? "今天已经完成 " + n + " 次觉察。想再看看，也可以再选一次。" : "选一个最接近你此刻的状态，会出现一张卡。") + "</p>" +
        stateButtons() + credit();
      bindStates(app);
      return;
    }
    var c = CARD[d.cardId];
    app.innerHTML =
      '<p class="eyebrow">今日卡牌 · ' + cnDate(d.date) + "</p>" + cardHtml(c) +
      '<section class="react" aria-label="读完的感觉"><p class="react-h">读完，你的感觉是？</p><div class="chips" role="radiogroup">' +
      C.ui.reactions.map(function (r) { return '<button type="button" role="radio" class="chip' + (d.reaction === r.key ? " on" : "") + '" aria-checked="' + (d.reaction === r.key) + '" data-r="' + r.key + '">' + esc(r.label) + "</button>"; }).join("") +
      '</div><textarea class="note" rows="2" maxlength="140" placeholder="' + esc(C.ui.notePlaceholder) + '" aria-label="写一句我刚刚意识到的事（可不写）"></textarea>' +
      '<p class="muted small">都可以不填。</p></section>' +
      '<div class="row"><button type="button" class="btn primary wide" data-act="try">' + esc(C.ui.cardCta) + "</button></div>";
    var note = app.querySelector(".note"); note.value = d.note || "";
    note.addEventListener("input", function () { d.note = note.value.slice(0, 140); save(); });
    Array.prototype.forEach.call(app.querySelectorAll("[data-box]"), function (t) {
      var k = t.getAttribute("data-box"); t.value = (d.boxes && d.boxes[k]) || "";
      t.addEventListener("input", function () { d.boxes = d.boxes || { mine: "", theirs: "", ours: "" }; d.boxes[k] = t.value.slice(0, 80); save(); });
    });
    Array.prototype.forEach.call(app.querySelectorAll(".chip"), function (b) {
      b.addEventListener("click", function () {
        var r = b.getAttribute("data-r"); d.reaction = d.reaction === r ? null : r; save();
        Array.prototype.forEach.call(app.querySelectorAll(".chip"), function (x) { var on = x.getAttribute("data-r") === d.reaction; x.classList.toggle("on", on); x.setAttribute("aria-checked", on); });
      });
    });
    app.querySelector('[data-act="try"]').addEventListener("click", function () {
      d.note = note.value.trim().slice(0, 140); d.done = true; d.doneAt = Date.now(); S.currentDrawId = null; save();
      justDone = d.id; viewCard(); window.scrollTo(0, 0);
    });
  }

  /* ---------------- 我的觉察 ---------------- */
  function reactionLabel(k) { var r = C.ui.reactions.filter(function (x) { return x.key === k; })[0]; return r ? r.label : ""; }
  function viewJournal() {
    var w = weekly();
    var week;
    if (w.ok) {
      week = '<div class="week"><p class="week-range">' + cnDate(w.from) + " – " + cnDate(w.to) + "</p>" +
        "<p>" + esc(C.ui.weekFound) + "<b>" + esc(cardTitle(w.card, true)) + "</b>。<span class=\"muted\">（" + esc(C.dims[w.dim].name) + "）</span></p>" +
        "<p>" + esc(C.ui.weekDone.replace("{n}", w.n)) + "</p>" +
        (w.note ? "<p>" + esc(C.ui.weekNote) + "“" + esc(w.note) + "”</p>" : "") +
        '<p class="week-next">' + esc(C.ui.weekNext) + esc(w.next) + "</p></div>";
    } else {
      week = '<p class="soft">' + esc(w.reason === "empty" ? C.ui.weekNoRecord : C.ui.weekNotEnough) +
        (w.reason === "days" ? '<span class="muted">（已经陪自己 ' + w.days + " / 7 天）</span>" : "") + "</p>";
    }
    var recs = S.draws.filter(function (d) { return d.done || (d.note && d.note.trim()) || d.reaction; })
      .sort(function (a, b) { return (b.doneAt || b.at) - (a.doneAt || a.at); });
    var list = recs.length ? '<ul class="records">' + recs.map(function (d) {
      var c = CARD[d.cardId], bx = "";
      if (d.boxes) bx = C.ui.taskBoxes.filter(function (b) { return d.boxes[b.key] && d.boxes[b.key].trim(); })
        .map(function (b) { return '<span class="bx"><em>' + esc(b.label) + "</em>" + esc(d.boxes[b.key].trim()) + "</span>"; }).join("");
      return '<li><p class="rec-h"><span class="rec-d">' + cnDate(d.date) + '</span><span class="sep">｜</span>' + esc(cardTitle(c, true)) +
        (d.reaction ? '<span class="tag">' + esc(reactionLabel(d.reaction)) + "</span>" : "") + "</p>" +
        (d.note && d.note.trim() ? '<p class="rec-q">“' + esc(d.note.trim()) + "”</p>" : "") +
        (bx ? '<p class="rec-bx">' + bx + "</p>" : "") + "</li>";
    }).join("") + "</ul>"
      : '<div class="soft">还没有觉察记录。回到首页，选一个今天的状态，抽一张卡试试。<div class="row"><a class="btn" href="#/card">去抽一张</a></div></div>';
    var as = S.assessments.slice().reverse(), a = as[0];
    var tests = a ? '<div class="last"><p class="last-h">最近一次 · ' + cnDate(a.date) + (a.nick ? " · " + esc(a.nick) : "") + "</p>" + bars(a) +
      '<div class="row two"><a class="btn" href="#/result/' + esc(a.id) + '">查看结果</a><a class="btn ghost" href="#/quiz" data-act="retest">重新测试</a></div></div>' +
      (as.length > 1 ? '<details class="hist"><summary>历史测评（' + as.length + "）</summary><ul>" + as.map(function (x) {
        return '<li><a href="#/result/' + esc(x.id) + '"><span>' + cnDate(x.date) + " " + pad(new Date(x.at).getHours()) + ":" + pad(new Date(x.at).getMinutes()) + "</span><span>" + esc(C.dims[x.top[0]].name) + " " + x.scores[x.top[0]] + " · " + esc(C.dims[x.top[1]].name) + " " + x.scores[x.top[1]] + "</span></a></li>";
      }).join("") + "</ul></details>" : "")
      : '<div class="soft">还没有做过测评。先花 3 分钟，看看自己最近最容易卡在哪里。<div class="row"><a class="btn primary" href="#/quiz">开始测评</a></div></div>';
    app.innerHTML = '<h1 class="page-h">我的觉察</h1>' +
      '<section class="panel" aria-labelledby="h-week"><h2 id="h-week" class="sec-h"><span>一</span>7 天小结</h2>' + week + "</section>" +
      '<section class="panel" aria-labelledby="h-rec"><h2 id="h-rec" class="sec-h"><span>二</span>觉察记录</h2>' + list + "</section>" +
      '<section class="panel" aria-labelledby="h-test2"><h2 id="h-test2" class="sec-h"><span>三</span>我的测评</h2>' + tests + "</section>" +
      (storeOk ? "" : '<p class="muted small">这台设备暂时存不下记录（可能是无痕模式），关掉页面后会丢失。</p>');
    var rt = app.querySelector('[data-act="retest"]');
    if (rt) rt.addEventListener("click", function (e) { e.preventDefault(); S.draft = null; save(); go("#/quiz"); });
  }

  /* ---------------- 路由 ---------------- */
  function go(h) { if (location.hash === h) route(); else location.hash = h; }
  var lastView = null;
  function route() {
    var h = (location.hash || "#/").replace(/^#/, ""), parts = h.split("/").filter(Boolean), v = parts[0] || "home";
    if (v !== "card") justDone = null;
    var tab = v;
    try {
      if (v === "quiz") viewQuiz();
      else if (v === "result") { viewResult(parts[1] ? decodeURIComponent(parts[1]) : null); tab = "home"; }
      else if (v === "card") viewCard();
      else if (v === "journal") viewJournal();
      else { tab = "home"; viewHome(); }
    } catch (e) {
      app.innerHTML = '<div class="empty"><h1 class="page-h">页面没有加载好</h1><p class="lead">可以回到首页再试一次。</p><div class="row center"><a class="btn primary" href="#/">回首页</a></div></div>';
      if (window.console) console.error(e);
    }
    document.body.setAttribute("data-view", v);
    tabbar.hidden = v === "quiz";
    Array.prototype.forEach.call(tabbar.querySelectorAll("a"), function (x) {
      var on = x.getAttribute("data-tab") === tab;
      x.classList.toggle("on", on); if (on) x.setAttribute("aria-current", "page"); else x.removeAttribute("aria-current");
    });
    if (lastView !== h) window.scrollTo(0, 0);
    lastView = h;
  }
  window.addEventListener("hashchange", route);
  route();

  /* ---------------- PWA ---------------- */
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js?v=0.1.0").catch(function () {}); });
  }

  /* 只读调试/测试入口（不含任何网络能力） */
  window.__shouhui = { scoreAnswers: scoreAnswers, rankDims: rankDims, pickDim: pickDim, pickCard: pickCard, weekly: weekly,
    state: function () { return JSON.parse(JSON.stringify(S)); }, schema: SCHEMA, key: KEY };
})();
