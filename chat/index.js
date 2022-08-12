(async () =>{
    const db = require('./db');
    console.log('start db');

    await db.createDB();

    result = await db.createTables();
    console.log(result);

    result = await db.addUser('ne','123'); 
    console.log(result);

    result = await db.addMessage('ne','Bla, bla, bla');
    console.log(result);

    result = await db.findUser('n');
    console.log(result);
})();