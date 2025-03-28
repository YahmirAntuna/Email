import bodyParser from 'body-parser';
import express from 'express';
import emailRoutes from './routes/emailRoute.js';
import { userEvents } from './services/rabbitServcesListener.js';

const app = express();

app.use(bodyParser.json());
app.use('/api/email', emailRoutes);

userEvents().catch((err) => {
    console.error('Error iniciando el consumidor de Eventos:', err);
});

export default app;