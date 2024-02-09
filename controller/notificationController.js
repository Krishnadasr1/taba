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
const Token = require('../model/token');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


//////////////////////

router.post('/register-device', async (req, res) => {
  try {
    const { token, regNo } = req.body;

    let existingToken = await Token.findOne({ regNo });

    if (existingToken) {
      
      existingToken.token = token || existingToken.token;
    } else {
      
      existingToken = new Token({
        regNo,
        token,
      });
    }

    await existingToken.save();

    console.log(`Received registration token: ${token}`);
    res.status(200).json('Token received successfully');
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
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
    Token.find({}, 'token')
      .then(users => {
        // Extract registration tokens from users
        const registrationTokens = users.map(user => user.token);
        console.log(registrationTokens)
  
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
          tokens: registrationTokens, // Use registrationTokens instead of tokens
        };
  
        // Send the broadcast message
        return admin.messaging().sendMulticast(message);
      })
      .then(response => {
        console.log('Successfully sent broadcast message:', response);
  
        // Save the broadcast message to the database
        const { title, body } = req.body;
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
      .catch(error => {
        console.error('Error sending or saving broadcast message:', error);
        res.status(500).send('Error sending or saving broadcast message');
      });
});
  
  

router.post('/get-message', async (req, res) => {
  try {
      const regNo = req.body.regNo;

      
      const notificationData = await notification.find({ regNo },'_id title body');

      const broadcastData = await broadcast.find();

      const combinedResult = [...notificationData, ...broadcastData];

      res.status(200).json(combinedResult);
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.post('/get-message-count', async (req, res) => {
  try {
      const regNo = req.body.regNo;

      // Get count of records from the notification model based on regNo
      const notificationCount = await notification.countDocuments({ regNo });

      // Get total count of records from the broadcast model
      const broadcastCount = await broadcast.countDocuments();

      // Calculate the total count
      const totalCount = notificationCount + broadcastCount;

      res.status(200).json({ totalCount });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});
  

  module.exports=router;