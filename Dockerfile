FROM node:slim

RUN apt-get update && apt-get install -y git zip unzip python libgtk-3-dev libx11-xcb1 libxss1 libgconf-2-4 libnss3-dev libasound2 libxkbfile1 libgtk2.0-0

# RUN npm install