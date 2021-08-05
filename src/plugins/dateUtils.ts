const plugin: any = {};

plugin.parseDate = (date: Date) => {
    if (!date) {
        throw new Error('It wasn\'t possible to parse the specified date because it\'s null');
    }

    let parsedDate = null;
    if (date instanceof Date) {
        parsedDate = date;
    } else if (Number.isInteger(date)) {
        parsedDate = new Date(date);
    } else if (!Number.isNaN(Date.parse(date)) && (new Date(date) !== null)) {
        parsedDate = new Date(date);
    }

    if (!(parsedDate instanceof Date)) {
        throw new Error(`It wasn't possible to parse the given date because it has an invalid format: ${date}`);
    }

    return parsedDate;
};

export = new Promise(resolve => resolve(plugin));
