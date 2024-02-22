const { text } = require('body-parser');
const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({

    userName:{
    type: String,
    },

    password: {
        type: String,
    },

    email:{
        type:String,
    },

    });

    const admin = mongoose.model('admin',adminSchema);

    module.exports = admin;
