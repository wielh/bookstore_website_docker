
export function button_factory(name,style,clickevent){
    const button = document.createElement("button");
    // button.style = "text-align: center;font-size:20px;";
    button.style = style;
    button.id = name;
    button.innerText = name;
    button.addEventListener("click",clickevent);
    return button
}

//=========================================================================
// buttons actions of index
export function register_page(){
    window.location = `/register`
}

export function login_page(){
    window.location = `/login`
}

export function send_email_page(){
    window.location = `/send_email`
}

export function booklist_page(){
    window.location = `/booklist`
}

export function view_all_order_page(){
    window.location = `/order`
}

export function about_bookstore_page(){
    window.location = `/about_us`
}
//==========================================================================
// button actions of login
export async function login() {
    let username = document.getElementById("username").value;
    if (username.length<=0){
        alert("Please input username");
        return;
    }
    let password = document.getElementById("password").value;
    if (password.length<=0){
        alert("Please input password");
        return;
    }
    // ========================================================
    // go to userpage
    let obj = new Object();
    obj.username = username;
    obj.password = password;
    let jsonString= JSON.stringify(obj);
    let response = await fetch(
        "/login",{
            method: 'POST',
            redirect: "follow",
            credentials: "same-origin",
            headers: new Headers({
                "Content-Type": "application/json",
                "Accept": "application/json",
                "X-Requested-With": "XMLHttpRequest",
            }),
            body: jsonString
        }
    )

    console.log("success")
    console.log("url:"+ response.url);
    console.log("status:"+response.status);
    console.log("headers:");
    for (let [key, value] of response.headers) {
        console.log(`${key} = ${value}`);
    }

    let json = await response.json();
    if(json["success"]){
        window.location = '/index'
        alert("login success, redirect to out index page")
    } else {
        alert(json["reason"])
    }
}

export async function google_login(){

    const redirect_uri = "http%3A%2F%2F127.0.0.1%3A3000%2Fgoogle_callback"
    const scope = "email%20profile"
    const client_id = "118619557524-26i4t5boire053d9pg59csddkf302tds.apps.googleusercontent.com"
    const google_verification_url =
    `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&redirect_uri=${redirect_uri}&scope=${scope}&client_id=${client_id}`

    window.location.href = google_verification_url;

    /*
    let response = await fetch(
        "/login_google",{
            method: 'get',
            redirect: "follow",
            headers: new Headers({
                "X-Requested-With": "XMLHttpRequest",
            }),
        }
    )

    if (response && response  !== 'null' && response !== 'undefined'){
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            console.log("headers:");
            for (let [key, value] of response.headers) {
                console.log(`${key} = ${value}`);
            }

            let response_json = await response.json()
            let failed_reason = response_json.reason
            window.alert("error: login to google fail!,reason:"+failed_reason)
        }
    }*/
}

//==========================================================================
// button actions of register
export function register() {
    let username = document.getElementById("username").value;
    if (username.length<=0){
        alert("Please input username");
        return;
    }
    let email = document.getElementById("email").value;
    if (email.length<=0){
        alert("Please input password");
        return;
    }
    let password = document.getElementById("password").value;
    if (password.length<=0){
        alert("Please input password");
        return;
    }
    let password2 = document.getElementById("password2").value;
    if (password2.length<=0){
        alert("Please input password2");
        return;
    }
    if (!(password === password2)){
        alert("password and password2 is inequal.");
        return;
    }
    // ========================================================
    // go to userpage
    let obj = new Object();
    obj.username = username;
    obj.password = password;
    obj.email = email;
    let jsonString= JSON.stringify(obj);

    fetch(
        "/register ",{
            method: 'put',
            redirect: "follow",
            headers: new Headers({
                // "Authorization": localStorage.getItem('token'),
                "Content-Type": "application/json",
                "Accept": "application/json",
                "X-Requested-With": "XMLHttpRequest",
            }),
            body: jsonString
        }
    ).then(
        function(response) {
            console.log("success")
            console.log("url:"+ response.url);
            console.log("status:"+response.status);
            return response;
        }
    ).then(
        function(response) {
            return response.json()
        }
    ).then(
        function(json){
            console.log(json)
            if(json["success"]){
                alert("Register success")
                window.location = `/index`
            } else{
                alert("Register failed,reason:"+json["reason"])
            }
        }
    ).catch(
        function(err) {
            console.log('Fetch Error :-S', err);
            alert('Fetch Error :-S', err)
        }
    );
}

//==========================================================================
// button action of reset_password
export function send_email() {
    let username = document.getElementById("username").value;
    if (username.length<=0){
        alert("Please input username");
        return;
    }
    let email = document.getElementById("email").value;
    if (email.length<=0){
        alert("Please input email");
        return;
    }
    // ========================================================
    // go to userpage
    let obj = new Object();
    obj.username = username;
    obj.email = email;
    let jsonString= JSON.stringify(obj);

    fetch(
        "/send_email",{
            method: 'post',
            redirect: "follow",
            headers: new Headers({
                "Content-Type": "application/json",
                "Accept": "application/json",
                "X-Requested-With": "XMLHttpRequest",
            }),
            body: jsonString
        }
    ).then(
        function(response) {
            console.log("success")
            console.log("url:"+ response.url);
            console.log("status:"+response.status);
            return response;
        }
    ).then(
        function(response) {
            return response.json()
        }
    ).then(
        function(json){
            console.log(json)
            if(json["success"]){
                alert(json["result"])
                window.location = `/index`
            } else{
                alert(json["reason"])
            }
        }
    ).catch(
        function(err) {
            console.log('Fetch Error :-S', err);
            alert('Fetch Error :-S', err)
        }
    );
}

