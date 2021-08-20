const chalk = require("chalk");
const tools = require("../base/tools.js")

/**
 * Logger class for easy and aesthetically pleasing console logging
 */
class Logger 
{
  static write(content, type)
  {
    const timestamp = `[${tools.getTimestamp()}]:`;
    switch (type) 
    {
      case "log": {
        return console.log(`${timestamp} ${chalk.bgBlue(type.toUpperCase())} ${content} `);
      }
      case "warn": {
        return console.warn(`${timestamp} ${chalk.black.bgYellow(type.toUpperCase())} ${content} `);
      }
      case "error": {
        return console.error(`${timestamp} ${chalk.bgRed(type.toUpperCase())} ${content} `);
      }
      case "debug": {
        return console.debug(`${timestamp} ${chalk.green(type.toUpperCase())} ${content} `);
      }
      case "cmd": {
        return console.log(`${timestamp} ${chalk.black.bgWhite(type.toUpperCase())} ${content}`);
      }
      case "ready": {
        return console.log(`${timestamp} ${chalk.black.bgGreen(type.toUpperCase())} ${content}`);
      } 
      default: throw new TypeError("Logger type must be either warn, debug, log, ready, cmd or error.");
    } 
  }

  static log(content) {
    return this.write(content, "log");
  }

  static warn(content) {
    return this.write(content, "warn");
  }
  
  static error(content) {
    return this.write(content, "error");
  }
  
  static debug(content) {
    return this.write(content, "debug");
  } 
  
  static cmd(content) {
    return this.write(content, "cmd");
  } 

  static ready(content) {
    return this.write(content, "ready");
  } 
}

module.exports = Logger;
