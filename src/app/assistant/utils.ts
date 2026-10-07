/* ---------- Claude assistant (viewer-paid, opt-in, hosts masked by default) ---------- */
export var sampleP = null;

export function sampleNs() {
  if (!sampleP)
    sampleP =
      window.claude && window.claude.use
        ? window.claude.use("sample").catch(function () {
            return null;
          })
        : Promise.resolve(null);
  return sampleP;
}
