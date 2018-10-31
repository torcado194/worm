const Worm = require('./index.js');
const fs = require('fs');
const chalk = require('chalk');

const log = console.log;

let w = 0,
    h = 0;

let source = '',
    sourceIndex = 0,
    input = '';

let done = false;

let characterCount = 0,
    cycleCount = 0;

let worm;

let codeX = 0,
    codeY = 0,
    dashboardX = 0,
    dashboardY = 0,
    dashboardWidth = 0,
    dashboardHeight = 0;

let screen = [],
    prevScreen = [];

let simpleChars = false;

let pointerTrail = [];

let arrows = [
    '→',
    '↘',
    '↓',
    '↙',
    '←',
    '↖',
    '↑',
    '↗',
];

let arrowsSimple = [
    '→',
    '┘',
    '↓',
    '└',
    '←',
    '┌',
    '↑',
    '┐',
];

let instColor = {
    '^': 'blueBright',
    '>': 'blueBright',
    '<': 'blueBright',
    'v': 'blueBright',
    '/': 'blueBright',
    '\\': 'blueBright',
    '_': 'blueBright',
    '|': 'blueBright',
    'x': 'cyan',
    'y': 'cyan',
    'k': 'cyan',
    '&': 'cyanBright',
    '#': 'cyanBright',
    'o': 'cyanBright',
    '!': 'redBright',
    '?': 'red',
    '.': 'red',
    '0': 'green',
    '1': 'green',
    '2': 'green',
    '3': 'green',
    '4': 'green',
    '5': 'green',
    '6': 'green',
    '7': 'green',
    '8': 'green',
    '9': 'green',
    'a': 'green',
    'b': 'green',
    'c': 'green',
    'd': 'green',
    'e': 'green',
    'f': 'green',
    '+': 'yellowBright',
    '-': 'yellowBright',
    '*': 'yellowBright',
    ',': 'yellowBright',
    '%': 'yellowBright',
    'l': 'yellowBright',
    '(': 'yellowBright',
    ')': 'yellowBright',
    '=': 'yellowBright',
    '"': 'redBright',
    '\'': 'magentaBright',
    ':': 'yellow',
    '~': 'yellow',
    '$': 'keyword("orange")',
    '@': 'keyword("orange")',
    '{': 'keyword("orange")',
    '}': 'keyword("orange")',
    '[': 'keyword("orange")',
    ']': 'keyword("orange")',
    'm': 'keyword("orange")',
    'h': 'yellowBright',
    'p': 'keyword("purple")',
    'q': 'keyword("purple")',
    'i': 'keyword("crimson")',
    'j': 'keyword("crimson")',
    'u': 'keyword("crimson")',
    'n': 'keyword("crimson")',
    'r': 'keyword("crimson")',
    't': 'keyword("crimson")',
    'w': 'magentaBright',
    'g': 'redBright',
    's': 'redBright',
    ';': 'greenBright',
}

let c = {
    'border': 'cyan',
    'dashBorder': 'green',
    'dashPos': 'blueBright',
    'dashDir': 'redBright',
    'dashAngle': 'magentaBright',
    'controls': 'yellowBright',
    'edge': 'gray',
    'pointer': 'bgRed.black',
    'nextPointer': 'bgMagenta.black',
}

/*
let borderColor = chalk.cyan,
    dashboardColor = chalk.green,
    edgeColor = chalk.gray
*/

process.on('SIGWINCH', resizeHandler);
function resizeHandler(){
    w = process.stdout.columns;
    h = process.stdout.rows - 1;
    log(chalk.yellow(w, h));
}


let dashboardControls = [
    {name: 'edit',
     pos: 0},
    {name: 'halfStep',
     pos: 0},
    {name: 'fullStep',
     pos: 0},
    {name: 'play',
     pos: 0},
    {name: 'stop',
     pos: 0}
]
let inDash = true,
    editing = false;

let curControlPos = 3,
    curControl = dashboardControls[curControlPos];
let cursor = {x: 0, y: 0};

let playing = false,
    playSpeed = 3,
    playSpeedMax = 11;
let lastStepSize = '';

let inputCharMode = false;
let reading = false;

let inputCB;
let inputLine = '';

