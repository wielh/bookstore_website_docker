import {mysql_connection_pool} from '../config.js'
import {sort_map_by_value,get_first_n_results_of_map} from '../utils.js'

async function get_query_result(query_str, query_parameters_array){
    try {
        const [rows, fields, query] = await mysql_connection_pool.execute(query_str,query_parameters_array);
        return rows;
    } catch (error) {
        return error
    }
}

async function get_transaction_query_result(query_str, query_parameters_array,connection){
    const [rows, fields, query] = await connection.execute(query_str,query_parameters_array);
    return rows;
}

//=========================================================================================
export async function get_user_exist(array){
    // input: array=[username] or [username,password]
    let user_rows;
    if(array.length == 1){
        user_rows = await get_query_result(`select count(*) as namesCount from user where user=?`,array);
    } else {
        user_rows =await get_query_result(
            `select count(*) as namesCount from user where user=? and hashed_password=?`,array);
    }
    if(user_rows instanceof Error) return user_rows;
    const user_exist = Number(user_rows[0].namesCount);
    return user_exist>0
}

export async function get_user_exist_by_email(array){
    // input: array=[username] or [username,password]
    let user_rows;
    if(array.length == 1){
        user_rows = await get_query_result(`select count(*) as namesCount from user where user=?`,array);
    } else {
        user_rows = await get_query_result(
            `select count(*) as namesCount from user where user=? and email=?`,array);
    }
    if(user_rows instanceof Error) return user_rows;
    const user_exist = Number(user_rows[0].namesCount);
    return user_exist>0
}

export async function get_user_balance(array){
    // input: array=[user_index]
    const result = await get_query_result(`select balance from user where user_index=?`,array);
    if (result instanceof Error) return result;
    const balance = result[0].balance;
    return balance;
}

export async function get_user_index_an_level(array){
    // input: array=[user_index]
    const user_rows = await get_query_result(`select user_index, identity from user where user=?`,array);
    return user_rows
}

export async function add_user_to_database(array){
    // input: array=[username,hashed_password,email]
    const result = await get_query_result(`insert into user(user,hashed_password,email) values (?,?,?)`,array)
    return result;
}

export async function add_google_user_to_database(array){
    // input: array=[google_ID,username,email]
    const result = await get_query_result(`insert into user(user,google_name,email) values (?,?,?)`,array)
    return result;
}

export async function update_password(array){
    // input: array=[hashed_password,username]
    const result = await get_query_result(
        `update user set hashed_password=? where user=?`,array)
    return result;
}

//=========================================================================================

export async function get_type_id(array){
    // input : array=[type_id:number]
    const rows = await get_query_result(`select type_id from type where type_name=?;`, array)
    if (rows instanceof Error) {
        return rows;
    } else if (rows.length>0){
        return rows[0].type_id
    } else {
        return -1
    }
}

export async function get_booklist(array){
    // input: array=[] or array=[type_id]
    const rows =  await get_query_result(`select * from booklist;`,[]);
    if (rows instanceof Error){
        return rows
    } else if(array.length == 0){
        return rows;
    } else {
        let type_id = array[0]
        let rows_match = [];
        let type_array;
        for(let i=0;i<rows.length;i++){
            type_array = JSON.parse(rows[i]["types"])
            if(type_array.includes(type_id)) rows_match.push(rows[i])
        }
        return rows_match;
    }
}

//=========================================================================================

