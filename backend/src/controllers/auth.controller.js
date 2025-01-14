import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

// Signup route
export const signup = async (req, res) => {
  // Deconstruting request body for required paramters
  const { fullName, email, password } = req.body;
  try {
    // Check for all the fields that input should be present
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check for: password length > 6
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Check for already Exisitng Users
    const user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "Email already exists" });

    // Hashing of passwords
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // If all above validations are true then proceed here
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      // generate jwt token here
      generateToken(newUser._id, res);
      // Adding user to DB
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Login route (We are getting email and password by a user)
export const login = async (req, res) => {
  // Deconstruting request body for required paramters
  const { email, password } = req.body;
  try {
    // finding user is existed
    const user = await User.findOne({ email });

    //  iF user = false(i.e. user doesnt exist)(Mallicious users)
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // If user = true , then checking for password
    // comparing entered password and user.password(DB password) with the help of compare function of bcrypt
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    // false password
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // true password
    // token generated
    generateToken(user._id, res);

    // response sended
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Logout route
export const logout = (req, res) => {
  try {
    // cookie jwt is cleared out when user logout
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//Update Profile Route
export const updateProfile = async (req, res) => {
  try {
    // Deconstructed profilepic and userid
    const { profilePic } = req.body;
    const userId = req.user._id;

    // profilepic = false or not found
    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    // profilepic = true (uploading to cloudinary)
    const uploadResponse = await cloudinary.uploader.upload(profilePic);

    // Updating in our DB
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );
    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// checking for Authorisation of user
export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
