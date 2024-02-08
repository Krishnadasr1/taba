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
const admin = require('../model/admin');



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
      console.log("..........enter...........");
      const {regNo,phone,password,enrollmentDate,firstName,email,DOB,whatsAppno,address,officeAddress,clerkName1,clerkName2,clerkPhone1,clerkPhone2,bloodGroup,welfareMember,pincode,state,district} = req.body;

      // Check if the user already exists with the given phone
      const existingUser = await signup.findOne({ phone });

      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Generate a salt to use for password hashing
      const saltRounds = 10;
      const salt = await bcrypt.genSalt(saltRounds);

      // Hash the password using the generated salt
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create a new user instance
      const newUser = new signup({
        regNo,
        phone,
        enrollmentDate,
        password: hashedPassword,
        isRegisteredUser: false,
        isValidUser: true,
        firstName,
        address,
        officeAddress,
        clerkName1,
        clerkName2,
        clerkPhone1,
        clerkPhone2,
        bloodGroup,
        welfareMember,
        state,
        district,
        email,
        DOB,
        whatsAppno,
        pincode

      });

      // Check if an image was uploaded
      if (req.file) {
        newUser.image = {
          data: req.file.buffer,
          contentType: req.file.mimetype,
          name: req.file.originalname, // Provide the name property
        };
      }

      // Save the user to the database
      await newUser.save();

      res.status(200).json({ message: 'User registered and image uploaded successfully',newUser:{_id:newUser._id}});
    } catch (error) {
      console.log(error)
          // Additional error handling for multer errors
      if (err instanceof multer.MulterError == false) {
        console.log("...........error..................." ,err);
        return res.status(404).json({ message: 'Only JPEG images are allowed',err});
       
        
      } else if (err instanceof multer.MulterError == true) {
        return res.status(404).json({ message: 'File size limit exceeded (50 KB max)' });
        
      } else {
        //return res.status(404).json({ message: 'File size limit exceeded (50 KB max)' });
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  });
});


