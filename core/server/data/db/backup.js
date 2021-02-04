// # Backup Database
// Provides for backing up the database before making potentially destructive changes
const fs = require('fs-extra');
const JsonStreamStringify = require('json-stream-stringify');

const path = require('path');
const config = require('../../../shared/config');
const logging = require('../../../shared/logging');
const urlUtils = require('../../../shared/url-utils');
const exporter = require('../exporter');

const readBackup = async (filename) => {
    const parsedFileName = path.parse(filename);
    const sanitized = `${parsedFileName.name}${parsedFileName.ext}`;
    const backupPath = path.resolve(urlUtils.urlJoin(config.get('paths').contentPath, 'data', sanitized));

    const exists = await fs.pathExists(backupPath);

    if (exists) {
        const backupFile = await fs.readFile(backupPath);
        return JSON.parse(backupFile);
    } else {
        return null;
    }
};

/**
 * ## Backup
 * does an export, and stores this in a local file
 * @returns {Promise<*>}
 */
const backup = async function backup(options) {
    logging.info('Creating database backup');
    options = options || {};

    const data = await exporter.doExport(options);
    const jsonStream = new JsonStreamStringify(data);

    const filename = await exporter.fileName(options);
    const filePath = path.resolve(urlUtils.urlJoin(config.get('paths').contentPath, 'data', filename));
    const writeStream = fs.createWriteStream(filePath);

    jsonStream.once('error', () => logging.error('Error writing export:', jsonStream.stack.join('.')));
    jsonStream.pipe(writeStream);

    logging.info('Database backup written to: ' + filename);
    return filename;
};

module.exports = {
    backup,
    readBackup
};
