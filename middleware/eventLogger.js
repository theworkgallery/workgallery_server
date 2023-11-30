const path = require("path");
const fsPromises = require("fs").promises;
const { existsSync } = require("fs")
const { format } = require("date-fns")
const { v4: uuid } = require("uuid")
const eventLogger = async (message, filename) => {
    const id = uuid();
    const date = format(new Date(), "dd/MM/yyyy\t HH:mm:ss");
    try {
        //check directory exists or not 
        if (!existsSync(path.join(__dirname, "..", "logs"))) {
            fsPromises.mkdir(path.join(__dirname, "..", "logs"))
        }
        const log = `${id}\t${date}\t ${message}\n`;
        await fsPromises.appendFile(path.join(__dirname, "..", "logs", filename), log, "utf-8")
    } catch (err) {
        console.log(err);
    };
}


const reqLogger = async (req, res, next) => {
    console.log(`method:${req.method}\t origin:${req.headers.origin} \turl:${req.url}`);
    eventLogger(`method:${req.method}\t origin:${req.headers.origin} \turl:${req.url}`, "reqLog.docx");
    //call next 
    next();
}

module.exports = { eventLogger, reqLogger }