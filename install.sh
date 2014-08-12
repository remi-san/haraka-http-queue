#!/bin/bash

# Install Node and NPM
apt-get install curl
apt-get install lsb-release
curl -sL https://deb.nodesource.com/setup | bash -
apt-get install nodejs
curl -sL https://npmjs.org/install.sh | sh

# Install Haraka SMTP server
npm install -g Haraka
haraka -i /home/haraka-smtp

# Configure Haraka
echo LOGINFO > /home/haraka-smtp/config/loglevel
echo myserver.com >> /home/haraka-smtp/config/host_list
echo 52428800 > /home/haraka-smtp/config/databytes

# Configure Haraka Plugins
cp -f ./config/plugins /home/haraka-smtp/plugins

# Add Haraka Plugins
cp -f ./plugins/queue.notify_http.js /home/haraka-smtp/plugins/queue.notify_http.js
cp -f ./plugins/queue.default.js /home/haraka-smtp/plugins/queue.default.js

# Rewrite packege dependencies
cp -f ./package.json /home/haraka-smtp/package.json

# Haraka npm install
cd /home/haraka-smtp
npm install