process.stdin.setRawMode(true);
process.stdin.on('data', inputHandler);
function inputHandler(input){
    let char = String.fromCharCode(input[0]);
    
    if(input[0] === 3){
        cursor = {x: 0, y: h};
        updateCursor();
        process.exit(0);
    }
    //log(input);
    //log([...input]);
    if(reading){
        if(inputCharMode){
            /*if(lastStepSize === 'full'){
                worm.pointer.skipMove = true;
            }*/
            inputCB(input.toString());
            reading = false;
            cursor = {x: dashboardX + curControl.pos, y: dashboardY + 1};
            draw();
            updateCursor();
        } else {
            if(input == '\u000d'){ //enter
                /*if(lastStepSize === 'full'){
                    worm.pointer.skipMove = true;
                }*/
                if(inputLine.length === 0){
                    inputCB('\n');
                } else {
                    inputCB(inputLine);
                }
                inputLine = '';
                reading = false;
                clearInput();
                cursor = {x: dashboardX + curControl.pos, y: dashboardY + 1};
            } else if(input == '\u0008'){ //backspace
                inputLine = inputLine.slice(0, -1);
                cursor.x -= 1;
            } else {
                inputLine += input.toString();
                cursor.x += 1;
            }
        }
        draw();
        updateCursor();
    } else if(inDash){
        if(input == '\u001B\u005B\u0043'){ //right
            curControlPos = (curControlPos + 1) % dashboardControls.length;
        }
        if(input == '\u001B\u005B\u0044'){ //left
            curControlPos = ((curControlPos - 1) + dashboardControls.length) % dashboardControls.length;
        }
        if(input == '\u001B\u005B\u0041'){ //up
            if(playing && curControl.name === 'play'){
                playSpeed = (playSpeed + 1) % playSpeedMax;
            }
        }
        if(input == '\u001B\u005B\u0042'){ //down
            if(playing && curControl.name === 'play'){
                playSpeed = ((playSpeed - 1) + playSpeedMax) % playSpeedMax;
            }
        }
        
        
        curControl = dashboardControls[curControlPos];
        cursor = {x: dashboardX + curControl.pos, y: dashboardY + 1};
        
        if(char === ' '){
            if(curControl.name === 'fullStep'){
                lastStepSize = 'full';
                worm.update();
                draw();
            } else if(curControl.name === 'halfStep'){
                lastStepSize = 'half';
                worm.step();
                draw();
            } else if(curControl.name === 'play'){
                if(playing){
                    playing = false
                } else {
                    playing = true;
                    playLoop();
                }
            } else if(curControl.name === 'stop'){
                
            }
        }
        
        draw();
        updateCursor();
    }
    
    /*if(char === 'a'){
        draw();
    }
    
    if(char === ' '){
        worm.update();
        draw();
    }
    if(char === 'm'){
        worm.step();
        draw();
    }
    
    if(input == '\u001B\u005B\u0041'){
        process.stdout.moveCursor(0, -1);
    }
    if(input == '\u001B\u005B\u0042'){
        process.stdout.moveCursor(0, 1);
    }
    if(input == '\u001B\u005B\u0043'){
        process.stdout.moveCursor(1, 0); 
    }
    if(input == '\u001B\u005B\u0044'){
        process.stdout.moveCursor(-1, 0);
    }
    
    if(input == '\u0009'){
        simpleChars = !simpleChars;
    }
    
    if(char === 'z'){
        process.stdout.write('z');
    }
    if(char === 'x'){
        process.stdout.write('123');
    }
    
    if(char === 'c'){
        clearScreen();
    }
    if(char === 'p'){
        draw(true);
    }
    
    if(char === 'v'){
        worm.emit('continue');
    }*/
}

function playLoop(){
    if(playing){
        worm.step();
        draw();
        setTimeout(()=>{
            if(playing){
                playLoop();
            }
        }, playSpeed * 100);
    }
}

function updateCursor(){
    process.stdout.cursorTo(cursor.x, cursor.y);
}

let flags = {
    '-c': "code",
    '--code': "code",
    //'-d': "delay",
    //'--delay': "delay"
}

