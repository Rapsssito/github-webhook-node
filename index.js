const http = require('http');
const { spawn } = require('child_process');
const crypto = require('crypto');
const url = require('url');

const PORT = process.argv[2];
const SECRET_KEY = process.argv[3];
const BASH_SCRIPT = process.argv[4];

if (!PORT || !SECRET_KEY || !BASH_SCRIPT) {
    throw new Error('Invalid arguments: node index.js <port> <secret> <path_to_script>');
}

http.createServer(function (req, res) {
    console.log('Request received');
    // @ts-ignore
    const path = url.parse(req.url).pathname;

    if (path != '/push' || req.method != 'POST') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        const data = JSON.stringify({ error: 'Invalid request' });
        return res.end(data);
    }

    let jsonString = '';
    req.on('data', function (data) {
        jsonString += data;
    });

    req.on('end', async function () {
        const hash =
            'sha1=' + crypto.createHmac('sha1', SECRET_KEY).update(jsonString).digest('hex');
        if (hash != req.headers['x-hub-signature']) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            const data = JSON.stringify({ error: 'Invalid secret key' });
            return res.end(data);
        }

        console.log('Running', BASH_SCRIPT);
        try {
            await executeCommand('sh', [BASH_SCRIPT]);
            console.log('Success!');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            const data = JSON.stringify({ success: true });
            return res.end(data);
        } catch (e) {
            console.warn('Error', e);
            res.writeHead(400, { 'Content-Type': 'application/json' });
            const data = JSON.stringify({ error: true });
            return res.end(data);
        }
    });
}).listen(PORT);

/**
 * @param {string} command
 * @param {string[]} args
 */
function executeCommand(command, args) {
    return new Promise((resolve, reject) => {
        const deploySh = spawn(command, args);
        deploySh.stdout.on('data', function (data) {
            console.log(data.toString('utf-8'));
        });
        deploySh.on('error', (e) => {
            reject(e);
        });
        deploySh.on('exit', (code) => {
            if (code == 1) {
                reject('Error executing ' + command + ' with args ' + args);
            } else {
                resolve();
            }
        });
    });
}

console.log('GitHub WebHooks Server listening at ' + PORT);
