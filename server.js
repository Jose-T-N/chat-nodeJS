const express = require('express');
const path = require('path');
const dt = require('./DataTime');
require("dotenv").config();

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server ,{smaxHttpBufferSize: 1e8, pingTimeout: 60000,});
const readable = require('stream').Readable;
const fs = require("fs");

const db = require('./db');
//const { fork } = require('child_process');
//const { dir } = require('console');

var users_connected = [];
const message_types = ["TEXT","BASE64"];

app.use(express.static(path.join(process.cwd(), 'public'), {index:'index.html'}));
app.set('views', path.join(process.cwd(), 'public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html'); 


server.listen(3000, function () {
    console.log('listen on port 3000');
});