#!/bin/bash
APK_NAME="app-release-unsigned.apk"
APK_LOC="$(pwd)/platforms/android/app/build/outputs/apk/release/"
OUTPUT_LOC='./output.log'
echo "building apk . . . ."
ionic cordova build android --release > './output.log'
echo "signing apk . . . ."
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore cicloestaciones.keystore -storepass ecobici "${APK_LOC}${APK_NAME}" alias_name >> './output.log'
echo "building signed apk . . . ."
zipalign -f -v 4 "${APK_LOC}${APK_NAME}" "./Ecobici.apk" >> './output.log'