router.post('/login', async (req, res) => { 
  try {
    console.log("login")
    const { regNo, password } = req.body;
    

    // Check if the user exists with the given regNo
    const user = await signup.findOne({ regNo });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if(user.isRegisteredUser==false){
      return res.status(403).json({message: 'user not approved yet'});
    }

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user._id }, 'your-secret-key', { expiresIn: '1h' });
    return res.status(200).json({ message: 'login successful', token,
    user:{
      regNo : user.regNo || "",
      _id : user._id
      

    }});
    // Respond with the generated token
   // res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


router.post('/list_users', async (req, res) => {
  try {
    const page = parseInt(req.body.page) || 1;
    const pageSize = 10;

    console.log(`Listing users - Page: ${page}, PageSize: ${pageSize}`);

    const skip = (page - 1) * pageSize;

    const users = await signup
      .find({ isRegisteredUser:true })
      .select('regNo phone image firstName email DOB address officeAddress clerkName1 clerkName2 clerkPhone1 clerkPhone2 bloodGroup welfareMember pincode district state whatsAppno enrollmentDate')
      .skip(skip)
      .limit(pageSize);

    // Convert binary image data to Base64
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

router.post('/list_image', async (req, res) => {
  try {
     const {regNo} = req.body;
     if (!regNo) {
      return res.status(400).json({ message: 'Missing regNo in request body' });
    }
    const users = await signup.find({regNo}, 'image  ');

    const usersWithBase64Image = users.map(user => {
      return {
        
        
        image: user.image && user.image.data ? user.image.data.toString('base64') : null,
      };
    });

    
   return res.status(200).json(usersWithBase64Image);
  } catch (error) {
    console.log(error);

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

router.post('/get_due', async (req, res) => {
  try {
     const {regNo} = req.body;
     if (!regNo) {
      return res.status(400).json({ message: 'Missing regNo in request body' });
    }
    const users = await signup.find({regNo}, 'annualFee');

    const usersWithBase64Image = users.map(user => {
      return {
        annualFee: user.annualFee
      };
    });

    
   return res.status(200).json(usersWithBase64Image);
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// router.post('/get_image', async (req, res) => {
//   try {
//     const { regNos } = req.body;

//     if (!regNos || !Array.isArray(regNos) || regNos.length === 0) {
//       return res.status(400).json({ message: 'Missing or invalid regNos in request body' });
//     }

//     const users = await signup.find({ regNo: { $in: regNos } }, 'regNo  image ');

//     const usersWithBase64Image = users.map(user => {
//       return {
//         image: user.image && user.image.data ? user.image.data.toString('base64') : null,
//       };
//     });

//     return res.status(200).json(usersWithBase64Image);
//   } catch (error) {
//     console.log(error);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// });


router.put('/update/:userId', upload.single('image'), async (req, res) => {
  try {
    console.log("..........update...........");
    const userId = req.params.userId;
    const { regNo, phone, firstName, email, DOB, whatsAppno, address,officeAddress,clerkName1,clerkName2,clerkPhone1,clerkPhone2,bloodGroup,welfareMember, pincode, district, state,  } = req.body;

    // Find the user by ID
    const user = await signup.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update user fields
    user.regNo = regNo || user.regNo;
    user.phone = phone || user.phone;
    user.firstName = firstName || user.firstName;
    user.email = email || user.email;
    user.DOB = DOB || user.DOB;
    user.whatsAppno = whatsAppno || user.whatsAppno;
    user.address = address || user.address;
    user.officeAddress = officeAddress || user.officeAddress;
    user.clerkName1 = clerkName1 || user.clerkName1;
    user.clerkName2 = clerkName2 || user.clerkName2; 
    user.clerkPhone1 = clerkPhone1 || user.clerkPhone1;
    user.clerkPhone2 = clerkPhone2 || user.clerkPhone2;
    user.bloodGroup = bloodGroup || user.bloodGroup;
    user.welfareMember = welfareMember ||user.welfareMember;
    user.pincode = pincode || user.pincode;
    user.district = district || user.district;
    user.state = state || user.state;

    

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

// Helper function for handling registration errors
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



// const upload = multer({
//   limits: { fileSize: 5000000 }, // limit file size to 1MB
//   fileFilter: (req, file, cb) => {
//       if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
//           return cb(new Error('Only image files are allowed!'));
//       }
//       cb(null, true);
//   }
// });


// router.post('/uploadImage',upload.single('image') , async (req, res) => {
//   try {
//       // find the existing image for the given email
//       console.log("uploading");
//       const {phone,regNo,password} = req.body;
//       const existingImage = await signup.findOne({ phone: req.body.phone });

//       if (existingImage) {
//           // if an image already exists for the email, update the data and contentType
//           return res.status(400).json({ message: 'User already exists' });
//       } else {

//           const saltRounds = 10;
//           const salt = await bcrypt.genSalt(saltRounds);

//           const hashedPassword = await bcrypt.hash(password,salt);
//           // if no image exists for the email, create a new image
//           const newUser = new signup({
//               regNo,
//               password: hashedPassword,
//               isRegisteredUser :false,
//               phone,
//               image: {
//                   data: req.file.buffer,
//                   contentType: req.file.mimetype,
//               },
//           });
//           await newUser.save();
//           res.status(201).send('Image uploaded successfully!');
//       }
//   } catch (error) {
//       console.log(error);
//       res.status(500).send('Failed to upload image!');
//   }
// }
// );





// router.post('/search_users', async (req, res) => {
//   try {
//     console.log("searching users");

//     const { search } = req.body;

//     if (!search) {
//       return res.status(400).json({ message: 'Search input is required in the request body.' });
//     }

//     // Use a case-insensitive regular expression for the search query
//     const Query = new RegExp(search, 'i');

//     // Search for users with matching firstName, lastName, phone, or regNo
//     const users = await signup.find({
//       $or: [
//         { firstName: Query },
//         { lastName: Query },
//         { phone: Query },
//         { regNo: Query },
//         { DOB: Query },
//         { bloodGroup: Query },
//         { welfareMember: Query },
//       ]
//     }, 'regNo phone image firstName lastName email DOB address pincode district state');

//     // Convert binary image data to Base64
//     const usersWithBase64Image = users.map(user => {
//       return {
//         enrollmentDate: user.enrollmentDate,
//         regNo: user.regNo,
//         phone: user.phone,
//         firstName: user.firstName,
//         lastName: user.lastName,
//         email: user.email,
//         DOB: user.DOB,
//         whatsAppno: user.whatsAppno,
//         officeAddress: user.officeAddress,
//         clerkName1:user.clerkName1,
//         clerkName2:user.clerkName2,
//         clerkPhone1: user.clerkPhone1,
//         clerkPhone2: user.clerkPhone2,
//         bloodGroup: user.bloodGroup,
//         welfareMember: user.welfareMember,  
//         address: user.address,
//         pincode: user.pincode,
//         district: user.district,
//         state: user.state,
//         image: user.image && user.image.data ? user.image.data.toString('base64') : null,
//       };
//     });

//     // Respond with the array of user data including Base64 image
//     res.status(200).json(usersWithBase64Image);
//   } catch (error) {
//     // Log the error
//     console.error(error);

//     // Respond with a 500 Internal Server Error
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// });


// router.post('/search_users', async (req, res) => {
//   try {
//     console.log("searching users");

//     const { search, page } = req.body;
//     const pageSize = 1000;
    
//     // Default page number to 1 if not provided
//     const pageNumber = page || 1;

//     console.log(`Listing users - Page: ${pageNumber}, PageSize: ${pageSize}`);


//     if (!search) {
//       return res.status(400).json({ message: 'Search input is required in the request body.' });
//     }

//     // Use a case-insensitive regular expression for the search query
//     const query = new RegExp(search, 'i');

//     // Calculate the skip value based on the page number
//     const skip = (pageNumber - 1) * pageSize;

//     // Search for users with matching firstName, lastName, phone, or regNo
//     const users = await signup.find( 
//       {
//         $and: [
//           {
//             $or: [
//               { firstName: query },
//               { phone: query },
//               { regNo: query },
//               { DOB: query },
//               { bloodGroup: query },
//               { welfareMember: query },
//             ],
//           },
//           { isRegisteredUser: true }, // Additional condition for registered users
//         ],
//       },
//       'regNo phone image firstName email DOB whatsAppno officeAddress clerkName1 clerkName2 clerkPhone1 clerkPhone2 bloodGroup welfareMember address pincode district state'
//     )
//       .skip(skip)
//       .limit(pageSize);

//     // Convert binary image data to Base64
//     const usersWithBase64Image = users.map(user => {
//       return {
//         enrollmentDate: user.enrollmentDate,
//         regNo: user.regNo,
//         phone: user.phone,
//         firstName: user.firstName,
//         email: user.email,
//         DOB: user.DOB,
//         whatsAppno: user.whatsAppno,
//         officeAddress: user.officeAddress,
//         clerkName1: user.clerkName1,
//         clerkName2: user.clerkName2,
//         clerkPhone1: user.clerkPhone1,
//         clerkPhone2: user.clerkPhone2,
//         bloodGroup: user.bloodGroup,
//         welfareMember: user.welfareMember,
//         address: user.address,
//         pincode: user.pincode,
//         district: user.district,
//         state: user.state,
//         image: user.image && user.image.data ? user.image.data.toString('base64') : null,
//       };
//     });

//     // Respond with the array of user data including Base64 image
//     res.status(200).json(usersWithBase64Image);
//   } catch (error) {
//     // Log the error
//     console.error(error);

//     // Respond with a 500 Internal Server Error
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// });

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


router.post('/request-reset',async(req,res)=>{
  try{
    const {regNo,phone} = req.body;

    const user = await signup.findOne({regNo,phone})

    if(!user){
      return res.status(400).json({message:"no user found"})
    }
    else{
      return res.status(200).json({message:"success"})
    }
  }
  catch(error){
    console.log(error)
    return res.status(500).json({message:"internal server error"})
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { phone, newPassword } = req.body;
    const user = await signup.findOne({ phone });

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


router.get('/download/:id', async (req, res) => {
  try {
    const user = await signup.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const img = user.image;

    if (!img || !img.data) {
      return res.status(404).json({ message: 'Image not found in user document' });
    }

    res.set('Content-Type', img.contentType);
    res.set('Content-Disposition', `attachment; filename="${img.name}"`);
    res.send(img.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


router.get('/show',async(req,res)=>{

  res.status(200).json({message:"success"})
});

module.exports = router;
