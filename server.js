const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import the User model
const User = require('./models/User');

const app = express();
const port = process.env.PORT || 3000;
const uri = process.env.DATABASE_URL;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB using Mongoose
mongoose.connect(uri)
  .then(() => console.log("Successfully connected to MongoDB via Mongoose."))
  .catch(err => console.error("Connection error", err));

// --- AUTHENTICATION ROUTES ---

// Register a new user
app.post('/register', async (req, res) => {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Create a new user with the hashed password
    const newUser = new User({
      email: req.body.email,
      password: hashedPassword
    });

    const savedUser = await newUser.save();
    res.status(201).json(savedUser);

  } catch (error) {
    res.status(500).json({ message: 'Error registering new user', error });
  }
});


// --- TODO ROUTES (We will secure these later) ---

app.get('/tasks', (req, res) => {
  // Placeholder - to be implemented
  res.json([]);
});


// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});