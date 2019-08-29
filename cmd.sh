#!/bin/bash

PS3='Select operation:'
options=(
"Docker user X access"
"Run docker image"
"Make windows build"
"Exit"
)
select opt in "${options[@]}"
do
    case $opt in
        "Docker user X access")
            command xhost +"local:docker@"
            break
        ;;
        "Run docker image")
            command docker run -dit --name billdesk -v ${PWD}:/app -v /tmp/.X11-unix:/tmp/.X11-unix -e DISPLAY=$DISPLAY --device /dev/snd electron:dev
            break
        ;;
        "Make windows build")
            command docker run --rm -ti \
                        --env-file <(env | grep -iE 'DEBUG|NODE_|ELECTRON_|YARN_|NPM_|CI|CIRCLE|TRAVIS_TAG|TRAVIS|TRAVIS_REPO_|TRAVIS_BUILD_|TRAVIS_BRANCH|TRAVIS_PULL_REQUEST_|APPVEYOR_|CSC_|GH_|GITHUB_|BT_|AWS_|STRIP|BUILD_') \
                        --env ELECTRON_CACHE="/root/.cache/electron" \
                        --env ELECTRON_BUILDER_CACHE="/root/.cache/electron-builder" \
                        -v ${PWD}:/project \
                        -v ${PWD##*/}-node-modules:/project/node_modules \
                        -v ~/.cache/electron:/root/.cache/electron \
                        -v ~/.cache/electron-builder:/root/.cache/electron-builder \
                        electronuserland/builder:wine-mono

            break;
        ;;
        "Exit")
            break
            ;;
        *) echo "Invalid option $REPLY";;
    esac
done
