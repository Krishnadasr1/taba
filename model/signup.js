const mongoose = require('mongoose');

const signupSchema = new mongoose.Schema({
  regNo: {
    type: String,
    default:""
  },

  firstName: {
    type: String,
    default:""
  },
  

  phone: {
    type: String,
    default:""
  },
  password: {
    type: String,
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

  clerkName1: {
    type: String,
    default:""
  },

  clerkName2: {
    type: String,
    default:""
  },


  clerkPhone1: {
    type: String,
    default:""
  },

  clerkPhone2:{
    type: String,
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

  token:{
    type:String
  },
  
  image: {

    data:{
      type :Buffer,
      
    },
    contentType:{
      type :String,
      
    },
    name: {
      type :String,
    
    }
    
  },
  // img: {
  //   name: String,
  //   contentType: String,
  //   data: Buffer
  // },
  isRegisteredUser: {
    type: String,
    required: true,
    default: false
  },

  isValidUser: {
    type: String,
    required: true,
    default:false
  
  },

  paidAmount: {
    type: String,
    default:"0"
  }
},{timestamps : true});

const signup = mongoose.model('signup', signupSchema);

module.exports = signup;
