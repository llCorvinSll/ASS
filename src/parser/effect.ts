import {IEffect} from "./ISubtitleTree";

export function parseEffect(text:string):IEffect {
  const param = text.toLowerCase().split(";");
  if (param[0] === "banner") {
    return {
        name: param[0],
        delay: parseInt(param[1], 10) || 1,
        lefttoright: parseInt(param[2], 10) || 0,
        fadeawaywidth: parseInt(param[3], 10) || 0,
    };
  }
  if (/^scroll\s/.test(param[0])) {
    return {
      name: param[0],
      y1: Math.min((parseInt(param[1], 10), parseInt(param[2], 10))),
      y2: Math.max(parseInt(param[1], 10), parseInt(param[2], 10)),
      delay: parseInt(param[3], 10) || 1,
      fadeawayheight: parseInt(param[4], 10) || 0,
    };
  }
  return null;
}
