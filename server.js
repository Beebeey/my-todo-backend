const http = require('http');
const hostname = '127.0.0.1';
const port = 3000;

let tasks = [
  { text: "Learn Node.js", completed: true },
  { text: "Build a server", completed: true },
  { text: "Connect front end to back end", completed: false }
];

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET: Send the current list of tasks
  if (req.url === '/tasks' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(tasks));
  }
  // POST: Add a single new task
  else if (req.url === '/tasks' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      const newTask = JSON.parse(body);
      tasks.push(newTask);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newTask));
    });
  }
  // POST: Receive and save the entire list
  else if (req.url === '/save' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      tasks = JSON.parse(body); // Replace the entire tasks array
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Tasks saved successfully' }));
    });
  }
  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Error: Not Found' }));
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});