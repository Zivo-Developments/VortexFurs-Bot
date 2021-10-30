import moment from "moment";
import winston from "winston";
import FuzzyClient from "../lib/FuzzyClient";

export default class Logger {
    private logger: winston.Logger;
    constructor(private client: FuzzyClient) {
        this.client = client;
        this.logger = winston.createLogger({
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.printf(
                            (info) => `${moment(Date.now()).toISOString()} | [${info.level}]: ${info.message}`,
                        ),
                    ),
                }),
                new winston.transports.File({
                    filename: `logs/log-${moment(Date.now()).toISOString()}.txt`,
                    format: winston.format.printf(
                        (info) => `${moment(Date.now()).toISOString()} | [${info.level}]: ${info.message}`,
                    ),
                }),
            ],
            level: "debug",
        });
    }

    public error(message: string, ...args: any[]): void {
        this.logger.error(message, ...args);
    }
    public warn(message: string, ...args: any[]): void {
        this.logger.warn(message, ...args);
    }
    public info(message: string, ...args: any[]): void {
        this.logger.info(message, ...args);
    }
    public debug(message: string, ...args: any[]): void {
        this.logger.debug(message, ...args);
    }
}
