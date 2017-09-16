import {IParsedText} from "./tags";

export interface ISubtitleTree {
    ScriptInfo:IScriptInfo;
    V4Styles:IStyles;
    Events:IEvents;
}

interface IScriptInfo {
    Title:string;
    WrapStyle:number;
    Timer:number;
    PlayResY?:number;
    PlayResX?:number;
    ScaledBorderAndShadow?:string;
    ["Original Script"]:string;

    [key:string]:number | string;

}


export interface IStylesMap {
    [key:string]:IStyle;
}

interface IStyles {
    Format:string[];
    Style:IStylesMap;
}

interface IEvents {
    Format:string[];
    Dialogue:IDialogue[];
}

export const enum BlockType {
    SCRIPT_INFO = 1,
    STYLES = 2,
    EVENTS = 3,
    NONE
}

export interface IStyle {
    Name:string;
    Fontname:string;
    Fontsize:string;
    PrimaryColour:string;
    SecondaryColour:string;
    OutlineColour:string;
    BackColour:string;
    Bold:string;
    Italic:string;
    Underline:string;
    StrikeOut:string;
    ScaleX:string;
    ScaleY:string;
    Spacing:string;
    Angle:string;
    Outline:string;
    Shadow:string;
    _tags:IStyleTags;

    [key:string]:string | number | IStyleTags;
}

export interface IPosition {
    x:number;
    y:number;
}

export interface IStyleTags {
    fn:string;
    fs:string;
    c1:string;
    a1:string;
    c2:string;
    a2:string;
    c3:string;
    a3:string;
    c4:string;
    a4:string;
    b:number;
    i:number;
    u:number;
    s:number;
    q:number;
    fscx:string;
    fscy:string;
    fsp:string;
    frz:string;
    xbord:string;
    ybord:string;
    xshad:string;
    yshad:string;
}

export interface IDialogue {
    Text:string;
    Layer:number;
    Start:number;
    End:number;
    Style:string;
    MarginL:number;
    MarginR:number;
    MarginV:number;
    Effect:IEffect | string;
    _index:number;
    _parsedText:IParsedText;

    [key:string]:string | number | IEffect | IParsedText;
}

export interface IEffect {
    name:string;
    y1?:number;
    y2?:number;
    delay:number;
    fadeawayheight?:number;
    fadeawaywidth?:number;
    lefttoright?:number;
}
