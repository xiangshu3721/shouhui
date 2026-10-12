/* 结果长图：canvas 绘制 → toBlob（不用 data: URL） */
(function () {
  "use strict";
  var SERIF = '"Songti SC","STSong","Noto Serif CJK SC","Noto Serif SC","Source Han Serif SC",serif';
  var SANS = '-apple-system,"PingFang SC","Hiragino Sans GB","Noto Sans CJK SC","Noto Sans SC","Microsoft YaHei",sans-serif';
  var COL = { bg: "#f5f0e6", paper: "#fbf8f1", ink: "#2b2925", muted: "#7a7268", green: "#2f5d50", gold: "#b08a4a", line: "#e3d9c4", track: "#ebe3d3", soft: "#9fb3a9" };
  var NO_START = "，。、；：？！”’）》」』…—,.;:?!)";

  function wrap(ctx, text, maxW) {
    var lines = [], line = "", chars = Array.from(String(text));
    for (var i = 0; i < chars.length; i++) {
      var ch = chars[i], test = line + ch;
      if (ctx.measureText(test).width > maxW && line) {
        if (NO_START.indexOf(ch) >= 0) {          // 避头：标点不放行首，带上前一个字一起换行
          var last = Array.from(line); var prev = last.pop();
          lines.push(last.join("")); line = prev + ch;
        } else { lines.push(line); line = ch; }
      } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }

  function render(a, C) {
    var W = 750, PAD = 64, IN = 52, S = 2;
    var cw = W - PAD * 2 - IN * 2;                  // 文字可用宽度
    var mc = document.createElement("canvas").getContext("2d");
    var ops = [], y = 0;
    function txt(s, font, color, lh, opts) {
      opts = opts || {};
      mc.font = font;
      var ls = wrap(mc, s, opts.w || cw);
      ls.forEach(function (l) { ops.push({ t: "text", s: l, font: font, color: color, x: opts.x || 0, y: y + lh * 0.78, align: opts.align }); y += lh; });
    }
    function gap(h) { y += h; }

    // —— 版面 ——
    gap(56);
    ops.push({ t: "seal", y: y }); gap(56);
    txt(C.app.name, "600 30px " + SERIF, COL.ink, 44, { align: "center" });
    txt((a.nick ? a.nick + " · " : "") + a.date.replace(/^(\d+)-0?(\d+)-0?(\d+)$/, "$1年$2月$3日"), "400 22px " + SANS, COL.muted, 34, { align: "center" });
    gap(30); ops.push({ t: "rule", y: y }); gap(46);
    txt(C.ui.resultTitle, "600 40px " + SERIF, COL.ink, 56);
    gap(26);
    C.dimOrder.forEach(function (k) { ops.push({ t: "bar", y: y, name: C.dims[k].name, v: a.scores[k], hi: a.top.indexOf(k) >= 0 }); gap(58); });
    gap(22);
    if (a.scores[a.top[0]] < 40) { txt(C.ui.resultAllSteady, "400 23px " + SANS, COL.muted, 38); gap(14); }
    txt(C.ui.resultTopLead, "500 25px " + SANS, COL.ink, 40); gap(14);
    a.top.forEach(function (k, i) {
      var top0 = y;
      txt((i ? "② " : "① ") + C.dims[k].name + "  " + a.scores[k], "600 28px " + SERIF, COL.green, 44, { x: 22, w: cw - 22 });
      gap(4);
      txt(C.dims[k].desc, "400 24px " + SANS, COL.ink, 40, { x: 22, w: cw - 22 });
      ops.push({ t: "vline", y0: top0 + 6, y1: y - 6 });
      gap(28);
    });
    gap(8);
    var p0 = y; gap(30);
    txt(C.ui.resultPracticeLead, "400 23px " + SANS, COL.muted, 36, { x: 30, w: cw - 60 });
    gap(6);
    txt("“" + C.dims[a.top[0]].practice + "”", "600 28px " + SERIF, COL.green, 44, { x: 30, w: cw - 60 });
    gap(30); ops.unshift({ t: "box", y0: p0, y1: y });
    gap(50); ops.push({ t: "rule", y: y }); gap(40);
    txt(C.app.subtitle, "400 20px " + SANS, COL.muted, 32, { align: "center", w: W - PAD * 2 - 40 });
    txt(C.app.credit, "400 18px " + SANS, COL.muted, 30, { align: "center", w: W - PAD * 2 - 40 });
    gap(10);
    txt("xiangshu3721.github.io/shouhui", "500 20px " + SANS, COL.gold, 32, { align: "center" });
    gap(54);
    var innerH = y, H = innerH + PAD * 2;

    var cv = document.createElement("canvas");
    cv.width = W * S; cv.height = H * S;
    var c = cv.getContext("2d");
    c.scale(S, S);
    c.fillStyle = COL.bg; c.fillRect(0, 0, W, H);
    // 纸
    c.fillStyle = COL.paper; c.fillRect(PAD, PAD, W - PAD * 2, innerH);
    c.strokeStyle = COL.line; c.lineWidth = 1; c.strokeRect(PAD + 0.5, PAD + 0.5, W - PAD * 2 - 1, innerH - 1);
    c.strokeStyle = "rgba(176,138,74,.45)"; c.strokeRect(PAD + 10.5, PAD + 10.5, W - PAD * 2 - 21, innerH - 21);
    var X0 = PAD + IN, Y0 = PAD;
    ops.forEach(function (o) {
      if (o.t === "text") {
        c.font = o.font; c.fillStyle = o.color; c.textBaseline = "alphabetic";
        if (o.align === "center") { c.textAlign = "center"; c.fillText(o.s, W / 2, Y0 + o.y); }
        else { c.textAlign = "left"; c.fillText(o.s, X0 + o.x, Y0 + o.y); }
      } else if (o.t === "seal") {
        var sx = W / 2 - 22, sy = Y0 + o.y;
        c.strokeStyle = COL.green; c.lineWidth = 2; roundRect(c, sx, sy, 44, 44, 5); c.stroke();
        c.fillStyle = COL.green; c.font = "600 24px " + SERIF; c.textAlign = "center"; c.fillText("主", W / 2, sy + 31);
      } else if (o.t === "rule") {
        c.strokeStyle = COL.line; c.lineWidth = 1; c.beginPath(); c.moveTo(X0, Y0 + o.y + 0.5); c.lineTo(W - X0, Y0 + o.y + 0.5); c.stroke();
        c.fillStyle = COL.gold; c.beginPath(); c.arc(W / 2, Y0 + o.y + 0.5, 3, 0, Math.PI * 2); c.fill();
      } else if (o.t === "bar") {
        var by = Y0 + o.y, tx = X0 + 120, tw = cw - 120 - 64;
        c.font = "500 24px " + SANS; c.fillStyle = o.hi ? COL.ink : COL.muted; c.textAlign = "left"; c.fillText(o.name, X0, by + 30);
        c.fillStyle = COL.track; roundRect(c, tx, by + 14, tw, 16, 8); c.fill();
        c.fillStyle = o.hi ? COL.green : COL.soft; roundRect(c, tx, by + 14, Math.max(16, tw * o.v / 100), 16, 8); c.fill();
        c.font = "600 26px " + SERIF; c.fillStyle = o.hi ? COL.green : COL.muted; c.textAlign = "right"; c.fillText(String(o.v), W - X0, by + 32);
      } else if (o.t === "vline") {
        c.fillStyle = COL.gold; c.fillRect(X0, Y0 + o.y0, 3, o.y1 - o.y0);
      } else if (o.t === "box") {
        c.fillStyle = "#f1ece0"; roundRect(c, X0, Y0 + o.y0, cw, o.y1 - o.y0, 10); c.fill();
      }
    });
    return new Promise(function (res, rej) {
      if (!cv.toBlob) return rej(new Error("toBlob"));
      cv.toBlob(function (b) { b ? res(b) : rej(new Error("blob")); }, "image/png");
    });
  }
  function roundRect(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
  }
  window.ShouhuiExport = {
    render: function (a, C) {
      var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
      return ready.then(function () { return render(a, C); });
    }
  };
})();
