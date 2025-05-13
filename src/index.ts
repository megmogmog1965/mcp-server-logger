#!/usr/bin/env node

import { spawn } from 'node:child_process';
import * as fs from 'node:fs';

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
const logStream = fs.createWriteStream(logFile, { flags: 'w' });

// Handle log file errors
logStream.on('error', (error) => {
  console.error(`Error: Failed to open log file.`);
  console.error(`${error.message}`);
  process.exit(1);
});

// Launch subprocess
const childProcess = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] });

childProcess.on('error', (error) => {
  console.error(`Failed to start subprocess: ${error.message}`);
  process.exit(1);
});

childProcess.on('close', (code) => {
  logStream.end(); // Close the stream
  process.exit(code);
});

// Pass subprocess standard output to parent process standard output
childProcess.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  logStream.write(`[STDOUT] ${chunk}`); // Also write to log file
});

// Pass subprocess standard error to parent process standard error
childProcess.stderr.on('data', (chunk) => {
  process.stderr.write(chunk);
  logStream.write(`[STDERR] ${chunk}`); // Also write to log file
});

// When data is input
process.stdin.on('data', (chunk) => {
  childProcess.stdin.write(chunk);
  logStream.write(`[STDIN] ${chunk}`); // Write standard input to log file
});

// List linux signals.
const signals = [
  'SIGABRT', 'SIGALRM', 'SIGBUS', 'SIGCHLD', 'SIGCONT', 'SIGFPE', 'SIGHUP', 
  'SIGILL', 'SIGINT', 'SIGIO', 'SIGIOT', 'SIGKILL', 'SIGPIPE', 'SIGPOLL', 
  'SIGPROF', 'SIGPWR', 'SIGQUIT', 'SIGSEGV', 'SIGSTKFLT', 'SIGSTOP', 'SIGSYS',
  'SIGTERM', 'SIGTRAP', 'SIGTSTP', 'SIGTTIN', 'SIGTTOU', 'SIGUNUSED', 'SIGURG',
  'SIGUSR1', 'SIGUSR2', 'SIGVTALRM', 'SIGWINCH', 'SIGXCPU', 'SIGXFSZ'
];

// Forward signals to child process
signals.forEach(signal => {
  try {
    process.on(signal as NodeJS.Signals, () => {
      logStream.write(`[SIGNAL] ${signal} received, forwarding to child process.`);
      try {
        childProcess.kill(signal as NodeJS.Signals);
      } catch (err) {
        // err.
      }
    });
  } catch (err) {
    // Ignore if this signal is not supported on the current platform
    // console.debug(`Signal ${signal} is not supported`);
  }
});
