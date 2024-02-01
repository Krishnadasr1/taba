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


const registrationToken = 'YOUR_DEVICE_REGISTRATION_TOKEN';

const message = {
  notification: {
    title: 'Your Notification Title',
    body: 'Your Notification Body',
  },
  token: registrationToken,
};

admin.messaging().send(message)
  .then((response) => {
    console.log('Successfully sent message:', response);
  })
  .catch((error) => {
    console.error('Error sending message:', error);
  });

//////////////////////

router.post('/register-device', async(req, res) => {
    
  try{
    const { token,regNo } = req.body;
    const user = await signup.find(regNo)
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
  })

  
 

router.post('/send-notification', (req, res) => {
    const { title, body } = req.body;
  
    // Construct the FCM message
    const message = {
      notification: {
        title,
        body,
      },
      tokens: registeredTokens, // Use the stored tokens for targeted notifications
    };
  
    // Send the FCM message
    admin.messaging().sendMulticast(message)
      .then((response) => {
        console.log('Successfully sent message:', response);
        res.send('Notification sent successfully');
      })
      .catch((error) => {
        console.error('Error sending message:', error);x
        res.status(500).send('Error sending notification');
      });
  });

  module.exports=router;