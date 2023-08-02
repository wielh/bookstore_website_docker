import { html_root, css_root, client_script_root, port, logger, google_verify_strategy,
   basic_url} from './config.js';
import express from 'express';
import {apply_route} from './controller/route.js';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import cors from 'cors'


// start
var app = express();
app.use(cookieParser())
app.use(passport.initialize());
app.use(cors({
    origin: basic_url,
    methods: "GET,POST,PUT",
    credentials: true
}))
passport.use(google_verify_strategy)

// path setting
app.use(express.static(html_root));
app.use(express.static(css_root));
app.use(express.static(client_script_root));
// set view engine
app.set('view engine', 'ejs');
// set view folder
app.set('views', html_root);

// route setting
var public_route = express.Router();
var protected_route = express.Router();
var admin_route = express.Router();
apply_route(app,public_route,protected_route,admin_route);

app.use('/', public_route);
app.use('/', protected_route);
app.use('/', admin_route);

//start
app.listen(port, function () {
    logger.info('Example app listening on port '+ port +' !')
});

//===========================================================
