
# react-native-react-native-cryptography

## Getting started

`$ npm install react-native-react-native-cryptography --save`

### Mostly automatic installation

`$ react-native link react-native-react-native-cryptography`

### Manual installation


#### iOS

1. In XCode, in the project navigator, right click `Libraries` ➜ `Add Files to [your project's name]`
2. Go to `node_modules` ➜ `react-native-react-native-cryptography` and add `RNReactNativeCryptography.xcodeproj`
3. In XCode, in the project navigator, select your project. Add `libRNReactNativeCryptography.a` to your project's `Build Phases` ➜ `Link Binary With Libraries`
4. Run your project (`Cmd+R`)<

#### Android

1. Open up `android/app/src/main/java/[...]/MainActivity.java`
  - Add `import com.reactlibrary.RNReactNativeCryptographyPackage;` to the imports at the top of the file
  - Add `new RNReactNativeCryptographyPackage()` to the list returned by the `getPackages()` method
2. Append the following lines to `android/settings.gradle`:
  	```
  	include ':react-native-react-native-cryptography'
  	project(':react-native-react-native-cryptography').projectDir = new File(rootProject.projectDir, 	'../node_modules/react-native-react-native-cryptography/android')
  	```
3. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
  	```
      compile project(':react-native-react-native-cryptography')
  	```


## Usage
```javascript
import RNReactNativeCryptography from 'react-native-react-native-cryptography';

// TODO: What to do with the module?
RNReactNativeCryptography;
```
  