init();
function init(){
    let args = process.argv.slice(2);
    
    if(args.includes("-c") || args.includes("--code")){
        let index = args.findIndex(a => a === "-c" || a === "--code");
        source = args[index + 1];
        sourceIndex = index + 1;
    } else {
        try{
            source = fs.readFileSync(args[0], {encoding: "utf8"});
        } catch(e) {
            console.log("could not find file", e);
        }
        sourceIndex = 0;
    }
    if(Object.keys(flags).includes(args[sourceIndex + 1])){
        input = '';
    } else {
        input = args[sourceIndex + 1];
    }
    
    worm = new Worm(source, input, 'step');
    
    worm.on('positionUpdate', (to, from) => {
        pointerTrail.splice(0, 0, {x: from.x, y: from.y});
    });
    
    worm.on('end', () => {
        done = true;
        playing = false;
        draw();
    });
    
    worm.on('input', (type, cb) => {
        inputCB = cb;
        cursor = {x: 0, y: h};
        updateCursor();
        reading = true;
        playing = false;
        if(type === "character"){
            inputCharMode = true;
        } else {
            inputCharMode = false;
        }
        /*
        process.stdin.on('data', handler);
        function handler(input){
            if(input[0] === 3){
                process.exit(0);
            }
            if(inputCharMode){
                inputCharMode = false;
                process.stdin.setRawMode(false);
            }
            //log(input);
            //log([...input]);
            cb(input.toString());
            process.stdin.removeListener('data', handler);
        }*/
    });
    
    /*worm.on('edgeDetect', pos => {
        let a = [...prevScreen];
        
        let loc = fromEnd((codeX + pos.x) + (codeY + pos.y) * w);
        let char = worm.board.get({x: pos.x, y: pos.y});
        a.splice(loc, 1, {'bgCyanBright.black': char === worm.EDGE ? '░' : char });
        render(a, prevScreen);
        prevScreen = [...a];
    });*/
    
    worm.init();
    resizeHandler();
    
    draw();
    cursor = {x: dashboardX + curControl.pos, y: dashboardY + 1};
    updateCursor();
}


function draw(p){
    let a = screen = [];
    startPadding(a);
    trim(a);
    borders(a);
    dashboard(a);
    stacks(a);
    output(a);
    info(a);
    placeCode(a);
    pointer(a);
    showInput(a);
    //trail(a);
    
    if(p){
        print(a);
    } else {
        render(a, prevScreen);
    }
    
    prevScreen = [...screen];
    
    updateCursor();
}

function render(screen, prev){
    if(prev.length === 0){
        clearScreen();
        print(screen);
        return;
    }
    
    let out = process.stdout;
    let line = '',
        lineStart = 0,
        fg = false,
        bg = false;
    for(let i = 0; i < screen.length; i++){
        let a = screen[i],
            b = prev[i];
        if(a === undefined || b === undefined){
            break;
        }
        if(same(a, b)){
            if(line.length !== 0){
                out.cursorTo(lineStart % w, Math.floor(lineStart / w)) //convert to x,y
                out.write(line);
                line = '';
            }
            continue;
        } else {
            if(line.length === 0){
                lineStart = i;
            }
            if(typeof a !== 'object'){
                if(a !== ' '){
                    if(fg){
                        line += '[39m' //won't reset background?
                        fg = false;
                    }
                }
                if(bg){
                    line += '[49m'
                    bg = false;
                }
                line += a;
                continue;
            } else {
                let color = Object.keys(a)[0];
                
                if(bg){
                    line += '[49m';
                    bg = false;
                }
                
                let hasFG = false,
                    hasBG = false;
                if(color.includes('.')){
                    hasFG = true;
                    hasBG = true;
                } else if(color.includes('bg')){
                    hasBG = true;
                } else {
                    hasFG = true;
                }
                if(hasFG && color !== fg){
                    line += '[39m';
                    fg = color;
                }
                if(hasBG){
                    bg = true;
                }
                /*if(hasBG){
                    line += '[49m';
                    debugger;
                    bg = false;
                }*/
                line += getAnsi(color);
                line += Object.values(a)[0] === worm.EDGE ? ' ' : Object.values(a)[0];
            }
        }
    }
    if(line.length !== 0){
        out.cursorTo(lineStart % w, Math.floor(lineStart / w)) //convert to x,y
        out.write(line);
        line = '';
    }
    
    out.cursorTo(0, h);
    out.write('[39m[49m');
    
    
    function same(a, b){
        return Object.keys(a)[0] == Object.keys(b)[0] && Object.values(a)[0] == Object.values(b)[0];
    }
    
}

