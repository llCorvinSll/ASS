import {getRealFontSize} from "./font-size";
import {toRGBA} from "./rgba";
import {createTransform} from "./transform";
import {createClipPath} from "./clip";
import {getChannel} from "./collision";
import {createCSSBS} from "./border-and-shadow";
import {createDrawing} from "./drawing";
import {IDialogue, IEffect, IPosition, ISubtitleTree} from "../parser/ISubtitleTree";
import {IClip, IParsedText} from "../parser/tags";


interface IClipElement {
    className:string;
    cssText:string;
}

interface IDialogueNode {
    className?:string;
}


export interface IDialogueToRender {
    Alignment:number;
    nodeElement:IDialogueNode; // HTMLDivElement;
    node:HTMLDivElement;
    clipElement?:IClipElement;
    Layer:number;
    Start:number;
    End:number;
    BorderStyle:number;
    MarginL:number;
    MarginR:number;
    MarginV:number;
    Effect:IEffect | string;
    parsedText:IParsedText;
    animationName:string;
    move:number[];
    fad:number[];
    fade:number[];
    pos:IPosition;
    org:IPosition;
    clip:IClip;
    channel:number;
    t:boolean;
    width?:number;
    height?:number;
    clipPath?:SVGClipPathElement;

    x?:number;
    y?:number;

    hasRotate?:boolean;
}


interface IRenderOptions {
    tree:ISubtitleTree;
    scale:number;
    width:number;
    height:number;
    currentTime:number;
}

export function renderer(this:void, dialogue:IDialogue, options:IRenderOptions):IDialogueToRender {
    const pt = dialogue._parsedText;
    const s = options.tree.V4Styles.Style[dialogue.Style];
    const dia:IDialogueToRender = {
        nodeElement: {}, // document.createElement("div"),
        node: document.createElement("div"),
        Alignment: pt.alignment || s.Alignment,
        Layer: dialogue.Layer,
        Start: dialogue.Start,
        End: dialogue.End,
        BorderStyle: s.BorderStyle,
        MarginL: dialogue.MarginL || s.MarginL,
        MarginR: dialogue.MarginR || s.MarginR,
        MarginV: dialogue.MarginV || s.MarginV,
        Effect: dialogue.Effect,
        parsedText: pt,
        animationName: pt.animationName,
        move: pt.move,
        fad: pt.fad,
        fade: pt.fade,
        pos: pt.pos || (pt.move ? {x: 0, y: 0} : null),
        org: pt.org,
        clip: pt.clip,
        channel: 0,
        t: false,
    };
    dia.nodeElement.className = "ASS-dialogue";

    setTagsStyle(dia, {
        currentTime: options.currentTime,
        tree: options.tree,
        scale: options.scale
    });

    const bcr = dia.node.getBoundingClientRect();
    dia.width = bcr.width;
    dia.height = bcr.height;

    setDialoguePosition(dia, {
        scale: options.scale,
        width: options.width,
        height: options.height,
        currentTime: options.currentTime
    });
    setDialogueStyle(dia, {
        width: options.width,
        currentTime: options.currentTime,
        scale: options.scale
    });
    setTransformOrigin(dia);
    setClipPath(dia, {
        tree: options.tree
    });

    return dia;
}


interface ISetTagsStyleOptions {
    currentTime:number;
    scale:number;
    tree:ISubtitleTree;
}

