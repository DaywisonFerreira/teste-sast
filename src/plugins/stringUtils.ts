const plugin: any = {};

plugin.isBlank = (str: string) => !str || (typeof str === 'string' && !str.trim());

plugin.escapeSpecialChars = (jsonString: string) => jsonString.replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/\f/g, '\\f');

plugin.removeWhitespace = (string: string) => string.replace(/\s/g, '');

plugin.removeChars = (str: string, chars: any) => str.replace(new RegExp(`[${chars}]`, 'g'), '');


export = new Promise(resolve => resolve(plugin));