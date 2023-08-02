import * as amqplib from "amqplib"
import * as mysql from 'mysql2/promise'

const rabbitMQ_username = 'root';
const rabbitMQ_password = '1234';
const rabbitMQ_server = 'rabbitmq' //localhost
const rabbitMQ_URL = `amqp://${rabbitMQ_username}:${rabbitMQ_password}@${rabbitMQ_server}:5672/`;
export const rabbitMQ_connection = await amqplib.connect(rabbitMQ_URL);

//==============================================================
export const mysql_connection_pool = mysql.createPool({
    user: "bookstore_user",
    password: "test",
    host: "10.244.189.122" , //"localhost",
    port: 3306,
    database: "bookstore_js",
    waitForConnections : true,
    connectionLimit : 100,
    decimalNumbers: true,
});


async function get_transaction_query_result(query_str, query_parameters_array,connection){
    const [rows, fields, query] = await connection.execute(query_str,query_parameters_array);
    return rows;
}

async function check_books_sold_out(json, connection){
    // json with format: {bookid_1:number1, bookid_2:number2, ...}
    // output : {bookid_1:[number_requried1,number_inventory1],...} where number_requried1>number_inventory1
    let not_enough = {}
    for(let key in json) {
        let rows = await get_transaction_query_result(
            `select inventory from booklist where bookname=? for update`, [key], connection);
        let number_requried = json[key]
        let number_in_inventory = rows[0]["inventory"]
        if( number_requried > number_in_inventory) {
            not_enough[key] = [number_requried,json[key]]
        }
    }
}

export async function post_orders_of_user(array) {
    //input array = [user_index,order_detail]
    const user_index = array[0];     // int
    const order_detail = array[1];   // json with {bookid_1:number1, bookid_2:number2, ...}
    const total_price = array[2];    // number

    // transaction
    const connection = await mysql_connection_pool.getConnection();
    try {
        await connection.beginTransaction();
        const user_balance_row =
            await get_transaction_query_result(
                `select balance from user where user_index=? for update`,[user_index],connection);
        const user_balance = user_balance_row[0]["balance"];
        if (user_balance < total_price) {
            return `The balance of user is not enough, user_balance:${user_balance},
                    total_price of this transaction:${total_price}`;
        }

        const books_sold_out = await check_books_sold_out(order_detail, connection);
        if (books_sold_out) {
            return `Some books in out inventory is not enough, you can check number of books in our website.`;
        }

        const store_balance_row = await get_transaction_query_result(
            `select balance from bookstore_state where id=1 for update`,[],connection);
        const store_balance = store_balance_row[0]["balance"];
        await get_transaction_query_result(
            `insert into bookorder(user_index,order_detail,price) values (?,?,?)`,
            [user_index, JSON.stringify(order_detail),total_price],connection
        );
        const new_store_balance = (store_balance+total_price).toFixed(2)
        const new_user_balance = (user_balance-total_price).toFixed(2)

        for(let key in order_detail) {
            let rows = await get_transaction_query_result(
                `select inventory from booklist where bookname=? for update`, [key], connection);
            let number_requried = order_detail[key]
            let number_in_inventory = rows[0]["inventory"]
            rows = await get_transaction_query_result(
                `update booklist set inventory=? where bookname=?`,
                [number_in_inventory-number_requried , key], connection);
        }

        await get_transaction_query_result(
            `update bookstore_state set balance=? where id=1`,[new_store_balance],connection
        )
        await get_transaction_query_result(
            `update user set balance=? where user_index=?`,[new_user_balance,user_index],connection
        )
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        console.log(error.stack.toString())
        return error;
    }
    connection.release();
    return "ok";
}
