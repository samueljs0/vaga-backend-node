import express, { Express } from 'express';
import routerApp from './routes/index';
import dotenv from 'dotenv';

// Environment
dotenv.config();

// App
const app: Express = express();

// App config
app.use(express.json({ limit: '50mb' }));

// Prefixed routes
app.use(`/${process.env.APP_VERSION}`, routerApp);

// PORT
const PORT = process.env.PORT || 3333;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Start message
console.log(` VERSION      : ${process.env.APP_VERSION}`);
console.log(` PORT         : ${PORT}`);