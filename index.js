const express = require('express');
const socketio = require('socket.io');
const path = require('path');
const http = require('http');
const wifi = require('wifi-control');

wifi.init({
    debug: true,
    iface: null,
});

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname + '/public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

app.post('/connect', (req, res) => {
    const ssid = req.body.ssid;
    const password = req.body.password;

    wifi.connectToAP({ ssid, password }, (err) => {
        if (err) {
            console.log(err);
            res.send('Failed to Connect to Wifi');
        } else {
            console.log('connected wifi');
            res.redirect('/index.html');
        }
    });
});

io.on('connection', function (socket) {
    socket.on('sender-join', function (data) {
        socket.join(data.uid);
    });

    socket.on('receiver-join', function (data) {
        socket.join(data.uid);
        socket.in(data.sender_uid).emit('init', data.uid);
    });

    socket.on('file-meta', function (data) {
        socket.in(data.uid).emit('fs-meta', data.metadata);
    });

    socket.on('fs-start', function (data) {
        socket.in(data.uid).emit('fs-share', {});
    });

    socket.on('file-raw', function (data) {
        socket.in(data.uid).emit('fs-share', data.buffer);
    });
});

server.listen(3000, () => {
    console.log('Server connected @ 3000');
});