function print(a){
    //no color
    //a = a.map(v => v[Object.keys(v)[0]]);
    
    //slow color
    //a = a.map(v => chalk`{${'green'} ${Object.values(v)[0]}}`);
    a = a.map(v => typeof v === 'object' ? chalk`{${Object.keys(v)[0]} ${Object.values(v)[0]}}` : v);
    let text = a.join('');
    //optimized color
    /*let text = '';
    let fg = false,
        bg = false;
    for(let i = 0; i < a.length; i++){
        let t = a[i];
        if(typeof t !== 'object'){
            if(t !== ' '){
                if(fg){
                    text += '[0m' //won't reset background?
                    fg = false;
                }
            }
            if(bg){
                text += '[49m'
                bg = false;
            }
            text += t;
            continue;
        } else {
            let color = Object.keys(t)[0];
            if(color.includes('.')){
                fg = true;
                bg = true;
            } else if(color.includes('bg')){
                bg = true;
                if(fg){
                    text += '[0m'
                    fg = false;
                }
            } else {
                fg = true;
                if(bg){
                    text += '[49m'
                    bg = false;
                }
            }
            text += getAnsi(color);
            text += Object.values(t)[0];
        }
    }*/
    
    log(text);
}

function getAnsi(color){
    return (chalk`{${color}  }`).split(' ')[0];
}

function clearScreen(){
    process.stdout.cursorTo(0,0);
    process.stdout.clearScreenDown();
}

function startPadding(a){
    let pad = (new Array(w * (h))).fill(' ');
    a.splice(0, 0, ...pad);
    return a;
}

function borders(a){
    let padding = 0;
    let left = padding + 1,
        top = padding,
        bottom = padding,
        right = padding + 1;
    //let horizontal = (new Array(w - (left + right) - 2)).fill(chalk.cyan('═'));
    /*let horizontal = fill(w - (left + right) - 2, '═', c['border']);
    a.splice(-(w*h) + left, w - (right + left), {[c['border']]: '╔' }, ...horizontal, {[c['border']]: '╗' }); //top
    a.splice(-w + left, w - (right + left), {[c['border']]: '╚' }, ...horizontal, {[c['border']]: '╝' }); //bottom
    for(let i = a.length - (w * (h - 1)); i < a.length - w; i++){
        if(i % w === left){
            a.splice(i, 1, {[c['border']]: '║' });
        } else if(i % w === w - 1 - right){
            a.splice(i, 1, {[c['border']]: '║' });
            
        }
    }*/
    if(done){
        makeBorder(a, 1, 0, w - 2, h - 0, 'greenBright'); 
        a.splice(Math.ceil(w / 2) - 4, 7, ...escape('╡', 'greenBright'),...escape('done!', 'yellowBright'), ...escape('╞', 'greenBright'));
    } else {
        makeBorder(a, 1, 0, w - 2, h - 0, c['border']);
    }
    return a;
}

function makeBorder(a, x, y, width, height, color){
    height -= 1;
    let horizontal = fill(width - 2, '═', color);
    a.splice(fromEnd(x + (y * w)), horizontal.length + 2, {[color]: '╔' }, ...horizontal, {[color]: '╗' }); //top
    a.splice(fromEnd(x + ((y + height) * w)), horizontal.length + 2, {[color]: '╚' }, ...horizontal, {[color]: '╝' }); //bottom
    for(let i = a.length + fromEnd(x + ((y + 1) * w)); i < (y + height) * w; i++){
        if(i % w === x){
            a.splice(i, 1, {[color]: '║' });
        } else if(i % w === x + width - 1){
            a.splice(i, 1, {[color]: '║' });
        }
    }
}

function trim(a){
    a.splice(-1, 1);
    return a;
}

