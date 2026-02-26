const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const campaignRoutes = require('./routes/campaignRoutes');
const customFieldRoutes = require('./routes/customFieldRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

const { MONGODB_URI } = process.env;
if (MONGODB_URI) {
  mongoose
    .connect(MONGODB_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB error:", err));
}

// Routes
app.get('/', (req, res) => res.send('Campaign API is running!'));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/custom-fields', customFieldRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));