const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// Helper - consistent user payload used everywhere
const userPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  allowedCampaigns: user.allowedCampaigns,
  viewAllCampaigns: user.viewAllCampaigns,
  visibleFields: user.visibleFields || [],
});

// @POST /api/auth/register  (Admin only)
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Name, email and password are required",
        });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }
    const user = await User.create({
      name,
      email,
      password,
      role: role || "viewer",
      createdBy: req.user?._id,
    });
    res
      .status(201)
      .json({
        success: true,
        message: "User created successfully",
        data: userPayload(user),
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error creating user",
        error: error.message,
      });
  }
};

// @POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user || !user.isActive) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
    const token = generateToken(user._id);
    res
      .status(200)
      .json({
        success: true,
        message: "Login successful",
        token,
        data: userPayload(user),
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error logging in",
        error: error.message,
      });
  }
};

// @GET /api/auth/me  - always fetches fresh data from DB
exports.getMe = async (req, res) => {
  try {
    // Re-fetch from DB so visibleFields/allowedCampaigns are always current
    const user = await User.findById(req.user._id).select("-password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, data: userPayload(user) });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error fetching user",
        error: error.message,
      });
  }
};

// @POST /api/auth/setup-admin
exports.setupAdmin = async (req, res) => {
  try {
    const adminExists = await User.findOne({ role: "admin" });
    if (adminExists) {
      return res
        .status(400)
        .json({ success: false, message: "Admin already exists" });
    }
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields required" });
    }
    const admin = await User.create({ name, email, password, role: "admin" });
    const token = generateToken(admin._id);
    res
      .status(201)
      .json({
        success: true,
        message: "Admin account created",
        token,
        data: userPayload(admin),
      });
  } catch (error) {
    res
      .status(500)
      .json({
        success: false,
        message: "Error setting up admin",
        error: error.message,
      });
  }
};
