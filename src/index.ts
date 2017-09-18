import {parseASS} from "./parser/ass";
import {ASS_CSS, CAF, channel, RAF, RAFID} from "./global";
import {createAnimation} from "./renderer/animation";
import {IDialogueToRender, renderer} from "./renderer/renderer";
import {IEffect, ISubtitleTree} from "./parser/ISubtitleTree";
import {$ffs} from "./renderer/font-size";
import {$clipPath, $clipPathDefs} from "./renderer/clip";


interface IInitOptions {
    resample:string;
}

export default class ASSParser {
    constructor() {
        this.tree = {} as any;
        this.position = 0;
        this.runline = [];
        this.scale = 1;
        this._resample = "video_height";
        this.resolution = {x: null, y: null};
        this.container = document.createElement("div");
        this.container.className = "ASS-container";
        this.container.appendChild($ffs);
        this.container.appendChild($clipPath);
        this.stage = document.createElement("div");
        this.stage.className = "ASS-stage ASS-animation-paused";
    }


    public init(data:string, video:HTMLVideoElement, opt:IInitOptions) {
        if (!data || video.nodeName !== "VIDEO") {
            return;
        }

        if (!this.video) {
            const isPlaying = !video.paused;
            this.video = video;
            this.video.parentNode.insertBefore(this.container, this.video);
            this.container.appendChild(this.video);
            this.container.appendChild(this.stage);
            this.video.addEventListener("seeking",  () => {
                this._seek();
            });
            this.video.addEventListener("play",  () =>  {
                this._play();
            });
            this.video.addEventListener("pause", () =>  {
                this._pause();
            });
            if (isPlaying && this.video.paused) {
                this.video.play();
            }
        }

        this.tree = parseASS(data);
        if (!this.tree.ScriptInfo.PlayResX || !this.tree.ScriptInfo.PlayResY) {
            this.tree.ScriptInfo.PlayResX = this.video.videoWidth;
            this.tree.ScriptInfo.PlayResY = this.video.videoHeight;
        }

        if (opt && opt.resample) {
            this._resample = opt.resample;
        }

        let $style:HTMLStyleElement = document.getElementById("ASS-style") as HTMLStyleElement;
        if (!$style) {
            $style = document.createElement("style");
            $style.type = "text/css";
            $style.id = "ASS-style";
            $style.appendChild(document.createTextNode(ASS_CSS));
            document.head.appendChild($style);
        }

        this.resize();
        return this;
    }

    private resize() {
        if (!this.video) {
            return;
        }
        const cw = this.video.clientWidth;
        const ch = this.video.clientHeight;
        const vw = this.video.videoWidth;
        const vh = this.video.videoHeight;
        const sw = this.tree.ScriptInfo.PlayResX;
        const sh = this.tree.ScriptInfo.PlayResY;
        const videoScale = Math.min(cw / vw, ch / vh);

        this.resolution.x = sw;
        this.resolution.y = sh;
        if (this.resample === "video_width") {
            this.resolution.y = sw / vw * vh;
        }
        if (this.resample === "video_height") {
            this.resolution.x = sh / vh * vw;
        }
        this.scale = Math.min(cw / this.resolution.x, ch / this.resolution.y);
        if (this.resample === "script_width") {
            this.scale = videoScale * (vw / this.resolution.x);
        }
        if (this.resample === "script_height") {
            this.scale = videoScale * (vh / this.resolution.y);
        }
        this.width = this.scale * this.resolution.x;
        this.height = this.scale * this.resolution.y;

        let cssText = `width:${cw}px;height:${ch}px;`;
        this.container.style.cssText = cssText;
        cssText = `width:${this.width}px;height:${this.height}px;top:${(ch - this.height) / 2}px;left:${(cw - this.width) / 2}px;`;
        this.stage.style.cssText = cssText;
        $clipPath.style.cssText = cssText;
        $clipPath.setAttributeNS(null, "viewBox", [0, 0, sw, sh].join(" "));

        createAnimation(this.tree, {
            scale: this.scale,
            resolution: this.resolution
        });
        this._seek();
        return this;
    }

