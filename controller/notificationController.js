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
const notification = require('../model/notification');
const serviceAccount = require('../config/push-notification.json');
const broadcast = require('../model/broadcast');

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

  
 

//router.post('/send-notification', (req, res) => {
  //   const { registrationToken, title, body } = req.body;
  
  //   if (!registrationToken) {
  //     return res.status(400).send('Registration token is required');
  //   }
  
  //   const message = {
  //     notification: {
  //       title,
  //       body,
  //     },
  //     token: registrationToken,
  //   };
  
  //   admin.messaging().send(message)
  //     .then((response) => {
  //       console.log('Successfully sent message:', response);
  //       res.send('Notification sent successfully');
  //     })
  //     .catch((error) => {
  //       console.error('Error sending message:', error);
  //       res.status(500).send('Error sending notification');
  //     });
  // });


router.post('/send-notification', (req, res) => {
    const { registrationToken, regNo, title, body } = req.body;
  
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
  
        // Save the notification to the database
        const newNotification = new notification({
          regNo,
          registrationToken,
          title,
          body,
        });
  
        return newNotification.save();
      })
      .then(() => {
        console.log('Notification saved to the database');
        res.send('Notification sent and saved successfully');
      })
      .catch((error) => {
        console.error('Error sending or saving notification:', error);
        res.status(500).send('Error sending or saving notification');
      });
  });

router.post('/send-broadcast-notification', (req, res) => {
    // Fetch all registration tokens from the signup model
    signup.find({}, 'token', (err, users) => {
      if (err) {
        console.error('Error fetching registration tokens:', err);
        return res.status(500).send('Error fetching registration tokens');
      }
  
      // Extract registration tokens from users
      const registrationTokens = users.map(user => user.token);
  
      // Check if there are tokens available
      if (registrationTokens.length === 0) {
        return res.status(400).send('No registration tokens found');
      }
  
      // Construct the message
      const { title, body } = req.body;
      const message = {
        notification: {
          title,
          body,
        },
        tokens: registrationTokens,
      };
  
      // Send the broadcast message
      admin.messaging().sendMulticast(message)
        .then((response) => {
          console.log('Successfully sent broadcast message:', response);
  
          // Save the broadcast message to the database
          const newBroadcast = new broadcast({
            title,
            body,
          });
  
          return newBroadcast.save();
        })
        .then(() => {
          console.log('Broadcast message saved to the database');
          res.send('Broadcast message sent and saved successfully');
        })
        .catch((error) => {
          console.error('Error sending or saving broadcast message:', error);
          res.status(500).send('Error sending or saving broadcast message');
        });
    });
  });
  
  

  module.exports=router;