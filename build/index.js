#!/usr/bin/env node
import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
// Validate command line arguments
if (process.argv.length < 4) {
    console.error('Error: Not enough arguments');
    console.error('Usage: node index.js <log_file> <command> [arguments...]');
    process.exit(1);
}
const logFile = process.argv[2];
const command = process.argv[3];
const args = process.argv.slice(4);
// Create a stream for the log file
const logStream = fs.createWriteStream(logFile, { flags: 'a' });
const log = (message) => {
    const timestamp = new Date().toISOString();
    const formattedMessage = `${timestamp} ${message}${message.endsWith(os.EOL) ? '' : os.EOL}`;
    logStream.write(formattedMessage);
};
// Handle log file errors
logStream.on('error', (error) => {
    console.error(`Error: Failed to open log file.`);
    console.error(`${error.message}`);
    process.exit(1);
});
// Launch subprocess
const childProcess = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] });
log(`[INFO] Subprocess launched: ${command} ${args.join(' ')}`);
childProcess.on('error', (error) => {
    console.error(`Failed to start subprocess: ${error.message}`);
    log(`[ERROR] Failed to start subprocess: ${error.message}`);
    process.exit(1);
});
childProcess.on('close', (code) => {
    log(`[INFO] Subprocess finished with code ${code}`);
    logStream.end(); // Close the stream
    process.exit(code);
});
// Pass subprocess standard output to parent process standard output
childProcess.stdout.on('data', (chunk) => {
    process.stdout.write(chunk);
    log(`[STDOUT] ${chunk}`); // Also write to log file
});
// Pass subprocess standard error to parent process standard error
childProcess.stderr.on('data', (chunk) => {
    process.stderr.write(chunk);
    log(`[STDERR] ${chunk}`); // Also write to log file
});
// When data is input
process.stdin.on('data', (chunk) => {
    childProcess.stdin.write(chunk);
    log(`[STDIN] ${chunk}`); // Write standard input to log file
});
// List linux signals.
const signals = [
    'SIGABRT', 'SIGALRM', 'SIGBUS', 'SIGCHLD', 'SIGCONT', 'SIGFPE', 'SIGHUP',
    'SIGILL', 'SIGINT', 'SIGIO', 'SIGIOT', 'SIGPIPE', 'SIGPOLL',
    'SIGPROF', 'SIGPWR', 'SIGQUIT', 'SIGSEGV', 'SIGSTKFLT', 'SIGSYS',
    'SIGTERM', 'SIGTRAP', 'SIGTSTP', 'SIGTTIN', 'SIGTTOU', 'SIGUNUSED', 'SIGURG',
    'SIGUSR1', 'SIGUSR2', 'SIGVTALRM', 'SIGWINCH', 'SIGXCPU', 'SIGXFSZ'
];
// Logging signals.
signals.forEach(signal => {
    try {
        process.on(signal, () => {
            log(`[SIGNAL] ${signal} received.`);
        });
    }
    catch (err) {
        // for windows os.
        log(`[ERROR] ${err}`);
    }
});
// Forward signals from parent process to child process
['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGTERM'].forEach(signal => {
    try {
        process.on(signal, () => {
            log(`[SIGNAL] ${signal} received from parent process, forwarding to child process.`);
            try {
                childProcess.kill(signal);
            }
            catch (err) {
                log(`[ERROR] ${err}`);
            }
        });
    }
    catch (err) {
        // for windows os.
        log(`[ERROR] ${err}`);
    }
});
