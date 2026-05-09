import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { HTTP_STATUS_CODE } from "../utils/HTTP_STATUS_CODE.js";
import { sendResetPasswordEmail } from "../utils/sendEmail.js";

// signup controller
export const signup = async (req, res) => {
  try {
    let { name, email, password } = req.body;
    const avatar = req.file;

    if (!name || !email || !password || !avatar) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "All fields are required",
      });
    }

    name = name.trim();
    email = email.toLowerCase();

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(HTTP_STATUS_CODE.CONFLICT).json({
        success: false,
        message: "Email already exists",
      });
    }

    let uploadedAvatar;
    try {
      uploadedAvatar = await cloudinary.uploader.upload(avatar.path);
    } catch (error) {
      return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Avatar upload failed",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      avatar: uploadedAvatar.secure_url,
      resetOtp: null,
      resetOtpExpire: null,
    });

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(HTTP_STATUS_CODE.CREATED).json({
      success: true,
      message: "Signup successful",
    });
  } catch (error) {
    console.error("Signup Error:", error);

    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// login controller
export const login = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Email and password are required",
      });
    }

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(HTTP_STATUS_CODE.UNAUTHORIZED).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login Error:", error);

    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// logout controller
export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return res.status(HTTP_STATUS_CODE.OK).json({
    success: true,
    message: "Logout successful",
  });
};

// get user controller
export const getUser = async (req, res) => {
  try {
    const user = req.user;

    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get User Error:", error);

    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// update profile controller
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { name, password } = req.body;

    let updatedData = {};

    // name update
    if (name) {
      updatedData.name = name;
    }

    // password update
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);

      updatedData.password = hashedPassword;
    }

    // image update
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);

      updatedData.profileImage = result.secure_url;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
      upsert: true,
    }).select("-password");

    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.log("Update Profile Error:", error);

    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Forget password controller
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // check user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // generate 6 digit otp
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // hash otp
    const hashedOtp = await bcrypt.hash(otp, 10);

    // save otp + expire time
    user.resetOtp = hashedOtp;
    user.resetOtpExpire = Date.now() + 5 * 60 * 1000; // 5 minutes

    await user.save();

    // send email
    await sendResetPasswordEmail(user.email, otp);

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error) {
    console.log("Forgot Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// controllers/auth.controller.js
export const checkOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // validation
    if (!email || !otp) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    // find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    // check otp exists
    if (!user.resetOtp || !user.resetOtpExpire) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "No OTP found",
      });
    }

    // check otp expire
    if (user.resetOtpExpire < Date.now()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "OTP expired",
      });
    }

    // compare otp
    const isMatch = await bcrypt.compare(String(otp), user.resetOtp);

    if (!isMatch) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.log("Check OTP Error:", error);

    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Reset password controller
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    // validation
    if (!email || !otp || !password) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "All fields are required",
      });
    }

    // password validation
    if (password.length < 6) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(HTTP_STATUS_CODE.NOT_FOUND).json({
        success: false,
        message: "User not found",
      });
    }

    // check otp exists
    if (!user.resetOtp || !user.resetOtpExpire) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "No OTP found",
      });
    }

    // check expire
    if (user.resetOtpExpire < Date.now()) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "OTP expired",
      });
    }

    // compare otp
    const isMatch = await bcrypt.compare(String(otp), user.resetOtp);

    if (!isMatch) {
      return res.status(HTTP_STATUS_CODE.BAD_REQUEST).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // update password
    user.password = hashedPassword;

    // clear otp
    user.resetOtp = null;
    user.resetOtpExpire = null;

    await user.save();

    return res.status(HTTP_STATUS_CODE.OK).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.log("Reset Password Error:", error);

    return res.status(HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
