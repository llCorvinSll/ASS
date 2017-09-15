import {parseDialogue} from "./dialogue";
import {parseFormat} from "./format";
import {parseStyle} from "./style";
import {BlockType, ISubtitleTree} from "./ISubtitleTree";


export function parseASS(data:string) {
    data = data.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const tree:ISubtitleTree = {
    ScriptInfo: {
        "Title": "&lt;untitled&gt;",
        "Original Script": "&lt;unknown&gt;",
        "WrapStyle": 0,
        "Timer": 0,
    },
        V4Styles: {Format: [], Style: {}},
        Events: {Format: [], Dialogue: []}
  };
    const lines = data.split(/\r?\n/);
    let state:BlockType = BlockType.NONE;

    for (let len = lines.length, i = 0; i < len; ++i) {
        const line = lines[i].replace(/^\s+|\s+$/g, "");
        if (/^;/.test(line)) {
            continue;
        }

        if (/^\[Script Info]/i.test(line)) {
            state = BlockType.SCRIPT_INFO; // 1;
        } else if (/^\[V4\+ Styles]/i.test(line)) {
            state = BlockType.STYLES; // 2;
        } else if (/^\[Events]/i.test(line)) {
            state = BlockType.EVENTS; // 3;
        } else if (/^\[.*]/.test(line)) {
            state = BlockType.NONE; // 0;
        }

        if (state === BlockType.NONE) {
            continue;
        }
        if (state === BlockType.SCRIPT_INFO) {
      if (/:/.test(line)) {
          const kv = line.match(/(.*?)\s*:\s*(.*)/);

          const prop_name = kv[1];
          let prop_value:string|number = kv[2];

          if (!isNaN(parseInt(prop_value, 10))) {
              prop_value = parseInt(prop_value, 10);
          }
          tree.ScriptInfo[prop_name] = kv[2];
      }
    }
        if (state === BlockType.STYLES) {
      if (/^Format:/.test(line)) {
        tree.V4Styles.Format = parseFormat(line);
      }
      if (/^Style:/.test(line)) {
          const s = parseStyle(line, tree);
          tree.V4Styles.Style[s.Name] = s;
      }
    }
        if (state === BlockType.EVENTS) {
      if (/^Format:/.test(line)) {
        tree.Events.Format = parseFormat(line);
      }
      if (/^Dialogue:/.test(line)) {
          const dia = parseDialogue(line, tree);
          if (dia.Start < dia.End) {
              dia._index = tree.Events.Dialogue.length;
              tree.Events.Dialogue.push(dia);
          }
      }
    }
  }
    tree.Events.Dialogue.sort((a, b) => {
    return (a.Start - b.Start) || (a.End - b.End) || (a._index - b._index);
  });

    return tree;
}
