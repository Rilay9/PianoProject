// Render a MusicXML file with OSMD 2.1.2 under jsdom and list, per graphical note, the accidental OSMD draws.
// Usage: node osmd_acc.cjs <file.xml> [bars]
const path = require("path");
const fs = require("fs");
const APP = "C:/Users/yalir/repos/Piano Stuff/PianoProject/app/node_modules/";
const { JSDOM } = require(APP + "jsdom");
const dom = new JSDOM("<!DOCTYPE html><html><body><div id='c'></div></body></html>", { pretendToBeVisual: true });
global.window = dom.window; global.document = dom.window.document;
for (const k of ["HTMLElement", "HTMLAnchorElement", "XMLHttpRequest", "Node", "DOMParser", "SVGElement", "Element", "navigator", "getComputedStyle", "Image", "HTMLCanvasElement"]) {
  try { if (dom.window[k] !== undefined) global[k] = dom.window[k]; } catch (e) {}
}
global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
const div = document.getElementById("c");
Object.defineProperty(div, "offsetWidth", { get: () => 1200 });
Object.defineProperty(window.HTMLElement.prototype, "offsetWidth", { get: () => 1200, configurable: true });
Object.defineProperty(window.HTMLElement.prototype, "offsetHeight", { get: () => 800, configurable: true });
// SVG text measurement stub
window.SVGElement.prototype.getBBox = function () { return { x: 0, y: 0, width: 10 * ((this.textContent || "").length || 1), height: 10 }; };
window.HTMLCanvasElement.prototype.getContext = function () {
  return { font: "", measureText: (s) => ({ width: 6 * String(s).length }), fillText() {}, save() {}, restore() {}, scale() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, fill() {}, fillRect() {}, clearRect() {}, rect() {}, arc() {}, closePath() {}, bezierCurveTo() {}, quadraticCurveTo() {}, setLineDash() {}, translate() {}, rotate() {}, canvas: this };
};
const OSMD = require(APP + "opensheetmusicdisplay/build/opensheetmusicdisplay.min.js");
(async () => {
  const xml = fs.readFileSync(process.argv[2], "utf8");
  const osmd = new OSMD.OpenSheetMusicDisplay(div, { backend: "svg", autoResize: false, drawTitle: false, drawingParameters: "compacttight" });
  await osmd.load(xml);
  osmd.render();
  const AccEnum = OSMD.AccidentalEnum;
  const out = [];
  osmd.GraphicSheet.MeasureList.forEach((staves, mi) => {
    staves.forEach((gm, si) => {
      if (!gm) return;
      for (const se of gm.staffEntries) for (const gve of se.graphicalVoiceEntries) for (const gn of gve.notes) {
        const sn = gn.sourceNote;
        if (!sn || sn.isRest()) continue;
        const p = sn.Pitch; if (!p) continue;
        const da = gn.DrawnAccidental;
        out.push({ m: mi, staff: si + 1, t: sn.getAbsoluteTimestamp ? sn.getAbsoluteTimestamp().RealValue * 4 : null, note: p.ToString ? p.ToString() : String(p), drawn: da === undefined ? null : (AccEnum ? AccEnum[da] : da) });
      }
    });
  });
  console.log(JSON.stringify(out));
})().catch((e) => { console.error("ERR", e && e.stack || e); process.exit(1); });
