const Worm = require('./index.js');
const fs = require('fs');
const chalk = require('chalk');

const log = console.log;


let charMode = false;

let flags = {
    '-c': "code",
    '--code': "code",
    '-d': "delay",
    '--delay': "delay",
    '--v': "verbose",
    '--verbose': "verbose",
    '--i': "verbose",
    '--input': "verbose",
}

function init(){

    //grab cli arguments
    let args = process.argv.slice(2);
    let source = '',
        sourceIndex = 0,
        input = '',
        delay = 0,
        verbose = false;
    
    //if -c or --code flag is passed, ignore file input
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
    if(args.includes("-d") || args.includes("--delay")){
        let index = args.findIndex(a => a === "-d" || a === "--delay");
        delay = args[index + 1];
        if(!isNaN(parseFloat(delay))){
            delay = parseFloat(delay);
        }
    } else {
        delay = 0;
    }
    if(args.includes("-v") || args.includes("--verbose")){
        verbose = true;
    }
    
    if(Object.keys(flags).includes(args[sourceIndex + 1])){
        input = '';
    } else {
        input = args[sourceIndex + 1];
    }
    
    if(args.includes("-i") || args.includes("--input")){
        let index = args.findIndex(a => a === "-i" || a === "--input");
        input = fs.readFileSync(args[index + 1], {encoding: "utf8"});
    }
    
    if(verbose){
        log(source);
    }
    
    let worm = new Worm(source, input, delay);
    worm.on('instruction', (char, name, pos) => {
        if(verbose){
            //log(chalk.blueBright(char));
            let inst = char === worm.EDGE ? '░' : char;
            log(chalk`{green ${inst}}    {cyan (${pos.x}, ${pos.y})}{gray   |  }{red (${worm.pointer.dir.x}, ${worm.pointer.dir.y})}${new Array(8 - `${worm.pointer.dir.x}, ${worm.pointer.dir.y}`.length).join(' ')}: {magenta ${worm.pointer.getAngle()}}{gray   |  }{yellow ${worm.stack.values}}{redBright  [${worm.input}]}`);
        }
    });
    worm.on('output', (data) => {
        process.stdout.write(data.toString());
        //log(chalk.keyword('orange')(data));
    });
    worm.on('end', (output) => {
        if(verbose){
            log(worm.output);
            log(chalk.greenBright(source));
            log(chalk`{magenta ::done!::  }{keyword('orange') ${output}}`);
        }
        process.stdin.emit('end');
        process.exit(0);
    });
    
    worm.on('input', (type, cb) => {
        if(type === "character"){
            process.stdin.setRawMode(true);
        } else {
            process.stdin.setRawMode(false);
        }
        process.stdin.on('data', handler);
        function handler(input){
            if(input[0] === 3){
                process.exit(0);
            }
            if(charMode){
                charMode = false;
                process.stdin.setRawMode(false);
            }
            if(verbose){
                log(input);
                log([...input]);
            }
            cb(input.toString());
            process.stdin.removeListener('data', handler);
        }
    });
    
    
    worm.init();
    
    process.on('SIGINT', function () {
        process.exit(0);
    });
    
    //process.stdin.setRawMode(true);
    
}
init();