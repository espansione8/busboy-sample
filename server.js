// const http = require('http');
// const fs = require('fs');
// const busboy = require('busboy');

import http from 'http';
//import fs from 'fs';
import { createWriteStream, mkdir, readFile, unlink, rm, readdir, rmdir } from 'fs';
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
    try {
        if (req.method === 'POST') {
            const bb = busboy({ headers: req.headers });
            let directory = '';
            //let user = '';
            bb.on('field', (name, val, info) => {
                //console.log(`Field [${name}]: value: %j`, val);
                if (name === 'directory') {
                    directory = val;
                }
                // if (name === 'user') {
                //     user = val;
                // }
            });
            bb.on('file', (name, file, info) => {
                // ensureExists(`files/${user}/${directory}`, 0o744, function (err) { // REMOVED USER DIR for property transfer
                ensureExists(`files/${directory}`, 0o744, function (err) {
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
                        //file.pipe(createWriteStream(`files/${user}/${directory}/${encodeURIComponent(filename)}`)); // REMOVED USER DIR for property transfer
                        file.pipe(createWriteStream(`files/${directory}/${encodeURIComponent(filename)}`));
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
        else if (req.method === 'DELETE') {
            let delBool = true;
            let delRes = 'file removal err:';
            const reqtype = req.headers.reqtype;
            const filename = req.headers.filename;
            //const user = req.headers.user;
            let doc = req.headers.doc;

            if (reqtype == 'fileDoc') {
                doc = req.headers.doc;
                const pathDoc = `files/${doc}/${encodeURIComponent(filename)}`;
                unlink(pathDoc, (err) => {
                    if (err) {
                        console.error('Event unlink err', err);
                        delRes = 'error DELETE file:';
                        delBool = false;
                        throw new Error('Event unlink err');
                    } else {
                        delRes = 'DELETED Document file:';
                        const obj = {
                            message: `${delRes} ${filename}`,
                            deleted: delBool
                        };
                        const resObj = JSON.stringify(obj);
                        res.end(resObj);
                    }
                });
            } else if (reqtype == 'fileVehicle') {
                doc = `vehicles/${req.headers.doc}`;
                const pathVehicle = `files/${doc}/${encodeURIComponent(filename)}`;
                unlink(pathVehicle, (err) => {
                    if (err) {
                        console.error('Event unlink err', err);
                        delRes = 'error DELETE file:';
                        delBool = false;
                        throw new Error('Event unlink err');
                    } else {
                        delRes = 'DELETED Vehicle file:';
                        const obj = {
                            message: `${delRes} ${filename}`,
                            deleted: delBool
                        };
                        const resObj = JSON.stringify(obj);
                        res.end(resObj);
                    }
                });
            } else if (reqtype == 'fileVehicleEvent') {
                const delPath = `files/vehicles/${req.headers.doc}/events/${filename}`;
                rm(delPath, { recursive: true }, (err) => {
                    if (err) {
                        console.error('Event delDir err (rm)', err);
                        delRes = 'error DELETE Event dir (rm):';
                        delBool = false;
                        throw new Error('Event delDir err (rm)');
                    } else {
                        delRes = 'DELETED Event dir:';
                        const obj = {
                            message: `${delRes} ${filename}`,
                            deleted: delBool
                        };
                        const resObj = JSON.stringify(obj);
                        res.end(resObj);
                    }
                });
            } else if (reqtype == 'fileLogistic') {
                doc = `logistic/${req.headers.doc}`;
                const pathLogistic = `files/${doc}/${encodeURIComponent(filename)}`;
                unlink(pathLogistic, (err) => {
                    if (err) {
                        console.error('Event unlink err', err);
                        delRes = 'error DELETE file:';
                        delBool = false;
                        throw new Error('Event unlink err');
                    } else {
                        delRes = 'DELETED Logistic file:';
                        const obj = {
                            message: `${delRes} ${filename}`,
                            deleted: delBool
                        };
                        const resObj = JSON.stringify(obj);
                        res.end(resObj);
                    }
                });
            } else if (reqtype == 'userId') {
                // doc = `users/${req.headers.doc}/id`;
                // const pathLogistic = `files/${doc}/${encodeURIComponent(filename)}`;
                const pathLogistic = `files/users/${req.headers.doc}/id/${encodeURIComponent(filename)}`;
                unlink(pathLogistic, (err) => {
                    if (err) {
                        console.error('Event unlink err', err);
                        delRes = 'error DELETE file ID:';
                        delBool = false;
                        throw new Error('Event unlink err');
                    } else {
                        delRes = 'DELETED user file ID:';
                        const obj = {
                            message: `${delRes} ${filename}`,
                            deleted: delBool
                        };
                        const resObj = JSON.stringify(obj);
                        res.end(resObj);
                    }
                });
            } else if (reqtype == 'userCompany') {
                // doc = `users/${req.headers.doc}/company`;
                // const pathLogistic = `files/${doc}/${encodeURIComponent(filename)}`;
                const pathLogistic = `files/users/${req.headers.doc}/company/${encodeURIComponent(filename)}`;
                unlink(pathLogistic, (err) => {
                    if (err) {
                        console.error('Event unlink err', err);
                        delRes = 'error DELETE file Company:';
                        delBool = false;
                        throw new Error('Event unlink err');
                    } else {
                        delRes = 'DELETED user file Company:';
                        const obj = {
                            message: `${delRes} ${filename}`,
                            deleted: delBool
                        };
                        const resObj = JSON.stringify(obj);
                        res.end(resObj);
                    }
                });
            } else if (reqtype == 'userLogo') {
                // doc = `users/${req.headers.doc}/company`;
                // const pathLogistic = `files/${doc}/${encodeURIComponent(filename)}`;
                const pathLogistic = `files/users/${req.headers.doc}/logo/${encodeURIComponent(filename)}`;
                unlink(pathLogistic, (err) => {
                    if (err) {
                        console.error('Event unlink err', err);
                        delRes = 'error DELETE file Logo:';
                        delBool = false;
                        throw new Error('Event unlink Logo err');
                    } else {
                        delRes = 'DELETED user file Logo:';
                        const obj = {
                            message: `${delRes} ${filename}`,
                            deleted: delBool
                        };
                        const resObj = JSON.stringify(obj);
                        res.end(resObj);
                    }
                });
            } else {
                console.error('Event delDir err (reqtype)');
                delRes = 'error DELETE Event dir (reqtype):';
                delBool = false;
                throw new Error('Event delDir err (reqtype)');
            }

            // const path = `files/${user}/${doc}/${encodeURIComponent(filename)}`; // REMOVED USER DIR for property transfer
            // const path = `files/${doc}/${encodeURIComponent(filename)}`;
            // unlink(path, (err) => {
            //     if (err) {
            //         console.error('Event unlink err', err);
            //         delRes = 'error DELETE file:';
            //         delBool = false;
            //         throw new Error('Event unlink err');
            //     }
            // });
            ////////////// API response
            // const obj = {
            //     message: `${delRes} ${filename}`,
            //     deleted: delBool
            // };
            // const resObj = JSON.stringify(obj);
            // res.end(resObj);
        }
        else if (req.method === 'GET') {
            let filePath = `.${req.url}`;
            if (filePath === './') {
                filePath = './index.html';
            }
            readFile(filePath, function (err, data) {
                if (err) {
                    res.writeHead(400, { 'Content-type': 'text/html' });
                    console.log('file server error:', err);
                    //res.end(JSON.stringify(err));
                    res.end("File not found");
                    return;
                }
                res.writeHead(200, {
                    "Access-Control-Allow-Origin": "*"
                });
                res.end(data);
            });

        }
    } catch (err) {
        res.statusCode = 500;
        res.end(`Error: ${err.message}`);
    }
}).listen(3100, () => {
    console.log('Listening 3100 for requests');
});