import {rabbitMQ_connection, send_mail} from "./config.js"

const queueName = "get_verification_code"
const channel = await rabbitMQ_connection.createChannel()
await channel.assertQueue(queueName, { durable: true });

function send_verification_email() {
    try {
        const options = { noAck: true };
        console.log("=======check again...=========")
        channel.consume(queueName,
            async (message) => {
                if (message !== null) {
                    const email_message = JSON.parse(message.content.toString())
                    await send_mail(email_message["email_address"],email_message["message"])
                }
            },options);
    } catch (error) {
        console.error(error);
    }
}

setInterval(send_verification_email,10*1000)
