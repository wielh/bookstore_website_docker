FROM ubuntu:20.04
COPY transection_docker.zip /home/app.zip

RUN apt update
RUN apt install -y unzip
RUN unzip /home/app.zip -d /home/app
RUN apt install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt install nodejs build-essential -y
WORKDIR /home/app/transection_docker
COPY ./ /home/app/transection_docker
RUN npm install
CMD node transection_docker/app.js

