package com.herd

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter

import javax.crypto.Cipher
import javax.crypto.spec.SecretKeySpec
import java.security.KeyPairGenerator
import java.security.KeyPair
import java.security.PublicKey
import java.security.PrivateKey
import java.security.KeyStore
import android.util.Base64
import android.util.Log
import android.security.keystore.KeyProperties
import java.security.KeyFactory
import java.security.spec.X509EncodedKeySpec
import java.security.GeneralSecurityException
import java.security.MessageDigest

import android.security.keystore.KeyGenParameterSpec
import javax.crypto.spec.OAEPParameterSpec
import java.security.spec.MGF1ParameterSpec
import javax.crypto.spec.PSource

import kotlinx.coroutines.*;

class CryptoModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  private final val TAG = "HerdCryptoModule";
  var cryptographyScope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
  val coroutineResultContext = newSingleThreadContext("coroutineResultContext");
  val context = reactContext;

  var encryptionPromise : Promise? = null;
  var decryptionPromise : Promise? = null;

  override fun getName(): String {
      return "CryptoModule"
  }

  @ReactMethod
  fun addListener(listenerName: String) {
      Log.i(TAG,"addListener called, eventName : $listenerName")
  }

  @ReactMethod
  fun removeListeners(listenerCount: Int) {
      Log.i(TAG,"removeListeners called, count : $listenerCount")
  }

  override fun getConstants(): Map<String, Any>? {
      // Export any constants to be used in your native module
      // https://facebook.github.io/react-native/docs/native-modules-android.html#the-toast-module
      val constants : Map<String, Any> = mapOf(
          "algorithm" to mapOf(
              "RSA" to "RSA"
          ),
          "blockMode" to mapOf(
              "ECB" to "ECB"
          ),
          "padding" to mapOf(
              "OAEP_SHA256_MGF1Padding" to "OAEPwithSHA-256andMGF1Padding"
          )
      )

      return constants
  }

  private fun loadKeyStore(storeName : String) : KeyStore {
    val keyStore = KeyStore.getInstance(storeName);
    keyStore.load(null);
    return keyStore;
  }

  private fun loadPublicKey(alias : String, keyStoreName : String) : PublicKey? {
    try {
      val keyStore = loadKeyStore(keyStoreName)
      val publicKey = keyStore.getCertificate(alias)?.publicKey;
      return publicKey;
    }
    catch(e : Exception) {
      Log.e(TAG,"error loading public key from keystore",e);
    }
    return null;
  }

  private fun loadPrivateKey(alias : String, keyStoreName : String) : PrivateKey? {
    try {
      val keyStore = loadKeyStore(keyStoreName);
      val privateKey = keyStore.getKey(alias, null) as PrivateKey?;
      return privateKey;
    }
    catch(e : Exception) {
      Log.e(TAG,"error loading private key from keystore",e);
    }
    return null;
  }

  private fun getCipherSpec() : OAEPParameterSpec {
    val cipherSpec = OAEPParameterSpec(
      "SHA-256",
      "MGF1",
      MGF1ParameterSpec.SHA1,
      PSource.PSpecified.DEFAULT
    );
    return cipherSpec;
  }

  private fun initialiseCipher(encryptionType : String, publicKey : PublicKey) : Cipher {
    val cipher : Cipher = Cipher.getInstance(encryptionType);
    val cipherSpec = getCipherSpec();
    cipher.init(Cipher.ENCRYPT_MODE, publicKey, cipherSpec);
    return cipher;
  }

  private fun initialiseCipher(encryptionType : String, privateKey : PrivateKey) : Cipher {
    val cipher : Cipher = Cipher.getInstance(encryptionType);
    val cipherSpec = getCipherSpec();
    if(encryptionType === "RSA/ECB/OAEPWithSHA-256AndMGF1Padding") {
      cipher.init(Cipher.DECRYPT_MODE, privateKey,cipherSpec);
    }
    else {
      cipher.init(Cipher.DECRYPT_MODE, privateKey);
    }
    return cipher;
  }

  private fun initialisePublicKey(keyOrAlias : String, loadKeyFromStore: Boolean) : PublicKey? {
    var publicKey : PublicKey? = null;
    if(loadKeyFromStore) {
      publicKey = loadPublicKey(keyOrAlias,"AndroidKeyStore");
    }
    else {
      try {
        val publicBytes = Base64.decode(keyOrAlias,Base64.DEFAULT);
        publicKey = KeyFactory.getInstance("RSA").generatePublic(X509EncodedKeySpec(publicBytes));
      }
      catch(e : Exception) {
        val errorMessage = "Error initialising public key passed in as parameter"
        Log.i(TAG,errorMessage,e)
      }
    }
    return publicKey;
  }

  private fun generateCipherString(algorithm : String, blockMode : String, padding : String) : String {
    return "$algorithm/$blockMode/$padding";
  }

  @ReactMethod
  fun generateRSAKeyPair(alias : String, promise : Promise) {

    val keyPairGenerator : KeyPairGenerator =
    KeyPairGenerator.getInstance(
      KeyProperties.KEY_ALGORITHM_RSA,
      "AndroidKeyStore"
    );

    keyPairGenerator.initialize(KeyGenParameterSpec.Builder(
      alias,
      KeyProperties.PURPOSE_DECRYPT)
      .setBlockModes(KeyProperties.BLOCK_MODE_ECB)
      .setDigests(KeyProperties.DIGEST_SHA256, KeyProperties.DIGEST_SHA512)
      .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_RSA_OAEP)
      .build()
    )

    keyPairGenerator.generateKeyPair();
    promise.resolve(null);
  }

  @ReactMethod
  fun deleteKeyPair(alias : String, promise : Promise) {
    val keyStore = loadKeyStore("AndroidKeyStore");
    try {
      keyStore.deleteEntry(alias)
    }
    catch(e : GeneralSecurityException) {
      return promise.reject("Delete key error",e);
    }
    promise.resolve(null);
  }

  @ReactMethod
  fun loadKeyFromKeystore(alias : String, promise : Promise) {
    val publicKey = loadPublicKey(alias,"AndroidKeyStore");
    if(publicKey === null) {
      return promise.resolve(null)
    }

    val publicBytes : ByteArray = publicKey.getEncoded();
    val publicBASE64 = Base64.encodeToString(publicBytes,Base64.DEFAULT);

    promise.resolve(publicBASE64)
  }

  @ReactMethod
  fun encryptStrings(
  keyOrAlias : String,
  loadKeyFromStore : Boolean,
  algorithm : String,
  blockMode : String,
  padding : String,
  strings : ReadableArray,
  promise : Promise) {
    val encryptionType = generateCipherString(algorithm,blockMode,padding);
    var publicKey : PublicKey? = initialisePublicKey(keyOrAlias,loadKeyFromStore);

    if(publicKey === null) {
      val errorMessage = "error loading or initialising publicKey in encryptStrings function, publicKey was null";
      Log.i(TAG,errorMessage)
      return promise.reject("could not make load or use public key")
    }
    
    encryptionPromise = promise;
    var results : Array<String> = Array<String>(strings.size()) { "" };
    var nativeInputStrings : ArrayList<String> = strings.toArrayList() as ArrayList<String>;
    
    cryptographyScope.launch {
      val encryptionRoutines =  
        nativeInputStrings.mapIndexed{ index, it -> 
          cryptographyScope.launch {
          try {
            val stringAsBytes : ByteArray = it.toByteArray();
            val cipher : Cipher = initialiseCipher(encryptionType, publicKey);
            val encryptedBytes = cipher.doFinal(stringAsBytes)
            val encryptedStringBASE64 = Base64.encodeToString(encryptedBytes,Base64.DEFAULT);
            results[index] = encryptedStringBASE64;
          }
          catch(e : Exception) {
            Log.e(TAG, "error encrypting string in coroutine",e)
          }
        }
      }
      encryptionRoutines.joinAll();
      if(results.any{it -> it.length == 0}) {
        encryptionPromise?.reject("failed to encrypt a string");
      }
      else {
        encryptionPromise?.resolve(Arguments.fromArray(results));
      }
      encryptionPromise = null;
    }
  }

  fun decryptString(
    encryptionType : String,
    privateKey : PrivateKey,
    stringToDecrypt : String
  ) : String {
    val cipher : Cipher = initialiseCipher(encryptionType, privateKey);
    val encryptedStringAsBytes = Base64.decode(stringToDecrypt,Base64.DEFAULT);
    val decryptedBytes = cipher.doFinal(encryptedStringAsBytes);
    val decryptedString = String(decryptedBytes);
    return decryptedString; 
  }

  fun decryptWithIdentifier(
    encryptionType : String,
    privateKey : PrivateKey,
    decryptionObject : Map<String,Any>
  ) : Map<String,Any>{
    val text : String = decryptionObject["text"] as String;
    val identifier : String = decryptionObject["identifier"] as String;
    val decryptedString = decryptString(encryptionType,privateKey,text);

    return mapOf(
      "text" to decryptedString,
      "identifier" to identifier
    )
  }

  @ReactMethod
  fun decryptStrings(
  alias : String,
  algorithm : String,
  blockMode : String,
  padding : String,
  strings: ReadableArray,
  promise : Promise) {
    val encryptionType = generateCipherString(algorithm,blockMode,padding);
    //retrieve key from keystore
    val privateKey = loadPrivateKey(alias,"AndroidKeyStore");
    var results : Array<String> = Array<String>(strings.size()) { "" };
    var nativeInputStrings : ArrayList<String> = strings.toArrayList() as ArrayList<String>;

    decryptionPromise = promise;

    if(privateKey === null) {
      return promise.resolve("Private key does not exist")
    }
    
    cryptographyScope.launch {
      val decryptionRoutines =  
        nativeInputStrings.mapIndexed{ index, it -> 
          cryptographyScope.launch {
          try {
            results[index] = decryptString(encryptionType,privateKey,it);
          }
          catch(e : Exception) {
            Log.e(TAG, "error decrypting string in coroutine",e)
          }
        }
      }
      decryptionRoutines.joinAll();
      decryptionPromise?.resolve(Arguments.fromArray(results))
      decryptionPromise = null;
    }
  }

  @ReactMethod
  fun decryptStringsWithIdentifier(
  alias : String,
  algorithm : String,
  blockMode : String,
  padding : String,
  stringsWithIndex: ReadableArray,
  promise : Promise) {
    val encryptionType = generateCipherString(algorithm,blockMode,padding);
    //retrieve key from keystore
    val privateKey = loadPrivateKey(alias,"AndroidKeyStore");
    //var results : WritableArray = Arguments.createArray();
    var results : ArrayList<Map<String,Any>> = ArrayList<Map<String,Any>>();
    var jsResults : WritableArray = Arguments.createArray();
    var nativeInputStrings : ArrayList<Map<String,Any>> = stringsWithIndex.toArrayList() as ArrayList<Map<String,Any>>;

    if(privateKey === null) {
      return promise.resolve("Private key does not exist")
    }

    decryptionPromise = promise;
    
    cryptographyScope.launch {
      val decryptionRoutines =  
        nativeInputStrings.map{ it -> 
          cryptographyScope.launch {
          try {
            val resultObject = decryptWithIdentifier(
              encryptionType,
              privateKey,
              it
            )
            withContext(coroutineResultContext) {
              results.add(resultObject);
            }
          }
          catch(e : Exception) {
            Log.e(TAG, "error decrypting string in coroutine",e)
            results.add(mapOf(
              "identifier" to it["identifier"] as String,
              "text" to "An error occurred attemping to decrypt this message"
            ))
          }
        }
      }
      decryptionRoutines.joinAll();
      for(result in results) {
        var jsResult : WritableMap = Arguments.createMap();
        jsResult.putString("text",result["text"] as String);
        jsResult.putString("identifier",result["identifier"] as String);
        jsResults.pushMap(jsResult);
      }
      decryptionPromise?.resolve(jsResults)
      decryptionPromise = null;
    }
  }

  @ReactMethod
  fun cancelCoroutineWork(promise : Promise) {
    cryptographyScope.cancel();
    cryptographyScope = CoroutineScope(SupervisorJob() + Dispatchers.Default);
    decryptionPromise?.resolve(Arguments.createArray());
    encryptionPromise?.resolve(Arguments.createArray());
    promise.resolve(true);
  }

  private fun generateMessageDigest(message : String, algorithm : String) : ByteArray {
    val messageBytes : ByteArray = message.toByteArray();
    val messageDigest = MessageDigest.getInstance(algorithm);
    return messageDigest.digest(messageBytes);
  }

  @ReactMethod
  fun createHash(message : String, promise : Promise) {
    val hash = Base64.encodeToString(generateMessageDigest(message,"SHA-512"),Base64.DEFAULT);
    promise.resolve(hash);
  }

  @ReactMethod
  fun compareHashes(hash1 : String, hash2 : String, promise : Promise) {
    val hash1Bytes : ByteArray = Base64.decode(hash1,Base64.DEFAULT);
    val hash2Bytes : ByteArray = Base64.decode(hash2,Base64.DEFAULT);
    promise.resolve(MessageDigest.isEqual(hash1Bytes,hash2Bytes));
  }
}
