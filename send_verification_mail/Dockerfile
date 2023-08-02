FROM ubuntu:20.04
COPY sendmail_docker.zip /home/app.zip

RUN apt update
RUN apt install -y unzip
RUN unzip /home/app.zip -d /home/app
RUN apt install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt install nodejs build-essential -y
WORKDIR /home/app/sendmail_docker
COPY ./ /home/app/sendmail_docker
RUN npm install
CMD node sendmail_docker/app.js

