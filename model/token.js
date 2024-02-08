const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    

    
    
    regNo:{
        type:String,
    },
    token:{
        type:String,
    }
});

const token = mongoose.model('token', tokenSchema);

module.exports = token;
