const plugin: any = {};

plugin.isValidNumber = (val: any) => val !== undefined && val !== null && typeof val === 'number';

plugin.isNumberAndHigherOrEqualsToZero = (val: any) => plugin.isValidNumber(val) && val >= 0;

export = new Promise(resolve => resolve(plugin));
