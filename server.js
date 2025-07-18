const http = require('http');
const { MongoClient } = require('mongodb');

const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

// Paste your connection string here. Make sure you've replaced <password>
const uri = process.env.DATABASE_URL;
const client = new MongoClient(uri);

let db;

async function connectToDatabase() {
    try {
        await client.connect();
        db = client.db('todo-app'); // You can name your database here
        console.log("Successfully connected to MongoDB.");

        // Check if the tasks collection is empty, if so add default tasks
        const taskCount = await db.collection('tasks').countDocuments();
        if (taskCount === 0) {
            await db.collection('tasks').insertMany([
                { text: "Learn MongoDB", completed: true },
                { text: "Connect server to database", completed: false }
            ]);
        }
    } catch (e) {
        console.error(e);
    }
}

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    const tasksCollection = db.collection('tasks');

    if (req.url === '/tasks' && req.method === 'GET') {
        const tasks = await tasksCollection.find({}).toArray();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(tasks));
    } else if (req.url === '/tasks' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            const newTask = JSON.parse(body);
            await tasksCollection.insertOne(newTask);
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(newTask));
        });
    } else if (req.url === '/save' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', async () => {
            const updatedTasks = JSON.parse(body);
            // Delete all existing tasks and insert the new list
            await tasksCollection.deleteMany({});
            if (updatedTasks.length > 0) {
                await tasksCollection.insertMany(updatedTasks);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Tasks saved successfully' }));
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Error: Not Found' }));
    }
});

// Connect to the database before starting the server
connectToDatabase().then(() => {
    server.listen(port, hostname, () => {
        console.log(`Server running at http://${hostname}:${port}/ and connected to the database.`);
    });
});