import {DrawingCommand, parseDrawing} from "./drawing";
import {IDialogue, IEffect, IPosition, IStylesMap} from "./ISubtitleTree";

export interface IParsedText {
    content:ITextContent[];
    clip:IClip;
    alignment:number;
    pos:IPosition;
    org:IPosition;
    move:number[];
    fad:number[];
    fade:number[];
    animationName?:string;
}

export interface ITextContent {
    text:string;
    animationName?:string;
    commands?:DrawingCommand[];
    tags:ITags;
}

export interface ITags {
    clip:IClip;
    b:number;
    i:number;
    u:number;
    s:number;
    fn:string;
    fe:number;
    k:number;
    kf:number;
    ko:number;
    kt:number;
    q:number;
    p:number;
    pbo:number;
    fs:number;
    fsp:number;
    fscx:number;
    fscy:number;
    fax:number;
    fay:number;
    frx:number;
    fry:number;
    frz:number;
    blur:number;
    xbord:number;
    xshad:number;
    ybord:number;
    yshad:number;
    a1:string;
    c1:string;
    a3:string;
    c3:string;
    a4:string;
    c4:string;
    t:ITct[];

    [key:string]:string|number|IClip|ITct[];
}

export interface IClip {
    inverse:boolean;
    scale:number;
    commands:DrawingCommand[];
    dots:number[];
}

interface IWithTags {
    tags:ITags;
}

interface ITct extends IWithTags {
    t1:number;
    t2:number;
    accel:number;
}

interface ICt extends IWithTags {
    text:string;
    commands?:DrawingCommand[];
}

