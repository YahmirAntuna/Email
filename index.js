import app from './src/app.js';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT_EXPRES;

app.listen(PORT, () => {
    console.log(`Servicio corriendo en el puerto ${PORT}.`);
});
