const express = require('express');
require("dotenv").config();
const router = express.Router();
const jwt = require('jsonwebtoken');
//const verifyToken = require('../verifytoken');
const signup = require('../model/signup');
const bcrypt = require('bcrypt');
const multer = require('multer');
const { MongoClient } = require('mongodb');
const axios = require('axios');
const verifyToken = require('../verifyToken');
const admin = require('firebase-admin');

const serviceAccount = require('../config/push-notification.json');


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


// const registrationToken = 'ddjrn1H_QxqlhYtBGu7C9Z:APA91bGwulNcziSrtvj7t0JDiuQLsWARFqHrdbbl_RMFT6RqMgU6CLn4wcLFwaVv7OyrTyQC0iF63W3-CyezxpUN5haDfHDXt5zZ4FDKP_2-sJMa7kyH6RHbeL87cnQHJ6DKnZ-gmhB0';


//////////////////////

router.post('/register-device', async(req, res) => {
    
  try{
    const { token,regNo } = req.body;
    const user = await signup.findOne({regNo})
    if(!user){
        return res.status(404).json({message:'user not found'})
    }
    user.regNo = regNo || user.regNo,
    user.token = token || user.token
  

  await user.save();

    console.log(`Received registration token: ${token}`);
    res.status(200).json('Token received successfully');}

    catch(error){
        console.log(error)
        return res.status(500).json({message:"internal server error"})
    }
  });

  
 

  router.post('/send-notification', (req, res) => {
    const { registrationToken, title, body } = req.body;
  
    if (!registrationToken) {
      return res.status(400).send('Registration token is required');
    }
  
    const message = {
      notification: {
        title,
        body,
      },
      token: registrationToken,
    };
  
    admin.messaging().send(message)
      .then((response) => {
        console.log('Successfully sent message:', response);
        res.send('Notification sent successfully');
      })
      .catch((error) => {
        console.error('Error sending message:', error);
        res.status(500).send('Error sending notification');
      });
  });

  module.exports=router;