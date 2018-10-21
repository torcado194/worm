const fs = require('fs');
const chalk = require('chalk');
const events = require('events').EventEmitter;

const EDGE = Symbol("edge");

const log = console.log;

function Worm(code, delay = 0){
    let worm = this;
    
    /*let source = worm.source = code;
    let running = worm.running = false;
    let stack = worm.stack = {};
    let pointer = worm.pointer = {};
    let board = worm.board = {};
    let output = worm.output = [];*/
    
    let board,
        stack,
        pointer;
    
    worm.source = code;
    worm.output = [];
    worm.running = false;
    
    this.init = function(){
        board = worm.board = new Board(worm.source);
        stack = worm.stack = new Stack();
        pointer = worm.pointer = new Pointer();
        worm.running = true;
        this.update();
    }
    
    function Board(source){
        this.source = source;
        this.code = [[]];
        this.bottom = 0;
        
        this.parse = function(){
            this.code = [];
            let lines = this.source.split(/\r?\n/); //split lines into array
            this.code = lines.map(v => v.split('')); //split each line into individual characters
            this.bottom = this.code.length - 1;
        }
        this.parse();
        this.get = function(x, y){
            //return edge if outside bounds
            if(this.code[y] == undefined || this.code[y][x] === undefined){
                return EDGE;
            } else {
                return this.code[y][x];
            }
        }
        this.set = function(x, y, v){
            //check if outside bounds
            if(this.get(x, y) === EDGE){
                //create new lines if lower than bottom
                if(this.code[y] === undefined){
                    for(let i = 0; i < y - this.bottom; i++){
                        this.code.push([]);
                    }
                    this.bottom = this.code.length - 1;
                }
                //create space between end of line and character
                let line = this.code[y];
                let width = line.length;
                for(let i = 0; i < x - width; i++){
                    line.push(" ");
                }
                line[x] = v;
            } else {
                this.code[y][x] = v;
            }
        }
    }
    
    function Stack(values = [], r = false){
        this.values = values;
        this.stacks = [];
        this.current = this;
        if(!r){
            this.registers = [this.register = new Stack([], true)];
        }
        
        this.pop = function(){
            return this.current.values.pop();
        }
        
        this.push = function(v){
            return this.current.values.push(v);
        }
        
        this.length = function(){
            return this.current.values.length;
        }
        
        this.fork = function(n){
            this.current = this.stacks.push(new Stack(this.current.splice(-n)));
            this.registers.push(this.register = new Stack());
        }
        
        this.merge = function(){
            (this.current = this.stacks[this.stacks.length-2]).push(this.stacks.pop());
            this.registers.pop();
            this.register = this.registers[this.registers.length];
        }
        
        this.duplicate = function(){
            this.current.values.push(this.current.values[this.current.values.length-1]);
        }
        
        this.reverse = function(){
            this.current.values.reverse();
        }
        
        this.shift = function(){
            this.current.values.unshift(this.current.values.pop());
        }
        
        this.unshift = function(){
            this.current.values.push(this.current.values.shift());
        }
        
        this.toRegister = function(){
            this.register.push(this.current.pop());
        }
        
        this.fromRegister = function(){
            this.current.push(this.register.pop());
        }
    }
    
    function Pointer(x = 0, y = 0, dir = 0){
        this.x = x;
        this.y = y;
        this.dir = {x: 1, y: 0};
        this.prev = {x: 0, y: 0};
        this.instruction = '';
        this.wallMode = false;
        this.charString = [];
        this.charStringing = false;
        this.numString = [];
        this.numStringing = false;
        
        this.checkX = function(){
            if(board.get(this.x, this.y) === EDGE){
                let line = board.code[this.y];
                if(this.x < 0){
                    this.x = line.length - 1;
                } else if(this.x > line.length - 1){
                    this.x = 0;
                }
            }
        }
        
        this.checkY = function(){
            if(board.get(this.x, this.y) === EDGE){
                if(this.y < 0){
                    this.y = board.bottom;
                } else if(this.y > board.bottom){
                    this.y = 0;
                }
            }
        }
        
        this.execute = function(){
            this.instruction = board.get(this.x, this.y);
            
            if(this.instruction === EDGE){
                
            } else if(this.charStringing) {
                if(this.instruction === '"'){
                    worm.run(this.instruction);
                } else {
                    log(parseChar(this.instruction));
                    stack.push(parseChar(this.instruction));
                }
            } else if(this.numStringing){
                //for now, parsing stores values in a list to be parsed at once. may change later to parse as it runs,
                // which may require the functions to be part of Pointer.
                if(this.instruction === "'"){
                    worm.run(this.instruction);
                } else {
                    this.numString.push(this.instruction);
                }
                
            } else {
                worm.run(this.instruction);
            }
        }
        this.move = function(){
            let angle = toAngle(this.dir);
            if(angle === 0 || angle === 4){
                this.x += this.dir.x;
                this.checkX();
            } else if(angle === 2 || angle === 6){
                this.y += this.dir.y;
                this.checkY();
            } else if(angle === 1 || angle === 5){
                this.x += this.dir.x;
                this.checkX();
                this.y += this.dir.y;
                this.checkY();
            } else if(angle === 3 || angle === 7){
                this.y += this.dir.y;
                this.checkY();
                this.x += this.dir.x;
                this.checkX();
            }
            let inst = this.instruction === EDGE ? '░' : this.instruction;
            log(chalk`{green ${inst}}    {cyan (${this.x}, ${this.y})}  |  {red (${this.dir.x}, ${this.dir.y})}${new Array(8 - `${this.dir.x}, ${this.dir.y}`.length).join(' ')}: {magenta ${angle}}`);
        }
        
        /*this.setDir(x, y){
            this.dir = {x, y};
        }*/
        
        this.setAngle = function(a){
            this.dir = toDir(a);
        }
        
        this.rotate = function(a){
            this.setAngle(toAngle(this.dir) + a);
        }
        
        this.toggleWallMode = function(){
            this.wallMode = !this.wallMode;
        }
        
        //TODO: on close, parse strings.
        this.toggleCharString = function(){
            this.charStringing = !this.charStringing;
        }
        this.toggleNumString = function(){
            this.numString.reverse();
            if(this.numStringing){
                while(this.numString.length > 0){
                    stack.push(parseNum(this.numString));
                }
            }
            this.numStringing = !this.numStringing;
        }
    }
    
    worm.printChar = function(char){
        worm.output.push(String.fromCharCode(char));
        log(chalk.keyword('orange')(String.fromCharCode(char)));
    }
    
    worm.printNum = function(num){
        worm.output.push(num);
        log(chalk.keyword('orange')(num));
    }
    
    let instructions = {
        '': () => {},
        ' ': () => {},
        [EDGE]: () => {},
        '0': () => {
            stack.push(0);
        },
        '1': () => {
            stack.push(1);
        },
        '2': () => {
            stack.push(2);
        },
        '3': () => {
            stack.push(3);
        },
        '4': () => {
            stack.push(4);
        },
        '5': () => {
            stack.push(5);
        },
        '6': () => {
            stack.push(6);
        },
        '7': () => {
            stack.push(7);
        },
        '8': () => {
            stack.push(8);
        },
        '9': () => {
            stack.push(9);
        },
        'a': () => {
            stack.push(10);
        },
        'b': () => {
            stack.push(11);
        },
        'c': () => {
            stack.push(12);
        },
        'd': () => {
            stack.push(13);
        },
        'e': () => {
            stack.push(14);
        },
        'f': () => {
            stack.push(15);
        },
        '+': () => {
            let y = stack.pop();
            let x = stack.pop();
            stack.push(x + y);
        },
        '-': () => {
            let y = stack.pop();
            let x = stack.pop();
            stack.push(x - y);
        },
        '*': () => {
            let y = stack.pop();
            let x = stack.pop();
            stack.push(x * y);
        },
        ',': () => {
            let y = stack.pop();
            let x = stack.pop();
            stack.push(x / y);
        },
        '%': () => {
            let y = stack.pop();
            let x = stack.pop();
            stack.push(mod(x, y));
        },
        'l': () => {
            let x = stack.pop();
            stack.push(Math.floor(x));
        },
        '(': () => {
            let y = stack.pop();
            let x = stack.pop();
            stack.push(x < y ? 1 : 0);
        },
        ')': () => {
            let y = stack.pop();
            let x = stack.pop();
            stack.push(x > y ? 1 : 0);
        },
        '=': () => {
            let y = stack.pop();
            let x = stack.pop();
            stack.push(x == y ? 1 : 0);
        },
        '"': () => {
            pointer.toggleCharString();
        },
        '\'': () => {
            pointer.toggleNumString();
        },
        '>': () => {
            pointer.dir = {x: 1, y: 0};
        },
        'v': () => {
            pointer.dir = {x: 0, y: 1};
        },
        '<': () => {
            pointer.dir = {x: -1, y: 0};
        },
        '^': () => {
            pointer.dir = {x: 0, y: -1};
        },
        '\\': () => {
            let dir = pointer.dir;
            pointer.dir = {x: dir.y, y: dir.x};
        },
        '/': () => {
            let dir = pointer.dir;
            pointer.dir = {x: -dir.y, y: -dir.x};
        },
        '|': () => {
            let dir = pointer.dir;
            pointer.dir = {x: -dir.x, y: dir.y};
        },
        '_': () => {
            let dir = pointer.dir;
            pointer.dir = {x: dir.x, y: -dir.y};
        },
        'x': () => {
            let angle = toAngle(pointer.x - pointer.prev.x, pointer.y - pointer.prev.y);
            log(pointer.x, pointer.y);
            pointer.setAngle(angle + 1);
            pointer.move();
            pointer.setAngle(angle);
            log(pointer.x, pointer.y);
        },
        'y': () => {
            let angle = toAngle(pointer.x - pointer.prev.x, pointer.y - pointer.prev.y);
            pointer.setAngle(angle - 1);
            pointer.move();
            pointer.setAngle(angle);
        },
        '&': () => {
            pointer.rotate(1);
        },
        'k': () => {
            pointer.rotate(Math.floor(Math.random() * 4) * 2);
        },
        '#': () => {
            pointer.toggleWallMode();
        },
        '`': () => {
            let y = stack.pop();
            let x = stack.pop();
            pointer.x = x;
            pointer.y = y;
            pointer.prev = {x: pointer.x, y: pointer.y};
        },
        '!': () => {
            pointer.move();
        },
        '?': () => {
            let x = stack.pop();
            if(x === 0){
                pointer.move();
            }
        },
        '.': () => {
            let x = stack.pop();
            for(let i = 0; i < x; i++){
                pointer.move();
            }
        },
        'o': () => {
            let current = {x: pointer.x, y: pointer.y},
                minDist = Number.MAX_VALUE,
                target = {x: 0, y: 0};
            for(let y = 0; y < board.code.length; y++){
                let line = board.code[y];
                for(let x = 0; x < line.length; x++){
                    let dist = Math.abs((x - current.x) + (y - current.y));
                    if(dist < minDist){
                        minDist = dist;
                        target = {x, y};
                    } 
                }
            }
            pointer.x = target.x;
            pointer.y = target.y;
            pointer.prev = {x: pointer.x, y: pointer.y};
        },
        ':': () => {
            stack.duplicate();
        },
        '~': () => {
            stack.pop();
        },
        '$': () => {
            let x = stack.pop();
            let y = stack.pop();
            stack.push(x);
            stack.push(y);
        },
        '@': () => {
            let x = stack.pop();
            let y = stack.pop();
            let z = stack.pop();
            stack.push(x);
            stack.push(z);
            stack.push(y);
        },
        '}': () => {
            stack.shift();
        },
        '{': () => {
            stack.unshift();
        },
        'm': () => {
            stack.reverse();
        },
        'h': () => {
            stack.push(stack.length());
        },
        '[': () => {
            stack.fork(stack.pop());
        },
        ']': () => {
            stack.merge();
        },
        'p': () => {
            stack.toRegister();
        },
        'q': () => {
            stack.fromRegister();
        },
        'g': () => {
            let y = stack.pop();
            let x = stack.pop();
            stack.push(board.get(x,y));
        },
        's': () => {
            let y = stack.pop();
            let x = stack.pop();
            let v = stack.pop();
            board.set(x,y,v);
        },
        'w': () => {
            let x = stack.pop();
            //sleep(x);
        },
        ';': () => {
            worm.end();
        },
        'i': () => {
            //
        },
        'j': () => {
            //
        },
        'u': () => {
            let x = stack.pop();
            worm.printChar(x);
        },
        'n': () => {
            let x = stack.pop();
            worm.printNum(x);
        },
    }
    
    this.run = function(instruction){
        instructions[instruction]();
    }
    
    this.update = function(){
        worm.pointer.execute();
        worm.pointer.move();
        if(worm.running){
            if(delay){
                setTimeout(()=>{
                    worm.update();
                }, delay);
            } else {
                worm.update();
            }
        } else {
            log(chalk.magenta("=== done! ==="));
            log(chalk.keyword('orange')(worm.output.join('')));
        }
    }
    
    this.end = function(){
        worm.running = false;
    }
    
}

