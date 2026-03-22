### Development:

#### Start the metro server
```
npm start
```

#### Push dev build to phone
```
npx react-native run-android
```


### Production

#### Build
```
cd android
./gradlew clean
cd ..
npx react-native start --reset-cache
cd android
./gradlew assembleRelease
```


#### Install
```
adb install android/app/build/outputs/apk/release/app-release.apk

```