// emailController.js
import transporter from "../config/emailConfig.js";
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();
export const sendEmail = async (req, res) => {
    const {to, subject, text, username} = req.body;
    try {
        const htmlPath = path.resolve('src/views/bienvenida.html');
        let htmlContent = fs.readFileSync(htmlPath, 'utf8');
        
        // Reemplazar el username en el HTML
        htmlContent = htmlContent.replace('{username}', username || 'Usuario');

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            html: htmlContent
        });
        return res.json({ 
            message: 'Correo enviado con éxito',
            details: {
                to,
                username,
                subject
            }
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