function setTagsStyle(this:void, dia:IDialogueToRender, options:ISetTagsStyleOptions) {
    const df = document.createDocumentFragment();
    for (let len = dia.parsedText.content.length, i = 0; i < len; ++i) {
        const ct = dia.parsedText.content[i];
        if (!ct.text) {
            continue;
        }
        const t = ct.tags;
        const cssText = ["display:inline-block"];
        const vct = options.currentTime;

        if (!t.p) {
            cssText.push(`font-family:'${t.fn}',Arial`);
            const rfs = options.scale * getRealFontSize(t.fs, t.fn);
            cssText.push(`font-size:${rfs}px`);
            cssText.push(`color:${toRGBA(t.a1 + t.c1)}`);
            const sisbas = options.tree.ScriptInfo.ScaledBorderAndShadow;
            const sbas = /Yes/i.test(sisbas) ? options.scale : 1;
            if (dia.BorderStyle === 1) {
                cssText.push(`text-shadow:${createCSSBS(t, sbas)}`);
            }
            if (dia.BorderStyle === 3) {
                cssText.push(`background-color:${toRGBA(t.a3 + t.c3)}`);
                cssText.push(`box-shadow:${createCSSBS(t, sbas)}`);
            }
            if (t.b === 0) {
                cssText.push("font-weight:normal");
            } else if (t.b === 1) {
                cssText.push("font-weight:bold");
            } else {
                cssText.push(`font-weight:${t.b}`);
            }
            cssText.push("font-style:" + (t.i ? "italic" : "normal"));
            if (t.u && t.s) {
                cssText.push("text-decoration:underline line-through");
            } else if (t.u) {
                cssText.push("text-decoration:underline");
            } else if (t.s) {
                cssText.push("text-decoration:line-through");
            }
            cssText.push(`letter-spacing:${options.scale * t.fsp}px`);
            if (t.q === 0) {
                // TODO
            }
            if (t.q === 1) {
                cssText.push("word-break:break-all");
                cssText.push("white-space:normal");
            }
            if (t.q === 2) {
                cssText.push("word-break:normal");
                cssText.push("white-space:nowrap");
            }
            if (t.q === 3) {
                // TODO
            }
        }

        if (t.fax || t.fay ||
            t.frx || t.fry || t.frz ||
            t.fscx !== 100 || t.fscy !== 100) {
            const tf = createTransform(t);
            ["", "-webkit-"].forEach(function (v) {
                cssText.push(v + "transform:" + tf);
            });
            if (!t.p) {
                cssText.push("transform-style:preserve-3d");
                cssText.push("word-break:normal");
                cssText.push("white-space:nowrap");
            }
        }
        if (t.t) {
            ["", "-webkit-"].forEach((v) => {
                const delay = Math.min(0, dia.Start - vct);
                cssText.push(`${v}animation-name:${ct.animationName}`);
                cssText.push(`${v}animation-duration:${dia.End - dia.Start}s`);
                cssText.push(`${v}animation-delay:${delay}s`);
                cssText.push(`${v}animation-timing-function:linear`);
                cssText.push(`${v}animation-iteration-count:1`);
                cssText.push(`${v}animation-fill-mode:forwards`);
            });
            dia.t = true;
        }

        dia.hasRotate = /"fr[xyz]":[^0]/.test(JSON.stringify(t));
        const parts = ct.text.split("<br>");
        for (let lenj = parts.length, j = 0; j < lenj; j++) {
            if (j) {
                df.appendChild(document.createElement("br"));
            }
            if (!parts[j]) {
                continue;
            }
            const cn:HTMLElement = document.createElement("span");
            cn.dataset.hasRotate = `${dia.hasRotate}`;

            if (t.p) {
                cn.appendChild(createDrawing(cn, ct, {
                    scale: options.scale,
                    tree: options.tree
                }));
                if (t.pbo) {
                    const pbo = options.scale * -t.pbo * (t.fscy || 100) / 100;
                    cssText.push(`vertical-align:${pbo}px`);
                }
            } else {
                cn.innerHTML = parts[j];
            }
            cn.style.cssText += cssText.join(";");
            df.appendChild(cn);
        }
    }
    dia.node.appendChild(df);
}

interface ISetDialoguePosition {
    height:number;
    width:number;
    scale:number;
    currentTime:number;
    // video:HTMLVideoElement;
}

function setDialoguePosition(this:void, dia:IDialogueToRender, options:ISetDialoguePosition) {
    const effect:IEffect = dia.Effect as IEffect;
    if (effect) {
        if (effect.name === "banner") {
            if (dia.Alignment <= 3) {
                dia.y = options.height - dia.height - dia.MarginV;
            }
            if (dia.Alignment >= 4 && dia.Alignment <= 6) {
                dia.y = (options.height - dia.height) / 2;
            }
            if (dia.Alignment >= 7) {
                dia.y = dia.MarginV;
            }
            if (effect.lefttoright) {
                dia.x = -dia.width;
            } else {
                dia.x = options.width;
            }
        }
        if (/^scroll/.test(effect.name)) {
            dia.y = /up/.test(effect.name) ? options.height : -dia.height;
            if (dia.Alignment % 3 === 1) {
                dia.x = 0;
            }
            if (dia.Alignment % 3 === 2) {
                dia.x = (options.width - dia.width) / 2;
            }
            if (dia.Alignment % 3 === 0) {
                dia.x = options.width - dia.width;
            }
        }
    } else {
        if (dia.pos) {
            if (dia.Alignment % 3 === 1) {
                dia.x = options.scale * dia.pos.x;
            }
            if (dia.Alignment % 3 === 2) {
                dia.x = options.scale * dia.pos.x - dia.width / 2;
            }
            if (dia.Alignment % 3 === 0) {
                dia.x = options.scale * dia.pos.x - dia.width;
            }
            if (dia.Alignment <= 3) {
                dia.y = options.scale * dia.pos.y - dia.height;
            }
            if (dia.Alignment >= 4 && dia.Alignment <= 6) {
                dia.y = options.scale * dia.pos.y - dia.height / 2;
            }
            if (dia.Alignment >= 7) {
                dia.y = options.scale * dia.pos.y;
            }
        } else {
            if (dia.Alignment % 3 === 1) {
                dia.x = 0;
            }
            if (dia.Alignment % 3 === 2) {
                dia.x = (options.width - dia.width) / 2;
            }
            if (dia.Alignment % 3 === 0) {
                dia.x = options.width - dia.width - options.scale * dia.MarginR;
            }
            if (dia.t) {
                if (dia.Alignment <= 3) {
                    dia.y = options.height - dia.height - dia.MarginV;
                }
                if (dia.Alignment >= 4 && dia.Alignment <= 6) {
                    dia.y = (options.height - dia.height) / 2;
                }
                if (dia.Alignment >= 7) {
                    dia.y = dia.MarginV;
                }
            } else {
                dia.y = getChannel(dia, {
                    width: options.width,
                    height: options.height,
                    scale: options.scale,
                    currentTime: options.currentTime
                });
            }
        }
    }
}