    public show() {
        this.stage.style.visibility = "visible";
        return this;
    }

    public hide() {
        this.stage.style.visibility = "hidden";
        return this;
    }


    private _play() {
        const that = this;
        const frame = function () {
            that._launch();
            RAFID = RAF(frame);
        };
        RAFID = RAF(frame);
        this.stage.classList.remove("ASS-animation-paused");
    }

    private _pause() {
        CAF(RAFID);
        RAFID = 0;
        this.stage.classList.add("ASS-animation-paused");
    }

    private _seek() {
        const vct = this.video.currentTime;
        const dias = this.tree.Events.Dialogue;
        while (this.stage.lastChild) {
            this.stage.removeChild(this.stage.lastChild);
        }
        while ($clipPathDefs.lastChild) {
            $clipPathDefs.removeChild($clipPathDefs.lastChild);
        }
        this.runline = [];
        channel = [];
        this.position = (function () {
            let from = 0;
            const to = dias.length - 1;
            /* tslint:disable-next-line:no-bitwise */
            while (from + 1 < to && vct > dias[(to + from) >> 1].End) {
                /* tslint:disable-next-line:no-bitwise */
                from = (to + from) >> 1;
            }
            if (!from) {
                return 0;
            }
            for (let i = from; i < to; ++i) {
                if (dias[i].End > vct && vct >= dias[i].Start ||
                    i && dias[i - 1].End < vct && vct < dias[i].Start) {
                    return i;
                }
            }
            return to;
        })();
        this._launch();
    }

    private _launch() {
        const vct = this.video.currentTime;
        const dias = this.tree.Events.Dialogue;
        for (let i = this.runline.length - 1; i >= 0; --i) {
            const dia = this.runline[i];
            let end = dia.End;

            const effect = dia.Effect as IEffect;

            if (effect && /scroll/.test(effect.name)) {
                const effDur = (effect.y2 - effect.y1) / (1000 / effect.delay);
                end = Math.min(end, dia.Start + effDur);
            }
            if (end < vct) {
                this.stage.removeChild(dia.node);
                if (dia.clipPath) {
                    $clipPathDefs.removeChild(dia.clipPath);
                }
                this.runline.splice(i, 1);
            }
        }
        while (this.position < dias.length && vct >= dias[this.position].Start) {
            if (vct < dias[this.position].End) {
                const dia = renderer(dias[this.position], {
                    tree: this.tree,
                    scale: this.scale,
                    currentTime: this.video.currentTime,
                    width: this.width,
                    height: this.height
                });

                this.stage.appendChild(dia.node);
                if (dia.clipElement) {
                    const clip = document.createElement("div");
                    clip.className = dia.clipElement.className;
                    clip.style.cssText += dia.clipElement.cssText;

                    this.stage.insertBefore(clip, dia.node);
                    clip.appendChild(dia.node);

                }

                this.runline.push(dia);
            }
            ++this.position;
        }
    }

    public get resample() {
        const r = this._resample;
        if (r === "video_width" ||
            r === "video_height" ||
            r === "script_width" ||
            r === "script_height") {
            return r;
        } else {
            return "video_height";
        }
    }

    public set resample(r:string) {
        if (r === this._resample) {
            return;
        }
        if (r === "video_width" ||
            r === "video_height" ||
            r === "script_width" ||
            r === "script_height") {
            this._resample = r;
            this.resize();
        }
    }


    private width:number;
    private height:number;
    private tree:ISubtitleTree;
    private position:number;
    private runline:IDialogueToRender[];
    private scale:number;
    private _resample:string;
    private resolution:{ x:number; y:number };
    private container:HTMLDivElement;
    private stage:HTMLDivElement;
    private video:HTMLVideoElement;
}
