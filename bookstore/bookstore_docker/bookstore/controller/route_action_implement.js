import {join} from 'node:path';
import { password_hash, create_token, decode_token, message, return_failed_json, return_sucessful_json,
    check_variable_format,check_array_format, get_username,
    googleID_to_username} from '../utils.js'
import {html_root,client_script_root,logger,token_expire_second,verification_code_expire_second,
    basic_url,google_login_ID,google_login_password, rabbitMQ_connection} from '../config.js'
import * as model from "../model/database_search.js"
import { google } from "googleapis";

//==================================================================================
export function skip_favicon_ico(req,res,next){
    res.locals.through_public_route=true;
    if (req.originalUrl.includes('favicon.ico')) {
        res.status(204).end();
    }
    next();
}

export function get_button_action(req, res) {
    res.locals.through_public_route=true;
    res.sendFile(join(client_script_root,"button_actions.js"))
    return;
}

//==================================================================================
export function get_register_page(req, res){
    res.locals.through_public_route=true;
    res.sendFile(join(html_root,"register.html"));
    return;
}

export async function put_register(req, res) {
    res.locals.through_public_route=true;
    const method = "PUT";
    const url = "/register";

    if(!check_variable_format(req.body,"username","string")) {
        logger.warn(message(req.ip,method,url,"the input of key 'username' is not a string"));
        return_failed_json(req, res, 400,"the input of key 'username' is not a string");
        return;
    }
    const username = req.body["username"];
    logger.info(message(req.ip,method,url,`Try to assign a new user with username=${username}`))

    if(!check_variable_format(req.body,"password","string")) {
        logger.warn(message(req.ip,method,url,"the input of key 'password' is not a string"));
        return_failed_json(req, res, 400,"the input of key 'password' is not a string");
        return;
    }
    const hashed_password = password_hash(req.body["password"]);

    if(!check_variable_format(req.body,"email","string")) {
        logger.warn(message(req.ip,method,url,"the input of key 'email' is not a string"));
        return_failed_json(req, res, 400,"the input of key 'email' is not a string");
        return;
    }
    const email = req.body["email"];

    const user_exist = await model.get_user_exist([username]);
    if(user_exist instanceof Error) {
        logger.warn(message(req.ip, method,url,
                "Somer error happens on register page when we check user exist, reason:\n"+user_exist.stack.toString()));
        return_failed_json(req, res, 500,"Somer error happens on register page");
        return;
    } else if (user_exist) {
        logger.warn(message(req.ip, method,url, `The username: ${username} is already a member`));
        return_failed_json(req, res, 200, `The username: ${username} is already a member`);
        return;
    }

    const result = model.add_user_to_database([username,hashed_password,email]);
    if(result instanceof Error) {
        logger.warn(message(req.ip,method,url,
                "Somer error happens on register page when we add user, reason:\n"+result.stack));
        return_failed_json(req, res, 500,"Somer error happens on register page");
        return;
    } else {
        logger.info(message(req.ip,method,url,`A new member ${username} !`));
        return_sucessful_json(req, res, "")
        return;
    }
}

// reference: http://sj82516-blog.logdown.com/posts/776734/oauth2-gihub-google-facebook-log-in-actual-combat
// user_data format example:
/* {
  id: ...
  email: ...
  verified_email: ...
  name: ...,
}*/

export async function get_google_login(req, res){
    // get access token
    res.locals.through_public_route=true;
    const method = "POST";
    const url = "/login_google";

    const Oauth2Client = new google.auth.OAuth2(google_login_ID,google_login_password,basic_url+"/google_callback")
    let { tokens } = await Oauth2Client.getToken(req.query.code);
    // get user info
    let get_user_info_auth = new google.auth.OAuth2();
    get_user_info_auth.setCredentials({access_token: tokens.access_token});
    let user_data  = await google.oauth2({ auth: get_user_info_auth, version: 'v2'}).userinfo.get();    // get user info
    let user_data_json = user_data.data

    if(!check_variable_format(user_data_json,"id","string")) {
        logger.warn(message(req.ip,method,url,"the input ofrom google token of key 'id' is not a string"));
        return_failed_json(req, res, 400,"the input of key 'username' is not a string");
        return;
    }
    let google_ID = user_data_json.id

    if(!check_variable_format(user_data_json,"email","string")) {
        logger.warn(message(req.ip,method,url,"the input from google token of key 'email' is not a string"));
        return_failed_json(req, res, 400,"the input of key 'username' is not a string");
        return;
    }
    let email = user_data_json.email

    if(!check_variable_format(user_data_json,"name","string")) {
        logger.warn(message(req.ip,method,url,"the input from google token of key 'name' is not a string"));
        return_failed_json(req, res, 400,"the input of key 'username' is not a string");
        return;
    }
    let username =  user_data_json.name

    const user_exist = await model.get_user_exist([googleID_to_username(google_ID)]);
    if(user_exist instanceof Error) {
        logger.warn(message(req.ip,method,url,
            "Somer error happens on register page when we check google_user exist, reason:\n"+user_exist.stack.toString()));
        return_failed_json(req, res, 500, "Somer error happens on google login page");
        return;
    } else if (!user_exist) {
        model.add_google_user_to_database([googleID_to_username(google_ID),username,email])
    }

    res.cookie("token",create_token({google_ID:google_ID , username:username}, token_expire_second))
    res.redirect("/")
    return;
}

