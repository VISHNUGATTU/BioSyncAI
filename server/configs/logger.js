import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logFilePath = path.join(__dirname, '../server.log');

// Create non-blocking append stream
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

const formatMessage = (level, message, errorStack = '') => {
  const timestamp = new Date().toISOString();
  const stack = errorStack ? `\n${errorStack}` : '';
  return `[${level}] ${timestamp} - ${message}${stack}\n`;
};

const logger = {
  info: (message) => {
    const logMsg = formatMessage('INFO', message);
    if (process.env.NODE_ENV !== 'production') console.log(logMsg.trim());
    logStream.write(logMsg);
  },
  warn: (message) => {
    const logMsg = formatMessage('WARN', message);
    console.warn(logMsg.trim());
    logStream.write(logMsg);
  },
  error: (message, errorStack = '') => {
    const logMsg = formatMessage('ERROR', message, errorStack);
    console.error(logMsg.trim());
    logStream.write(logMsg);
  }
};

export default logger;