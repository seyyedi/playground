import util from 'gulp-util';

export class Log {
    constructor(name) {
        this.name = name;
    }

    info(text) {
        util.log(text);
    }
}

var log = new Log();
export default log;