export function get_login_page(req, res) {
    res.locals.through_public_route=true;
    res.sendFile(join(html_root,"login.html"));
    return;
}

export async function post_login(req, res){
    res.locals.through_public_route=true;
    const method = "POST";
    const url = "/login";

    if(!check_variable_format(req.body,"username","string")) {
        logger.warn(message(req.ip,method,url,"the input of key 'username' is not a string"));
        return_failed_json(req, res, 400,"the input of key 'username' is not a string");
        return;
    }
    const username = req.body["username"];
    logger.info(message(req.ip,method,url,`Try to login as user ${username}`))

    if(!check_variable_format(req.body,"password","string")) {
        logger.warn(message(req.ip,method,url,"the input of key 'password' is not a string"));
        return_failed_json(req, res, 400,"the input of key 'password' is not a string");
        return;
    }
    const hashed_password = password_hash(req.body["password"]);

    const user_exist = await model.get_user_exist([username,hashed_password]);
    if(user_exist instanceof Error) {
        logger.warn(message(req.ip,method,url,
            "Somer error happens on register page when we check user exist, reason:\n"+user_exist.stack.toString()));
        return_failed_json(req, res, 500, "Somer error happens on login page");
        return;
    } else if (!user_exist) {
        return_failed_json(req, res, 200, `The username or password is incorrect`);
        return;
    } else {
        res.cookie("token",create_token({username:username},token_expire_second))
        return_sucessful_json(req, res, "");
        return
    }
}

export async function get_index(req, res){
    res.locals.through_public_route=true;
    const method = "GET";
    const url = "/index";

    logger.info(message(req.ip,method,url,"get html from route /index"))
    const token = req.cookies["token"];
    const json = decode_token(token);

    if ( json === null || ! "username" in json) {
        logger.info(message(req.ip,method,url,`identity= unknown`))
        res.render("index", {is_user: false});
        return;
    } else if (!check_variable_format(json,"username","string")) {
        logger.warn(message(req.ip,method,url, `The format of username is not a string `))
        res.render("index", {is_user: false});
        return;
    }

    let username = json["username"];
    logger.info(message(req.ip,method,url,`identity= ${username}`))
    res.render("index", {is_user: true, username:username});
    return;

    /*
    const user_exist = await model.get_user_exist([username]);
    if(user_exist instanceof Error) {
        logger.warn(message(req.ip,method,url,`Some error happenes when we
             try to check user exist, reason:\n`+user_exist.stack.toString()))
        res.render("index", {is_user: false});
        return;
    } else if (!user_exist){
        logger.info(message(req.ip,method,url,`cannot find user=${username} in database`))
        res.render("index", {is_user: false});
        return;
    } else {
        username = get_username(username)
        logger.info(message(req.ip,method,url,`identity= ${username}`))
        res.render("index", {is_user: true, username:username});
        return;
    }*/
}

export function get_verification_code(req, res){
    res.locals.through_public_route=true;
    res.sendFile(join(html_root,"send_email.html"));
}

async function send_mail_Producer(email_address, message){
    try {
        const channel = await rabbitMQ_connection.createChannel();
        const channel_name = "get_verification_code"
        await channel.assertQueue(channel_name, { durable: true });
        const rabbitMQ_message = JSON.stringify({email_address:email_address, message:message})
        channel.sendToQueue(channel_name, Buffer.from(rabbitMQ_message))
        await channel.close();
    } catch (error) {
        return error;
    }
    return true
}

