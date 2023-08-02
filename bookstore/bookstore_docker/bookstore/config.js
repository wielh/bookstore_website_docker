import winston from 'winston';
import * as mysql from 'mysql2/promise'
import * as path from 'node:path'
import * as nodemailer from "nodemailer"
import * as amqplib from "amqplib"
import { Strategy } from 'passport-google-oauth20';
import { OAuth2Client } from 'google-auth-library';

export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [new winston.transports.Console()],
});

const root_dir = process.cwd()
export const html_root = path.join(root_dir,"bookstore/view/html")
export const css_root = path.join(root_dir , "bookstore/view/css")
export const client_script_root = path.join(root_dir ,"bookstore/view/javascript")

export const port = 3000
export const basic_url = 'http://127.0.0.1:3000'

export const hash_salt = "qwertyuiopasdfghjklzxcvbnm"
export const token_key = "abcdefghijklmnopqrstuvwxyz"
export const token_expire_second = 24*60*60
export const verification_code_expire_second = 5*60
export const website_email = 'wielh.erlow@gmail.com'

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

// mail
export const transporter = nodemailer.createTransport(
    {
        host: 'smtp.gmail.com',
        port: 465,
        auth: {
            user: website_email,
            pass: 'prbaoboixuxnuwnk',
        },
        tls: {
            rejectUnauthorized: false
        }
    }
);

// ref: https://blog.hungwin.com.tw/aspnet-google-login/
export const google_login_ID = "118619557524-26i4t5boire053d9pg59csddkf302tds.apps.googleusercontent.com"
export const google_login_password = "***"
export const google_verify_strategy = new Strategy({
    clientID: google_login_ID,
    clientSecret:  google_login_password,
    callbackURL: basic_url + "/google_callback"
  }, function(accessToken, refreshToken, profile, cb) {
    return cb(null,profile);
  }
)

/*
docker pull rabbitmq:management
docker run --name rabbitmq -p 5672:5672 -p 15672:15672 -e RABBITMQ_DEFAULT_USER=root -e RABBITMQ_DEFAULT_PASS=1234 rabbitmq:management
*/

const rabbitMQ_username = 'root';
const rabbitMQ_password = '1234';
const rabbitMQ_server = 'rabbitmq' //rabbitmq or localhost
const rabbitMQ_URL = `amqp://${rabbitMQ_username}:${rabbitMQ_password}@${rabbitMQ_server}:5672/`;
export const rabbitMQ_connection = await amqplib.connect(rabbitMQ_URL);
