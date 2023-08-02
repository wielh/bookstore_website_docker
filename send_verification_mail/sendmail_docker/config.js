import {createTransport} from "nodemailer"
import * as amqplib from "amqplib"

const rabbitMQ_username = 'root';
const rabbitMQ_password = '1234';
const rabbitMQ_server = 'rabbitmq' //localhost
const rabbitMQ_URL = `amqp://${rabbitMQ_username}:${rabbitMQ_password}@${rabbitMQ_server}:5672/`;
export const rabbitMQ_connection = await amqplib.connect(rabbitMQ_URL);

const website_email = "wielh.erlow@gmail.com"
export const transporter = createTransport(
    {
        host: 'smtp.gmail.com',
        port: 465,
        auth: {
            user: website_email,
            pass: '***',
        },
        tls: {
            rejectUnauthorized: false
        }
    }
);

export async function send_mail(email_address,message){
    try {
        await transporter.sendMail(
            {
                from: website_email,
                to: email_address,
                subject: 'reset password',
                html: message,
            }
        )
    } catch (error) {
        return error;
    }
    return true
}