export async function post_verification_code(req, res){
    res.locals.through_public_route=true;
    const method = "POST";
    const url = "/send_email";

    if(!check_variable_format(req.body,"username","string")) {
        logger.warn(message(req.ip,method,url,"the input of key 'username' is not a string"));
        return_failed_json(req, res, 400,"the input of key 'username' is not a string");
        return;
    }
    const username = req.body["username"];

    if(!check_variable_format(req.body,"email","string")) {
        logger.warn(message(req.ip,method,url,"the input of key 'email' is not a string"));
        return_failed_json(req, res, 400,"the input of key 'email' is not a string");
        return;
    }
    const email = req.body["email"];

    const user_exist = await model.get_user_exist_by_email([username,email]);
    if(user_exist instanceof Error) {
        logger.warn(message(req.ip,method,url,
            "Somer error happens on register page when we check user exist, reason:\n"+user_exist.stack.toString()));
        return_failed_json(req, res, 500, "Somer error happens on reset_password page");
        return;
    } else if (!user_exist) {
        return_failed_json(req, res, 200, `The username or email is incorrect`);
        return;
    }

    const verification_code = create_token({username:username},verification_code_expire_second)
    const email_info =
        ` Hello, user ${username}, this is QueenStore bookstore.` +
        ` Please enter the website: ${basic_url}/reset_password/${verification_code} `+
        ` to reset your password in our website.`+
        ` If you are not a member. Please ignore this.`;


    //let result = await send_mail(email,email_info);
    let result = await send_mail_Producer(email,email_info)
    if(result instanceof Error) {
        logger.warn(message(req.ip,method,url,
        "Somer error happens on register page when we check user exist, reason:\n"+result.stack.toString()));
        return_failed_json(req, res, 500, "Somer error happens on login page");
        return;
    } else {
        logger.info(message(req.ip,method,url,`send email to user ${username} successful`));
        return_sucessful_json(req, res,
            "Send an URL to your email, please click to reset your password.\n"+
            "The link in email will be expired in 5 minute.");
        return
    }
}

export function reset_password_page(req, res){
    res.locals.through_public_route=true;
    res.sendFile(join(html_root,"reset_password.html"));
}

export async function reset_password(req, res){
    res.locals.through_public_route=true;
    const method = "POST";
    const url = "/reset_password";
    const public_reason = "username/email is incorrect or token is expired, please try again";

    if(!check_variable_format(req.body,"username","string")) {
        logger.warn(message(req.ip,method,url,"the input of key 'username' is not a string"));
        return_failed_json(req, res, 400, "the input of key 'username' is not a string");
        return;
    }
    const username = req.body["username"];

    if(!check_variable_format(req.body,"password","string")) {
        logger.warn(message(req.ip,method,url,"the input of key 'password' is not a string"));
        return_failed_json(req, res, 400,"the input of key 'password' is not a string");
        return;
    }
    const hashed_password = password_hash(req.body["password"]);

    if(!check_variable_format(req.body,"verification_token","string")) {
        logger.warn(message(req.ip,method,url,"the input of key 'verification_token' is not a string"));
        return_failed_json(req, res, 400,"the input of key 'verification_token' is not a string");
        return;
    }
    const verification_token_str = req.body["verification_token"];
    const verification_token = decode_token(verification_token_str);

    if (verification_token === null) {
        logger.warn(message(req.ip,method,url,`The token ${verification_token_str} is invalid`))
        return_failed_json(req,res,400,public_reason)
        return;
    } else if (!"username" in verification_token) {
        logger.warn(message(req.ip,method,url,
            `cannot find user in token ${verification_token_str}`))
        return_failed_json(req,res,400,public_reason)
        return;
    } else if (!check_variable_format(verification_token,"username","string")) {
        logger.warn(message(req.ip,method,url, `The format of username in token is not a string`))
        return_failed_json(req,res,400,public_reason)
        return;
    }

    const username2 = verification_token["username"];
    if(username!== username2){
        logger.warn(message(req.ip,method,url, `username in token not equal to username in body`))
        return_failed_json(req,res,400,public_reason)
        return;
    }

    const user_exist = await model.get_user_exist([username]);
    if(user_exist instanceof Error) {
        logger.warn(message(req.ip, method,url,
                "Somer error happens on register page when we reset password, reason:\n"+user_exist.stack.toString()));
        return_failed_json(req, res, 500,"Somer error happens on register page when we reset password for you");
        return;
    } else if (!user_exist) {
        logger.warn(message(req.ip, method,url, `The username: ${username} is already a member`));
        return_failed_json(req, res, 200, public_reason);
        return;
    }

    const update_result = await model.update_password([hashed_password,username])
    if(update_result instanceof Error) {
        logger.warn(message(req.ip, method,url,
                "Somer error happens on register page when we reset password, reason:\n"+update_result.stack.toString()));
        return_failed_json(req, res, 500, "Somer error happens on register page when we reset password for you");
        return;
    } else {
        logger.info(message(req.ip, method,url, `Reset password for user ${username} successful`));
        return_sucessful_json(req, res, `Reset password successful`);
        return;
    }
}

