import {generateUUID} from "../uuid";
import {xmlns} from "../global";
import {getDrawingAttributes} from "./drawing";
import {IDialogueToRender} from "./renderer";
import {ISubtitleTree} from "../parser/ISubtitleTree";

export const $clipPath = document.createElementNS(xmlns, "svg");
$clipPath.setAttributeNS(null, "class", "ASS-clip-path");
export const $clipPathDefs = document.createElementNS(xmlns, "defs");
$clipPath.appendChild($clipPathDefs);

interface ICreateClipPathOptions {
    tree:ISubtitleTree;
}

export function createClipPath(this:void, dia:IDialogueToRender, options:ICreateClipPathOptions) {
    if (dia.clip) {
        let d = "";
        const id = "ASS-" + generateUUID();
        /* tslint:disable-next-line:no-bitwise */
        const s = 1 / (1 << (dia.clip.scale - 1));
        const prx = options.tree.ScriptInfo.PlayResX;
        const pry = options.tree.ScriptInfo.PlayResY;

        if (dia.clip.dots !== null) {
            const n = dia.clip.dots.map((dot, i) => {
                /* tslint:disable-next-line:no-bitwise */
                if (i & 1) {
                    return dot / pry;
                } else {
                    return dot / prx;
                }
            });
            d += `M${[n[0], n[1]].join()}`;
            d += `L${[n[0], n[3], n[2], n[3], n[2], n[1]].join()}Z`;
        }
        if (dia.clip.commands !== null) {
            d = getDrawingAttributes(dia.clip.commands, prx, pry).d;
        }
        if (dia.clip.inverse) {
            d += `M0,0L${[0, s, s, s, s, 0, 0, 0].join()}Z`;
        }
        dia.clipPath = document.createElementNS(xmlns, "clipPath");
        dia.clipPath.setAttributeNS(null, "id", id);
        dia.clipPath.setAttributeNS(null, "clipPathUnits", "objectBoundingBox");
        const path = document.createElementNS(xmlns, "path");
        path.setAttributeNS(null, "d", d);
        path.setAttributeNS(null, "transform", `scale(${s})`);
        path.setAttributeNS(null, "clip-rule", "evenodd");
        dia.clipPath.appendChild(path);
        $clipPathDefs.appendChild(dia.clipPath);
        const cp = `clip-path:url(#${id});`;
        return `-webkit-${cp}${cp}`;
    }
    return "";
}
