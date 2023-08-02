import * as action from "./route_action_implement.js";
import express from 'express';

export function apply_route(app,public_route,protected_route,admin_route){
  // route setting
  app.use('/favicon.ico',action.skip_favicon_ico)
  // actions of button
  app.use('/button_actions',action.get_button_action)

  // =============================================================
  // public page
  public_route.get('/', action.get_index)

  public_route.get('/index', action.get_index)

  public_route.get('/register', action.get_register_page)

  public_route.put('/register',express.json(), action.put_register)

  public_route.get('/google_callback', action.get_google_login)

  public_route.get('/login', action.get_login_page)

  public_route.post('/login', express.json(), action.post_login)

  public_route.get('/send_email', action.get_verification_code)

  public_route.post('/send_email', express.json(),action.post_verification_code)

  public_route.get('/reset_password/:token', action.reset_password_page)

  public_route.post('/reset_password', express.json(),action.reset_password)

  public_route.get('/about_us', action.get_about_us)

  //==============================================================
  // protected page
  protected_route.use(action.verify_token)

  protected_route.get('/booklist',action.get_booklist_page)

  protected_route.get('/booklist/:type',action.get_booklist_by_type_page)

  protected_route.get('/order', action.get_order_page)

  protected_route.post('/order', express.json(), action.post_order)

  protected_route.delete('/order', express.json(), action.delete_order)
  //===============================================================
  // admin page
  admin_route.post('/list_costumer', express.json(), action.list_costumer_ordered_by_cost)

  admin_route.post('/list_book', express.json(), action.list_book_ordered_by_sales)
  //===============================================================
  // handle all unexpected error
  app.use(action.handle_all_uxexpected_error)
}