export function get_about_us(req,res){
    res.locals.through_public_route=true;
    logger.info(message(req.ip,"GET","/about_us","get html from route /about_us"))
    res.sendFile(join(html_root,"about_us.html"));
}
//==================================================================================

export async function verify_token(req, res, next) {
    if(res.locals.through_public_route!==undefined && res.locals.through_public_route){
        next(); return;
    }
    const method = "ALL";
    const url= "/verify_token";
    const token = req.cookies["token"];
    const json = decode_token(token);

    logger.debug(message(req.ip,method,url,`token:${token}`))
    logger.debug(message(req.ip,method,url,`json:${json}`))

    if (json === null) {
        logger.info(message(req.ip,"ALL",method,url,"user does not log in"))
        res.status(401).send('Please login first');
        return;
    } else if (!"username" in json) {
        logger.info(message(req.ip,"ALL",method,url,'cannot find user in token'))
        res.status(401).send('Unable to find user in your token');
        return;
    } else if (!check_variable_format(json,"username","string")) {
        logger.warn(message(req.ip,method,url,`The format of username is not a string `))
        res.render("index", {is_user: false});
        return;
    }

    let username_in_DB
    if ( "google_ID" in json ){
        username_in_DB = "google_user:" + json["google_ID"];
    } else  {
        username_in_DB = json["username"];
    }

    const user_info = await model.get_user_index_an_level([username_in_DB]);
    if(user_info instanceof Error){
        logger.warn(
            message(
                req.ip, method,url, `Some error happens when we verify the token from user,
                reason:\n`+user_info.stack.toString()
            )
        );
        res.status(500).send("Oops, some error happens when we verify the identity of user")
        return;
    } else if (user_info.length<=0){
        logger.info(
            message(req.ip,method,url, `Cannot find user ${username_in_DB} in database`)
        );
        res.status(401).send('Oops, cannot find user ${username_in_DB} on your token')
        return;
    } else {
        req.user_index = user_info[0].user_index
        req.user_level = user_info[0].identity;
        logger.info(
            message(req.ip,method,url, `Verify token with user ${username_in_DB} successfully`)
        );
        logger.debug(
            message(req.ip,method,url, `user=${username_in_DB},
                id=${user_info[0].user_index}, level=${user_info[0].identity}`)
        );
        next();
    }
}

export async function get_booklist_page(req, res){
    logger.info(message(req.ip,"GET","/booklist", `Try to get html from route /booklist`))
    const booklist = await model.get_booklist([]);
    const token = req.cookies["token"];
    const json = decode_token(token);
    let username = json["username"];

    if(booklist instanceof Error){
        logger.warn(message(req.ip,"GET","/booklist","Some error happens on page booklist,reason:\n"+booklist.stack.toString()));
        res.status(500).send("Oops, some error happens on page booklist.Please try again later");
        return;
    } else {
        res.render("booklist", {username: username , sample_data: booklist});
        return;
    }
}

export async function get_booklist_by_type_page(req,res){
    const type = req.params["type"];
    const method = "GET";
    const url= `/booklist/${type}`;

    logger.info(message(req.ip,method,url, `Try to get html from route ${url}`))
    if (!check_variable_format(req.params,"type","string")) {
        logger.warn(message(req.ip,method,url, `The format of value of key 'type' is not a string `))
        return;
    }
    let type_id = await model.get_type_id([type]);

    if(type_id instanceof Error){
        logger.info(message(req.ip,method,url,"Some error happens on page booklist,reason:\n"+type_id.stack.toString()));
        res.status(500).send("Oops, some error happens on page booklist. Please try again later");
        return;
    } else if (type_id < 0){
        logger.info(message(req.ip,method,url,`There's no typeid of type ${type}`));
        res.status(400).send(`Sorry, there's no books with type:${type} in QueenStone`);
        return;
    } else {
        const booklist = await model.get_booklist([type_id]);
        res.render("booklist_type",
            {username:  req.username , sample_data: booklist, type:type});
        return;
    }
}

