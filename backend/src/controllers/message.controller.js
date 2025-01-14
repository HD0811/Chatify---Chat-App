import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// For user path : GET Method
export const getUsersForSidebar = async (req, res) => {
  try {
    // Deconstructing user_id from req
    const loggedInUserId = req.user._id;

    // filtering user_id
    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// For /:id path : GET Method
export const getMessages = async (req, res) => {
  try {
    // Grabing the id(of other user), using param from req body
    const { id: userToChatId } = req.params;
    // grabing the sender id (currently logged in user or our own id)
    const myId = req.user._id;

    // filtering messages
    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// For /:id path : POST Method
export const sendMessage = async (req, res) => {
  try {
    // Deconstructing text and image from request body
    const { text, image } = req.body;
    // Grabing id parameter from request paramaters
    const { id: receiverId } = req.params;
    // Grabing the currently logged in usser_id
    const senderId = req.user._id;

    // Checking if user sends image
    let imageUrl;
    if (image) {
      // Upload base64 image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    // New Message created
    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    // Saved to DB
    await newMessage.save();

    // real time communication
    const receiverSocketId = getReceiverSocketId(receiverId);
    // This only comes true when user is online
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