function placeCode(a){
    let code = worm.board.code;
    let centerX = Math.floor(w/2),
        centerY = Math.floor(h/2);
    
    let codeWidth = 0,
        codeHeight = 0;
    
    for(let y = 0; y < code.length; y++){
        if(code[y].length > codeWidth){
            codeWidth = code[y].length;
        }
    }
    codeHeight = code.length;
    
    
    codeX = centerX - Math.floor(codeWidth / 2);
    codeY = centerY - Math.floor(codeHeight / 2) - 1;
    
    
    let beginning = fromEnd(codeX + codeY * w);
    
    for(let i = 0; i < codeHeight; i++){
        a.splice(beginning + (i*w), code[i].length, ...(code[i].map(v => ({[instColor[v] || 'white']: v }))));
    }
    a.splice(beginning - w - 1, code[0].length + 2, ...(fill(code[0].length + 2, '░', c['edge'])));
    a.splice(beginning + (w*codeHeight) - 1, code[code.length-1].length + 2, ...(fill(code[code.length-1].length + 2, '░', c['edge'])));
    //a.splice(beginning - w - 1, code[0].length + 2, ...(new Array(code[0].length + 2).fill(chalk.bgYellow(' '))));
    if(code.length > 1){
        for(let i = 0; i < codeHeight; i++){
            a.splice(beginning + (i*w) - 1, 1, {[c['edge']]: '░' });
            let l = 1;
            if(i === 0){
                l = Math.max(1, code[i+1].length - (code[i].length - 1));
            } else if(i === codeHeight - 1){
                l = Math.max(1, code[i-1].length - (code[i].length - 1));
            } else {
                l = Math.max(1, Math.max(code[i-1].length - (code[i].length - 1), code[i+1].length - (code[i].length - 1)));
            }
            a.splice(beginning + (i*w) + code[i].length, l, ...fill(l, '░', c['edge']));
        }
    } else {
        a.splice(beginning - 1, 1, {[c['edge']]: '░' });
        a.splice(beginning + code[0].length, 1, ...fill(1, '░', c['edge']));
    }
    
    //makeBorder(a, codeX - 3, codeY - 3, codeWidth + 7, codeHeight + 6, c['dashBorder']);
    
    return a;
}

