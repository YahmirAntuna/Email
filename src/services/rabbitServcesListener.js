import amqp from 'amqplib';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import transporter from '../config/emailConfig.js';
import chalk from 'chalk';

dotenv.config();

const RABBITMQ_URL = process.env.RABBIT_HOST;
const EMAIL_USER = process.env.EMAIL_USER;

export async function userEvents() {
    try {
        console.log(chalk.blue(' Conectando a RabbitMQ...'));

        const connection = await amqp.connect("amqps://sfnbytcx:mReKqVp2EW9xO1iebiuIpNayQzc-ZTfj@albatross.rmq.cloudamqp.com/sfnbytcx");

        const channel = await connection.createChannel();
        const exchange = 'user_event';
        const queue = 'user_created_queue';
        const routingKey = 'user.created';

        await channel.assertExchange(exchange, 'topic', { durable: true });
        await channel.assertQueue(queue, { durable: true });
        await channel.bindQueue(queue, exchange, routingKey);

        console.log(chalk.green(' Conexión exitosa a RabbitMQ'));
        console.log(chalk.cyan(` Esperando mensajes en la cola: ${queue}`));

        channel.consume(queue, async (msg) => {
            if (!msg) {
                console.log(chalk.yellow('⚠️ Mensaje vacío recibido'));
                return;
            }

            try {
                const user = JSON.parse(msg.content.toString());
                
                // Usar username como email
                const userEmail = user.username;
                const userName = userEmail.split('@')[0]; // Extraer parte antes del @ para el nombre

                // Logs de creación de usuario
                console.log(chalk.green(' Nuevo usuario creado:'));
                console.log(chalk.cyan(' Detalles del usuario:'));
                console.log(chalk.cyan(`   - Username: ${userName}`));
                console.log(chalk.cyan(`   - Email: ${userEmail}`));
                console.log(chalk.cyan(`   - Teléfono: ${user.phone}`));
                console.log(chalk.cyan(`   - Fecha de creación: ${new Date().toLocaleString()}`));
                console.log(chalk.green(' Usuario registrado exitosamente en el sistema'));

                // Validar campo requerido
                if (!userEmail) {
                    throw new Error('Falta el username/email del usuario');
                }

                // Leer y personalizar la plantilla HTML
                const htmlPath = path.resolve('src/views/bienvenida.html');
                let htmlContent = await fs.readFile(htmlPath, 'utf8');
                htmlContent = htmlContent.replace('{username}', userName);

                // Configurar y enviar el correo
                const mailOptions = {
                    from: EMAIL_USER,
                    to: userEmail,
                    subject: '¡Bienvenido!',
                    html: htmlContent,
                };

                await transporter.sendMail(mailOptions);
                console.log(chalk.green(` Correo de bienvenida enviado a ${userEmail}`));

                channel.ack(msg);
            } catch (error) {
                console.log(chalk.red(' Error en el proceso:'));
                console.log(chalk.red(`   - Tipo de error: ${error.name}`));
                console.log(chalk.red(`   - Mensaje: ${error.message}`));
                console.log(chalk.red(`   - Fecha: ${new Date().toLocaleString()}`));
                
                channel.nack(msg, false, false);
            }
        }, { noAck: false });

        connection.on('close', () => {
            console.log(chalk.yellow('⚠️ Conexión cerrada. Reintentando en 5s...'));
            setTimeout(userEvents, 5000);
        });

    } catch (error) {
        console.log(chalk.red(' Error al conectar con RabbitMQ:'));
        console.log(chalk.red(`   - Error: ${error.message}`));
        console.log(chalk.yellow(' Reintentando conexión en 5s...'));
        setTimeout(userEvents, 5000);
    }
}
