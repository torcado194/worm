const util = require('util');
const EventEmitter = require('events').EventEmitter;

const EDGE = Symbol("edge");

const log = console.log;

util.inherits(Worm, EventEmitter);

function Worm(code, input, delay = 0){
    //EventEmitter.call(this);
    
    let worm = this;
    
    let board,
        stack,
        pointer;
    
    worm.source = code;
    worm.input = input;
    worm.output = [];
    worm.running = false;
    
    worm.edge = worm.EDGE = EDGE;
    
    this.init = function(){
        board = worm.board = new Board(worm.source);
        stack = worm.stack = new Stack();
        pointer = worm.pointer = new Pointer();
        if(typeof worm.input === 'string'){
            worm.input = worm.input.split('');
        }
        worm.input.reverse();
        worm.running = true;
        worm.emit('test');
        
        log(worm.board.code);
        
        this.update();
    }
    
    
    function Board(source){
        this.source = source.toLowerCase();
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
                //return -1;
            } else {
                return this.code[y][x];
            }
        }
        this.set = function(x, y, v){
            let oldBoard = this.code.map(a => a.slice());
            let oldChar = this.get(x, y);
            v = String.fromCharCode(v || 32);
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
            
            let newBoard = this.code.map(a => a.slice());
            worm.emit('boardUpdate', newBoard, oldBoard, [v], [oldChar]);
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
            return this.current.values.pop() || 0;
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
        this.origDir = {x: 1, y: 0};
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
            
            worm.emit('edgeDetect', {x: this.x, y: this.y});
        }
        
        this.checkY = function(){
            if(board.get(this.x, this.y) === EDGE){
                if(this.y < 0){
                    this.y = board.bottom;
                } else if(this.y > board.bottom){
                    this.y = 0;
                }
            }
            
            worm.emit('edgeDetect', {x: this.x, y: this.y});
        }
        
        this.checkWrap = function(){
            let angle = toAngle(this.origDir);
            if(angle === 0 || angle === 4){
                while(board.code[this.y].length === 0){
                    this.y = (this.y + 1) % (board.bottom + 1);
                    worm.emit('edgeDetect', {x: this.x, y: this.y});
                }
            }
            
        }
        
        this.execute = function(){
            this.instruction = board.get(this.x, this.y);
            
            this.origDir = {x: this.dir.x, y: this.dir.y};
            
            worm.emit('instruction', this.instruction, null, {x: this.x, y: this.y});
            
            if(this.instruction === EDGE){
                //log("b")
            } else if(this.charStringing) {
                if(this.instruction === '"'){
                    worm.run(this.instruction);
                } else {
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
            this.prev = {x: this.x, y: this.y};
        }
        this.move = function(){
            let angle = this.getAngle();
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
            this.checkWrap();
            
            worm.emit('positionUpdate', {x: this.x, y: this.y}, {x: this.prev.x, y: this.prev.y});
            
            //let inst = this.instruction === EDGE ? '░' : this.instruction;
            //log(chalk`{green ${inst}}    {cyan (${this.x}, ${this.y})}  |  {red (${this.dir.x}, ${this.dir.y})}${new Array(8 - `${this.dir.x}, ${this.dir.y}`.length).join(' ')}: {magenta ${angle}}`);
        }
        
        this.setPos = function(x, y){
            if(y === undefined){
                y = x.y;
                x = x.x;
            }
            this.x = x;
            this.y = y;
            
            worm.emit('positionUpdate', {x: this.x, y: this.y}, {x: this.prev.x, y: this.prev.y});
        }
        
        this.setDir = function(x, y){
            let old = {x: this.dir.x, y: this.dir.y};
            if(y === undefined){
                y = x.y;
                x = x.x;
            }
            this.dir = {x, y};
            
            worm.emit('directionUpdate', {x: this.dir.x, y: this.dir.y}, {x: old.x, y: old.y});
        }
        
        this.setAngle = function(a){
            this.dir = toDir(a);
        }
        
        this.rotate = function(a){
            this.setAngle(this.getAngle() + a);
        }
        
        this.getAngle = function(){
            return toAngle(this.dir);
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
        worm.emit('output', String.fromCharCode(char), char, "character");
    }
    
    worm.printNum = function(num){
        worm.output.push(num);
        worm.emit('output', num, num, "number");
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
            pointer.setDir(1, 0);
        },
        'v': () => {
            pointer.setDir(0, 1);
        },
        '<': () => {
            pointer.setDir(-1, 0);
        },
        '^': () => {
            pointer.setDir(0, -1);
        },
        '\\': () => {
            let dir = pointer.dir;
            pointer.setDir(dir.y, dir.x);
        },
        '/': () => {
            let dir = pointer.dir;
            pointer.setDir(-dir.y, -dir.x);
        },
        '|': () => {
            let dir = pointer.dir;
            pointer.setDir(-dir.x, dir.y);
        },
        '_': () => {
            let dir = pointer.dir;
            pointer.setDir(dir.x, -dir.y);
        },
        'x': () => {
            let angle = toAngle(pointer.x - pointer.prev.x, pointer.y - pointer.prev.y);
            pointer.setAngle(angle + 1);
            pointer.move();
            pointer.setAngle(angle);
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
            pointer.setPos(x, y);
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
            pointer.setPos(target.x, target.y);
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
            let v = board.get(x,y);
            if(v == worm.EDGE){
                v = -1
            }
            stack.push(v);
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
            let x = worm.getCharInput();
            stack.push(x);
        },
        'j': () => {
            let x = worm.getNumInput();
            stack.push(x);
        },
        'u': () => {
            let x = stack.pop();
            worm.printChar(x);
        },
        'n': () => {
            let x = stack.pop();
            worm.printNum(x);
        },
        'r': () => {
            worm.running = false;
            worm.emit('input', 'character', function(char){
                worm.stack.push(parseChar(char));
                worm.running = true;
                worm.update(true);
            });
        },
        't': () => {
            worm.running = false;
            worm.emit('input', 'number', function(num){
                worm.stack.push(parseNum(num));
                worm.running = true;
                worm.update(true);
            });
        },
    }
    
    this.run = function(instruction){
        instructions[instruction]();
    }
    
    this.update = function(move){
        if(!move){
            worm.pointer.execute();
        }
        if(worm.running){
            worm.pointer.move();
            if(delay){
                setTimeout(()=>{
                    worm.update();
                }, delay);
            } else {
                worm.update();
            }
        } else {
            //log(chalk.keyword('orange')(worm.output.join('')));
        }
    }
    
    this.end = function(){
        worm.running = false;
        worm.emit('end', worm.output.join(''));
    }
    
    this.getCharInput = function(){
        return parseChar(worm.input);
    }
    
    this.getNumInput = function(){
        return parseNum(worm.input);
    }
}

function toAngle(x, y){
    if(y === undefined){
        y = x.y;
        x = x.x;
    }
    return (Math.atan2(y,x) * (4/Math.PI) + 8) % 8;
}

function toDir(a){
    return {x: Math.round(Math.cos((Math.PI/4) * a)),
            y: Math.round(Math.sin((Math.PI/4) * a))};
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
            return item.pop().charCodeAt(0);
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


module.exports = Worm;