interface ISetDialogueStyle {
    // video:HTMLVideoElement;
    currentTime:number;
    width:number;
    scale:number;
}

function setDialogueStyle(this:void, dia:IDialogueToRender, options:ISetDialogueStyle) {
    const cssText:string[] = [];
    const vct = options.currentTime;
    if (dia.Layer) {
        cssText.push("z-index:" + dia.Layer);
    }
    if (dia.move || dia.fad || dia.fade || dia.Effect) {
        ["", "-webkit-"].forEach((v) => {
            cssText.push(`${v}animation-name:${dia.animationName}`);
            cssText.push(`${v}animation-duration:${dia.End - dia.Start}s`);
            cssText.push(`${v}animation-delay:${Math.min(0, dia.Start - vct)}s`);
            cssText.push(`${v}animation-timing-function:linear`);
            cssText.push(`${v}animation-iteration-count:1`);
            cssText.push(`${v}animation-fill-mode:forwards`);
        });
    }

    if (dia.Alignment % 3 === 1) {
        cssText.push("text-align:left");
    }
    if (dia.Alignment % 3 === 2) {
        cssText.push("text-align:center");
    }
    if (dia.Alignment % 3 === 0) {
        cssText.push("text-align:right");
    }

    if (!dia.Effect) {
        const mw = options.width - options.scale * (dia.MarginL + dia.MarginR);
        cssText.push(`max-width:${mw}px`);
        if (!dia.pos) {
            if (dia.Alignment % 3 === 1) {
                cssText.push(`margin-left:${options.scale * dia.MarginL}px`);
            }
            if (dia.Alignment % 3 === 0) {
                cssText.push(`margin-right:${options.scale * dia.MarginR}px`);
            }
            if (dia.width > options.width - options.scale * (dia.MarginL + dia.MarginR)) {
                cssText.push(`margin-left:${options.scale * dia.MarginL}px`);
                cssText.push(`margin-right:${options.scale * dia.MarginR}px`);
            }
        }
    }
    cssText.push(`width:${dia.width}px`);
    cssText.push(`height:${dia.height}px`);
    cssText.push(`left:${dia.x}px`);
    cssText.push(`top:${dia.y}px`);
    dia.node.style.cssText = cssText.join(";");
}

function setTransformOrigin(dia:IDialogueToRender) {
    if (!dia.hasRotate) {
        return;
    }
    if (!dia.org) {
        dia.org = {x: 0, y: 0};
        if (dia.Alignment % 3 === 1) {
            dia.org.x = dia.x;
        }
        if (dia.Alignment % 3 === 2) {
            dia.org.x = dia.x + dia.width / 2;
        }
        if (dia.Alignment % 3 === 0) {
            dia.org.x = dia.x + dia.width;
        }
        if (dia.Alignment <= 3) {
            dia.org.y = dia.y + dia.height;
        }

        if (dia.Alignment >= 4 && dia.Alignment <= 6) {
            dia.org.y = dia.y + dia.height / 2;
        }
        if (dia.Alignment >= 7) {
            dia.org.y = dia.y;
        }
    }
    const children = dia.node.childNodes;
    for (let i = children.length - 1; i >= 0; i--) {
        const html_child = children[i] as HTMLElement;

        if (html_child.dataset.hasRotate) {
            // It's not extremely precise for offsets are round the value to an integer.
            const tox = dia.org.x - dia.x - html_child.offsetLeft;
            const toy = dia.org.y - dia.y - html_child.offsetTop;
            const to = `transform-origin:${tox}px ${toy}px;`;
            html_child.style.cssText += `-webkit-${to}${to}`;
        }
    }
}


interface ISetClipPathOptions {
    tree:ISubtitleTree;
}

function setClipPath(this:void, dia:IDialogueToRender, options:ISetClipPathOptions):void {
    if (dia.clip) {
        dia.clipElement = {
            className: "ASS-fix-objectBoundingBox",
            cssText: createClipPath(dia, {
                tree: options.tree
            })
        };
    }
}
