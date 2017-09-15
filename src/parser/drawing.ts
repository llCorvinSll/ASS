class Point {
    constructor(public x:number, public y:number) {

    }

    public toString():string {
        return this.x + "," + this.y;
    }
}


export class DrawingCommand {
    constructor(type:string) {
        this.points = [];
        this.type = null;
        this.prevType = null;
        this.nextType = null;
        if (/m/.test(type)) {
            this.type = "M";
        }
        if (/n|l/.test(type)) {
            this.type = "L";
        }
        if (/b/.test(type)) {
            this.type = "C";
        }
        if (/s/.test(type)) {
            this.type = "_S";
        }
    }

    public isValid():boolean {
        if (!this.points.length || !this.type) {
            return false;
        }
        if (/C|S/.test(this.type) && this.points.length < 3) {
            return false;
        }
        return true;
    }

    public toString() {
        if (this.type === "_S") {
            return s2b(this.points, this.prevType, this.nextType);
        }
        return this.type + this.points.join();
    }

    public points:Point[];
    public type:string;
    public prevType:string;
    public nextType:string;
}

function s2b(ps:Point[], prevType:string, nextType:string) {
    // D3.js, d3_svg_lineBasisOpen()
    const bb1 = [0, 2 / 3, 1 / 3, 0];
    const bb2 = [0, 1 / 3, 2 / 3, 0];
    const bb3 = [0, 1 / 6, 2 / 3, 1 / 6];
    const dot4 = function (a:number[], b:number[]) {
        return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    };
    let px = [ps[ps.length - 1].x, ps[0].x, ps[1].x, ps[2].x];
    let py = [ps[ps.length - 1].y, ps[0].y, ps[1].y, ps[2].y];
    const path = ["L", new Point(dot4(bb3, px), dot4(bb3, py))];
    if (prevType === "M") {
        path[0] = "M";
    }

    for (let k = 3; k < ps.length; k++) {
        px = [ps[k - 3].x, ps[k - 2].x, ps[k - 1].x, ps[k].x];
        py = [ps[k - 3].y, ps[k - 2].y, ps[k - 1].y, ps[k].y];
        path.push("C" + new Point(dot4(bb1, px), dot4(bb1, py)),
            "," + new Point(dot4(bb2, px), dot4(bb2, py)),
            "," + new Point(dot4(bb3, px), dot4(bb3, py)));
    }
    if (nextType === "L" || nextType === "C") {
        path.push("L", ps[ps.length - 1]);
    }

    return path.join("");
}


export function parseDrawing(text:string):DrawingCommand[] {
    text = text.replace(/([mnlbspc])/gi, " $1 ")
        .replace(/^\s*|\s*$/g, "")
        .replace(/\s+/g, " ")
             .toLowerCase();
    const rawCommands = text.split(/\s(?=[mnlbspc])/);
    const commands = [];

    let i = 0;
    while (i < rawCommands.length) {
        const p = rawCommands[i].split(" ");
        const command = new DrawingCommand(p[0]);

        for (let lenj = p.length - !(p.length & 1), j = 1; j < lenj; j += 2) {
            command.points.push(new Point(parseInt(p[j], 10), parseInt(p[j + 1], 10)));
        }

        if (/p|c/.test(p[0])) {
            if (commands[i - 1].type === "_S") {
                if (p[0] === "p") {
                    commands[i - 1].points = commands[i - 1].points.concat(command.points);
                }
                if (p[0] === "c") {
                    const ps = commands[i - 1].points;
                    commands[i - 1].points.push(new Point(ps[0].x, ps[0].y),
                                      new Point(ps[1].x, ps[1].y),
                                      new Point(ps[2].x, ps[2].y));
                }
            }
            rawCommands.splice(i, 1);
        } else {
            if (p[0] === "s") {
                const prev = commands[i - 1].points[commands[i - 1].points.length - 1];
                command.points.unshift(new Point(prev.x, prev.y));
            }
            if (command.isValid()) {
                if (i) {
                    command.prevType = commands[i - 1].type;
                    commands[i - 1].nextType = command.type;
                }
                commands.push(command);
            }
            i++;
        }
    }

    return commands;
}
