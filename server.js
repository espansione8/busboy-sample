// const http = require('http');
// const fs = require('fs');
// const busboy = require('busboy');

import http from 'http';
//import fs from 'fs';
import { createWriteStream, mkdir, readFile, unlink, readdir, rmdir } from 'fs';
import busboy from 'busboy';

function ensureExists(path, mask, cb) {
    if (typeof mask == 'function') { // Allow the `mask` parameter to be optional
        cb = mask;
        mask = 0o744;
    }
    mkdir(path, { mask, recursive: true }, function (err) {
        if (err) {
            if (err.code == 'EEXIST') cb(null); // Ignore the error if the folder already exists
            else cb(err); // Something else went wrong
        } else cb(null); // Successfully created folder
    });
}

http.createServer((req, res) => {
    if (req.method === 'POST') {
        console.log('POST request');
        const bb = busboy({ headers: req.headers });
        let directory = '';
        let user = '';
        bb.on('field', (name, val, info) => {
            console.log(`Field [${name}]: value: %j`, val);
            if (name === 'directory') {
                directory = val;
            }
            if (name === 'user') {
                user = val;
            }
        });
        bb.on('file', (name, file, info) => {
            ensureExists(`files/${user}/${directory}`, 0o744, function (err) {
                if (err) {
                    console.log('upload err', err);
                    res.writeHead(500, { Connection: 'close' });
                    res.end();
                } else {
                    const { filename, encoding, mimeType } = info;
                    console.log(
                        `File [${name}]: filename: %j, encoding: %j, mimeType: %j`,
                        filename,
                        encoding,
                        mimeType
                    );
                    file.pipe(createWriteStream(`files/${user}/${directory}/${filename}`));
                    //writeFile(`static/${dir}/${fileName}`, file, 'base64', (err) => {
                    //     if (err) { console.log('file err', err); }
                    //     // else {
                    //     //     console.log("File written successfully\n");
                    //     // }
                    // }
                    //)
                    //file.pipe(createWriteStream(`/github/busboy-sample/files/${filename}`));
                    file.on('data', (data) => {
                        console.log(`File [${filename}] got ${data.length} bytes`);
                    }).on('close', () => {
                        console.log(`File [${filename}] done`);
                    });
                }
            });
        });

        bb.on('close', () => {
            console.log('Done parsing form!');
            //res.writeHead(303, { Connection: 'close' });
            //res.writeHead(303, { Connection: 'close', Location: '/' });
            const resMsg = JSON.stringify({ filesUpload: 'ok' });
            res.end(resMsg);
        });
        req.pipe(bb);
    }
    else if (req.method === 'GET') {
        let filePath = `.${req.url}`;
        if (filePath === './') {
            filePath = './index.html';
        }
        readFile(filePath, function (err, data) {
            if (err) {
                res.writeHead(404);
                res.end(JSON.stringify(err));
                return;
            }
            res.writeHead(200);
            res.end(data);
        });

    }
}).listen(3100, () => {
    console.log('Listening 3100 for requests');
});