export function reset_password() {
    let username = document.getElementById("username").value;
    if (username.length<=0){
        alert("Please input username");
        return;
    }

    let password = document.getElementById("password").value;
    if (password.length<=0){
        alert("Please input password");
        return;
    }
    let password2 = document.getElementById("password2").value;
    if (password2.length<=0){
        alert("Please input password2");
        return;
    }
    if (!(password === password2)){
        alert("password and password2 is inequal.");
        return;
    }
    // ========================================================
    // go to userpage
    let obj = new Object();
    obj.username = username;
    obj.password = password;
    let url = window.location.href.split("/")
    obj.verification_token = url[url.length-1];
    let jsonString= JSON.stringify(obj);

    fetch(
        "/reset_password",{
            method: 'post',
            redirect: "follow",
            headers: new Headers({
                "Content-Type": "application/json",
                "Accept": "application/json",
                "X-Requested-With": "XMLHttpRequest",
            }),
            body: jsonString
        }
    ).then(
        function(response) {
            console.log("success")
            console.log("url:"+ response.url);
            console.log("status:"+response.status);
            return response;
        }
    ).then(
        function(response) {
            return response.json()
        }
    ).then(
        function(json){
            console.log(json)
            if(json["success"]){
                alert(json["result"])
                window.location = `/index`
            } else{
                alert(json["reason"])
            }
        }
    ).catch(
        function(err) {
            console.log('Fetch Error :-S', err);
            alert('Fetch Error :-S', err)
        }
    );
}

//==========================================================================
// button actions of booklist
export async function submit(){
    // submit
    const table = document.getElementById("table");
    let price = 0;
    let order_detail = "{";
    for (var i = 1, row; row = table.rows[i]; i++) {
        //iterate through rows
        //rows would be accessed using the "row" variable assigned in the for loop
        let buy_number_text = document.getElementsByClassName('book_order_number')[i-1];
        let buy_number = Number(buy_number_text.value)
        if(isNaN(buy_number)){
            alert(`The input of row ${i}th , ${buy_number} is not a number`);
            return;
        }

        price = Number(row.cells[2].innerText);
        if(buy_number>0){
            order_detail += `"${row.cells[0].innerText}":${buy_number},`
        }
    }

    if(order_detail.endsWith(",")){
        order_detail=order_detail.substring(0, order_detail.length - 1)
    }
    order_detail+="}"

    let total_obj = new Object();
    total_obj.order_detail = order_detail;

    fetch(
        "order",{
            method: 'POST',
            redirect: "follow",
            headers: new Headers({
                "Content-Type": "application/json",
                "Accept": "application/json",
                "X-Requested-With": "XMLHttpRequest",
            }),
            body: JSON.stringify(total_obj)
        }
    ).then(
        function(response) {
            console.log("success")
            console.log("url:"+ response.url);
            console.log("status:"+response.status);
            return response;
        }
    ).then(
        function(response) {
            return response.json()
        }
    ).then(
        function(json){
            console.log(json)
            if(json["success"]){
                let result =
                    `upload order to server successfully.`+
                    `Total price: ${json["result"]["total_price"]}. Thank you for coming today.`
                alert(result);
                window.location = `/index`
            } else{
                alert(json["reason"])
            }
        }
    ).catch(
        function(err) {
            console.log('Fetch Error :-S', err);
            alert('Fetch Error :-S', err)
        }
    );

    // reset
    for (var i = 1, row; row = table.rows[i]; i++) {
        let buy_number_text = document.getElementsByClassName('book_order_number')[i-1];
        buy_number_text.value = "0";
    }
}

export function reset(){
    const collection = document.getElementsByClassName("book_order_number");
    for (let i = 0; i < collection.length; i++) {
        console.log(collection[i].value);
        collection[i].value = "0";
    }
}

export function back_to_index(){
    window.location = `/index`;
}

export function logout(){
    document.cookie = "token" + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;path=/;';
    window.location = `/index`;
}

//==========================================================================
// button action of order
export async function delete_submit(){
    const table = document.getElementById("table");
    let cancel_order_index = [];
    for (var i = 1, row; row = table.rows[i]; i++) {
        let check_box =  document.getElementsByClassName('cancel_checkbox')[i-1];
        if (check_box.checked) {
            try {
                const num = Number(row.cells[0].innerText);
                cancel_order_index.push(num)
            } catch (error) {}
        }
    }

    let obj = new Object();
    obj.cancel_order_index = cancel_order_index;
    let jsonString= JSON.stringify(obj);

    fetch(
        "/order",{
            method: 'DELETE',
            redirect: "follow",
            headers: new Headers({
                // "Authorization": localStorage.getItem('token'),
                "Content-Type": "application/json",
                "Accept": "application/json",
                "X-Requested-With": "XMLHttpRequest",
            }),
            body: jsonString
        }
    ).then(
        function(response) {
            console.log("success")
            console.log("url:"+ response.url);
            console.log("status:"+response.status);
            return response;
        }
    ).then(
        function(response) {
            return response.json()
        }
    ).then(
        function(json){
            console.log(json)
            if(json["success"]){
                let result ="cancel order success, please double check again."
                alert(result);
                window.location.reload();
            } else{
                alert(json["reason"])
            }
        }
    ).catch(
        function(err) {
            console.log('Fetch Error :-S', err);
            alert('Fetch Error :-S', err)
        }
    );
}

