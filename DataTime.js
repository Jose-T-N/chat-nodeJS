function dateTime() {
    let date = new Date();
    //date.setTime(result_from_getTime);

    let seconds = date.getSeconds();
    let minutes = date.getMinutes();
    let hour = date.getHours();

    var year = date.getFullYear();
    var month = date.getMonth();
    var day = date.getDate();

    var dayOfWeek = date.getDay(); // Sunday = 0, Monday = 1, etc.

    return year + '-' + month + '-' + day + ' ' + hour + ':' + minutes + ':' + seconds;
}

function time() {

    let date = new Date();

    let seconds = date.getSeconds();
    let minutes = date.getMinutes();
    let hour = date.getHours();

    return hour + ':' + minutes + ':' + seconds;
}

function date() {

    let date = new Date();

    let year = date.getFullYear();
    let month = date.getMonth();
    let day = date.getDate();

    return year + '-' + month + '-' + day;
}
//format date
function dateString (date) {
    let seconds = date.getSeconds();
    let minutes = date.getMinutes();
    let hour = date.getHours();

    let year = date.getFullYear();
    let month = date.getMonth();
    let day = date.getDate();
    //creating date and adding in array
    return year + '-' + month + '-' + day + ' ' + hour + ':' + minutes + ':' + seconds;
};

function timeInterval() {

    let interval = [];
    let date = new Date();

    interval.push(dateString(date));

    //creating interva and adding in array
    date.setSeconds(date.getSeconds() - 1);
    interval.push(dateString(date));

    return interval;
}

module.exports = { dateTime, time, date ,timeInterval};
