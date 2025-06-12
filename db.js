
const util = require('util');
const dt   = require('./DataTime');
require("dotenv").config();
const {Client} = require('pg');

console.log(process.env.PG_USER);

const pool = new Client({
         host: process.env.PG_HOST,
         user: process.env.PG_USER,
         password: process.env.PG_PASSWORD,
         port: process.env.PG_PORT,
         database: process.env.PG_DATABASE,
         keepAlive:true,
        connectionTimeoutMillis:0
     });

pool.connect();

/*
async function createDB(){
 
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection('mysql://root:@localhost:3306/');

    await connection.query('CREATE DATABASE IF NOT EXISTS chat');

    console.log('Database Make');

}
//connect in databese
async function connect(){

    if(global.db && global.db !== 'disconnected'){
        return global.db;
    }

    const mysql = require('mysql2/promise');
    const db = await mysql.createConnection('mysql://root:@localhost:3306/chat');
    console.log('connection done');
    global.db = db;
    return db;
}
/**
 * 
 * 
 * -------------- Criação de tabelas ----------
 *  
 * 
 *
//create tables users and messages
async function createTables(){
    const conn = await connect();

    let result1 = '';
    let result2 = '';

    await conn.query('CREATE TABLE IF NOT EXISTS users'+
    '(user VARCHAR(20) NOT NULL, passwd VARCHAR(20) NOT NULL, PRIMARY KEY(user(20)));'
    ).then(
        function(){
            result1='ok';
        }
    ).catch(
        function(error){
            result1=error;
        }
    );
    //Tabela de Menssages
    await conn.query('CREATE TABLE IF NOT EXISTS messages'
    +'(id int NOT NULL AUTO_INCREMENT,'
    +'message VARCHAR(1000) NOT NULL,'
    +'userID VARCHAR(20) NOT NULL,'
    +'userSendID VARCHAR(20) NOT NULL,'
    +'date DATETIME NOT NULL,'
    +'message_status TINYINT NOT NULL,'
    +'message_type VARCHAR(10) NOT NULL,'
    +'PRIMARY KEY(id),FOREIGN KEY (userID) REFERENCES users(user),FOREIGN KEY (userSendID) REFERENCES users(user));'
    ).then(
        function(){
            result2='ok';
        }
    ).catch(
        function(error){
            result2=error;
        }
    );

    return [result1,result2];

}
/**
 *
 * 
 * --------------------- Adicionar linhas ----------------
 * 
 * 
 *
async function addUser(user,passwd){
    const conn = await connect();
    result = '';
    await conn.query('INSERT INTO users(user,passwd) VALUES ("'+user+'","'+passwd+'")').then(
        function(){
            result = 'ok';
        }
    ).catch(
        function(error){
            result = error;
        }
    );
    return result;
}

//add message in table messages
async function addMessage(user,sdUser,msg,date_time,status_message,message_type){
    const conn = await connect();
    result = '';
    await conn.query('INSERT INTO messages(userID,message,userSendID,date,message_status,message_type) VALUES ("'+user+'","'+msg+'","'+sdUser+'","'+date_time+'",'+status_message+',"'+message_type+'")').then(
        function(){
            result = 'ok';
        }
    ).catch(
        function(error){
            result = error;
        }
    );
    return result;
}

/**
 * 
 * ------------------------------Buscas--------------------------
 * 
 * 
 *

//find expecific user
async function findUser(user){
    const conn = await connect();
    result = '';
    const [rows] = await conn.query('SELECT * FROM users WHERE user="'+user+'";');
    
    return rows;
}
//list all users
async function allUser(){
    const conn = await connect();
    result = '';
    const [rows] = await conn.query('SELECT user FROM users;');
    return rows;
}
//list all messages
async function allMessage(){
    const conn = await connect();
    result = '';
    const [rows] = await conn.query('SELECT * FROM messages;');//WHERE user="'+user+'";');
    
    return rows;

}
//find message for expecific user
async function findTextMessages(user, senduser){
    const conn = await connect();
    const [rows] = await conn.query('SELECT * FROM messages WHERE userID="'+user+'" AND userSendID="'+senduser+'" AND message_type="TEXT" AND message_status = 3 OR userID="'+senduser+'" AND userSendID="'+user+'" AND message_type="TEXT" AND message_status = 3;');
    
    return rows;

}

//Faz busca por status
async function findNewsTextMessage(user, senduser){
    const conn = await connect();
    const [rows] = await conn.query('SELECT * FROM messages WHERE ((userID="'+user+'" AND userSendID="'+senduser+'" AND message_type="TEXT" AND message_status < 3 ) OR (userID="'+senduser+'" AND userSendID="'+user+'" AND message_type="TEXT" AND message_status < 3));');
    return rows;
}

//Faz busca por status
async function findBase64Messages(user, senduser){
    const conn = await connect();
    const [rows] = await conn.query('SELECT * FROM messages WHERE userID="'+user+'" AND userSendID="'+senduser+'" AND message_type="BASE64" AND message_status = 3 OR userID="'+senduser+'" AND userSendID="'+user+'" AND message_type="BASE64" AND message_status = 3;');
    return rows;
}

//Faz busca por status
async function findNewsBase64Messages(user, senduser){
    const conn = await connect();
    const [rows] = await conn.query('SELECT * FROM messages WHERE ((userID="'+user+'" AND userSendID="'+senduser+'" AND message_type="BASE64" AND message_status < 3 ) OR (userID="'+senduser+'" AND userSendID="'+user+'" AND message_type="BASE64" AND message_status < 3))');
    return rows;
}


//find message for expecific user and especific date
async function findMessageforDate(user, senduser){
    const conn = await connect();
    const [rows] = await conn.query('SELECT * FROM messages WHERE userID="'+user+'" AND userSendID="'+senduser+'" AND'+ 
    ' date BETWEEN "'+ dt.timeInterval()[1] +'" AND "'+dt.timeInterval()[0]+'"'+
    ' OR userID="'+senduser+'" AND userSendID="'+user+'" AND'+
    ' date BETWEEN "'+ dt.timeInterval()[1] +'" AND "'+dt.timeInterval()[0]+'";'
    );
    return rows;
}

//find message for expecific user and especific date
async function findMessageforDateAndUser(user){
    const conn = await connect();
    const [rows] = await conn.query('SELECT * FROM messages WHERE userID="'+user+'" AND'+ 
    ' date BETWEEN "'+ dt.timeInterval()[1] +'" AND "'+dt.timeInterval()[0]+'";'
    );
    return rows;
}

//Pesquisar menssagem expecifica
async function findSpecificMsg(user,sdUser,msg,date_time,status_message){
    const conn = await connect();
    const [rows] = await conn.query('SELECT * FROM messages WHERE userID="'+user+'" AND message="'+msg+'" AND userSendID="'+sdUser+'" AND date="'+date_time+'" AND message_status='+status_message+';');
    return rows;
}

//find message for expecific send user and especific date
async function findMessageforDateAndSendUser(senduser){
    const conn = await connect();
    const [rows] = await conn.query('SELECT * FROM messages WHERE userSendID="'+senduser+'" AND'+ 
    ' date BETWEEN "'+ dt.timeInterval()[1] +'" AND "'+dt.timeInterval()[0]+'";'
    );
    return rows;
}

/**
 * 
 * 
 * ------------------------- Atualiuzações --------------------
 * 
 * 
 * 
 *

//mudar estatus da menssagem
async function setStatus(id, status_message){
    const conn = await connect();
    const [rows] = await conn.query('UPDATE messages SET message_status = '+status_message+' WHERE id='+id);
    return rows;
}

/**
 * 
 * ------------------------- Construtor -----------
 * 
 *
(async () => {
    await createDB();
    let result = await createTables();
})();

module.exports = {createDB,createTables,addUser,addMessage,findUser,allUser,findTextMessages,allMessage,findMessageforDate,findMessageforDateAndUser,findMessageforDateAndSendUser,setStatus,findSpecificMsg,findNewsTextMessage,findBase64Messages,findNewsBase64Messages};

*/