export function toRGBA(c:string) {
  const t = c.match(/(\w\w)(\w\w)(\w\w)(\w\w)/);
  const a = 1 - (`0x${t[1]}`) / 255;
  const b = +("0x" + t[2]);
  const g = +("0x" + t[3]);
  const r = +("0x" + t[4]);
  return "rgba(" + [r, g, b, a].join() + ")";
}