export function parseTags(dialogue:IDialogue, styles:IStylesMap):IParsedText {
    const text = dialogue.Text.replace(/\\N/g, "<br>").replace(/\\h/g, "&nbsp;");
    let prevTags = JSON.parse(JSON.stringify(styles[dialogue.Style]._tags));
    const kv = text.split(/{([^{}]*?)}/);
    const dia:IParsedText = {content: []} as any;

    if (kv[0].length) {
    dia.content.push({
      text: kv[0],
      tags: prevTags
    });
  }
    for (let i = 1; i < kv.length; i += 2) {
        const ct:ICt = {
            text: kv[i + 1],
            tags: JSON.parse(JSON.stringify(prevTags))
        };

    /* JavaScript doesn't support split(/(?<!\(.*?)\\(?!.*?\))/) */
        const cmds = kv[i].split("\\");

        for (let j = 0; j < cmds.length; ++j) {
            if (/^t\(/.test(cmds[j]) && !/\)$/.test(cmds[j])) {
                while (!/\)$/.test(cmds[j + 1])) {
                    cmds[j] += "\\" + cmds[j + 1];
                    cmds.splice(j + 1, 1);
                }
                cmds[j] += "\\" + cmds[j + 1];
                cmds.splice(j + 1, 1);
            }
        }

        for (let j = 0; j < cmds.length; ++j) {
            const cmd = cmds[j];
            parseAnimatableTags(ct, cmd);
            if (ct.tags.clip) {
                dia.clip = ct.tags.clip;
            }
            if (/^b\d/.test(cmd)) {
                ct.tags.b = parseInt(cmd.match(/^b(\d+)/)[1], 10);
            }
            if (/^i\d/.test(cmd)) {
                ct.tags.i = parseInt(cmd[1], 10);
            }
            if (/^u\d/.test(cmd)) {
                ct.tags.u = parseInt(cmd[1], 10);
            }
            if (/^s\d/.test(cmd)) {
                ct.tags.s = parseInt(cmd[1], 10);
            }
            if (/^fn/.test(cmd)) {
                ct.tags.fn = cmd.match(/^fn(.*)/)[1];
            }
            if (/^fe/.test(cmd)) {
                ct.tags.fe = parseInt(cmd.match(/^fe(.*)/)[1], 10);
            }
            if (/^k\d/.test(cmd)) {
                ct.tags.k = parseInt(cmd.match(/^k(\d+)/)[1], 10);
            }
            if (/^K\d/.test(cmd)) {
                ct.tags.kf = parseInt(cmd.match(/^K(\d+)/)[1], 10);
            }
            if (/^kf\d/.test(cmd)) {
                ct.tags.kf = parseInt(cmd.match(/^kf(\d+)/)[1], 10);
            }
            if (/^ko\d/.test(cmd)) {
                ct.tags.ko = parseInt(cmd.match(/^ko(\d+)/)[1], 10);
            }
            if (/^kt\d/.test(cmd)) {
                ct.tags.kt = parseInt(cmd.match(/^kt(\d+)/)[1], 10);
            }
            if (/^q\d/.test(cmd)) {
                ct.tags.q = parseInt(cmd[1], 10);
            }
            if (/^p\d/.test(cmd)) {
                ct.tags.p = parseInt(cmd.match(/^p(\d+)/)[1], 10);
            }
            if (/^pbo/.test(cmd)) {
                ct.tags.pbo = parseInt(cmd.match(/^pbo(.*)/)[1], 10);
            }
            if (/^an\d/.test(cmd) && !dia.alignment) {
                dia.alignment = parseInt(cmd[2], 10);
            }
            if (/^a\d/.test(cmd) && !dia.alignment) {
                const val = parseInt(cmd.match(/^a(\d+)/)[1], 10);
                if (val < 4) {
                    dia.alignment = val;
                } else if (val > 8) {
                    dia.alignment = val - 5;
                } else {
                    dia.alignment = val + 2;
                }
            }
            if (/^pos/.test(cmd) && !dia.pos && !dia.move) {
                const p = cmd.replace(/\s/g, "").match(/^pos\((.*?)\)?$/)[1].split(",");
                dia.pos = {
                    x: parseInt(p[0], 10),
                    y: parseInt(p[1], 10)
                };
            }
            if (/^org/.test(cmd) && !dia.org) {
                const p = cmd.replace(/\s/g, "").match(/^org\((.*?)\)?$/)[1].split(",");
                dia.org = {
                    x: parseInt(p[0], 10),
                    y: parseInt(p[1], 10)
                };
            }
            if (/^move/.test(cmd) && !dia.move && !dia.pos) {
                const p = cmd.replace(/\s/g, "")
                    .match(/^move\((.*?)\)?$/)[1]
                    .split(",")
                    .map(function (x) {
                        return parseInt(x, 10);
                    });
                dia.pos = {
                    x: p[0],
                    y: p[1]
                };
                if (p.length === 4) {
                    p.push(0);
                    p.push((dialogue.End - dialogue.Start) * 1000);
                }
                dia.move = p;
            }
            if (/^fad\s*\(/.test(cmd) && !dia.fad) {
                dia.fad = cmd.replace(/\s/g, "")
                    .match(/^fad\((.*?)\)?$/)[1]
                    .split(",")
                    .map(function (x) {
                        return parseInt(x, 10);
                    });
            }
            if (/^fade/.test(cmd) && !dia.fade) {
                dia.fade = cmd.replace(/\s/g, "")
                    .match(/^fade\((.*?)\)?$/)[1]
                    .split(",")
                    .map(function (x) {
                        return parseInt(x, 10);
                    });
            }
            if (/^r/.test(cmd)) {
                const name = cmd.match(/^r(.*)/)[1];
                const rStyle = styles[name] || styles[dialogue.Style];
                ct.tags = JSON.parse(JSON.stringify(rStyle._tags));
            }
            if (/^t\(/.test(cmd)) {
                const args = cmd.replace(/\s/g, "").match(/^t\((.*)\)/)[1].split(",");
                if (!args[0]) {
                    continue;
                }
                const tcmds = args[args.length - 1].split("\\");
                const tct = {
                    t1: 0,
                    t2: (dialogue.End - dialogue.Start) * 1000,
                    accel: 1,
                    tags: {} as ITags
                };
                for (let k = tcmds.length - 1; k >= 0; k--) {
                    parseAnimatableTags(tct, tcmds[k]);
                }
                if (args.length === 2) {
                    tct.accel = parseInt(args[0], 10);
                }
                if (args.length === 3) {
                    tct.t1 = parseInt(args[0], 10);
                    tct.t2 = parseInt(args[1], 10);
                }
                if (args.length === 4) {
                    tct.t1 = parseInt(args[0], 10);
                    tct.t2 = parseInt(args[1], 10);
                    tct.accel = parseInt(args[2], 10);
                }
                if (!ct.tags.t) {
                    ct.tags.t = [];
                }
                ct.tags.t.push(tct);
            }
        }

        if (ct.tags.t) {
            for (let j = 0; j < ct.tags.t.length - 1; ++j) {
                for (let k = j + 1; k < ct.tags.t.length; ++k) {
                    if (ct.tags.t[j].t1 === ct.tags.t[k].t1 &&
                        ct.tags.t[j].t2 === ct.tags.t[k].t2) {
                        for (const l in ct.tags.t[k].tags) {
                            if ((ct.tags.t[k].tags as any).hasOwnProperty(l)) {
                                ct.tags.t[j].tags[l] = ct.tags.t[k].tags[l];
                            }
                        }
                        ct.tags.t.splice(k, 1);
                    }
                }
            }
        }

        if (dialogue.Effect && (dialogue.Effect as IEffect).name === "banner") {
            ct.tags.q = 2;
        }
        if (!ct.tags.p) {
            ct.text = ct.text.replace(/\s/g, "&nbsp;");
        } else {
            ct.commands = parseDrawing(ct.text);
        }

        ct.text = ct.text.replace(/\\n/g, (ct.tags.q === 2) ? "<br>" : "&nbsp;");
        prevTags = ct.tags;
        dia.content.push(ct);
    }
    return dia;
}


function parseAnimatableTags(ct:IWithTags, cmd:string) {
    if (/^fs[\d+\-]/.test(cmd)) {
        const val = cmd.match(/^fs(.*)/)[1];
        if (/^\d/.test(val)) {
            ct.tags.fs = parseInt(val, 10);
        }

        if (/^\+|-/.test(val)) {
            ct.tags.fs *= (parseInt(val, 10) > -10 ? (1 + parseInt(val, 10) / 10) : 1);
        }
    }
    if (/^fsp/.test(cmd)) {
        ct.tags.fsp = parseInt(cmd.match(/^fsp(.*)/)[1], 10);
    }
    if (/^fscx/.test(cmd)) {
        ct.tags.fscx = parseInt(cmd.match(/^fscx(.*)/)[1], 10);
    }
    if (/^fscy/.test(cmd)) {
        ct.tags.fscy = parseInt(cmd.match(/^fscy(.*)/)[1], 10);
    }
    if (/^fsp/.test(cmd)) {
        ct.tags.fsp = parseInt(cmd.match(/^fsp(.*)/)[1], 10);
    }
    if (/^frx/.test(cmd)) {
        ct.tags.frx = parseInt(cmd.match(/^frx(.*)/)[1], 10);
    }
    if (/^fry/.test(cmd)) {
        ct.tags.fry = parseInt(cmd.match(/^fry(.*)/)[1], 10);
    }
    if (/^fr[z\d\-]/.test(cmd)) {
        ct.tags.frz = parseInt(cmd.match(/^frz?(.*)/)[1], 10);
    }
    if (/^blur\d/.test(cmd)) {
        ct.tags.blur = parseInt(cmd.match(/^blur(.*)/)[1], 10);
    }
    if (/^be\d/.test(cmd)) {
        ct.tags.blur = parseInt(cmd.match(/^be(.*)/)[1], 10);
    }
    if (ct.tags.blur < 0) {
        ct.tags.blur = 0;
    }
    if (/^fax/.test(cmd)) {
        ct.tags.fax = parseInt(cmd.match(/^fax(.*)/)[1], 10);
    }
    if (/^fay/.test(cmd)) {
        ct.tags.fay = parseInt(cmd.match(/^fay(.*)/)[1], 10);
    }
    if (/^x*bord/.test(cmd)) {
        ct.tags.xbord = parseInt(cmd.match(/^x*bord(.*)/)[1], 10);
    }
    if (/^y*bord/.test(cmd)) {
        ct.tags.ybord = parseInt(cmd.match(/^y*bord(.*)/)[1], 10);
    }
    if (ct.tags.xbord < 0) {
        ct.tags.xbord = 0;
    }
    if (ct.tags.ybord < 0) {
        ct.tags.ybord = 0;
    }
    if (/^x*shad/.test(cmd)) {
        ct.tags.xshad = parseInt(cmd.match(/^x*shad(.*)/)[1], 10);
    }
    if (/^y*shad/.test(cmd)) {
        ct.tags.yshad = parseInt(cmd.match(/^y*shad(.*)/)[1], 10);
    }
    if (/^\d?c&?H?[0-9a-f]+/i.test(cmd)) {
        const args = cmd.match(/^(\d?)c&?H?(\w+)/);
        if (!args[1]) {
            args[1] = "1";
        }
        while (args[2].length < 6) {
            args[2] = "0" + args[2];
        }
        ct.tags["c" + args[1]] = args[2];
    }
    if (/^\da&?H?[0-9a-f]+/i.test(cmd)) {
        const args = cmd.match(/^(\d)a&?H?(\w\w)/);
        ct.tags[`a${args[1]}`] = args[2];
    }
    if (/^alpha&?H?[0-9a-f]+/i.test(cmd)) {
        for (let i = 1; i <= 4; i++) {
            ct.tags[`a${i}`] = cmd.match(/^alpha&?H?(\w\w)/)[1];
    }
  }
    if (/^i?clip/.test(cmd)) {
        const p = cmd.match(/^i?clip\s*\((.*)\)/)[1].split(/\s*,\s*/);

        ct.tags.clip = {
            inverse: /iclip/.test(cmd),
            scale: 1,
            commands: null,
            dots: null,
        };

        if (p.length === 1) {
            ct.tags.clip.commands = parseDrawing(p[0]);
        }

        if (p.length === 2) {
            ct.tags.clip.scale = parseInt(p[0], 10);
            ct.tags.clip.commands = parseDrawing(p[1]);
        }

        if (p.length === 4) {
            ct.tags.clip.dots = [parseInt(p[0], 10), parseInt(p[1], 10), parseInt(p[2], 10), parseInt(p[3], 10)];
        }
    }
}
