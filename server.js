const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const username = 'marcarkin1409'; // MongoDB username
const password = 'GGIorYA4F7pWhtVX'; // MongoDB password

const mongoURI = `mongodb+srv://${username}:${password}@cluster0.50prk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch((err) => console.error('MongoDB connection error:', err));

// Log schema
const logSchema = new mongoose.Schema({
  ip: { type: String, required: true },
  city: { type: String, required: true },
  region: { type: String, required: true },
  country: { type: String, required: true },
  isp: { type: String, required: true },
  timezone: { type: String, required: true },
  userAgent: { type: String, required: true },
  screenResolution: { type: String, required: true },
  os: { type: String, required: true },
  browser: { type: String, required: true },
  language: { type: String, required: true },
  timestamp: { type: String, default: new Date().toISOString() },
});

const Log = mongoose.model('Log', logSchema);

// WebSocket for real-time updates
wss.on('connection', (ws) => {
  console.log('New client connected');
  ws.on('close', () => console.log('Client disconnected'));
});

// Endpoint to receive logs
app.post('/log', async (req, res) => {
  try {
    const logData = req.body;

    // Validate incoming data
    if (!logData.ip || !logData.city || !logData.country) {
      return res.status(400).send('Invalid log data');
    }

    // Save log to MongoDB
    const log = new Log(logData);
    await log.save();

    // Broadcast new log to all WebSocket clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(logData));
      }
    });

    res.status(200).send('Log received and saved successfully');
  } catch (error) {
    console.error('Error saving log:', error);
    res.status(500).send('Internal server error');
  }
});

// Endpoint to view logs
app.get('/logs', async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 });
    res.status(200).json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).send('Internal server error');
  }
});

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});