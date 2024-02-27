const express= require('express');
const router= express.Router();
const jwt= require('jsonwebtoken');
const signup= require('../model/signup');
const admin= require('../model/admin');
require("dotenv").config();
const bcrypt= require("bcrypt");
const multer= require("multer");
const { MongoClient } = require('mongodb');
const axios = require('axios');
const verifyToken = require('../verifyToken');
const about = require('../model/about');
const Token = require('../model/token');
const nodemailer = require('nodemailer');
const generatePassword = require('generate-password');


router.post('/login', async (req, res) => {
  try {
    console.log("login")
    const {userName, password } = req.body;
    console.log(req.body.userName,req.body.password)

    const user = await admin.findOne({ userName });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    
    return res.status(200).json({ message: 'login successful'});
   
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/list-new-users', async (req, res) => {
  try {
    console.log("listing users");

    // Extract page number from the request query, default to 1 if not provided
    const page = parseInt(req.body.page, 10) || 1;
    // Set the page size
    const pageSize = 10000;
    // Calculate the skip value based on the page number and page size
    const skip = (page - 1) * pageSize;

    // Fetch new users with pagination
    const users = await signup
      .find({ isRegisteredUser: false }, '_id regNo phone image firstName email DOB address officeAddress clerkName1 clerkName2 clerkPhone1 clerkPhone2 bloodGroup welfareMember pincode district state whatsAppno enrollmentDate')
      .skip(skip)
      .limit(pageSize);

    // Convert binary image data to Base64
    const usersWithBase64Image = users.map(user => {
      return {
        _id: user._id,
        regNo: user.regNo,
        phone: user.phone,
        firstName: user.firstName,
        email: user.email,
        DOB: user.DOB,
        address: user.address,
        officeAddress: user.officeAddress,
        clerkName1: user.clerkName1,
        clerkName2: user.clerkName2,
        clerkPhone1: user.clerkPhone1,
        clerkPhone2: user.clerkPhone2,
        bloodGroup: user.bloodGroup,
        welfareMember: user.welfareMember,
        enrollmentDate: user.enrollmentDate,
        pincode: user.pincode,
        district: user.district,
        state: user.state,
        whatsAppno: user.whatsAppno,
        image: user.image && user.image.data ? user.image.data.toString('base64') : null,
      };
    });

    // Respond with the array of new user data including Base64 image
    res.status(200).json(usersWithBase64Image);
  } catch (error) {
    console.log(error);

    // Respond with a 500 Internal Server Error
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// router.get('/list-valid-users', async (req, res) => {
//   try {
//     console.log("listing users")
//     const users = await signup.find({isRegisteredUser:true}, '_id regNo phone image firstName email DOB address officeAddress clerkName1 clerkName2 clerkPhone1 clerkPhone2 bloodGroup welfareMember pincode district state whatsAppno enrollmentDate annualFee paidAmount');

//     // Convert binary image data to Base64
//     const usersWithBase64Image = users.map(user => {
//       return {
//         _id: user._id,
//         regNo: user.regNo,
//         phone: user.phone,
//         firstName: user.firstName,
//         email: user.email,
//         DOB: user.DOB,
//         address: user.address,
//         officeAddress: user.officeAddress,
//         clerkName1: user.clerkName1,
//         clerkName2: user.clerkName2,
//         clerkPhone1: user.clerkPhone1,
//         clerkPhone2: user.clerkPhone2,
//         bloodGroup: user.bloodGroup,
//         welfareMember: user.welfareMember,
//         enrollmentDate: user.enrollmentDate,
//         pincode: user.pincode,
//         district: user.district,
//         state: user.state,
//         whatsAppno: user.whatsAppno,
//         annualFee:user.annualFee,
//         paidAmount:user.paidAmount,
        
//         image: user.image && user.image.data ? user.image.data.toString('base64') : null,
//       };
//     });

//     // Respond with the array of user data including Base64 image
//     res.status(200).json(usersWithBase64Image);
//   } catch (error) {
//     console.log(error);

//     // Respond with a 500 Internal Server Error
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// });

router.get('/list-valid-users', async (req, res) => {
  try {
    console.log("listing users");

    // Extract page number from the request query, default to 1 if not provided
    const page = parseInt(req.body.page, 10) || 1;

    const pageSize = 30;
    // Calculate the skip value based on the page number and page size
    const skip = (page - 1) * pageSize;

    // Fetch users with pagination
    const users = await signup
      .find({ isRegisteredUser: true }, '_id regNo phone image firstName email DOB address officeAddress clerkName1 clerkName2 clerkPhone1 clerkPhone2 bloodGroup welfareMember pincode district state whatsAppno enrollmentDate annualFee paidAmount')
      .skip(skip)
      .limit(pageSize);

    // Convert binary image data to Base64
    const usersWithBase64Image = [];

    for (const user of users) {
      // Fetch data from Token model based on regNo
      const tokenData = await Token.findOne({ regNo: user.regNo }, 'regNo token');

      usersWithBase64Image.push({
        _id: user._id,
        regNo: user.regNo,
        phone: user.phone,
        firstName: user.firstName,
        email: user.email,
        DOB: user.DOB,
        address: user.address,
        officeAddress: user.officeAddress,
        clerkName1: user.clerkName1,
        clerkName2: user.clerkName2,
        clerkPhone1: user.clerkPhone1,
        clerkPhone2: user.clerkPhone2,
        bloodGroup: user.bloodGroup,
        welfareMember: user.welfareMember,
        enrollmentDate: user.enrollmentDate,
        pincode: user.pincode,
        district: user.district,
        state: user.state,
        whatsAppno: user.whatsAppno,
        annualFee: user.annualFee,
        paidAmount: user.paidAmount,
        image: user.image && user.image.data ? user.image.data.toString('base64') : null,
        token: tokenData ? tokenData.token : null,
      });
    }

    // Respond with the array of user data including Base64 image and Token
    res.status(200).json(usersWithBase64Image);
  } catch (error) {
    console.log(error);

    // Respond with a 500 Internal Server Error
    res.status(500).json({ message: 'Internal Server Error' });
  }
});




router.delete('/delete/:userId', async (req, res) => {
  const regNoToDelete = req.params.userId;

  try {
    const deletedUser = await signup.findOneAndDelete({ _id: regNoToDelete });

    if (deletedUser) {
      return res.status(200).json({ message: 'User deleted successfully', user: deletedUser });
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.put('/validUsers', async (req, res) => {
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: 'Invalid or empty user IDs' });
  }

  try {
    const updateResult = await signup.updateMany(
      { _id: { $in: userIds } },
      { $set: { isRegisteredUser: true } }
    );

    if (updateResult.nModified === 0) {
      return res.status(404).json({ message: 'Users not found' });
    }

    res.status(200).json({ message: 'User validation successful' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 5000 * 1024, // 50 KB limit
  },
  fileFilter: function (req, file, cb) {
    
      cb(null, true);
    
  },
});
router.post('/upload', (req, res) => {
  upload.single('image')(req, res, async (err) => {
    try {
      console.log("uploading............waiting for response....");
      const {name,description} = req.body;

  
      const newUser = new about({
        name,
        description
      });

      
      if (req.file) {
        newUser.image = {
          data: req.file.buffer,
          contentType: req.file.mimetype,
          name: req.file.originalname, 
        };
      }

      await newUser.save();

      res.status(200).json({ message: 'data added successfully'});
    } catch (error) {

      if (err instanceof multer.MulterError == false) {
        console.log("...........error..................." ,err);
        return res.status(404).json({ message: 'Only JPEG images are allowed',err});
       
        
      } else if (err instanceof multer.MulterError == true) {
        return res.status(404).json({ message: 'File size limit exceeded (50 KB max)' });
        
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  });
});

router.get('/about', async (req, res) => {
  try {
    console.log("listing")
    const users = await about.find({}, 'image name description _id');

    // Convert binary image data to Base64
    const usersWithBase64Image = users.map(user => {
      return {
        name:user.name,
        description:user.description,
        _id:user._id,
        image: user.image && user.image.data ? user.image.data.toString('base64') : null,
      };
    });

    // Respond with the array of user data including Base64 image
    res.status(200).json(usersWithBase64Image);
  } catch (error) {
    console.log(error);

    // Respond with a 500 Internal Server Error
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.put('/update-about/:userId', upload.single('image'), async (req, res) => {
  try {
    console.log("..........update...........");
    const userId = req.params.userId;
    const { name,description  } = req.body;
    console.log(name,description)
    const user = await about.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user fields
    
    user.name = name || user.name;
    user.description = description || user.description;

    

    // Check if an image was uploaded
    if (req.file) {
      user.image = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        name: req.file.originalname,
      };
    }

    // Save the updated user to the database
    await user.save();

    res.status(200).json({ message: 'User updated successfully' });
  } catch (error) {
    handleRegistrationError(error, res);
  }
});

function handleRegistrationError(error, res) {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size limit exceeded (50 KB max)' });
    } else {
      return res.status(400).json({ message: 'Invalid file' });
    }
  } else {
    console.error("...........error...................", error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

const cron = require('node-cron');
// 0 0 1 * * -once a month
// */5 * * * * * -every 5 second
// 0 0 * * * -everyday

// cron.schedule('*/5 * * * * *', async () => {
//   try {
//     const users = await signup.find({});

//     users.forEach(async (user) => {
//       const enrollmentDateParts = user.enrollmentDate.split('/'); // Assuming date is in the format DD/MM/YYYY
//       const enrollmentDate = new Date(`${enrollmentDateParts[2]}-${enrollmentDateParts[1]}-${enrollmentDateParts[0]}`);
      
//       const currentDate = new Date();
//       const experienceYears = Math.floor((currentDate - enrollmentDate) / (365 * 24 * 60 * 60 * 1000));

//       let monthlyIncrement = 0;

//       if (experienceYears >= 0 && experienceYears <= 5) {
//         monthlyIncrement = 25;
//       } else if (experienceYears >= 6 && experienceYears <= 15) {
//         monthlyIncrement = 50;
//       } else if (experienceYears >= 16 && experienceYears <= 50) {
//         monthlyIncrement = 100;
//       }

//       const currentAnnualFee = parseInt(user.annualFee) || 0; // Ensure a valid number, default to 0 if NaN
//       const updatedAnnualFee = currentAnnualFee + monthlyIncrement;

//       if (!isNaN(updatedAnnualFee)) {
//         // Update the annualFee as a string
//         await signup.findByIdAndUpdate(user._id, { $set: { annualFee: updatedAnnualFee.toString() } });
//       } else {
//         console.error(`Invalid updatedAnnualFee for user with ID ${user._id}: ${updatedAnnualFee}`);
//       }
//     });

//     console.log('Annual fees updated successfully.');
//   } catch (error) {
//     console.error('Error updating annual fees:', error);
//   }
// });

// console.log('Cron job scheduled to run every 5 seconds.');

cron.schedule('0 0 1 * *', async () => {
  try {
    const users = await signup.find({});

    users.forEach(async (user) => {
      const enrollmentDateParts = user.enrollmentDate.split('/'); // Assuming date is in the format DD/MM/YYYY
      const enrollmentDate = new Date(`${enrollmentDateParts[2]}-${enrollmentDateParts[1]}-${enrollmentDateParts[0]}`);
      
      const currentDate = new Date();
      const experienceYears = Math.floor((currentDate - enrollmentDate) / (365 * 24 * 60 * 60 * 1000));

      let monthlyIncrement = 0;

      if (experienceYears >= 0 && experienceYears <= 5) {
        monthlyIncrement = 25;
      } else if (experienceYears >= 6 && experienceYears <= 15) {
        monthlyIncrement = 50;
      } else if (experienceYears >= 16 && experienceYears <= 50) {
        monthlyIncrement = 100;
      }

      // Check if user.annualFee is a valid number string
      if (!isNaN(user.annualFee)) {
        const currentAnnualFee = parseInt(user.annualFee) || 0; // Ensure a valid number, default to 0 if NaN
        const updatedAnnualFee = currentAnnualFee + monthlyIncrement;
        // console.log(updatedAnnualFee)

        if (!isNaN(updatedAnnualFee)) {
          // Update the annualFee as a string
          await signup.findByIdAndUpdate(user._id, { $set: { annualFee: updatedAnnualFee.toString() } });
        } else {
          console.error(`Invalid updatedAnnualFee for user with ID ${user._id}: ${updatedAnnualFee}`);
        }
      } else {
        console.error(`Invalid annualFee for user with ID ${user._id}: ${user.annualFee}`);
      }
    });

    console.log('Annual fees updated successfully.');
  } catch (error) {
    console.error('Error updating annual fees:', error);
  }
});

console.log('Cron job scheduled to run every 5 seconds.');


router.post('/updatePayment/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const { paymentAmount } = req.body;

    // Fetch the user from the database
    const user = await signup.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update paidAmount and subtract from annualFee
    user.paidAmount = String(parseFloat(user.paidAmount) + parseFloat(paymentAmount));
    user.annualFee = String(parseFloat(user.annualFee) - parseFloat(paymentAmount));

    // Save the updated user
    await user.save();

    res.status(200).json({ message: 'Payment updated successfully',  });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/search_requests', async (req, res) => {
  try {
    console.log("searching users");

    const { search, page } = req.body;
    const pageSize = 10000;
    
    // Default page number to 1 if not provided
    const pageNumber = page || 1;

    console.log(`Listing users - Page: ${pageNumber}, PageSize: ${pageSize}`);


    if (!search) {
      return res.status(400).json({ message: 'Search input is required in the request body.' });
    }

    // Use a case-insensitive regular expression for the search query
    const query = new RegExp(search, 'i');

    // Calculate the skip value based on the page number
    const skip = (pageNumber - 1) * pageSize;

    // Search for users with matching firstName, lastName, phone, or regNo
    const users = await signup.find( 
      {
        $and: [
          {
            $or: [
              { firstName: query },
              { phone: query },
              { regNo: query },
              { DOB: query },
              { bloodGroup: query },
              { welfareMember: query },
            ],
          },
          { isRegisteredUser: false }, // Additional condition for registered users
        ],
      },
      'regNo phone image firstName email DOB whatsAppno officeAddress clerkName1 clerkName2 clerkPhone1 clerkPhone2 bloodGroup welfareMember address pincode district state'
    )
      .skip(skip)
      .limit(pageSize);

    // Convert binary image data to Base64
    const usersWithBase64Image = users.map(user => {
      return {
        enrollmentDate: user.enrollmentDate,
        regNo: user.regNo,
        phone: user.phone,
        firstName: user.firstName,
        email: user.email,
        DOB: user.DOB,
        whatsAppno: user.whatsAppno,
        officeAddress: user.officeAddress,
        clerkName1: user.clerkName1,
        clerkName2: user.clerkName2,
        clerkPhone1: user.clerkPhone1,
        clerkPhone2: user.clerkPhone2,
        bloodGroup: user.bloodGroup,
        welfareMember: user.welfareMember,
        address: user.address,
        pincode: user.pincode,
        district: user.district,
        state: user.state,
        image: user.image && user.image.data ? user.image.data.toString('base64') : null,
      };
    });

    // Respond with the array of user data including Base64 image
    res.status(200).json(usersWithBase64Image);
  } catch (error) {
    // Log the error
    console.error(error);

    // Respond with a 500 Internal Server Error
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.put('/invalid', async (req, res) => {
  try {
    const updateResult = await signup.updateMany({}, { $set: { isRegisteredUser: false } });

    if (updateResult.nModified === 0) {
      return res.status(404).json({ message: 'No user' });
    }

    res.status(200).json({ message: 'reverted :)' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { userName, newPassword } = req.body;
    const user = await admin.findOne({ userName });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const saltRounds = 10;
    const newSalt = await bcrypt.genSalt(saltRounds);

    const hashedNewPassword = await bcrypt.hash(newPassword, newSalt);

    user.password = hashedNewPassword;
    user.isValidUser = true;

    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/search_users', async (req, res) => {
  try {
    console.log("searching users");

    const { search, page } = req.body;
    const pageSize = 10000;
    
    // Default page number to 1 if not provided
    const pageNumber = page || 1;

    console.log(`Listing users - Page: ${pageNumber}, PageSize: ${pageSize}`);

    if (!search) {
      return res.status(400).json({ message: 'Search input is required in the request body.' });
    }

    // Escape special characters in the search query
    const escapedSearch = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

    // Use a case-insensitive regular expression for the escaped search query
    const query = new RegExp(escapedSearch, 'i');

    // Calculate the skip value based on the page number
    const skip = (pageNumber - 1) * pageSize;

    // Search for users with matching firstName, lastName, phone, or regNo
    const users = await signup.find( 
      {
        $and: [
          {
            $or: [
              { firstName: query },
              { phone: query },
              { regNo: query },
              { DOB: query },
              { bloodGroup: query },
              { welfareMember: query },
            ],
          },
          { isRegisteredUser: true }, // Additional condition for registered users
        ],
      },
      '_id regNo phone image firstName email DOB whatsAppno officeAddress clerkName1 clerkName2 clerkPhone1 clerkPhone2 bloodGroup welfareMember address pincode district state paidAmount annualFee'
    )
      .skip(skip)
      .limit(pageSize);

    // Convert binary image data to Base64
    const usersWithBase64Image = users.map(user => {
      return {
        _id: user._id,
        enrollmentDate: user.enrollmentDate,
        regNo: user.regNo,
        phone: user.phone,
        firstName: user.firstName,
        email: user.email,
        DOB: user.DOB,
        whatsAppno: user.whatsAppno,
        officeAddress: user.officeAddress,
        clerkName1: user.clerkName1,
        clerkName2: user.clerkName2,
        clerkPhone1: user.clerkPhone1,
        clerkPhone2: user.clerkPhone2,
        bloodGroup: user.bloodGroup,
        welfareMember: user.welfareMember,
        address: user.address,
        pincode: user.pincode,
        district: user.district,
        state: user.state,
        paidAmount: user.paidAmount,
        annualFee: user.annualFee,
        image: user.image && user.image.data ? user.image.data.toString('base64') : null,
      };
    });

    // Respond with the array of user data including Base64 image
    res.status(200).json(usersWithBase64Image);
  } catch (error) {
    // Log the error
    console.error(error);

    // Respond with a 500 Internal Server Error
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/get_by_regno', async (req, res) => {
  try {
     const {regNo} = req.body;
     if (!regNo) {
      return res.status(400).json({ message: 'Missing regNo in request body' });
    }
    const users = await signup.find({regNo}, 'regNo phone image firstName email DOB address officeAddress clerkName1 clerkName2 clerkPhone1 clerkPhone2 bloodGroup welfareMember pincode district state whatsAppno enrollmentDate annualFee ');

    const usersWithBase64Image = users.map(user => {
      return {
        regNo: user.regNo,
        phone: user.phone,
        firstName: user.firstName,
        email: user.email,
        DOB: user.DOB,
        address: user.address,
        officeAddress: user.officeAddress,
        clerkName1: user.clerkName1,
        clerkName2: user.clerkName2,
        clerkPhone1: user.clerkPhone1,
        clerkPhone2: user.clerkPhone2,
        bloodGroup: user.bloodGroup,
        welfareMember: user.welfareMember,
        enrollmentDate: user.enrollmentDate,
        pincode: user.pincode,
        district: user.district,
        state: user.state,
        whatsAppno: user.whatsAppno,
        annualFee: user.annualFee,
        
        image: user.image && user.image.data ? user.image.data.toString('base64') : null,
      };
    });

    
   return res.status(200).json(usersWithBase64Image);
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/get_token', async (req, res) => {
  try {
     const {regNo} = req.body;
     if (!regNo) {
      return res.status(400).json({ message: 'Missing regNo in request body' });
    }
    const users = await Token.find({regNo}, 'regNo token ');

    const usersWithBase64Image = users.map(user => {
      return {
        regNo: user.regNo,
        token: user.token
      };
    });

    
   return res.status(200).json(usersWithBase64Image);
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.put('/update-fee/:userId',async (req, res) => {
  try {
    console.log("..........update...........");
    const userId = req.params.userId;
    const { annualFee } = req.body;

    // Find the user by ID
    const user = await signup.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user fields
    user.annualFee = annualFee || user.annualFee;
    

    // Save the updated user to the database
    await user.save();

    res.status(200).json({ message: 'Fee updated successfully' });
  } catch (error) {
    handleRegistrationError(error, res);
  }
});

router.post('/send-email', async (req, res) => {
  try {
    // Generate a random eight-character password
    const newPassword = generatePassword.generate({
      length: 8,
      numbers: false,
      symbols: false,
      uppercase: true,
      lowercase: true,
    });

    const to = req.body.to;

    const Admin = await admin.findOne({ email: to });

    if (!Admin) {
      return res.status(404).json({ message: 'Admin not found for the provided email' });
    }

    // Hash the generated password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await admin.findOneAndUpdate({ email: to }, { password: hashedPassword });

    // Create a Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.forwardemail.net',
      port: 465,
      secure: true,
      service: 'gmail',
      auth: {
        user: 'thealappuzhabarassociation@gmail.com',
        pass: 'qabl ivam qntl zksx',
      },
    });

    // Define email options
    const mailOptions = {
      from: 'thealappuzhabarassociation@gmail.com',
      to,
      subject: 'Admin Password reset',
      text: `Your password has been reset. Your new password is: ${newPassword}`,
      html: `<head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          background-color: #f4f4f4;
          color: #333;
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }
    
        .container {
          max-width: 400px;
          background-color: #fff;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
    
        h1 {
          color: #3498db;
          margin-bottom: 20px;
        }
    
        p {
          line-height: 1.6;
        }
    
        .password {
          font-size: 1.5em;
          font-weight: bold;
          color: #27ae60;
          margin: 15px 0;
          border: 2px solid #27ae60;
          padding: 8px;
          border-radius: 5px;
          text-align: center;
        }
    
        .footer {
          margin-top: 20px;
          text-align: center;
          font-size: 12px;
          color: #777;
        }
      </style>
    </head>
    
    <body>
      <div class="container">
        <h1>Password Reset</h1>
        <p>Your password has been reset. Here is your new password:</p>
        <div class="password">${newPassword}</div>
        <p>Please login with your new password.</p>
        <div class="footer">
        </div>
      </div>
    </body>`,
    };

    // Update the hashed password in the admin model

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Failed to send email' });
      } else {
        console.log('Email sent:', info.response);
        return res.status(200).json({ message: 'Email sent successfully' });
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});



module.exports=router;