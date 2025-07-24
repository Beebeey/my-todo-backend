const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import Models
const User = require('./models/User');
const Task = require('./models/Task');

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
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
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

// Login a user
app.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, userId: user._id });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
  }
});

// --- MIDDLEWARE TO AUTHENTICATE TOKEN ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- PROTECTED TODO ROUTES ---

// GET a user's tasks
app.get('/tasks', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.userId });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});

// POST a new task for a user
app.post('/tasks', authenticateToken, async (req, res) => {
  try {
    const newTask = new Task({
      text: req.body.text,
      completed: req.body.completed,
      user: req.user.userId
    });
    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (error) {
    res.status(500).json({ message: 'Error adding task' });
  }
});

// DELETE a task
app.delete('/tasks/:id', authenticateToken, async (req, res) => {
  try {
    await Task.findOneAndDelete({ _id: req.params.id, user: req.user.userId });
    res.sendStatus(204);
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task' });
  }
});

// PUT (update) a task
app.put('/tasks/:id', authenticateToken, async (req, res) => {
  try {
    await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      { completed: req.body.completed }
    );
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ message: 'Error updating task' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});