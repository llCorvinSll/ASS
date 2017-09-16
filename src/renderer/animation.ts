import {generateUUID} from "../uuid";
import {getRealFontSize} from "./font-size";
import {createTransform} from "./transform";
import {toRGBA} from "./rgba";
import {createCSSBS} from "./border-and-shadow";
import {IEffect, ISubtitleTree} from "../parser/ISubtitleTree";
import {ITags} from "../parser/tags";

const $animation = document.createElement("style");
$animation.type = "text/css";
$animation.className = "ASS-animation";
document.head.appendChild($animation);


class KeyFrames {
    public set(percentage:string, property:string, value:string | number) {
        if (!this.obj[percentage]) {
            this.obj[percentage] = {};
        }
        this.obj[percentage][property] = value;
    }

    public toString() {
        const arr = ["{"];
        for (const percentage in this.obj) {
            arr.push(percentage + "{");
            for (const property in this.obj[percentage]) {
                const rule = `${property}:${this.obj[percentage][property]};`;
                if (property === "transform") {
                    arr.push(`-webkit-${rule}`);
                }
                arr.push(rule);
            }
            arr.push("}");
        }
        arr.push("}\n");
        return arr.join("");
    }

    private obj:{ [key:string]:{ [key:string]:string | number } } = {};
}

function getName(str:string, kfObj:any) {
    for (const name in kfObj) {
        if (kfObj[name] === str) {
            return name;
        }
    }
    return null;
}

interface IAnimationOptions {
    scale:number;
    resolution:{x:number, y:number};
}

