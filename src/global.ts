export const RAF = window.requestAnimationFrame ||
                   (window as any).mozRequestAnimationFrame ||
                   window.webkitRequestAnimationFrame ||
                   function (cb:() => any) {return setTimeout(cb, 50 / 3); };
export const CAF = window.cancelAnimationFrame ||
                   (window as any).mozCancelAnimationFrame ||
                   window.webkitCancelAnimationFrame ||
                   function (id:number) {clearTimeout(id); };
export let RAFID = 0;
export let channel:any[] = [];
export const xmlns = "http://www.w3.org/2000/svg";
export const ASS_CSS = "__ASS_MIN_CSS__";
