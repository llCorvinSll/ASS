import {generateUUID} from "../uuid";
import {xmlns} from "../global";
import {createSVGBS} from "./border-and-shadow";
import {ITextContent} from "../parser/tags";
import {DrawingCommand} from "../parser/drawing";
import {ISubtitleTree} from "../parser/ISubtitleTree";


interface ICreateDrawingOptions {
    scale:number;
    tree:ISubtitleTree;
}

export function createDrawing(this:void, cn:HTMLSpanElement, ct:ITextContent, options:ICreateDrawingOptions) {
    const t = ct.tags;
    /* tslint:disable-next-line:no-bitwise */
    const s = options.scale / (1 << (t.p - 1));
    const sx = (t.fscx ? t.fscx / 100 : 1) * s;
    const sy = (t.fscy ? t.fscy / 100 : 1) * s;
    const gda = getDrawingAttributes(ct.commands);
    const vb = [gda.minX, gda.minY, gda.width, gda.height].join(" ");
    const filterID = "ASS-" + generateUUID();
    const symbolID = "ASS-" + generateUUID();
    const sisbas = options.tree.ScriptInfo.ScaledBorderAndShadow;
    const sbas = /Yes/i.test(sisbas) ? options.scale : 1;
    const xlink = "http://www.w3.org/1999/xlink";
    const blur = t.blur || 0;
    const vbx = t.xbord + (t.xshad < 0 ? -t.xshad : 0) + blur;
    const vby = t.ybord + (t.yshad < 0 ? -t.yshad : 0) + blur;
    const vbw = gda.width * sx + 2 * t.xbord + Math.abs(t.xshad) + 2 * blur;
    const vbh = gda.height * sx + 2 * t.ybord + Math.abs(t.yshad) + 2 * blur;
    const svg = document.createElementNS(xmlns, "svg");

    svg.setAttributeNS(null, "width", `${vbw}`);
    svg.setAttributeNS(null, "height", `${vbh}`);
    svg.setAttributeNS(null, "viewBox", [-vbx, -vby, vbw, vbh].join(" "));

    const defs = document.createElementNS(xmlns, "defs");
    defs.appendChild(createSVGBS(t, filterID, sbas));
    svg.appendChild(defs);
    const symbol = document.createElementNS(xmlns, "symbol");
    symbol.setAttributeNS(null, "id", symbolID);
    symbol.setAttributeNS(null, "viewBox", vb);
    svg.appendChild(symbol);
    const path = document.createElementNS(xmlns, "path");
    path.setAttributeNS(null, "d", gda.d);
    symbol.appendChild(path);
    const use = document.createElementNS(xmlns, "use");
    use.setAttributeNS(null, "width", `${gda.width * sx}`);
    use.setAttributeNS(null, "height", `${gda.height * sy}`);
    use.setAttributeNS(xlink, "xlink:href", `#${symbolID}`);
    use.setAttributeNS(null, "filter", `url(#${filterID})`);
    svg.appendChild(use);
    cn.style.cssText += `position:relative;width:${gda.width * sx}px;height:${gda.height * sy}px;`;
    svg.style.cssText = `position:absolute;left:${gda.minX * sx - vbx}px;top:${gda.minY * sy - vby}px;`;
    return svg;
}

export function getDrawingAttributes(commands:DrawingCommand[], normalizeX?:number, normalizeY?:number) {
  normalizeX = normalizeX || 1;
  normalizeY = normalizeY || 1;
  let minX = Number.MAX_VALUE;
  let minY = Number.MAX_VALUE;
  let maxX = Number.MIN_VALUE;
  let maxY = Number.MIN_VALUE;

  const arr = [];
  for (let len = commands.length, i = 0; i < len; i++) {
    commands[i].points.forEach(function (p) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
      p.x /= normalizeX;
      p.y /= normalizeY;
    });
    arr.push(commands[i].toString());
    commands[i].points.forEach(function (p) {
      p.x *= normalizeX;
      p.y *= normalizeY;
    });
  }

  return {
    d: `${arr.join("")}Z`,
    minX,
    minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}
