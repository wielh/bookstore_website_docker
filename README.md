關於此程式的詳細架構，請看:https://github.com/wielh/bookstore_website

如何用 docker 啟動此程式

(1). 安裝 rabbitMQ:
    docker pull rabbitmq:management

(2). 啟動 rabbitMQ:
    docker run --name rabbitmq -p 5672:5672 -p 15672:15672 -e RABBITMQ_DEFAULT_USER=root -e RABBITMQ_DEFAULT_PASS=1234 rabbitmq:management

(3). 構建主程式與兩個consumer的image， 則分別執行三個資料夾的 dockerfile
    docker build -t bookstore_app .
    docker build -t transection_app .
    docker build -t send_mail_app .

(4). 構建container並執行:
    docker run -it -p 3000:3000 -p 3306:3306 --link rabbitmq:management bookstore_app
    docker run -it --link rabbitmq:management transection_app
    docker run -it --link rabbitmq:management send_mail_app
