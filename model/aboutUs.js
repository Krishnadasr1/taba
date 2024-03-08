const mongoose = require('mongoose');

const aboutusSchema = new mongoose.Schema({
  
  description: {
    type: String
  },

  address:{
    type:String
  },

  email:{
    type:String
  },

  phone:{
    type:String
  },

  image: {

    data:{
      type :Buffer,
      required : true,
    },
    contentType:{
      type :String,
      required: true,
    },
    name: {
      type :String,
    required: true,
    }
    
  },
  
  
},{timestamps : false});

const aboutus = mongoose.model('aboutus', aboutusSchema);

module.exports = aboutus;
