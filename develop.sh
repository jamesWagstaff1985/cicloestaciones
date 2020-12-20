#!/bin/bash
sudo rm -r ./www/*
ionic cordova prepare android
#sudo cordova run android --livereload -cs

deviceLst=$(adb devices | awk 'NR > 1 {print $1}' | sed ':a;N;$!ba;s/\n/ /g')

IFS=' ' read -a array <<< "$deviceLst"

for element in "${array[@]}"
do
    sudo cordova run android --target=$element
done
