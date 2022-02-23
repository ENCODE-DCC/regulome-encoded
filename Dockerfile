FROM ubuntu:20.04

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update
RUN apt-get -y install python2
RUN apt-get -y install python3-dev
RUN apt-get -y install python3-pip
RUN apt-get -y install git
RUN apt-get -y install libevent-dev
RUN apt-get -y install libmagic-dev
RUN apt-get -y install libxml2-dev
RUN apt-get -y install libxslt-dev
RUN apt-get -y install openssl
RUN apt-get -y install graphviz
RUN apt-get -y install nginx
RUN apt-get -y install freetype2-demos
RUN apt-get -y install libjpeg-dev
RUN apt-get -y install libtiff-dev
RUN apt-get -y install liblcms2-utils
RUN apt-get -y install webp
RUN apt-get -y install nodejs
RUN apt-get -y install npm 
RUN pip3 install -U zc.buildout setuptools==43

WORKDIR /app
COPY . .
RUN buildout bootstrap
RUN bin/buildout

ENTRYPOINT bin/pserve development.ini
