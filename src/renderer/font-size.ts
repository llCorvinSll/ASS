interface IFontSizeCache {
    [key:string]:number;
}

const FONT_SIZE_CACHE:IFontSizeCache = {};


const $ffs = document.createElement("div");
$ffs.className = "ASS-fix-font-size";
$ffs.textContent = "M";


export function getRealFontSize(fs:number, fn:string):number {
    const key = `${fn}-${fs}`;
    if (!FONT_SIZE_CACHE[key]) {
        $ffs.style.cssText = `font-size:${fs}px;font-family:'${fn}',Arial;`;
        FONT_SIZE_CACHE[key] = fs * fs / $ffs.clientHeight;
    }
    return FONT_SIZE_CACHE[key];
}
