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

Patching React-native-camera
--

Building with modern react native (0.70+) causes the app to crash because of having react-native-camera as a dependency, which uses deprecated props.

install deprecated-react-native-prop-types

`npm install deprecated-react-native-prop-types`

navigate into node_modules/react-native-camera to edit RNCamera.js

replace
```
import {
...
  ViewPropTypes,
...
}
```

with

`import { ViewPropTypes } from 'deprecated-react-native-prop-types';`

this patch was sourced from https://stackoverflow.com/questions/72755476/invariant-violation-viewproptypes-has-been-removed-from-react-native-migrate-t
