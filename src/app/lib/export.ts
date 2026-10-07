import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

export function libraryMatch(lib, name) {
  var n = String(name || "").toLowerCase();
  return (
    (lib || []).find(function (e) {
      return e.match && n.indexOf(String(e.match).toLowerCase()) >= 0;
    }) || null
  );
}

/* ---------- downloads (viewer-confirmed saves) ---------- */

/* ---------- downloads (viewer-confirmed saves) ---------- */
export var dlPromise = null;

export function dlNs() {
  if (!dlPromise)
    dlPromise =
      window.claude && window.claude.use
        ? window.claude.use("downloads")
        : Promise.resolve(null);
  return dlPromise;
}

export function saveFile(ctx, filename, data) {
  return dlNs().then(function (d) {
    if (!d) return browserSave(ctx, filename, data);
    return d
      .save({
        filename: filename,
        data: data,
      })
      .then(
        function () {
          ctx.toast({
            title: "Saved " + filename,
          });
        },
        function (e) {
          if (e && e.code === "declined") return;
          if (e && e.code === "rate_limited") {
            ctx.toast({
              title: "A save prompt is already open",
              tone: "info",
            });
            return;
          }
          ctx.toast({
            title: "Couldn't save " + filename,
            message: (e && e.message) || "Try again.",
            tone: "danger",
          });
        },
      );
  });
}

/* plain browser download (self-hosted / Docker): the file is built in memory and never leaves the machine */
export function browserSave(ctx, filename: string, data: any) {
  try {
    var blob =
      data instanceof Blob
        ? data
        : new Blob([data], {
            type: /\.csv$/i.test(filename)
              ? "text/csv;charset=utf-8"
              : /\.json$/i.test(filename)
                ? "application/json"
                : /\.html?$/i.test(filename)
                  ? "text/html;charset=utf-8"
                  : /\.(md|txt|ics)$/i.test(filename)
                    ? "text/plain;charset=utf-8"
                    : "application/octet-stream",
          });
    var url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 30000);
    ctx.toast({ title: "Saved " + filename });
  } catch (e) {
    ctx.toast({
      title: "Couldn't save " + filename,
      message: (e && e.message) || "Try again.",
      tone: "danger",
    });
  }
}

export function slug(x) {
  return String(x)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
/* spreadsheet formula injection guard (OWASP): a cell starting with = + - @ tab or CR is prefixed with ' */

/* spreadsheet formula injection guard (OWASP): a cell starting with = + - @ tab or CR is prefixed with ' */
export function csvCell(v) {
  v = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(v) && !/^-?\d+(\.\d+)?$/.test(v)) v = "'" + v;
  return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
}

export function toCsv(rows) {
  return (
    rows
      .map(function (r) {
        return r.map(csvCell).join(",");
      })
      .join("\r\n") + "\r\n"
  );
}

export function captureCanvas(el, bg) {
  return html2canvas(el, {
    scale: 2,
    backgroundColor: bg,
    useCORS: true,
    logging: false,
  });
}

export function canvasToPdfBlob(canvas, auto?) {
  var J = jsPDF;
  var pdf = new J({
    unit: "pt",
    format: "a4",
    orientation:
      auto && canvas.width > canvas.height ? "landscape" : "portrait",
  });
  var pw = pdf.internal.pageSize.getWidth(),
    ph = pdf.internal.pageSize.getHeight(),
    m = 24;
  var iw = pw - m * 2,
    sliceH = Math.floor(((ph - m * 2) * canvas.width) / iw),
    y = 0,
    first = true;
  while (y < canvas.height) {
    var h2 = Math.min(sliceH, canvas.height - y),
      c = document.createElement("canvas");
    c.width = canvas.width;
    c.height = h2;
    c.getContext("2d").drawImage(
      canvas,
      0,
      y,
      canvas.width,
      h2,
      0,
      0,
      canvas.width,
      h2,
    );
    if (!first) pdf.addPage();
    first = false;
    pdf.addImage(
      c.toDataURL("image/jpeg", 0.92),
      "JPEG",
      m,
      m,
      iw,
      (h2 * iw) / canvas.width,
    );
    y += h2;
  }
  return pdf.output("blob");
}

/* ---------- shared bits ---------- */
/* ===== universal finding drawer: the same Detail from every list, board, map and search result ===== */

/* ---------- shared bits ---------- */
/* ===== universal finding drawer: the same Detail from every list, board, map and search result ===== */
export function findingByKey(ctx, key) {
  function pick(list) {
    return list.find(function (x) {
      return x.key === key;
    });
  }
  var f = pick(ctx.active) || pick(ctx.parked);
  if (f) return f;
  var best = null,
    order = {};
  ctx.batches.forEach(function (b, i) {
    order[b.id] = i;
  });
  ctx.data.forEach(function (x) {
    if (x.key === key && (!best || order[x.batch] > order[best.batch]))
      best = x;
  });
  return best;
}