export async function get_orders_of_user(array) {
    //input array = [user_index]
    const result = await  get_query_result(
        `select order_index,order_detail,price from bookorder
         where user_index=? and DATEDIFF(NOW(), order_datetime) <= 7;`, array)
    return result;
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

export async function calculate_total_price(json){
    // json with format: {bookid_1:number1, bookid_2:number2, ...}
    let total_price = 0 ;
    for(let key in json){
        let result = await get_query_result(
            `select * from booklist where bookname=? LIMIT 1`,[key])
        if(result.length<=0) return false
        let book_number = json[key];
        if(typeof book_number !== "number") return false;
        if(Math.round(book_number)<0) return false;

        json[key] = Math.round(book_number)
        total_price += result[0]["price"] * Math.round(book_number)
    }
    return total_price;
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

async function delete_an_order_of_user(user_index,order_index){
    const connection = await mysql_connection_pool.getConnection();
    try {
        let order_detail_rows =  await get_transaction_query_result(
            `select order_detail from bookorder where order_index=?`,[order_index],connection
        )
        let order_detail = JSON.parse(order_detail_rows[0]["order_detail"])
        for(let key in order_detail) {
            let rows = await get_transaction_query_result(
                `select inventory from booklist where bookname=? for update`, [key], connection);
            let number_requried = order_detail[key]
            let number_in_inventory = rows[0]["inventory"]
            rows = await get_transaction_query_result(
                `update booklist set inventory=? where bookname=?`,
                [number_in_inventory+number_requried , key], connection);
        }

        const user_balance_row =
        await get_transaction_query_result(
            `select balance from user where user_index=? for update`,[user_index],connection);
        const user_balance = user_balance_row[0]["balance"];

        const store_balance_row = await get_transaction_query_result(
            `select balance from bookstore_state where id=1 for update`,[],connection);
        const store_balance = store_balance_row[0]["balance"];

        const total_price_row = await get_transaction_query_result(
            `select price from bookorder where order_index=?`,[order_index],connection);
        const total_price = total_price_row[0]["price"];

        const new_store_balance = (store_balance-total_price).toFixed(2)
        const new_user_balance = (user_balance+total_price).toFixed(2)

        await get_transaction_query_result(`delete from bookorder where order_index=?`,[order_index],connection);
        await get_transaction_query_result(
            `update user set balance=? where user_index=?`,[new_user_balance,user_index],connection
        );
        await get_transaction_query_result(
            `update bookstore_state set balance=? where id=1`,[new_store_balance],connection
        )

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        return error;
    }
    connection.release();
    return true
}

export async function delete_orders_of_user(user_index,order_array){
    //input: array = [order_index, user_index]
    console.log(order_array)
    console.log(typeof order_array)
    if(!Array.isArray(order_array)) return false;
    try {
        for(let i=0;i<order_array.length;i++) {
            let result = await delete_an_order_of_user(user_index,order_array[i]);
            if (result instanceof Error) return result;
        }
    } catch (error) {
        return error
    }
    return true;
}

//=========================================================================================

export async function list_costumer_ordered_by_cost(array) {
    //input :　[top_n,start_date,end_date]
    const query_str =
        'select user_index, SUM(price) as total_price from bookorder where order_datetime between ? and ? '+
        'Group By user_index ORDER BY total_price DESC limit '+ array[0];
    const result = await get_query_result(query_str,[array[1],array[2]])
    if(result instanceof Error) return result;

    let result_json = new Object();
    for (let i=0;i<result.length;i++) {
        let user_id = result[i]["user_index"];
        let cost = result[i]["total_price"];
        result_json[String(i)] = {user_id : user_id, cost : cost}
    }
    return result_json
}

export async function list_book_ordered_by_sales(array){
    //input :　[top_n,start_date,end_date]
    const query_str = 'select order_detail from bookorder where order_datetime between ? and ? '
    let result = await get_query_result(query_str,[array[1],array[2]]);
    if(result instanceof Error) return result;

    let bookname_price_pair = new Map();
    let bookname_sale_pair = new Map();
    for (let i=0;i<result.length;i++) {
        let json = JSON.parse(result[i]["order_detail"])
        for(let bookname in json) {
            let price;

            if(!(bookname_sale_pair.has(bookname))) {
                bookname_sale_pair.set(bookname,0)
                let a = await get_query_result(
                    'select price from booklist where bookname=?',[bookname])
                price = a[0]["price"];
                bookname_price_pair.set(bookname,price);
            } else {
                price = bookname_price_pair.get(bookname);
            }

            let number = json[bookname]
            let current_sales = bookname_sale_pair.get(bookname)+price*number;
            bookname_sale_pair.set(bookname, current_sales)
        }
    }

    bookname_sale_pair = sort_map_by_value(bookname_sale_pair, "number", "decrease")
    bookname_sale_pair = get_first_n_results_of_map(bookname_sale_pair,array[0])

    let result_json = new Object();
    bookname_sale_pair = Array.from(bookname_sale_pair)

    for (let i=0;i<bookname_sale_pair.length;i++) {
        let bookname = bookname_sale_pair[i][0];
        let sales = bookname_sale_pair[i][1];
        result_json[String(i+1)] = {bookname : bookname, sales : sales.toFixed(2)}
    }
    return result_json
}
