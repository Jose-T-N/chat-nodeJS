//Status das menssagens 
//1 Salvo no servidor
//2 Chego para o rementente
//3 Visto pelo remetente 

//Rotina de envio das menssagens
/**
 * 1 - sendMessage - Servidor
 * 2 - sendNow - Cliente
 */

const express = require('express');
const path = require('path');
const dt = require('./DataTime');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const db = require('./db');

var users_connected = [];

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

io.on('connection', socket => {
    /*let messageObject = {
        user: user_connected
    }
    user_connected = '';
    socket.emit('previousMessages', messageObject);*/

    socket.on('authentication', data => {
        (async () => {
            //authentication user
            const user = await db.findUser(data.user);
            if (user.length != 0) {
                if (user[0].passwd === data.passwd) {
                    let messageObject = {
                        msg: 'ok'
                    };
                    socket.emit('result', messageObject);
                }
                else {
                    let messageObject = {
                        msg: 'passwd'
                    };
                    socket.emit('result', messageObject);
                }
            } else {
                let messageObject = {
                    msg: 'user'
                };
                socket.emit('result', messageObject);
            }
        })();
    });
    //create user 
    socket.on('create-user', data => {
        (async () => {
            const result = await db.addUser(data.user, data.passwd);
            console.log(result);
            if (result === 'ok') {
                let messageObject = {
                    msg: 'user-create'
                };
                //user_connected = data.user.toUpperCase();
                socket.emit('result', messageObject);
                socket.broadcast.emit('new-sender', data.user);
            } else {
                let messageObject = {
                    msg: 'user-exists'
                };
                socket.emit('result', messageObject);
            }
        })();
    });
    //receive, verify user and return message
    socket.on('sendMessage', data => {
        (async () => {
            //status 1 igual a salvo no servidor
            const result = await db.addMessage(data.userID, data.userSendID, data.message, dt.dateTime(),1);
            console.log(result);

            if (result === 'ok') {
                data = await db.findSpecificMsg(data.userID, data.userSendID, data.message, dt.dateTime(),1);
                socket.emit('send-now', data[0]);

                for (let i = 0; i < users_connected.length; i++) {
                    if (data.userSendID === users_connected[i].user) {
                        await socket.broadcast.to(users_connected[i].id).emit('send-now', data[0]);
                        //console.log(users_connected[i].id + ' ' + users_connected[i].user);
                        break;
                    }
                }
            }
        })();
    });
    //verify page
    socket.on('page-inform', data => {
        (async () => {
            //console.log(users_connected);
            if (data.page === 'chat') {
                let messages;

                users_connected.push({ id: socket.id, user: data.user });

                const all_user = await db.allUser();
                await socket.emit('senders', all_user);

                if (all_user[0].user === data.user) {
                    if (all_user.length == 1) {
                        messages = await db.findMessageforUser(data.user, all_user[0].user);
                    }
                    else {
                        messages = await db.findMessageforUser(data.user, all_user[1].user);
                    }
                } else {
                    messages = await db.findMessageforUser(data.user, all_user[0].user);
                }
                socket.emit('messages', messages);
            } else if (data.page === 'index') {
                //user = '';
                //console.log(socket.id);
            }
        })()
    });
    //action == 'findMessage'
    socket.on('findMessage', data => {
        (async () => {
            let messages = await db.findMessageforUser(data.userID, data.userSendID);
            //console.log(messages);
            socket.emit('messages', messages);
        })()
    });
    //check if message arrived 
    socket.on('arrivedMessage', data => {
        (async () => {
            let messages = await db.findMessageforDateAndSendUser(data.userID);
            socket.emit('receivedMessage', messages);
        })()
    });
    //check if the message sended
    socket.on('MessageSended', data => {
        (async () => {
            let messages = await db.findMessageforDateAndUser(data.userID);
            socket.emit('receivedMessage', messages);
        })()
    });

    //Muda o estatus da menssagem
    socket.on('setStatus', data => {
        (async () => {
            let messages = await db.setStatus(data.id,data.status);
        })()
    });

    socket.on('disconnecting', data => {
        (async () => {
            for (let i = 0; i < users_connected.length; i++) {
                if (users_connected[i].id === socket.id) {
                    users_connected.splice(i);
                    break;
                }
            }
        })()
    });

})

server.listen(3000, function () {
    console.log('listen on port 3000');
});