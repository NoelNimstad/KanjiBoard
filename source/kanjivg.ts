import { assertCondition, assertExistance } from "./assert.js";
import { SCALE } from "./kb.js";

function pointExtractionMagic(points: string[])
{
    let pointsToReturn: number[][] = [];
    let copy = points;
    let startPoint = [];

    for(let i = 0; i < copy.length; i++)
    {
        // Stupid typescript will never shut up about existance even if I assert stuff
        switch(copy[i]![0])
        {
            case "m":
                {
                    let values = copy[i]!.substring(1).split(",");
                    startPoint[0] = parseFloat(values[0]!);
                    startPoint[1] = parseFloat(values[1]!);
                    pointsToReturn.push([ startPoint[0] * SCALE,
                                          startPoint[1] * SCALE ]);
                }
                break;    
            case "M":
                {
                    let values = copy[i]!.substring(1).split(",");
                    startPoint[0] = parseFloat(values[0]!);
                    startPoint[1] = parseFloat(values[1]!);
                    pointsToReturn.push([ startPoint[0] * SCALE,
                                          startPoint[1] * SCALE ]);
                }
                break;
            case "c":
                {
                    let values = copy[i]!.substring(1).split(",");
                    while(values.length > 2)
                    {
                        values.shift();
                    }

                    let dx = parseFloat(values[0]!);
                    let dy = parseFloat(values[1]!);
                    startPoint[0]! += dx;
                    startPoint[1]! += dy;
                    pointsToReturn.push([ startPoint[0]! * SCALE,
                                          startPoint[1]! * SCALE ]);
                }
                break;
            case "C":
                {
                    let values = copy[i]!.substring(1).split(",");
                    while(values.length > 2)
                    {
                        values.shift();
                    }
                    startPoint[0] = parseFloat(values[0]!);
                    startPoint[1] = parseFloat(values[1]!);
                    pointsToReturn.push([ startPoint[0] * SCALE,
                                          startPoint[1] * SCALE ]);
                }
                break;
            default:
                console.log("you messed up");
                break;
        }
    }

    return pointsToReturn;
}

function extractSVG(svg: string, kanji: string)
{
    const strokeData: string[] = assertExistance(svg.match(/(<path(.*))/g));

    let strokes = [];

    for(let stroke of strokeData)
    {
        let s = [];
        const start: string[] = assertExistance(stroke.replace(/(.*)[Mm](.*?),(.*?)c(.*)/g, "$2:$3").split(":"));
        assertCondition(start.length >= 2, "Insufficient data points!");

        // @ts-ignore
        s.push([ parseFloat(start[0]), parseFloat(start[1]) ]);

        const information: string = stroke.replace(/(.*)d="(.*)"(.*)/, "$2").replace(/(?<!,)-/g, ",-");
        let points: string[] = information.replace(/([mMcC])/g, ":$1").split(":");
        points.shift();

        strokes.push(pointExtractionMagic(points));
    }
    
    const data = 
    {
        kanji: kanji,
        strokeCount: strokes.length,
        strokes: strokes,
        svgPaths: strokeData
    }

    return data;
}

async function getSVG(kanji: string): Promise<{
    kanji: string;
    strokeCount: number;
    strokes: number[][][];
    svgPaths: string[];
}>
{
    assertCondition(kanji.length === 1, "More than 1 character supplied!");

    const response: Response = await fetch(`https://kanjivg.tagaini.net/kanjivg/kanji/${ kanji.charCodeAt(0).toString(16).padStart(5, "0") }.svg`);
    const text: string = await response.text();
    return extractSVG(text, kanji);
}

export { getSVG };