//Status das menssagens 
//1 Salvo no servidor
//2 Chego para o rementente
//3 Visto pelo remetente 

//Rotina de envio das menssagens
/**
 * 1 - sendMessage - Servidor
 * 2 - sendNow - Cliente
 */

//Rotina d busca de menssagms
/**
 * 1 - findMesage - servidor
 */

const express = require('express');
const path = require('path');
const dt = require('./DataTime');
require("dotenv").config();

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {maxHttpBufferSize: 1e8, pingTimeout: 60000});
const readable = require('stream').Readable;
const fs = require("fs");

const db = require('./db');
const { fork } = require('child_process');
//const { dir } = require('console');

var users_connected = [];
const message_types = ["TEXT","BASE64"];

app.use(express.static(path.join(process.cwd(), 'public'), {index: 'index.html'}));
app.set('views', path.join(process.cwd(), 'public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html'); 

console.log(fs.existsSync(process.cwd()+"/public"));

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
            const result = await db.addMessage(data.userID, data.userSendID, data.message, dt.dateTime(),1,"TEXT");
            //console.log(result);
            if (result === 'ok') {
                data = await db.findSpecificMsg(data.userID, data.userSendID, data.message, dt.dateTime(),1);
                socket.emit('send-now', data[0]);
                //percorre todos os usuário
                for (let i = 0; i < users_connected.length; i++) {
                    //envia a menssage para o destinatario
                    if (data[0].userSendID === users_connected[i].user) {
                        await socket.broadcast.to(users_connected[i].id).emit('send-now', data[0]);
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
                let newMessages;
                let messages64;
                let newMessages64;

                users_connected.push({ id: socket.id, user: data.user });
                //Envia os distinatatios para a pagina do cliente
                const all_user = await db.allUser();
                await socket.emit('senders', all_user);
                //Pesquisas as menssagens
                //se o usuário atua for o primeiro
                if (all_user != 0)
                    if (all_user[0].userid === data.userID) {
                        //Verifica se só tem um usuário no servidor
                        if (all_user.length == 1) {
                            //Verifica se a novas messagens para o usuário recem logado
                            newMessages = await db.findNewsTextMessage(data.user,all_user[0].userid);
                            messages = await db.findTextMessages(data.user, all_user[0].userid);
                            messages64 = await db.findBase64Messages(data.user, all_user[0].userid);
                            newMessages64 = await db.findNewsBase64Messages(data.user, all_user[0].userid);
                            
                        }
                        else {
                            //Verifica se a novas messagens para o usuário recem logado
                            newMessages = await db.findNewsTextMessage(data.user, all_user[1].userid);
                            messages = await db.findTextMessages(data.user, all_user[1].userid);
                            messages64 = await db.findBase64Messages(data.user, all_user[1].userid);
                            newMessages64 = await db.findNewsBase64Messages(data.user, all_user[1].userid);
                        }
                    } else {
                        //Verifica se a novas messagens para o usuário recem logado
                        newMessages = await db.findNewsTextMessage(data.user, all_user[0].userid);
                        messages = await db.findTextMessages(data.user, all_user[0].userid);
                        messages64 = await db.findBase64Messages(data.user, all_user[0].userid);
                        newMessages64 = await db.findNewsBase64Messages(data.user, all_user[0].userid);
                    }
                    //
                    // ------------------------/////////////////////////-----------------------
                    //--------array Geral
                    let allMessages = [];
                    //
                    //Trasforma os três arrays em um
                    ///Menssagens velhas
                    //---------------------/////////////////////////////////////------
                    for(let item of messages){
                        const json = {
                            message : item,
                            type : 'old_message'    
                        }
                        allMessages.push(json);
                    }
                    //
                    //--------------////////////////////////////////-------
                    //----Novas Menssagens
                    //-----------////////////////////////////-------
                    for(let item of newMessages){
                        const json = {
                            message : item,
                            type : 'new_message'    
                        }
                        allMessages.push(json);
                    }
                    //
                    //-----------////////////////////////////////-------//
                    //----Velhas Menssagens base 64-------------------///////////////
                    //-------------////////////////////////////-------////////////////
                    for(let item of messages64){
                        //------/////////////////////////----/////
                        //--///--Index do ponto que define a extenção-///
                        //-----/////////////////////-------////
                        let pointIndex = item.message.lastIndexOf('.');
                        /////////////////////////////////////////////
                        //---///--Extenção do arquivo--///
                        /////////////////////////////////////
                        let ext = item.message.substring(pointIndex + 1,item.message.length);
                        item.message.ext = ext;
                        ////////////////////////////////////////////////////////
                        //-------///Trasforma o arquivo em base64/----/////////
                        ///////////////////////////////////////////////////////
                        item = {
                            id : item.id,
                            message : fileToBase64(item.message),
                            userID: item.userID,
                            userSendID: item.userSendID,
                            date: item.date,
                            message_status: item.message_status,
                            message_type: item.message_type,
                            ext:ext
                        };
                        const json = {
                            message : item,
                            type : 'old_64_message'
                        }
                        allMessages.push(json);
                    }
                    //
                    //------------////////////////////////////////-------//
                    //----Novas Menssagens base 64-----------------------/////////
                    //--------------------////////////////////////////-------/////
                    for(let item of newMessages64){
                        //------/////////////////////////----/////
                        //--///--Index do ponto que define a extenção-///
                        //-----/////////////////////-------////
                        let pointIndex = item.message.lastIndexOf('.');
                        /////////////////////////////////////////////
                        //---///--Extenção do arquivo--///
                        /////////////////////////////////////
                        let ext = item.message.substring(pointIndex + 1,item.message.length);
                        ////////////////////////////////////////////////////////
                        //-------///Trasforma o arquivo em base64/----/////////
                        ///////////////////////////////////////////////////////
                        item = {
                            id : item.id,
                            message : fileToBase64(item.message),
                            userID: item.userID,
                            userSendID: item.userSendID,
                            date: item.date,
                            message_status: item.message_status,
                            message_type: item.message_type,
                            ext:ext
                        };
                        const json = {
                            message : item,
                            type : 'new_64_message'
                        }
                        allMessages.push(json);
                    }
                    //-----////////////////////////-----
                    //---///////----Arruma a lista conforme o time----////-----
                    //-----////////////////////////-----
                    allMessages.sort(function(a,b){return a.message.date - b.message.date});
                    socket.emit('messages', allMessages);
                    
                    //console.log(allMessages[0].message);

                
            } else if (data.page === 'index') {
                //user = '';
                //console.log(socket.id);
            }
        })()
    });
    //action == 'findMessage'
    socket.on('findMessage', data => {
        (async () => {
            let messages = await db.findTextMessages(data.userID, data.userSendID);
            socket.emit('messages', messages);
            //console.log(messages);
        })()
    });
    //action == 'findMessage'
    socket.on('findNewsMessage', data => {
        (async () => {
            let messages = await db.findNewsTextMessage(data.userID, data.userSendID);
            socket.emit('newsMessages', messages);
            //console.log(messages);
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

    //Prrocra per status
    socket.on('findByStatus', data => {
        (async () => {
            let messages = await db.findByStatus(data.user);
        })()
    });
    /**
     * /////////////////////////////////////////////////////////////////////////////////////
     * ---------///////////---------Recebe arquivos de base64----------//////////////------
     * ////////////////////////////////////////////////////////////////////////////////////
     */
    socket.on('base64', data => {
        //console.log(data.user);
        //Cria um nome aleatório
        let generateRandom = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(23).substring(2, 5);
        //cria pasta
        let dir = "files"
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        //Cria pasta do usuário
        if (!fs.existsSync(dir+"/"+data.userID)){
            fs.mkdirSync(dir+"/"+data.userID);
        }
        //Nome e diretório do arquivo
        const filiDir =  __dirname.replaceAll("\\","/")+"/"+dir+"/"+"/"+data.userID+"/"+generateRandom() +data.ext;

        //--------/////////////---------------------------///////////////////----
        //---/////////////--------Cria a iumagem e salva a imagem no banco---////////
        //////////////////////////////////////////////////////////////////////////////
        require("fs").writeFile( filiDir,data.base64, 'base64', function(err) {
            (async () => {
                const result = await db.addMessage(data.userID, data.userSendID, filiDir, dt.dateTime(),1,"BASE64");
                //Se tudo estiver ok envia o arquivo para o remetente que o enviou
                if(result === 'ok'){
                    const sendData = {
                        userID: data.userID,
                        userSendID: data.userSendID,
                        message: data.base64,
                        ext: data.ext,
                        message_type: "BASE64"
                    }
                    //Devouve o arquivo para o Remetente
                    socket.emit('send-now', sendData);
                    for (let i = 0; i < users_connected.length; i++) {
                        //envia a menssage para o destinatário
                        if (data.userSendID === users_connected[i].user) {
                            const sendData = {
                                userID: data.userID,
                                userSendID: data.userSendID,
                                message: data.base64,
                                ext: data.ext,
                                message_type: "BASE64"
                            }
                            await socket.broadcast.to(users_connected[i].id).emit('send-now', sendData);
                            break;
                        }
                    }
                }
            })();
        });
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
/**-----------Trasforma arquivo em bas64
 * ------------////////////////////////////////---------------------
 * ---///////////---@param {Arquivo pra virar base64} file /////////////-------
 * -----///////////////////---@returns aquivo em base64 ------------/////////////------ 
 * ////////////////------------------------------------/////////////---
 * /////////////////////////////////////////////////////////////////////
 */
function fileToBase64(file){
    /**let bases64 = [];
    for(let file of files) {
        const contents = fs.readFileSync(file.message, {encoding: 'base64'});
        file.message = contents;
        bases64.push(file);
    }*/
   if (fs.existsSync(file)) {
    return  fs.readFileSync(file, {encoding: 'base64'});
    //console.log("foi");
   }
   else{
    return undefined;
   }
}
server.listen(3000, function () {
    console.log('listen on port 3000');
});