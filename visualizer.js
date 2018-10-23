const Worm = require('./index.js');
const fs = require('fs');
const chalk = require('chalk');

const log = console.log;


let w = 0,
    h = 0;

process.on('SIGWINCH', () => {
    w = process.stdout.columns;
    h = process.stdout.rows;
    log(chalk.yellow(w, h));
});

process.stdin.setRawMode(true);
process.stdin.on('data', inputHandler);
function inputHandler(input){
    if(input[0] === 3){
        process.exit(0);
    }
    log(input);
    log([...input]);
    if(String.fromCharCode(input[0]) === 'a'){
        let a = []
        startPadding(a);
        borders(a);
        log(a.join(''));
    }
}

init();
function init(){
    w = process.stdout.columns;
    h = process.stdout.rows;
    log(chalk.yellow(w, h));
}


function startPadding(a){
    let pad = (new Array(w * h)).fill(' ');
    a.splice(0, 0, ...pad);
    return a;
}

function borders(a){
    let horizontal = (new Array(w - 1)).fill(chalk.cyan('='));
    a.splice(-w, w, ...horizontal);
    return a;
}