function dashboard(a){
    let pointer = worm.pointer;
    dashboardWidth = Math.max(46, Math.floor(2/3 * w));
    dashboardHeight = 3;
    dashboardX = Math.floor(w/2 - dashboardWidth / 2);
    dashboardY = h - 1 - dashboardHeight;
    
    let beginning = fromEnd(dashboardX + dashboardY * w);
    
    /*a.splice(beginning, dashboardWidth, {[c['dashBorder']]: '╔' }, ...fill(dashboardWidth - 2, '═', c['dashBorder']), {[c['dashBorder']]: '╗' });
    a.splice(beginning + w * (dashboardHeight - 1), dashboardWidth, {[c['dashBorder']]: '╚' }, ...fill(dashboardWidth - 2, '═', c['dashBorder']), {[c['dashBorder']]: '╝' });
    for(let i = 0; i < dashboardHeight - 2; i++){
        a.splice(beginning + (w * (i + 1)), 1, {[c['dashBorder']]: '║' });
        a.splice(beginning + (w * (i + 1)) + dashboardWidth - 1, 1, {[c['dashBorder']]: '║' });
    }*/
    makeBorder(a, dashboardX, dashboardY, dashboardWidth, dashboardHeight, c['dashBorder']);
    
    
    
    let posText = `(${pointer.x > 9 ? '' : ' '}${pointer.x},${pointer.y > 9 ? '' : ' '}${pointer.y})`
    let dirText = `(${pointer.dir.x < 0 ? '' : ' '}${pointer.dir.x},${pointer.dir.y < 0 ? '' : ' '}${pointer.dir.y})`
    //let angleText = `${pointer.getAngle()} `;
    let angleText = simpleChars ? arrowsSimple[pointer.getAngle()] : arrows[pointer.getAngle()];
    let info = [...posText.split('').map(v => ({[c['dashPos']]: v })), ' ', {'gray': '•'}, ' ', ...dirText.split('').map(v => ({[c['dashDir']]: v })), ' ', ...angleText.split('').map(v => ({[c['dashAngle']]: v }))];
//    let edit = `[✍]`;
//    let edit = `[▒]`;
//    let edit = `[⛆]`;
//    let edit = `[╱]`;
    let edit = `[√]`;
//    let eventStep = `[‣`;
    let halfStep = `[⠆`;
    let fullStep = `∙]`;
//    let fullStep = `≥]`;
    //let eventStep = `ⵗ]`;
    let play = playing ? `[‼` : `[►`;
    let pause = `║`;
    let stop = `■]`;
    //let controls = [...escape(edit, c['controls']), ...fill(2, ' '), ...escape(eventStep, c['controls']), ' ', ...escape(halfStep, c['controls']), ' ', ...escape(fullStep, c['controls']), ...fill(3, ' '), ...escape(play, c['controls']), ...fill(2, ' '), ...escape(stop, c['controls'])]
    //let controls = [...step.split('').map(v => ({[c['yellowBright']]: v })), ...step.split('').map(v => ({[c['yellowBright']]: v }))]
    
    //makeBorder(a, dashboardX, dashboardY, info.length + 4, 3, 'cyanBright');
    a.splice(beginning + w + 2, info.length, ...info);
    
    let controls = escape(`${edit}  ${halfStep} ${fullStep}   ${play}  ${stop}`, c['controls']);
    dashboardControls[0].pos = (dashboardWidth - controls.length - 3) + 1;
    dashboardControls[1].pos = (dashboardWidth - controls.length - 3) + 6;
    dashboardControls[2].pos = (dashboardWidth - controls.length - 3) + 8;
    dashboardControls[3].pos = (dashboardWidth - controls.length - 3) + 14;
    dashboardControls[4].pos = (dashboardWidth - controls.length - 3) + 17;
    
    
    makeBorder(a, dashboardX + (dashboardWidth - (controls.length + 4)), dashboardY, controls.length + 2, 3, 'cyanBright');
    a.splice(beginning + w + (dashboardWidth - (controls.length + 4)), 1, ' ');
    a.splice(beginning + w + (dashboardWidth - (controls.length + 4)) + controls.length + 1, 1, ' ');
    a.splice(beginning + w + dashboardWidth - controls.length - 3, controls.length, ...controls);
    
    
    if(playing){
        let num = (playSpeed + 1) % playSpeedMax;
        a.splice(fromEnd(dashboardX + dashboardControls[3].pos - (num.toString().length) + w * (dashboardY + 0)), (num.toString().length), ...escape(num.toString(), c['controls']))
        num = playSpeed;
        a.splice(fromEnd(dashboardX + dashboardControls[3].pos - (num.toString().length + 1) + w * (dashboardY + 1)), (num.toString().length + 1), ...escape('[' + num.toString(), c['controls']))
        num = (playSpeed - 1 + playSpeedMax) % playSpeedMax;
        a.splice(fromEnd(dashboardX + dashboardControls[3].pos - (num.toString().length) + w * (dashboardY + 2)), (num.toString().length), ...escape(num.toString(), c['controls']))
    }
    
    return a;
}

function stacks(a){
    let dashStart = fromEnd(dashboardX + dashboardY * w);
    let beginning = 0;
    
    beginning = dashStart - w * 3 + (dashboardWidth - (worm.stack.current.values.join(',').length + 2));
    a.splice(beginning, worm.stack.current.values.join(',').length + 2, ...escape('[' + worm.stack.current.values.join(',') + ']', 'keyword("orange")'));
    let curPos = 1;
    for(let i = 0; i < worm.stack.current.values.length; i++){
        let v = worm.stack.current.values[i];
        let char = String.fromCharCode(v);
        if(v >= 32 && v <= 126){
            a.splice(beginning - w * 1 + curPos, char.length, ...escape(char, 'yellow'));
        }
        curPos += v.toString().length + 1;
    }
    
    beginning = dashStart - w * 3 + (dashboardWidth - (worm.stack.current.values.join(',').length + 2));
    a.splice(beginning, worm.stack.current.values.join(',').length + 2, ...escape('[' + worm.stack.current.values.join(',') + ']', 'keyword("orange")'));
    
    beginning = dashStart - w * 2 + (dashboardWidth - (worm.stack.register.values.join(',').length + 2));
    a.splice(beginning, worm.stack.register.values.join(',').length + 2, ...escape('[' + worm.stack.register.values.join(',') + ']', 'redBright'));
    
    a.splice(dashStart - w * 1, worm.input.join('').length, ...escape(worm.input.join(''), 'magentaBright'));
    
    return a;
}

