const mongoose = require('mongoose');

const broadcastSchema = new mongoose.Schema({
    

    
    
    title:{
        type:String,
    },
    body:{
        type:String,
    }
});

const broadcast = mongoose.model('broadcast', broadcastSchema);

module.exports = broadcast;
