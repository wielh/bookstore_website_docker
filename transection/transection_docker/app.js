
import {rabbitMQ_connection,post_orders_of_user} from "./config.js"

const queueName = "transection"
const channel = await rabbitMQ_connection.createChannel()
await channel.assertQueue(queueName, { durable: true });

function transection() {
    try {
        const options = { noAck: true };
       // console.log("=======check again...=========")
        channel.consume(queueName,
            async (message) => {
                if (message !== null) {
                    const transection_message = JSON.parse(message.content.toString())
                    console.log(transection_message)
                    await post_orders_of_user(
                        [
                            transection_message["user_index"],
                            transection_message["order_detail"],
                            transection_message["total_price"]
                        ]
                    )
                }
            },options);
    } catch (error) {
        console.error(error);
    }
}

setInterval(transection,1*1000)
