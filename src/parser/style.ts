import {IStyle, ISubtitleTree} from "./ISubtitleTree";

export function parseStyle(data:string, tree:ISubtitleTree):IStyle {
  const fields = data.match(/Style:(.*)/)[1].split(",");
  const s:IStyle = {} as IStyle;

  for (let i = fields.length - 1; i >= 0; --i) {
    const field = tree.V4Styles.Format[i];
    s[field] = fields[i].replace(/^\s*/, "");
    if (!isNaN(parseInt(s[field] as string, 10))) {
        s[field] = parseInt(s[field] as string, 10);
    }
  }
  s._tags = {
    fn: s.Fontname,
    fs: s.Fontsize,
    c1: s.PrimaryColour.match(/&H(\w\w)?(\w{6})&?/)[2],
    a1: s.PrimaryColour.match(/&H(\w\w)?(\w{6})&?/)[1] || "00",
    c2: s.SecondaryColour.match(/&H(\w\w)?(\w{6})&?/)[2],
    a2: s.SecondaryColour.match(/&H(\w\w)?(\w{6})&?/)[1] || "00",
    c3: s.OutlineColour.match(/&H(\w\w)?(\w{6})&?/)[2],
    a3: s.OutlineColour.match(/&H(\w\w)?(\w{6})&?/)[1] || "00",
    c4: s.BackColour.match(/&H(\w\w)?(\w{6})&?/)[2],
    a4: s.BackColour.match(/&H(\w\w)?(\w{6})&?/)[1] || "00",
    b: Math.abs(parseInt(s.Bold, 10)),
    i: Math.abs(parseInt(s.Italic, 10)),
    u: Math.abs(parseInt(s.Underline, 10)),
    s: Math.abs(parseInt(s.StrikeOut, 10)),
    q: tree.ScriptInfo.WrapStyle || 1,
    fscx: s.ScaleX,
    fscy: s.ScaleY,
    fsp: s.Spacing,
    frz: s.Angle,
    xbord: s.Outline,
    ybord: s.Outline,
    xshad: s.Shadow,
    yshad: s.Shadow,
  };
  return s;
}
