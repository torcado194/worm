const Worm = require('./index.js');
const fs = require('fs');
const chalk = require('chalk');

const log = console.log;

let w = 0,
    h = 0;

let source = '',
    sourceIndex = 0,
    input = '';

let worm;

let codeCornerX = 0,
    codeCornerY = 0;

let screen = [],
    prevScreen = [];

let simpleChars = false;

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
    '/': 'blueBright',
    '\\': 'blueBright',
    '_': 'blueBright',
    '|': 'blueBright',
    '&': 'keyword("orange")',
    'a': 'green',
    'b': 'green',
    'e': 'green',
    '1': 'green',
    'x': 'cyan',
    'y': 'cyan',
    '!': 'redBright',
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

process.stdin.setRawMode(true);
process.stdin.on('data', inputHandler);
function inputHandler(input){
    if(input[0] === 3){
        process.exit(0);
    }
    //log(input);
    //log([...input]);
    let char = String.fromCharCode(input[0]);
    if(char === 'a'){
        draw();
    }
    
    if(char === ' '){
        worm.update();
        draw();
    }
    
    if(input == '\u001B\u005B\u0041'){
        process.stdout.moveCursor(0, -1);
    }
    if(input == '\u001B\u005B\u0043'){
        process.stdout.moveCursor(1, 0); 
    }
    if(input == '\u001B\u005B\u0042'){
        process.stdout.moveCursor(0, 1);
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
    
    //worm.on('positionUpdate', draw);
    
    worm.init();
    resizeHandler();
}


function draw(p){
    let a = screen = [];
    startPadding(a);
    borders(a);
    trim(a);
    placeCode(a);
    pointer(a);
    dashboard(a);
    
    if(p){
        print(a);
    } else {
        render(a, prevScreen);
    }
    
    prevScreen = [...screen];
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
        if(same(a, b)){
            if(line.length !== 0){
                if(Math.floor(lineStart / w) < 4){
                    debugger;
                }
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
    let horizontal = fill(w - (left + right) - 2, '═', c['border']);
    a.splice(-(w*h) + left, w - (right + left), {[c['border']]: '╔' }, ...horizontal, {[c['border']]: '╗' }); //top
    a.splice(-w + left, w - (right + left), {[c['border']]: '╚' }, ...horizontal, {[c['border']]: '╝' }); //bottom
    for(let i = a.length - (w * (h - 1)); i < a.length - w; i++){
        if(i % w === left){
            a.splice(i, 1, {[c['border']]: '║' });
        } else if(i % w === w - 1 - right){
            a.splice(i, 1, {[c['border']]: '║' });
            
        }
    }
    return a;
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
    
    
    let cornerX = centerX - Math.floor(codeWidth / 2),
        cornerY = centerY - Math.floor(codeHeight / 2);
    
    codeCornerX = cornerX;
    codeCornerY = cornerY;
    
    let beginning = fromEnd(cornerX + cornerY * w);
    //for(let i = fromEnd(cornerX + cornerY * w); i < fromEnd((cornerX + codeWidth) + (cornerY + codeHeight) * w); i++){
    for(let i = 0; i < codeHeight; i++){
        a.splice(beginning + (i*w), code[i].length, ...(code[i].map(v => ({[instColor[v] || 'white']: v }))));
    }
    a.splice(beginning - w - 1, code[0].length + 2, ...(fill(code[0].length + 2, '░', c['edge'])));
    a.splice(beginning + (w*codeHeight) - 1, code[code.length-1].length + 2, ...(fill(code[code.length-1].length + 2, '░', c['edge'])));
    //a.splice(beginning - w - 1, code[0].length + 2, ...(new Array(code[0].length + 2).fill(chalk.bgYellow(' '))));
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
    
    return a;
}

function dashboard(a){
    let pointer = worm.pointer;
    let dashboardWidth = Math.floor(2/3 * w),
        dashboardHeight = 3;
    let cornerX = Math.floor(w/2) - dashboardWidth / 2,
        cornerY = h - 1 - dashboardHeight;
    
    let beginning = fromEnd(cornerX + cornerY * w);
    
    a.splice(beginning, dashboardWidth, {[c['dashBorder']]: '╔' }, ...fill(dashboardWidth - 2, '═', c['dashBorder']), {[c['dashBorder']]: '╗' });
    a.splice(beginning + w * (dashboardHeight - 1), dashboardWidth, {[c['dashBorder']]: '╚' }, ...fill(dashboardWidth - 2, '═', c['dashBorder']), {[c['dashBorder']]: '╝' });
    for(let i = 0; i < dashboardHeight - 2; i++){
        a.splice(beginning + (w * (i + 1)), 1, {[c['dashBorder']]: '║' });
        a.splice(beginning + (w * (i + 1)) + dashboardWidth - 1, 1, {[c['dashBorder']]: '║' });
    }
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
    let eventStep = `[∙`;
    let halfStep = `⠆`;
//    let fullStep = `≥]`;
    let fullStep = `ⵗ]`;
    let play = `[►`;
    let pause = `║`;
    let stop = `■]`;
    let controls = [...escape(edit, c['controls']), ...fill(2, ' '), ...escape(eventStep, c['controls']), ' ', ...escape(halfStep, c['controls']), ' ', ...escape(fullStep, c['controls']), ...fill(2, ' '), ...escape(play, c['controls']), ...fill(2, ' '), ...escape(stop, c['controls'])]
    //let controls = [...step.split('').map(v => ({[c['yellowBright']]: v })), ...step.split('').map(v => ({[c['yellowBright']]: v }))]
    a.splice(beginning + w + 2, info.length, ...info);
    a.splice(beginning + w + dashboardWidth - controls.length - 2, controls.length, ...controls);
    
    a.splice(beginning - w * 2, worm.stack.values.join(',').length + 2, ...escape('[' + worm.stack.values.join(',') + ']', 'keyword("orange")'));
    
    return a;
}

function pointer(a){
    let pointer = worm.pointer;
    let loc = fromEnd((codeCornerX + pointer.x) + (codeCornerY + pointer.y) * w);
    //log(a[a.length + loc])
    a.splice(loc, 1, {[c['pointer']]: pointer.instruction });
    
    loc += pointer.dir.x;
    loc += pointer.dir.y * w;
    let char = worm.board.get({x: pointer.x + pointer.dir.x, y: pointer.y + pointer.dir.y});
    a.splice(loc, 1, {[c['nextPointer']]: char === worm.EDGE ? '░' : char });
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