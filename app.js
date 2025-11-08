import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import bodyParser from 'body-parser'
import router from './v1/index.js'
import connectDB from './v1/config/db.js';

const app = express()
dotenv.config();

connectDB()
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Database connection failed:', err));

app.use(cors({origin: "*"}))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  req._startTime = Date.now();
  console.log(`--> ${req.method} ${req.originalUrl}`);
  res.on('finish', () => {
    const ms = Date.now() - req._startTime;
    console.log(`<-- ${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`);
  });
  next();
});

app.get('/', (req, res) => {res.send('API is running!');});
app.get('/health', (req, res) => {res.status(200).json({ status: 'ok', uptime: process.uptime() });});
app.use('/v1', router);


app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});


app.use((err, req, res, next) => {
  console.error(err.stack); 
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3050;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
