const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;
const uri = process.env.DATABASE_URL;

app.use(cors());
app.use(express.json());

const client = new MongoClient(uri);
let tasksCollection;

async function connectToDatabase() {
    try {
        await client.connect();
        const db = client.db('todo-app');
        tasksCollection = db.collection('tasks');
        console.log("Successfully connected to MongoDB via Express.");
    } catch (e) {
        console.error(e);
    }
}

// GET all tasks
app.get('/tasks', async (req, res) => {
    const tasks = await tasksCollection.find({}).toArray();
    res.json(tasks);
});

// POST a new task
app.post('/tasks', async (req, res) => {
    const newTask = req.body;
    const result = await tasksCollection.insertOne(newTask);
    res.status(201).json(result);
});

// DELETE a task
app.delete('/tasks/:id', async (req, res) => {
    const result = await tasksCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    res.json(result);
});

// PUT (update) a task
app.put('/tasks/:id', async (req, res) => {
    const result = await tasksCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { completed: req.body.completed } }
    );
    res.json(result);
});

connectToDatabase().then(() => {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
});