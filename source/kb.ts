import { assertCondition, assertExistance } from "./assert.js";
import { debugDrawStrokePoints } from "./debug.js";
import { getSVG } from "./kanjivg.js";

const LERP: number = 1;
const SCALE: number = 3;
const SENSITIVITY: number = 9 * SCALE;

let drawing: boolean = false;

let previous = { x: 0, y: 0 };
let current = { x: 0, y: 0 };
let bias = { x: 0, y: 0 };

let state:
{
    kanji: string;
    strokeCount: number;
    strokes: number[][][];
    currentStroke: number;
    currentPoint: number;
    svgPaths: string[];
} = 
{
    kanji: "木",
    strokeCount: 0,
    strokes: new Array(new Array(new Array<number>())),
    currentStroke: 0,
    currentPoint: 0,
    svgPaths: new Array<string>()
};

let canvas: HTMLCanvasElement;
let backdrop: SVGGElement;
let context: CanvasRenderingContext2D;

let offset = { x: 0, y: 0 };
const recomputeOffset = () => { let boundingBox: DOMRect = canvas.getBoundingClientRect();
                                offset.x = boundingBox.x;
                                offset.y = boundingBox.y; }
const translateEvent = (e: MouseEvent) => { return { x: (e.x - offset.x), y: (e.y - offset.y) } };

let completion: Function = () => {};

