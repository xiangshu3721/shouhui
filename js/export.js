/* 结果长图：水彩气质 + toBlob（不用 data: URL） */
(function () {
  "use strict";
  var SERIF = '"Songti SC","STSong","Noto Serif CJK SC","Noto Serif SC","Source Han Serif SC",serif';
  var SANS = '-apple-system,"PingFang SC","Hiragino Sans GB","Noto Sans CJK SC","Noto Sans SC","Microsoft YaHei",sans-serif';
  var COL = { bg: "#f6efe6", paper: "#fffdf9", ink: "#2c2a28", muted: "#8a837a", teal: "#1f4a4a", gold: "#c4a574",
    line: "#e8dfd0", track: "#ebe4d8", soft: "#a8bfb0", sage: "#6e9580", mist: "#6a84a8" };
  var NO_START = "，。、；：？！”’）》」』…—,.;:?!)";
  var DIMC = { A: ["#d8e8dc", "#6e9580"], B: ["#d5e0ee", "#6a84a8"], C: ["#f3ddd0", "#c48468"], D: ["#cfd8e8", "#4a5f82"] };

  function wrap(ctx, text, maxW) {
    var lines = [], line = "", chars = Array.from(String(text));
    for (var i = 0; i < chars.length; i++) {
      var ch = chars[i], test = line + ch;
      if (ctx.measureText(test).width > maxW && line) {
        if (NO_START.indexOf(ch) >= 0) {
          var last = Array.from(line); var prev = last.pop();
          lines.push(last.join("")); line = prev + ch;
        } else { lines.push(line); line = ch; }
      } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }
  function roundRect(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
  }

  function paintHero(c, x, y, w, h, dim) {
    var g = c.createLinearGradient(x, y, x, y + h);
    var dc = DIMC[dim] || DIMC.A;
    g.addColorStop(0, dc[0]); g.addColorStop(1, "#fffdf9");
    c.fillStyle = g; roundRect(c, x, y, w, h, 18); c.fill();
    // soft blobs
    c.globalAlpha = 0.35;
    c.fillStyle = dc[1];
    c.beginPath(); c.ellipse(x + w * 0.7, y + h * 0.35, w * 0.28, h * 0.28, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#ffffff";
    c.beginPath(); c.ellipse(x + w * 0.3, y + h * 0.55, w * 0.22, h * 0.18, 0, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 1;
    // star
    var sx = x + w / 2, sy = y + h * 0.38, r = 16;
    c.fillStyle = "rgba(255,247,224,.95)";
    c.beginPath();
    for (var i = 0; i < 8; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 4, rr = i % 2 === 0 ? r : r * 0.32;
      var px = sx + Math.cos(a) * rr, py = sy + Math.sin(a) * rr;
      if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.closePath(); c.fill();
  }

  function render(a, C) {
    var W = 750, PAD = 48, IN = 40, S = 2;
    var cw = W - PAD * 2 - IN * 2;
    var mc = document.createElement("canvas").getContext("2d");
    var ops = [], y = 0;
    function txt(s, font, color, lh, opts) {
      opts = opts || {};
      mc.font = font;
      var ls = wrap(mc, s, opts.w || cw);
      ls.forEach(function (l) { ops.push({ t: "text", s: l, font: font, color: color, x: opts.x || 0, y: y + lh * 0.78, align: opts.align }); y += lh; });
    }
    function gap(h) { y += h; }

    gap(40);
    ops.push({ t: "seal", y: y }); gap(48);
    txt(C.app.name, "600 32px " + SERIF, COL.ink, 46, { align: "center" });
    txt((a.nick ? a.nick + " · " : "") + a.date.replace(/^(\d+)-0?(\d+)-0?(\d+)$/, "$1年$2月$3日"), "400 22px " + SANS, COL.muted, 34, { align: "center" });
    gap(18);
    ops.push({ t: "hero", y: y, h: 140, dim: a.top[0] }); gap(156);
    txt(C.ui.resultTitle, "600 38px " + SERIF, COL.ink, 54);
    gap(18);
    C.dimOrder.forEach(function (k) { ops.push({ t: "bar", y: y, name: C.dims[k].name, v: a.scores[k], hi: a.top.indexOf(k) >= 0 }); gap(56); });
    gap(16);
    if (a.scores[a.top[0]] < 40) { txt(C.ui.resultAllSteady, "400 22px " + SANS, COL.muted, 36); gap(12); }
    txt(C.ui.resultTopLead, "500 24px " + SANS, COL.ink, 38); gap(12);
    a.top.forEach(function (k, i) {
      var top0 = y;
      txt((i ? "② " : "① ") + C.dims[k].name + "  " + a.scores[k], "600 28px " + SERIF, COL.teal, 42, { x: 18, w: cw - 18 });
      gap(4);
      txt(C.dims[k].desc, "400 23px " + SANS, COL.ink, 38, { x: 18, w: cw - 18 });
      ops.push({ t: "vline", y0: top0 + 4, y1: y - 4 });
      gap(22);
    });
    var p0 = y; gap(24);
    txt(C.ui.resultPracticeLead, "400 22px " + SANS, COL.muted, 34, { x: 26, w: cw - 52 });
    gap(4);
    txt("“" + C.dims[a.top[0]].practice + "”", "600 26px " + SERIF, COL.teal, 42, { x: 26, w: cw - 52 });
    gap(24); ops.unshift({ t: "box", y0: p0, y1: y });
    gap(36); ops.push({ t: "rule", y: y }); gap(28);
    txt(C.app.tagline || C.app.subtitle, "400 20px " + SANS, COL.muted, 32, { align: "center", w: W - PAD * 2 - 40 });
    txt(C.app.credit, "400 17px " + SANS, COL.muted, 28, { align: "center", w: W - PAD * 2 - 40 });
    gap(8);
    txt("xiangshu3721.github.io/shouhui", "500 19px " + SANS, COL.gold, 30, { align: "center" });
    gap(44);
    var innerH = y, H = innerH + PAD * 2;

    var cv = document.createElement("canvas");
    cv.width = W * S; cv.height = H * S;
    var c = cv.getContext("2d");
    c.scale(S, S);
    c.fillStyle = COL.bg; c.fillRect(0, 0, W, H);
    c.fillStyle = COL.paper; roundRect(c, PAD, PAD, W - PAD * 2, innerH, 22); c.fill();
    c.strokeStyle = COL.line; c.lineWidth = 1; roundRect(c, PAD + 0.5, PAD + 0.5, W - PAD * 2 - 1, innerH - 1, 22); c.stroke();
    var X0 = PAD + IN, Y0 = PAD;
    ops.forEach(function (o) {
      if (o.t === "text") {
        c.font = o.font; c.fillStyle = o.color; c.textBaseline = "alphabetic";
        if (o.align === "center") { c.textAlign = "center"; c.fillText(o.s, W / 2, Y0 + o.y); }
        else { c.textAlign = "left"; c.fillText(o.s, X0 + o.x, Y0 + o.y); }
      } else if (o.t === "seal") {
        var sx = W / 2 - 20, sy = Y0 + o.y;
        c.strokeStyle = COL.teal; c.lineWidth = 2; roundRect(c, sx, sy, 40, 40, 6); c.stroke();
        c.fillStyle = COL.teal; c.font = "600 22px " + SERIF; c.textAlign = "center"; c.fillText("主", W / 2, sy + 28);
      } else if (o.t === "hero") {
        paintHero(c, X0, Y0 + o.y, cw, o.h, o.dim);
      } else if (o.t === "rule") {
        c.strokeStyle = COL.line; c.lineWidth = 1; c.beginPath(); c.moveTo(X0, Y0 + o.y + 0.5); c.lineTo(W - X0, Y0 + o.y + 0.5); c.stroke();
        c.fillStyle = COL.gold; c.beginPath(); c.arc(W / 2, Y0 + o.y + 0.5, 3, 0, Math.PI * 2); c.fill();
      } else if (o.t === "bar") {
        var by = Y0 + o.y, tx = X0 + 118, tw = cw - 118 - 58;
        c.font = "500 23px " + SANS; c.fillStyle = o.hi ? COL.ink : COL.muted; c.textAlign = "left"; c.fillText(o.name, X0, by + 28);
        c.fillStyle = COL.track; roundRect(c, tx, by + 12, tw, 14, 7); c.fill();
        c.fillStyle = o.hi ? COL.teal : COL.soft; roundRect(c, tx, by + 12, Math.max(14, tw * o.v / 100), 14, 7); c.fill();
        c.font = "600 25px " + SERIF; c.fillStyle = o.hi ? COL.teal : COL.muted; c.textAlign = "right"; c.fillText(String(o.v), W - X0, by + 30);
      } else if (o.t === "vline") {
        c.fillStyle = COL.gold; c.fillRect(X0, Y0 + o.y0, 3, o.y1 - o.y0);
      } else if (o.t === "box") {
        c.fillStyle = "#e4efed"; roundRect(c, X0, Y0 + o.y0, cw, o.y1 - o.y0, 14); c.fill();
      }
    });
    return new Promise(function (res, rej) {
      if (!cv.toBlob) return rej(new Error("toBlob"));
      cv.toBlob(function (b) { b ? res(b) : rej(new Error("blob")); }, "image/png");
    });
  }

  window.ShouhuiExport = {
    render: function (a, C) {
      var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
      return ready.then(function () { return render(a, C); });
    }
  };
})();
