import {generateUUID} from "../uuid";

const $clipPath = document.createElementNS(xmlns, "svg");
$clipPath.setAttributeNS(null, "class", "ASS-clip-path");
const $clipPathDefs = document.createElementNS(xmlns, "defs");
$clipPath.appendChild($clipPathDefs);


export function createClipPath(dia) {
  if (dia.clip) {
    let d = "";
    const id = "ASS-" + generateUUID();
    const s = 1 / (1 << (dia.clip.scale - 1));
    const prx = this.tree.ScriptInfo.PlayResX;
    const pry = this.tree.ScriptInfo.PlayResY;

    if (dia.clip.dots !== null) {
      const n = dia.clip.dots.map(function (d, i) {
        if (i & 1) {
            return d / pry;
        } else {
            return d / prx;
        }
      });
      d += "M" + [n[0], n[1]].join();
      d += "L" + [n[0], n[3], n[2], n[3], n[2], n[1]].join() + "Z";
    }
    if (dia.clip.commands !== null) {
      d = getDrawingAttributes(dia.clip.commands, prx, pry).d;
    }
    if (dia.clip.inverse) {
      d += "M0,0L" + [0, s, s, s, s, 0, 0, 0].join() + "Z";
    }
    dia.clipPath = document.createElementNS(xmlns, "clipPath");
    dia.clipPath.setAttributeNS(null, "id", id);
    dia.clipPath.setAttributeNS(null, "clipPathUnits", "objectBoundingBox");
    const path = document.createElementNS(xmlns, "path");
    path.setAttributeNS(null, "d", d);
    path.setAttributeNS(null, "transform", "scale(" + s + ")");
    path.setAttributeNS(null, "clip-rule", "evenodd");
    dia.clipPath.appendChild(path);
    $clipPathDefs.appendChild(dia.clipPath);
    const cp = "clip-path:url(#" + id + ");";
    return "-webkit-" + cp + cp;
  }
  return "";
}
