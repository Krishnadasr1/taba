const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    

    regNo:{
        type:String,
    },
    registrationToken:{
        type:String,
    },
    title:{
        type:String,
    },
    body:{
        type:String,
    }
});

const notification = mongoose.model('notification', notificationSchema);

module.exports = notification;
