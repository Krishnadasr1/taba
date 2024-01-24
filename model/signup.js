const mongoose = require('mongoose');

const signupSchema = new mongoose.Schema({
  regNo: {
    type: String,
    required: true,
  },

  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },

  phone: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },

  email: {
    type: String,
  },
  DOB: {
    type:String,
  },
  whatsAppno:{
    type: String,
    default: ""
  },

  address: {
    type: String,
  },

  officeAddress: {
    type: String,
  },

  clerkName: {
    type: Array
  },

  clerkPhone: {
    type: Array
  },

  bloodGroup: {
    type: String
  },

  welfareMember : {
    type: String,
  },

  pincode: {
    type: String
  },

  district: {
    type: String
  },

  state: {
    type: String,
  },

  annualFee: {
    type: String,
    default:""
  },

  enrollmentDate: {
    type: String,
    // required:true,
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
  isRegisteredUser: {
    type: Boolean,
    required: true,
    default: false
  },

  isValidUser: {
    type: Boolean,
    required: true,
    default:false
  
  },
},{timestamps : true});

const signup = mongoose.model('signup', signupSchema);

module.exports = signup;
