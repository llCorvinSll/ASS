import {xmlns} from "../global";
import {toRGBA} from "./rgba";
import {ITags} from "../parser/tags";

export function createSVGBS(t:ITags, id:string, s:number):SVGFilterElement {
  const hasBorder = t.xbord || t.ybord;
  const hasShadow = t.xshad || t.yshad;
  const isTrans = (t.a1 === "FF");
  const blur = t.blur || 0;

  const filter = document.createElementNS(xmlns, "filter");
  filter.setAttributeNS(null, "id", id);
  const sg_b = document.createElementNS(xmlns, "feGaussianBlur");
  sg_b.setAttributeNS(null, "stdDeviation", `${hasBorder ? 0 : blur}`);
  sg_b.setAttributeNS(null, "in", "SourceGraphic");
  sg_b.setAttributeNS(null, "result", "sg_b");
  filter.appendChild(sg_b);
  const c1 = document.createElementNS(xmlns, "feFlood");
  c1.setAttributeNS(null, "flood-color", toRGBA(t.a1 + t.c1));
  c1.setAttributeNS(null, "result", "c1");
  filter.appendChild(c1);
  const main = document.createElementNS(xmlns, "feComposite");
  main.setAttributeNS(null, "operator", "in");
  main.setAttributeNS(null, "in", "c1");
  main.setAttributeNS(null, "in2", "sg_b");
  main.setAttributeNS(null, "result", "main");
  filter.appendChild(main);
  if (hasBorder) {
    const dil = document.createElementNS(xmlns, "feMorphology");
    dil.setAttributeNS(null, "radius", t.xbord * s + " " + t.ybord * s);
    dil.setAttributeNS(null, "operator", "dilate");
    dil.setAttributeNS(null, "in", "SourceGraphic");
    dil.setAttributeNS(null, "result", "dil");
    filter.appendChild(dil);
    const dil_b = document.createElementNS(xmlns, "feGaussianBlur");
    dil_b.setAttributeNS(null, "stdDeviation", `${blur}`);
    dil_b.setAttributeNS(null, "in", "dil");
    dil_b.setAttributeNS(null, "result", "dil_b");
    filter.appendChild(dil_b);
    const dil_b_o = document.createElementNS(xmlns, "feComposite");
    dil_b_o.setAttributeNS(null, "operator", "out");
    dil_b_o.setAttributeNS(null, "in", "dil_b");
    dil_b_o.setAttributeNS(null, "in2", "SourceGraphic");
    dil_b_o.setAttributeNS(null, "result", "dil_b_o");
    filter.appendChild(dil_b_o);
    const c3 = document.createElementNS(xmlns, "feFlood");
    c3.setAttributeNS(null, "flood-color", toRGBA(t.a3 + t.c3));
    c3.setAttributeNS(null, "result", "c3");
    filter.appendChild(c3);
    const border = document.createElementNS(xmlns, "feComposite");
    border.setAttributeNS(null, "operator", "in");
    border.setAttributeNS(null, "in", "c3");
    border.setAttributeNS(null, "in2", "dil_b_o");
    border.setAttributeNS(null, "result", "border");
    filter.appendChild(border);
  }
  if (hasShadow && (hasBorder || !isTrans)) {
    const off = document.createElementNS(xmlns, "feOffset");
    off.setAttributeNS(null, "dx", `${t.xshad * s}`);
    off.setAttributeNS(null, "dy", `${t.yshad * s}`);
    off.setAttributeNS(null, "in", hasBorder ? "dil" : "SourceGraphic");
    off.setAttributeNS(null, "result", "off");
    filter.appendChild(off);
    const off_b = document.createElementNS(xmlns, "feGaussianBlur");
    off_b.setAttributeNS(null, "stdDeviation", `${blur}`);
    off_b.setAttributeNS(null, "in", "off");
    off_b.setAttributeNS(null, "result", "off_b");
    filter.appendChild(off_b);
    if (isTrans) {
      const sg_off = document.createElementNS(xmlns, "feOffset");
      sg_off.setAttributeNS(null, "dx", `${t.xshad * s}`);
      sg_off.setAttributeNS(null, "dy", `${t.yshad * s}`);
      sg_off.setAttributeNS(null, "in", "SourceGraphic");
      sg_off.setAttributeNS(null, "result", "sg_off");
      filter.appendChild(sg_off);
      const off_b_o = document.createElementNS(xmlns, "feComposite");
      off_b_o.setAttributeNS(null, "operator", "out");
      off_b_o.setAttributeNS(null, "in", "off_b");
      off_b_o.setAttributeNS(null, "in2", "sg_off");
      off_b_o.setAttributeNS(null, "result", "off_b_o");
      filter.appendChild(off_b_o);
    }
    const c4 = document.createElementNS(xmlns, "feFlood");
    c4.setAttributeNS(null, "flood-color", toRGBA(t.a4 + t.c4));
    c4.setAttributeNS(null, "result", "c4");
    filter.appendChild(c4);
    const shadow = document.createElementNS(xmlns, "feComposite");
    shadow.setAttributeNS(null, "operator", "in");
    shadow.setAttributeNS(null, "in", "c4");
    shadow.setAttributeNS(null, "in2", isTrans ? "off_b_o" : "off_b");
    shadow.setAttributeNS(null, "result", "shadow");
    filter.appendChild(shadow);
  }
  const merge = document.createElementNS(xmlns, "feMerge");
  if (hasShadow && (hasBorder || !isTrans)) {
    const nodeShadow = document.createElementNS(xmlns, "feMergeNode");
    nodeShadow.setAttributeNS(null, "in", "shadow");
    merge.appendChild(nodeShadow);
  }
  if (hasBorder) {
    const nodeBorder = document.createElementNS(xmlns, "feMergeNode");
    nodeBorder.setAttributeNS(null, "in", "border");
    merge.appendChild(nodeBorder);
  }
  const nodeMain = document.createElementNS(xmlns, "feMergeNode");
  nodeMain.setAttributeNS(null, "in", "main");
  merge.appendChild(nodeMain);
  filter.appendChild(merge);
  return filter;
}

export function createCSSBS(this:void, t:ITags, s:number):string {
  const arr = [];
  const oc = toRGBA(t.a3 + t.c3);
  const ox = t.xbord * s;
  const oy = t.ybord * s;
  const sc = toRGBA(t.a4 + t.c4);
  let sx = t.xshad * s;
  let sy = t.yshad * s;
  const blur = t.blur || 0;
  if (!(ox + oy + sx + sy)) {
      return "none";
  }
  if (ox || oy) {
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            for (let x = 1; x < ox; x++) {
                for (let y = 1; y < oy; y++) {
                    if (i || j) {
                        arr.push(`${oc} ${i * x}px ${j * y}px ${blur}px`);
                    }
                }
            }
            arr.push(`${oc} ${i * ox}px ${j * oy}px ${blur}px`);
        }
    }
  }
  if (sx || sy) {
    const pnx = sx > 0 ? 1 : -1;
    const pny = sy > 0 ? 1 : -1;
    sx = Math.abs(sx);
    sy = Math.abs(sy);
    for (let x = Math.max(ox, sx - ox); x < sx + ox; x++) {
      for (let y = Math.max(oy, sy - oy); y < sy + oy; y++) {
          arr.push(`${sc} ${x * pnx}px ${y * pny}px ${blur}px`);
      }
    }
    arr.push(`${sc} ${(sx + ox) * pnx}px ${(sy + oy) * pny}px ${blur}px`);
  }
  return arr.join();
}