export function createAnimation(this:void, tree:ISubtitleTree, options:IAnimationOptions) {
    const kfObj:{[key:string]:string} = {};

    for (let i = tree.Events.Dialogue.length - 1; i >= 0; i--) {
        const dia = tree.Events.Dialogue[i];
        const pt = dia._parsedText;
        const dur = (dia.End - dia.Start) * 1000;
        let kf = new KeyFrames();
        let kfStr = "";
        const t = [];

        if (dia.Effect && !pt.move) {
            const eff = dia.Effect as IEffect;

            if (eff.name === "banner") {
                const tx = options.scale * (dur / eff.delay) * (eff.lefttoright ? 1 : -1);
                kf.set("0.000%", "transform", "translateX(0)");
                kf.set("100.000%", "transform", `translateX(${tx}px)`);
            }

            if (/^scroll/.test(eff.name)) {
                const updown = /up/.test(eff.name) ? -1 : 1;
                const y1 = eff.y1;
                const y2 = eff.y2 || options.resolution.y;
                const tFrom = `translateY(${options.scale * y1 * updown}px)`;
                const tTo = `translateY(${options.scale * y2 * updown}px)`;
                const dp = (y2 - y1) / (dur / eff.delay) * 100;

                t[1] = Math.min(100, dp).toFixed(3) + "%";
                kf.set("0.000%", "transform", tFrom);
                kf.set(t[1], "transform", tTo);
                kf.set("100.000%", "transform", tTo);
            }
        }

        if (!pt.fad && pt.fade && pt.fade.length === 2) {
            pt.fad = pt.fade;
        }

        if (pt.fad && pt.fad.length === 2) {
            t[0] = "0.000%";
            t[1] = `${Math.min(100, pt.fad[0] / dur * 100).toFixed(3)}%`;
            t[2] = `${Math.max(0, (dur - pt.fad[1]) / dur * 100).toFixed(3)}%`;
            t[3] = "100.000%";
            kf.set(t[0], "opacity", 0);
            kf.set(t[1], "opacity", 1);
            kf.set(t[2], "opacity", 1);
            kf.set(t[3], "opacity", 0);
        }

        if (pt.fade && pt.fade.length === 7) {
            t[0] = "0.000%";
            t[5] = "100.000%";

            for (let j = 1; j <= 4; j++) {
                t[j] = Math.min(100, pt.fade[j + 2] / dur * 100).toFixed(3) + "%";
            }
            for (let j = 0; j <= 5; j++) {
                kf.set(t[j], "opacity", 1 - pt.fade[j >> 1] / 255);
            }
        }

        if (pt.move && pt.move.length === 6) {
            if (!pt.pos) {
                pt.pos = {x: 0, y: 0};
            }

            if (pt.move.length === 6) {
                t[0] = "0.000%";
                t[1] = `${Math.min(100, pt.move[4] / dur * 100).toFixed(3)}%`;
                t[2] = `${Math.min(100, pt.move[5] / dur * 100).toFixed(3)}%`;
                t[3] = "100.000%";

                for (let j = 0; j <= 3; j++) {
                    const tx = options.scale * (pt.move[j < 2 ? 0 : 2] - pt.pos.x);
                    const ty = options.scale * (pt.move[j < 2 ? 1 : 3] - pt.pos.y);
                    kf.set(t[j], "transform", `translate(${tx}px, ${ty}px)`);
                }
            }
        }

        kfStr = kf.toString();

        let name = getName(kfStr, kfObj);
        if (name === null) {
            name = "ASS-" + generateUUID();
            kfObj[name] = kfStr;
        }

        pt.animationName = name;

        for (let j = pt.content.length - 1; j >= 0; j--) {
            kf = new KeyFrames();
            const tags = JSON.parse(JSON.stringify(pt.content[j].tags));

            if (tags.t) {
                for (let k = tags.t.length - 1; k >= 0; k--) {
                    const ttags = JSON.parse(JSON.stringify(tags.t[k].tags));
                    t[0] = "0.000%";
                    t[1] = `${Math.min(100, tags.t[k].t1 / dur * 100).toFixed(3)}%`;
                    t[2] = `${Math.min(100, tags.t[k].t2 / dur * 100).toFixed(3)}%`;
                    t[3] = "100.000%";
                    if (ttags.fs) {
                        const fsFrom = `${options.scale * getRealFontSize(tags.fs, tags.fn)}px`;
                        const fsTo = `${options.scale * getRealFontSize(ttags.fs, tags.fn)}px`;

                        kf.set(t[0], "font-size", fsFrom);
                        kf.set(t[1], "font-size", fsFrom);
                        kf.set(t[2], "font-size", fsTo);
                        kf.set(t[3], "font-size", fsTo);
                    }

                    if (ttags.fsp) {
                        const fspFrom = `${options.scale * tags.fsp}px`;
                        const fspTo = `${options.scale * ttags.fsp}px`;

                        kf.set(t[0], "letter-spacing", fspFrom);
                        kf.set(t[1], "letter-spacing", fspFrom);
                        kf.set(t[2], "letter-spacing", fspTo);
                        kf.set(t[3], "letter-spacing", fspTo);
                    }

                    if (ttags.c1 || ttags.a1) {
                        ttags.c1 = ttags.c1 || tags.c1;
                        ttags.a1 = ttags.a1 || tags.a1;

                        const cFrom = toRGBA(tags.a1 + tags.c1);
                        const cTo = toRGBA(ttags.a1 + ttags.c1);

                        kf.set(t[0], "color", cFrom);
                        kf.set(t[1], "color", cFrom);
                        kf.set(t[2], "color", cTo);
                        kf.set(t[3], "color", cTo);
                    }

                    if (ttags.a1 &&
                        ttags.a1 === ttags.a2 &&
                        ttags.a2 === ttags.a3 &&
                        ttags.a3 === ttags.a4) {
                        const aFrom = 1 - parseInt(tags.a1, 16) / 255;
                        const aTo = 1 - parseInt(ttags.a1, 16) / 255;

                        kf.set(t[0], "opacity", aFrom);
                        kf.set(t[1], "opacity", aFrom);
                        kf.set(t[2], "opacity", aTo);
                        kf.set(t[3], "opacity", aTo);
                    }

                    const bsTags = ["c3", "a3", "c4", "a4",
                  "xbord", "ybord", "xshad", "yshad", "blur"];
                    const hasTextShadow = function (current_tags:ITags) {
                        for (let kk = bsTags.length - 1; kk >= 0; --kk) {
                            if (current_tags[bsTags[kk]] !== undefined) {
                                return true;
                            }
                        }

                        return false;
                    };

                    if (hasTextShadow(ttags)) {
                        bsTags.forEach(function (e) {
                            if (ttags[e] === undefined) {
                                ttags[e] = tags[e];
                            }
                        });

                        const sisbas = tree.ScriptInfo.ScaledBorderAndShadow;
                        const sbas = /Yes/i.test(sisbas as string) ? options.scale : 1;
                        const bsFrom = createCSSBS(tags, sbas);
                        const bsTo = createCSSBS(ttags, sbas);

                        kf.set(t[0], "text-shadow", bsFrom);
                        kf.set(t[1], "text-shadow", bsFrom);
                        kf.set(t[2], "text-shadow", bsTo);
                        kf.set(t[3], "text-shadow", bsTo);
                    }

                    if ((ttags.fscx && ttags.fscx !== 100) ||
                        (ttags.fscy && ttags.fscy !== 100) ||
                        ttags.frx !== undefined ||
                        ttags.fry !== undefined ||
                        ttags.frz !== undefined ||
                        ttags.fax !== undefined ||
                        ttags.fay !== undefined) {
                        const tfTags = ["fscx", "fscy", "frx", "fry", "frz", "fax", "fay"];
                        tfTags.forEach((e) => {
                            if (ttags[e] === undefined) {
                                ttags[e] = tags[e];
                            }
                        });

                        if (tags.p) {
                            ttags.fscx = (ttags.fscx / tags.fscx) * 100;
                            ttags.fscy = (ttags.fscy / tags.fscy) * 100;
                            tags.fscx = tags.fscy = 100;
                        }

                        const tFrom = createTransform(tags);
                        const tTo = createTransform(ttags);

                        kf.set(t[0], "transform", tFrom);
                        kf.set(t[1], "transform", tFrom);
                        kf.set(t[2], "transform", tTo);
                        kf.set(t[3], "transform", tTo);
                    }
                }
            }

            kfStr = kf.toString();
            let animation_name = getName(kfStr, kfObj);
            if (animation_name === null) {
                animation_name = "ASS-" + generateUUID();
                kfObj[animation_name] = kfStr;
            }
            pt.content[j].animationName = animation_name;

        }
    }

    const cssText = [];
    for (const name in kfObj) {
        if (kfObj.hasOwnProperty(name)) {
            cssText.push(`@keyframes ${name}${kfObj[name]}`);
            cssText.push(`@-webkit-keyframes ${name}${kfObj[name]}`);
        }
    }
    $animation.innerHTML = cssText.join("");
}