export async function get_order_page(req,res){
    logger.info(message(req.ip,"GET",'/order', `Try to get html from route /view_all_order`))
    const username = req.username ;
    const user_index = req.user_index;

    const balance = await model.get_user_balance([user_index])
    const orders_of_user = await model.get_orders_of_user([user_index]);

    if(orders_of_user instanceof Error){
        logger.warn(message(req.ip,"GET",
            "Some error happens on page booklist,reason:\n"+orders_of_user.stack.toString()));
        res.status(500).send("Oops, some error happens on page order.Please try again later");
        return;
    } else {
        logger.info(
            message(req.ip,"GET",'/view_all_order',
            `get all previous orders of user ${username} successfully.`)
        )
        res.render("orders", {username: username, orders: orders_of_user, balance:balance});
        return;
    }
}

async function transection_Producer(user_index, order_detail, total_price){
    try {
        const channel = await rabbitMQ_connection.createChannel();
        const channel_name = "transection"
        await channel.assertQueue(channel_name, { durable: true });
        const rabbitMQ_message = JSON.stringify(
            {user_index:user_index, order_detail:order_detail, total_price:total_price})
        channel.sendToQueue(channel_name, Buffer.from(rabbitMQ_message))
        await channel.close();
    } catch (error) {
        return error;
    }
    return true
}

export async function post_order(req,res){
    const user_index = req.user_index;
    const username = req.username;
    const method = "POST"
    const url = "/order"

    if(check_variable_format(req,"order_detail","json")){
        logger.warn(message(req.ip, method,url,"The value of key 'order_detail' is not a json"));
        return_failed_json(req,res,400,`The balance:${user_balance} of user ${username} is insufficient`)
        return;
    }

    const order_detail = JSON.parse(req.body["order_detail"]);
    const total_price = await model.calculate_total_price(order_detail)
    if(typeof total_price === "boolean"){
        logger.warn(message(req.ip, method,url,"The format of key 'order_detail' is incorrect"));
        return_failed_json(req,res,400,`The format of key 'order_detail' is incorrect`)
        return;
    }

    logger.info(message(req.ip, method,url, `user ${username} try to upload a new order`))
    logger.debug(message(req.ip, method,url, `detail: ${order_detail}`))
    let result = await transection_Producer(user_index,order_detail,total_price)
    if(result instanceof Error) {
        logger.warn(message(req.ip,method,url,
        "Somer error happens on register page when A transection is build, reason:\n"+result.stack.toString()));
        return_failed_json(req, res, 500, "Somer error happens on login page");
        return;
    } else {
        logger.info(message(req.ip,method,url,`send email to user ${username} successful`));
        return_sucessful_json(req, res, {total_price:total_price});
        return
    }
}

export async function delete_order(req,res){
    const method = "DELETE"
    const url = "order"
    const user_index = req.user_index;

    logger.info(message(req.ip,method,url, `Try to delete some previous order`));
    if(!check_array_format(req.body,"cancel_order_index","number")) {
        logger.warn(
            message(req.ip,method,url,
            `The value of key 'cancel_order_index' is not an array with numbers`)
        );
        return_failed_json(req,res,400,"The input of key 'cancel_order_index' is not an array.");
        return;
    }
    const cancel_order_index = req.body["cancel_order_index"];

    const result = await model.delete_orders_of_user(user_index,cancel_order_index);
    if(result instanceof Error){
        logger.warn(message(req.ip,method,url,"Some error happens on page booklist,reason:\n"+result.stack.toString()));
        return_failed_json(req,res,500,"Some error happens when we delete some privious order.\n")
        return;
    } else if(!result){
        logger.info(message(req.ip,method,url, `Delete previous order failed`));
        return_failed_json(req,res,400,"Delete previous order failed.")
        return;
    } else {
        logger.info(message(req.ip,method,url, `Delete previous order successful`));
        return_sucessful_json(req, res, "");
        return;
    }
}

//==================================================================================

