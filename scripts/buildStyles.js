'use strict';

const {spawn} = require('node:child_process');

const styleEntries = [
    'css/biblePreviewer.scss:css/generated/biblePreviewer.css',
    'css/options.scss:css/generated/options.css',
    'css/popup.scss:css/generated/popup.css'
];

const args = process.argv.slice(2);
const shouldWatch = args.includes('--watch') || args.includes('--watch-and-build');
const shouldBuildWebpack = args.includes('--watch-and-build');

const sassArgs = ['sass'];
if (!shouldWatch) {
    sassArgs.push('--no-source-map');
}
sassArgs.push(...styleEntries);
if (shouldWatch) {
    sassArgs.splice(1, 0, '--watch');
}

const childProcesses = [];

/**
 * Spawns a local npm executable and forwards stdio.
 * @param {string} command Command to execute
 * @param {string[]} commandArgs Arguments for the command
 * @returns {import('node:child_process').ChildProcess} Spawned child process
 */
function run(command, commandArgs) {
    const childProcess = spawn(command, commandArgs, {
        stdio: 'inherit',
        shell: process.platform === 'win32'
    });

    childProcesses.push(childProcess);
    return childProcess;
}

let receivedTerminationSignal = false;

/**
 * Stops all spawned child processes once a termination signal is received.
 * @param {string} signal Termination signal
 * @returns {void}
 */
function shutdown(signal) {
    if (receivedTerminationSignal) {
        return;
    }

    receivedTerminationSignal = true;
    for (const childProcess of childProcesses) {
        if (!childProcess.killed) {
            childProcess.kill(signal);
        }
    }
}

for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => shutdown(signal));
}

const sassProcess = run('npx', sassArgs);

if (!shouldBuildWebpack) {
    sassProcess.on('exit', code => {
        process.exit(code ?? 0);
    });
} else {
    const webpackProcess = run('npx', ['webpack', '--watch']);

    let remainingProcesses = 2;

    /**
     * Mirrors child exit codes while keeping both watch processes tied together.
     * @param {number | null} code Exit code from the child process
     * @returns {void}
     */
    function handleExit(code) {
        remainingProcesses -= 1;
        if (!receivedTerminationSignal) {
            shutdown('SIGTERM');
        }

        if (remainingProcesses === 0) {
            process.exit(code ?? 0);
        }
    }

    sassProcess.on('exit', handleExit);
    webpackProcess.on('exit', handleExit);
}
