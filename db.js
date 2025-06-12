
const util = require('util');
const dt   = require('./DataTime');
require("dotenv").config();
const {Client} = require('pg');

const conn = new Client({
         host: process.env.PG_HOST,
         user: process.env.PG_USER,
         password: process.env.PG_PASSWORD,
         port: process.env.PG_PORT,
         database: process.env.PG_DATABASE,
         keepAlive:true,
        connectionTimeoutMillis:0,
        ssl: {
            rejectUnauthorized: false,
        },
     });

conn.connect();


async function createDB(){
 
    try {
        const res = await conn.query("SELECT datname FROM pg_catalog.pg_database WHERE lower(datname) = lower('chat');");
        if (res.rowCount === 0) {
            console.log('criando data base');
            await conn.query('CREATE DATABASE "chat";');
            console.log('created database ${databaseName}');
        } else {
            console.log('${databaseName} database exists.');
        }
    } catch (err) {
        console.error("Error creating database: ", err);
    }

    /*const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection('mysql://root:@localhost:3306/');

    await connection.query('CREATE DATABASE IF NOT EXISTS chat');

    console.log('Database Make');*/

}

/*connect in databese
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
 */
//create tables users and messages
async function createTables(){

    let result1 = '';
    let result2 = '';

    userTable = 'CREATE TABLE IF NOT EXISTS users (userID VARCHAR(20) NOT NULL, passwd VARCHAR(20) NOT NULL, PRIMARY KEY(userID));';
    
    conn.query(userTable, (err, result) => {
        if (err) {
            console.error('Error creating table:', err);
        } else {
            console.log('Table created successfully.');
            result1 = result;
        }
    });

    //Tabela de Menssages
    let messageTable = 'CREATE TABLE IF NOT EXISTS messages'
    +'(id int NOT NULL GENERATED ALWAYS AS IDENTITY,'
    +'message VARCHAR(1000) NOT NULL,'
    +'userID VARCHAR(20) NOT NULL,'
    +'userSendID VARCHAR(20) NOT NULL,'
    +'date TIMESTAMP NOT NULL,'
    +'message_status SMALLINT NOT NULL,'
    +'message_type VARCHAR(10) NOT NULL,'
    +'PRIMARY KEY(id),'
    +'FOREIGN KEY(userID) REFERENCES users(userID),'
    +'FOREIGN KEY(userSendID) REFERENCES users(userID));'

    conn.query(messageTable, (err, result) => {
        if (err) {
            console.error('Error creating table:', err);
        } else {
            console.log('Table created successfully.');
            result2 = result;
        }
        //conn.end(); // Close the connection pool
    });
    return [result1,result2];

}
/**
 *
 * 
 * --------------------- Adicionar linhas ----------------
 * 
 * 
 */
async function addUser(user,passwd){
    result = '';
    await conn.query("INSERT INTO users(userID,passwd) VALUES ('"+user+"','"+passwd+"')").then(
        function(){
            result = 'ok';
        }
    ).catch(
        function(error){
            result = error;
        }
    );
    console.log(result);
    return result;
}

//add message in table messages
async function addMessage(user,sdUser,msg,date_time,status_message,message_type){
    result = '';
    await conn.query("INSERT INTO messages(userID,message,userSendID,date,message_status,message_type) VALUES ('"+user+"','"+msg+"','"+sdUser+"','"+date_time+"','"+status_message+"','"+message_type+"')").then(
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
 */
//find expecific user
async function findUser(user){
    //result = '';
    const rows = await conn.query("SELECT * FROM users WHERE userID='"+user+"';");
    return rows.rows;
}

//list all users
async function allUser(){
    const rows = await conn.query('SELECT userID FROM users;');
    return rows.rows;
}

//list all messages
async function allMessage(){
    const rows = await conn.query('SELECT * FROM messages;');//WHERE user="'+user+'";');
    return rows.rows;

}

//find message for expecific user
async function findTextMessages(user, senduser){
    const rows = await conn.query("SELECT * FROM messages WHERE userID='"+user+"' AND userSendID='"+senduser+"' AND message_type='TEXT' AND message_status = 3 OR userID='"+senduser+"' AND userSendID='"+user+"' AND message_type='TEXT' AND message_status = 3;");
    return rows.rows;
}
//Faz busca por status
async function findNewsTextMessage(user, senduser){
    const rows = await conn.query("SELECT * FROM messages WHERE ((userID='"+user+"' AND userSendID='"+senduser+"' AND message_type='TEXT' AND message_status < 3 ) OR (userID='"+senduser+"' AND userSendID='"+user+"' AND message_type='TEXT' AND message_status < 3));");
    return rows.rows;
}

//Faz busca por status
async function findBase64Messages(user, senduser){
    const rows = await conn.query("SELECT * FROM messages WHERE userID='"+user+"' AND userSendID='"+senduser+"' AND message_type='BASE64' AND message_status = 3 OR userID='"+senduser+"' AND userSendID='"+user+"' AND message_type='BASE64' AND message_status = 3;");
    return rows.rows;
}

//Faz busca por status
async function findNewsBase64Messages(user, senduser){
    const rows = await conn.query("SELECT * FROM messages WHERE ((userID='"+user+"' AND userSendID='"+senduser+"' AND message_type='BASE64' AND message_status < 3 ) OR (userID='"+senduser+"' AND userSendID='"+user+"' AND message_type='BASE64' AND message_status < 3))");
    return rows.rows;
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
    const rows = await conn.query("SELECT * FROM messages WHERE userID='"+user+"' AND message='"+msg+"' AND userSendID='"+sdUser+"' AND date='"+date_time+"' AND message_status="+status_message+";");
    return rows.rows;
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
 */

//mudar estatus da menssagem
async function setStatus(id, status_message){
    const rows = await conn.query("UPDATE messages SET message_status = "+status_message+" WHERE id="+id+";");
    return rows.rows;
}
/**
 * 
 * ------------------------- Construtor -----------
 * 
 */
(async () => {
    await createDB();
    let result = await createTables();
})();
module.exports = {createDB,createTables,addUser,addMessage,findUser,allUser,findTextMessages,allMessage,findMessageforDate,findMessageforDateAndUser,findMessageforDateAndSendUser,setStatus,findSpecificMsg,findNewsTextMessage,findBase64Messages,findNewsBase64Messages};