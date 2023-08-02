
import jwt from 'jsonwebtoken';
import {createHmac} from "crypto";
import {token_key,hash_salt, logger,transporter, website_email, rabbitMQ_connection} from "./config.js";

export function password_hash(password) {
    for(let i=0;i<10;i++){
        password = createHmac('sha512',hash_salt).update(password).digest('hex');
    }
    return password;
};

//===========================================

const { sign, verify } = jwt

export function decode_token(token){
    try {
        return jwt.decode(token);
    } catch(e){
        console.log("cannot parse token, reason:");
        console.log(e);
        return JSON.parse("{}");
    }
}

export function create_token(json, second){
    return sign(json,  token_key, { expiresIn: second});
}

export function verify_token(token_string){
    if (token_string == null){
        return "token is null"
    }
    verify(token, token_key,
        (err, user) => {
            if (err) {
                return "token rejected, reason: "+ err
            } else {
                req.user = user;
                console.log(user);
            }
        }
    )
}

//===========================================
function get_current_datetime(){
    var m = new Date();
    var dateString =
        m.getUTCFullYear() + "/" +
        ("0" + (m.getUTCMonth()+1)).slice(-2) + "/" +
        ("0" + m.getUTCDate()).slice(-2) + " " +
        ("0" + m.getUTCHours()).slice(-2) + ":" +
        ("0" + m.getUTCMinutes()).slice(-2) + ":" +
        ("0" + m.getUTCSeconds()).slice(-2);
    return dateString;
}

export function message(ip, method, route, message) {
    return `[${get_current_datetime()}][${ip}] ${method} ${route}:${message}`
}

//===========================================

export function return_failed_page(req,res,reason) {
    logger.warn(message(req.ip,"PUT","/register", reason));
    let message_object = new Object();
    message_object.success = false;
    message_object.reason = reason
    res.json(JSON.stringify(message_object))
}

export function return_failed_json(req,res,status_code,reason) {
    logger.warn(reason);
    let message_object = new Object();
    message_object.success = false;
    message_object.reason = reason
    res.status(status_code).json(message_object)
}

export function return_sucessful_json(req,res,obj) {
    let message_object = new Object();
    message_object.success = true;
    message_object.result = obj
    res.status(200).json(message_object);
}

//===========================================

export function check_variable_format(object, key, typeof_value) {
    if( object[key] === undefined || object[key] === null) {
        return false
    }

    switch (typeof_value) {
        case 'json':
            try {
                JSON.parse(object[key])
                return true;
            } catch (error) {
                return false;
            }
        default:
            return ((typeof object[key]) === typeof_value)
    }
}

export function check_array_format(object, key, typeof_value) {
    if( object[key] === undefined || object[key] === null || !Array.isArray(object[key])) {
        return false
    }

    for (let i=0;i<object[key].length;i++) {
        if ((typeof object[key][i]) !== typeof_value) {
            return false;
        }
    }
    return true;
}

//============================================
export function sort_map_by_key(map, typeof_key, order){
    let sort_role;
    let order_num = (order === "decrease")?-1:1
    switch(typeof_key) {
        case 'string':
        sort_role = (a, b) => order_num * String(a[0]).localeCompare(b[0])
        break;
        case 'number':
        sort_role = (a, b) => order_num * (a[0] - b[0])
        break;
        default:
        return map;
    }
    return new Map([...map.entries()].sort(sort_role));
}

export function sort_map_by_value(map, typeof_value, order){
    let sort_role;
    let order_num = (order === "decrease")?-1:1
    switch(typeof_value) {
        case 'string':
        sort_role = (a, b) => order_num * String(a[1]).localeCompare(b[1])
        break;
        case 'number':
        sort_role = (a, b) => order_num * (a[1] - b[1])
        break;
        default:
        return map;
    }
    return new Map([...map.entries()].sort(sort_role));
}

export function get_first_n_results_of_map(map,number){
    while(map.size>number){
        let last_key = Array.from(map)[map.size-1][0]
        map.delete(last_key)
    }
    return map;
}

//============================================

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

export function get_username(username){
    if(username.startsWith("google_user:")){
        return username.substring("google_user:".length);
    } else {
        return username;
    }
}

export function googleID_to_username(ID){
    return "google_user:"+ID
}
