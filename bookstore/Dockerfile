FROM ubuntu:20.04
COPY bookstore_docker.zip /home/app.zip

RUN apt update
RUN apt install -y unzip
RUN unzip /home/app.zip -d /home/app
RUN apt install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt install nodejs build-essential -y
WORKDIR /home/app/bookstore_docker
COPY ./ /home/app/bookstore_docker
RUN npm install
CMD node bookstore_docker/bookstore/app.js