async function initialise(target: HTMLElement): Promise<void>
{
    const container = document.createElement("div");
    container.style.position = "relative";
    container.style.width = (109 * SCALE).toString();
    container.style.height = (109 * SCALE).toString();
    target.append(container);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement; 
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svg.setAttribute("width", (109 * SCALE).toString());
    svg.setAttribute("height", (109 * SCALE).toString());
    svg.setAttributeNS(null, "viewBox", "0 0 109 109");
    svg.style.position = "absolute";
    svg.style.backgroundImage = "url(../../public/box.svg)";
    svg.style.backgroundSize = "cover";
    svg.style.pointerEvents = "none";
    svg.style.boxSizing = "border-box";
    svg.style.zIndex = "-1";

    const innerG = document.createElementNS("http://www.w3.org/2000/svg", "g") as SVGGElement;
    innerG.style = "fill:none;stroke:#000000;stroke-width:3;stroke-linecap:round;stroke-linejoin:round;";

    backdrop = document.createElementNS("http://www.w3.org/2000/svg", "g") as SVGGElement;
    backdrop.setAttribute("kvg:element", "木");
    backdrop.setAttribute("kvg:radical", "general");

    canvas = document.createElement("canvas") as HTMLCanvasElement;
    canvas.width = 109 * SCALE;
    canvas.height = 109 * SCALE;
    container.append(canvas);
    canvas.style.imageRendering = "cris-edges";
    canvas.style.position = "absolute";
    canvas.style.zIndex = "1";
    canvas.style.touchAction = "none";

    innerG.append(backdrop);
    svg.append(innerG);
    container.append(svg);

    context = assertExistance(canvas.getContext("2d"));
    context.strokeStyle = "black";
    context.lineWidth = 2.5 * SCALE;
    context.lineCap = "round";

    canvas.addEventListener("mousedown", e =>
    {
        if(drawing || state.currentStroke >= state.strokeCount) return;

        const translated = translateEvent(e);

        // stupid JS memory management ):<
        previous.x = bias.x = current.x = translated.x;
        previous.y = bias.y = current.y = translated.y;
        drawing = true;

        // reset drawing path
        state.currentPoint = 0;

        console.clear();
        console.debug("Started drawing");
    });

    canvas.addEventListener("mouseup", () =>
    {
        if(!drawing) return;

        drawing = false;
        context.clearRect(0, 0, canvas.width, canvas.height);

        // @ts-expect-error
        debugDrawStrokePoints(state.strokes[state.currentStroke]); 

        console.debug("Stopped drawing");
    });

    canvas.addEventListener("mousemove", e =>
    {
        if(!drawing) return;

        previous.x = previous.x + LERP * (bias.x - previous.x);
        previous.y = previous.y + LERP * (bias.y - previous.y);
        
        current = translateEvent(e);

        if(Math.abs(current.x - state.strokes[state.currentStroke]![state.currentPoint]![0]!) <= SENSITIVITY
        && Math.abs(current.y - state.strokes[state.currentStroke]![state.currentPoint]![1]!) <= SENSITIVITY)
        {
            console.log(`Point ${ state.currentPoint++ } cleared!`);

            if(state.currentPoint === state.strokes[state.currentStroke]!.length)
            {
                console.log(`Stroke ${ state.currentStroke } cleared!`);

                backdrop.innerHTML += state.svgPaths[state.currentStroke++];
                drawing = false;
                context.clearRect(0, 0, canvas.width, canvas.height);

                if(state.currentStroke === state.strokeCount)
                {
                    completion();
                }

                return;
            }
        }

        bias.x = bias.x + LERP * (current.x - bias.x);
        bias.y = bias.y + LERP * (current.y - bias.y);
        
        context.strokeStyle = "black";

        context.beginPath();
        context.moveTo(previous.x, previous.y);
        context.lineTo(bias.x, bias.y);
        context.stroke();
    });

    canvas.addEventListener("touchstart", e => 
    {   
        let touch: Touch | undefined = e.touches[0];
        if(touch === undefined)
        {
            let mouseEvent: MouseEvent = new MouseEvent("mousedown",
            {
                clientX: current.x,
                clientY: current.y
            });
            canvas.dispatchEvent(mouseEvent);
            return;
        }

        let mouseEvent: MouseEvent = new MouseEvent("mousedown",
        {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    });

    canvas.addEventListener("touchmove", e => 
    {   
        let touch: Touch | undefined = e.touches[0];
        if(touch === undefined)
        {
            let mouseEvent: MouseEvent = new MouseEvent("mousemove",
            {
                clientX: current.x,
                clientY: current.y
            });
            canvas.dispatchEvent(mouseEvent);
            return;
        }

        let mouseEvent: MouseEvent = new MouseEvent("mousemove",
        {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    });

    canvas.addEventListener("touchend", e => 
    {   
        let touch: Touch | undefined = e.touches[0];
        if(touch === undefined)
        {
            let mouseEvent: MouseEvent = new MouseEvent("mouseup",
            {
                clientX: current.x,
                clientY: current.y
            });
            canvas.dispatchEvent(mouseEvent);
            return;
        }

        let mouseEvent: MouseEvent = new MouseEvent("mouseup",
        {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    });

    observer.observe(canvas);
    if(canvas.parentElement)
    {
        observer.observe(canvas.parentElement);
    }

    recomputeOffset();
}

function setOnComplete(callback: Function): void
{
    completion = callback;
}

async function load(kanji: string): Promise<void>
{
    state.kanji = kanji;
    state.currentPoint = state.currentStroke = 0;

    const data = await getSVG(state.kanji);
    state.strokes = assertExistance(data.strokes, "No strokes found!");
    assertCondition(state.strokes.length > 0, "No strokes found!");
    state.strokeCount = data.strokeCount;
    state.svgPaths = data.svgPaths;

    backdrop.innerHTML = "";
    context.clearRect(0, 0, canvas.width, canvas.height);

    // @ts-expect-error
    debugDrawStrokePoints(state.strokes[state.currentStroke]);
}

// detect when canvas moves
const observer = new ResizeObserver((entries) =>
{
    for(const entry of entries)
    {
        if(entry.target === canvas || entry.target === canvas.parentElement)
        {
            recomputeOffset();
            break;
        }
    }
});

window.addEventListener("scroll", recomputeOffset, { passive: true });

const kb =
{
    initialise: initialise,
    load: load,
    setOnComplete: setOnComplete
};

declare global
{
    interface Window
    {
        kb: typeof kb
    }
};

window.kb = kb;

export { kb, context, SCALE };