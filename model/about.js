const mongoose = require('mongoose');

const aboutSchema = new mongoose.Schema({
  name: {
    type: String
  },
  description: {
    type: String
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
  // img: {
  //   name: String,
  //   contentType: String,
  //   data: Buffer
  // },
  
},{timestamps : true});

const about = mongoose.model('about', aboutSchema);

module.exports = about;
