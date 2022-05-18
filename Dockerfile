FROM ubuntu:20.04

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update
RUN apt-get -y install python2 \
    python3-dev \
    python3-pip \
    git \
    libevent-dev \
    libmagic-dev \
    libxml2-dev \
    libxslt-dev \
    openssl \
    graphviz \
    nginx \
    freetype2-demos \
    libjpeg-dev \
    libtiff-dev \
    liblcms2-utils \
    webp \
    nodejs \
    npm  
RUN pip3 install -U zc.buildout setuptools==43

WORKDIR /app
COPY . .
RUN buildout bootstrap
RUN git config --global url."https://github.com/".insteadOf git@github.com: && git config --global url."https://".insteadOf git:// && bin/buildout