export async function list_costumer_ordered_by_cost(req,res){
    let reason;
    const method = "POST";
    const url = '/list_costumer';

    if(!check_variable_format(req.body,"top_n","number")) {
        reason = `The value of key 'top_n' is not a number`;
        logger.warn(message(req.ip, method, url, reason));
        return_failed_json(req,res,400,reason);
        return;
    }
    const top_n =  Math.round(req.body["top_n"]);
    if(top_n<1) {
        reason = '/list_costumer',`The value of key 'top_n' is smaller than 1`;
        logger.warn(message(req.ip, method, url ,reason));
        return_failed_json(req,res,400,reason);
        return;
    }

    if(!check_variable_format(req.body,"start_date","string")) {
        reason = `The value of key 'start_date' is not a string`
        logger.warn(message(req.ip,method, url,reason));
        return_failed_json(req,res,400,reason);
        return;
    }
    const start_date = new Date(req.body["start_date"]);
    if(start_date.toString()==="Invalid Date") {
        reason = "The value of key 'start_date' has to be like YYYY-MM-DD HH:MM:SS";
        logger.warn(message(req.ip,method, url,reason));
        return_failed_json(req,res,400,reason);
        return
    }

    if(!check_variable_format(req.body,"end_date","string")) {
        reason = `The value of key 'end_date' is not a string`
        logger.warn(message(req.ip,method, url,reason));
        return_failed_json(req,res,400,reason);
        return;
    }
    const end_date = new Date(req.body["end_date"]);
    if(end_date.toString()==="Invalid Date") {
        reason = "The value of key 'end_date' has to be like YYYY-MM-DD HH:MM:SS";
        logger.warn(message(req.ip,method, url,reason));
        return_failed_json(req,res,400,reason);
        return
    }

    let result = await model.list_costumer_ordered_by_cost([top_n,start_date,end_date])
    if(result instanceof Error){
        logger.warn(message(req.ip,method, url,"Some error happens on page booklist,reason:\n"+result.stack.toString()));
        return_failed_json(req,res,500,"Some error happens when we delete some privious order.\n")
        return;
    } else {
        logger.info(message(req.ip,method, url, `Delete previous order successful`));
        return_sucessful_json(req,res,result);
        return;
    }
}

export async function list_book_ordered_by_sales(req,res){
    const method = "POST";
    const url = "/list_book";

    let reason;
    if(!check_variable_format(req.body,"top_n","number")) {
        reason = `The value of key 'top_n' is not a number`;
        logger.warn(message(req.ip,method, url,reason));
        return_failed_json(req,res,400,reason);
        return;
    }
    const top_n =  Math.round(req.body["top_n"]);
    if(top_n<1) {
        reason = '/list_costumer',`The value of key 'top_n' is smaller than 1`;
        logger.warn(message(req.ip, method, url,reason));
        return_failed_json(req,res,400,reason);
        return;
    }

    if(!check_variable_format(req.body,"start_date","string")) {
        reason = `The value of key 'start_date' is not a string`
        logger.warn(message(req.ip,method, url,reason));
        return_failed_json(req,res,400,reason);
        return;
    }
    const start_date = new Date(req.body["start_date"]);
    if(start_date.toString()==="Invalid Date") {
        reason = "The value of key 'start_date' has to be like YYYY-MM-DD HH:MM:SS";
        logger.warn(message(req.ip,method, url,reason));
        return_failed_json(req,res,400,reason);
        return
    }

    if(!check_variable_format(req.body,"end_date","string")) {
        reason = `The value of key 'end_date' is not a string`
        logger.warn(message(req.ip,method, url,reason));
        return_failed_json(req,res,400,reason);
        return;
    }
    const end_date = new Date(req.body["end_date"]);
    if(end_date.toString()==="Invalid Date") {
        reason = "The value of key 'end_date' has to be like YYYY-MM-DD HH:MM:SS";
        logger.warn(message(req.ip,method, url,reason));
        return_failed_json(req,res,400,reason);
        return
    }

    let result = await model.list_book_ordered_by_sales([top_n,start_date,end_date])
    if(result instanceof Error){
        logger.warn(message(req.ip,method, url,"Some error happens on page booklist,reason:\n"+result.stack.toString()));
        return_failed_json(req,res,500,"Some error happens when we delete some privious order.\n")
        return;
    } else {
        logger.info(message(req.ip,method, url, `Delete previous order successful`));
        return_sucessful_json(req,res,result);
        return;
    }
}

//==================================================================================

export function handle_all_uxexpected_error(error, req, res, next) {
    logger.warn("An unexpected error happens,reason:\n"+error.stack)
    res.json(return_failed_json("Some unexpected error happens, maybe you can try again later."))
}




