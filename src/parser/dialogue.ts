import {parseEffect} from "./effect";
import {parseTags} from "./tags";
import {IDialogue, ISubtitleTree} from "./ISubtitleTree";


export function parseDialogue(data:string, tree:ISubtitleTree):IDialogue {
  let fields = data.match(/Dialogue:(.*)/)[1].split(",");
  const len = tree.Events.Format.length;

  if (fields.length > len) {
    const textField = fields.slice(len - 1).join();
    fields = fields.slice(0, len - 1);
    fields.push(textField);
  }

  const timer = (tree.ScriptInfo.Timer / 100) || 1;
  const dia:IDialogue = {} as IDialogue;

  for (let i = 0; i < len; ++i) {
    dia[tree.Events.Format[i]] = fields[i].replace(/^\s+/, "");
  }
  dia.Layer *= 1;
  dia.Start = dia.Start / timer;
  dia.End = dia.End / timer;
  dia.Style = tree.V4Styles.Style[dia.Style] ? dia.Style : "Default";
  dia.MarginL *= 1;
  dia.MarginR *= 1;
  dia.MarginV *= 1;
  dia.Effect = parseEffect(dia.Effect as string);
  dia._parsedText = parseTags(dia, tree.V4Styles.Style);

  return dia;
}
