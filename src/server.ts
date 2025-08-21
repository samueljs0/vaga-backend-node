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

// Only start listening when not running tests so importing the module for
// Supertest doesn't start a real server.
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

// Start message
console.log(` VERSION      : ${process.env.APP_VERSION}`);
console.log(` PORT         : ${PORT}`);

export default app;