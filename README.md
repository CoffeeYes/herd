Project Setup for release builds
--

In order to bundle the project for release, you must : 

 - Generate a signing key using this guide https://reactnative.dev/docs/signed-apk-android
 - move the generated key to the ./android/app folder
 - add a file named "keystore.properties" to the android folder, which should contain the following fields
    - storePassword=mystorepassword
    - keyPassword=mykeypassword
    - keyAlias=mykeyalis
    - storeFile=nameofmykeyfile.keystore