function init(){
    
    //grab cli arguments
    let args = process.argv.slice(2);
    let source = '';
    
    //if -c or --code flag is passed, ignore file input
    if(args.includes("-c") || args.includes("--code")){
        let index = args.findIndex(a => a === "-c" || a === "--code");
        source = args[index + 1];
    } else {
        try{
            source = fs.readFileSync(args[0], {encoding: "utf8"});
        } catch(e) {
            console.log("could not find file");
        }
    }
    
    //board.set(3,3,"f");
    //console.log(board.code);
    let worm = new Worm(source, args[1] || 200);
    worm.init();
}
init();

function toAngle(x, y){
    if(y === undefined){
        y = x.y;
        x = x.x;
    }
    return (Math.atan2(y,x) * (4/Math.PI) + 8) % 8;
}

function toDir(a){
    return {x: mod(Math.round(Math.cos((Math.PI/4) * a)), 8),
            y: mod(Math.round(Math.sin((Math.PI/4) * a)), 8)};
}

function parseChar(item){
    if(typeof item === "number"){
        return item;
    } else if(typeof item === "string"){
        return item.charCodeAt(0);
    } else if(Array.isArray(item)){
        return parseChar(item.pop());
    }
}

function parseNum(item){
    if(typeof item === "string"){
        return parseNum(item.split('').reverse());
    } else if(typeof item === "number"){
        return item;
    } else if(Array.isArray(item)){
        let num = 0,
            n = 0,
            d = -1,
            negative = false,
            inFraction = false,
            cur;
        
        //clear leading spaces
        for(let i = 0; i < item.length; i++){
            if(item[item.length-1] === " "){
                item.pop();
            } else {
                break;
            }
        }
        //check leading -
        if(item[item.length-1] === "-"){
            negative = true;
            if(item.length <= 1 || !/[.0-9]/.test(item[item.length-2])){ // if next item isn't a number or decimal point, return minus char
                return item.pop();
            } else {
                item.pop();
            }
        }
        //check leading .
        if(item[item.length-1] === "."){
            inFraction = true;
            if(item.length <= 1 || !/[0-9]/.test(item[item.length-2])){ // if next item isn't a number, return decimal point char
                return item.pop();
            } else {
                item.pop();
            }
        }
        
        //return if just a char
        if(!/[0-9]/.test(item[item.length-1])){
            return item.pop();
        }
        let length = item.length;
        for(let i = 0; i < length; i++){
            cur = item[item.length - 1];
            if(/[0-9]/.test(cur)){
                if(inFraction){
                    num += (10 ** (d--)) * parseInt(cur);
                } else {
                    num *= 10
                    num += parseInt(cur);
                }
                item.pop();
            } else if(/\./.test(cur)){
                if(inFraction){
                    break;
                } else {
                    inFraction = true;
                    item.pop();
                }
            } else {
                break;
            }
        }
        if(negative){
            num *= -1;
        }
        return num;
    }
}

function mod(x, n){
    return (x % n + n) % n;
}