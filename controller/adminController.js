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
    console.log("listing users")
    const users = await signup.find({isRegisteredUser:false}, '_id regNo phone image firstName email DOB address officeAddress clerkName1 clerkName2 clerkPhone1 clerkPhone2 bloodGroup welfareMember pincode district state whatsAppno enrollmentDate');

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

    // Respond with the array of user data including Base64 image
    res.status(200).json(usersWithBase64Image);
  } catch (error) {
    console.log(error);

    // Respond with a 500 Internal Server Error
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.get('/list-valid-users', async (req, res) => {
  try {
    console.log("listing users")
    const users = await signup.find({isRegisteredUser:true}, '_id regNo phone image firstName email DOB address officeAddress clerkName1 clerkName2 clerkPhone1 clerkPhone2 bloodGroup welfareMember pincode district state whatsAppno enrollmentDate');

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
        annualFee:user.annualFee,
        paidAmount:user.paidAmount,
        
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
    if (file.mimetype === 'image/jpeg') {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG images are allowed'), false)
    }
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

router.get('/about',async(req,res)=>{
  try{
    const About = await about.find();

    res.status(200).json({message:"success",About})
  }
  catch(error){
    console.log(error);
    res.status(500).json({message:"internal error"})
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

// cron.schedule('*/5 * * * * *', async () => {
//   try {
//     const users = await signup.find({});

//     users.forEach(async (user) => {
//       const enrollmentDateParts = user.enrollmentDate.split('/'); // Assuming date is in the format DD/MM/YYYY
//       const enrollmentDate = new Date(`${enrollmentDateParts[2]}-${enrollmentDateParts[1]}-${enrollmentDateParts[0]}`);
      
//       const currentDate = new Date();
//       const experienceYears = Math.floor((currentDate - enrollmentDate) / (365 * 24 * 60 * 60 * 1000));

//       let monthlyIncrement = 0;

//       if (experienceYears >= 1 && experienceYears <= 5) {
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
    const pageSize = 1000;
    
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
    const user = await signup.findOne({ userName });

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
    const pageSize = 1000;
    
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


module.exports=router;