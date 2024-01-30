const mongoose = require('mongoose');

const signupSchema = new mongoose.Schema({
  regNo: {
    type: String,
    required: true,
    default:""
  },

  firstName: {
    type: String,
    default:""
  },
  lastName: {
    type: String,
    default:""
  },

  phone: {
    type: String,
    required: true,
    default:""
  },
  password: {
    type: String,
    required: true,
    default:""
  },

  email: {
    type: String,
    default:""
  },
  DOB: {
    type:String,
    default:""
  },
  whatsAppno:{
    type: String,
    default: ""
  },

  address: {
    type: String,
    default:""
  },

  officeAddress: {
    type: String,
    default:""
  },

  clerkName: {
    type: Array,
    default:""
  },

  clerkPhone: {
    type: Array,
    default:""
  },

  bloodGroup: {
    type: String,
    default:""
  },

  welfareMember : {
    type: String,
    default:""
  },

  pincode: {
    type: String,
    default:""
  },

  district: {
    type: String,
    default:""
  },

  state: {
    type: String,
    default:""
  },

  annualFee: {
    type: String,
    default:""
  },

  enrollmentDate: {
    type: String,
    default:""
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