function output(a){
    
    //a.splice(fromEnd(3 + w * (h - 6)), worm.output.length, ...escape(worm.output.join(''), 'yellowBright'));
    let line = '',
        row = 0;
    for(let i = 0; i < worm.output.length; i++){
        if(worm.output[i] === '\n'){
            if(line.length > 0){
                a.splice(fromEnd(3 + w * (row + 3)), line.length, ...escape(line, 'magentaBright'));
            }
            row++
            line = '';
        } else {
            line += worm.output[i];
        }
    }
    if(line.length > 0){
        a.splice(fromEnd(3 + w * (row + 3)), line.length, ...escape(line, 'magentaBright'));
    }
    
    for(let i = 0; i < row + 1; i++){
        let char = i === 0 ? '╔' : i === row ? '╚' : '║';
        a.splice(fromEnd(1 + w * (i + 3)), 1, ...escape(char, 'magentaBright'))
    }
    
    return a;
}

function showInput(a){
    clearInput();
    if(inputLine.length > 0){
        //a.splice(-1, inputLine.length, ...escape(inputLine, 'white'))
        process.stdout.cursorTo(0, h);
        process.stdout.write(inputLine);
    }
    
    return a;
}

function clearInput(){
    process.stdout.cursorTo(0, h);
    process.stdout.write(' '.repeat(w-1));
}

function info(a){
    let charCount = worm.board.code.reduce((arr, v) => arr.concat(v)).length + (worm.board.code.length - 1)
    let text = charCount + ' chars';
    a.splice(fromEnd((w - text.length - 3) + w * 1), text.length, ...escape(charCount.toString(), 'magentaBright'), ...escape(' chars', 'blueBright'));
    
    text = worm.cycleCount + ' cycles';
    a.splice(fromEnd((w - text.length - 3) + w * 2), text.length, ...escape(worm.cycleCount.toString(), 'magentaBright'), ...escape(' cycles', 'blueBright'));
    
    return a;
}

function pointer(a){
    let pointer = worm.pointer;
    let loc = fromEnd((codeX + pointer.x) + (codeY + pointer.y) * w);
    //log(a[a.length + loc])
    a.splice(loc, 1, {[c['pointer']]: pointer.instruction });
    
    loc += pointer.dir.x;
    loc += pointer.dir.y * w;
    let char = worm.board.get({x: pointer.x + pointer.dir.x, y: pointer.y + pointer.dir.y});
    a.splice(loc, 1, {[c['nextPointer']]: char === worm.EDGE ? '░' : char });
}

function trail(a){
    let pointer = worm.pointer;
    let trailColor = {r: 150, g: 200, b: 67};
    let bgColor = {r: 38, g: 50, b: 56};
    for(let i = 0; i < Math.min(4, pointerTrail.length); i++){
        let pos = pointerTrail[i];
        let loc = fromEnd((codeX + pos.x) + (codeY + pos.y) * w);
        let char = worm.board.get({x: pos.x, y: pos.y});
        a.splice(loc, 1, {['bgRgb(' + (trailColor.r + ((bgColor.r - trailColor.r) / 4) * i) + ", " + (trailColor.g + ((bgColor.g - trailColor.g) / 4) * i) + ", " + (trailColor.b + ((bgColor.b - trailColor.b) / 4) * i) + ")"]: char === worm.EDGE ? '░' : char });
        //log(i, pos, loc, a[a.length + loc]);
    }
}

function fromEnd(n){
    return n - (w*h) + 1;
}

function fill(n, char, color){
    if(color){
        return (new Array(n)).fill({[color]: char });
    } else {
        return (new Array(n)).fill(char);
    }
}

function escape(str, color){
    return str.split('').map(v => ({[color]: v }));
}