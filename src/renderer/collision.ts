import {channel} from "../global";
import {IDialogueToRender} from "./renderer";

export function getChannel(this:void, dia:IDialogueToRender) {
  const L = dia.Layer;
  const SW = this.width - Math.floor(this.scale * (dia.MarginL + dia.MarginR));
  const SH = this.height;
  const W = dia.width;
  const H = dia.height;
  const V = Math.floor(this.scale * dia.MarginV);
  const  vct = this.video.currentTime;
  const count = 0;

  channel[L] = channel[L] || {
    left: new Uint16Array(SH + 1),
    center: new Uint16Array(SH + 1),
    right: new Uint16Array(SH + 1),
    leftEnd: new Uint32Array(SH + 1),
    centerEnd: new Uint32Array(SH + 1),
    rightEnd: new Uint32Array(SH + 1),
  };
  const align = ["right", "left", "center"][dia.Alignment % 3];
  const willCollide = function (x:number) {
      const l = channel[L].left[x];
      const c = channel[L].center[x];
      const r = channel[L].right[x];
      const le = channel[L].leftEnd[x] / 100;
      const ce = channel[L].centerEnd[x] / 100;
      const re = channel[L].rightEnd[x] / 100;

      if (align === "left") {
          if ((le > vct && l) ||
              (ce > vct && c && 2 * W + c > SW) ||
              (re > vct && r && W + r > SW)) {
              return true;
          }
      }
      if (align === "center") {
          if ((le > vct && l && 2 * l + W > SW) ||
              (ce > vct && c) ||
              (re > vct && r && 2 * r + W > SW)) {
              return true;
          }
      }
      if (align === "right") {
          if ((le > vct && l && l + W > SW) ||
              (ce > vct && c && 2 * W + c > SW) ||
              (re > vct && r)) {
              return true;
          }
      }
      return false;
  };
  const found = function (x:number) {
    if (willCollide(x)) {
        count = 0;
    } else {
        count++;
    }
    if (count >= H) {
      dia.channel = x;
      return true;
    } else {
        return false;
    }
  };
  if (dia.Alignment <= 3) {
    for (let i = SH - V - 1; i > V; i--) {
        if (found(i)) {
            break;
        }
    }
  } else if (dia.Alignment >= 7) {
    for (let i = V + 1; i < SH - V; i++) {
        if (found(i)) {
            break;
        }
    }
  } else {
      for (let i = (SH - H) >> 1; i < SH - V; i++) {
          if (found(i)) {
              break;
          }
      }
  }
  if (dia.Alignment > 3) {
      dia.channel -= H - 1;
  }
  for (let i = dia.channel; i < dia.channel + H; i++) {
    channel[L][align][i] = W;
    channel[L][align + "End"][i] = dia.End * 100;
  }
  return dia.channel;
}
