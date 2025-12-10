const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const campaignRoutes = require('./routes/campaignRoutes');
const customFieldRoutes = require('./routes/customFieldRoutes');

const app = express();
app.use(cors());
app.use(express.json());

const { MONGODB_URI } = process.env;
if (MONGODB_URI) {
  mongoose
    .connect(MONGODB_URI)
    .then(() => console.log("Mongo connected"))
    .catch((err) => console.error(err));
}


// Routes
app.get('/', (req, res) => res.send('Campaign is running!'));
app.use('/api/campaigns', campaignRoutes);
app.use('/api/custom-fields', customFieldRoutes);



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));