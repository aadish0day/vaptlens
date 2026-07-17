import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

function isDark(): boolean {
  return document.documentElement.classList.contains("dark");
}

function captureOptions(el: HTMLElement) {
  return {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: isDark() ? "#0B0D14" : "#F7F8FA",
    width: el.scrollWidth,
    height: el.scrollHeight,
    filter: (node: HTMLElement) => {
      if (!(node instanceof HTMLElement)) return true;
      if (node.classList?.contains("widget-cancel")) return false;
      if (node.classList?.contains("react-resizable-handle")) return false;
      return true;
    },
  };
}

function stamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

export async function exportDashboardPng(el: HTMLElement): Promise<void> {
  const dataUrl = await toPng(el, captureOptions(el));
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `vaptlens-dashboard-${stamp()}.png`;
  a.click();
}

export async function exportDashboardPdf(el: HTMLElement): Promise<void> {
  const dataUrl = await toPng(el, captureOptions(el));
  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to render image"));
  });
  const ratio = 2;
  const cssW = img.width / ratio;
  const cssH = img.height / ratio;
  const pdf = new jsPDF({
    orientation: cssW >= cssH ? "landscape" : "portrait",
    unit: "pt",
    format: [cssH, cssW],
  });
  pdf.addImage(dataUrl, "PNG", 0, 0, cssW, cssH);
  pdf.save(`vaptlens-dashboard-${stamp()}.pdf`);
}
