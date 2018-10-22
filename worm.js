const Worm = require('./index.js');
const fs = require('fs');
const chalk = require('chalk');

const log = console.log;

function init(){

    //grab cli arguments
    let args = process.argv.slice(2);
    let source = '';
    log(args);
    //if -c or --code flag is passed, ignore file input
    if(args.includes("-c") || args.includes("--code")){
        let index = args.findIndex(a => a === "-c" || a === "--code");
        source = args[index + 1];
    } else {
        try{
            source = fs.readFileSync(args[0], {encoding: "utf8"});
        } catch(e) {
            console.log("could not find file", e);
        }
    }
    
    let worm = new Worm(source, args[1] || 200);
    worm.on('instruction', (char, name, pos) => {
        //log(chalk.blueBright(char));
        let inst = char === worm.EDGE ? '░' : char;
        log(chalk`{green ${inst}}    {cyan (${pos.x}, ${pos.y})}{gray   |  }{red (${worm.pointer.dir.x}, ${worm.pointer.dir.y})}${new Array(8 - `${worm.pointer.dir.x}, ${worm.pointer.dir.y}`.length).join(' ')}: {magenta ${worm.pointer.getAngle()}}{gray   |  }{yellow ${worm.stack.values}}`);
    });
    worm.on('output', (data) => {
        log(chalk.keyword('orange')(data));
    });
    worm.on('end', (output) => {
        log(chalk`{magenta ::done!::  }{keyword('orange') ${output}}`);
        log(chalk.greenBright(source))
    });
    worm.init();
}
init();