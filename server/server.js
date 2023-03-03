'use strict';

import app from './js/index.js';
import db from "./js/db.js";

async function start_public_server() {
    app.listen(process.env.port, '0.0.0.0', () => {
        db.init(process.argv.slice(2));
        console.log("\x1b[32m%s\x1b[0m", `..: Server:    http://0.0.0.0:${process.env.port}/ :..`);
    });
}

async function init() {
    console.log("\x1b[32m%s\x1b[0m", "..: Starting forte :..");
    console.log("\x1b[32m%s\x1b[0m", "..: Open the web player at https://forte.buzl.uk/ :..");
    switch (process.env.mode) {
        case 'public':
            start_public_server();
            break;

        default:
            start_public_server();
    }
}

// onMounted
init();