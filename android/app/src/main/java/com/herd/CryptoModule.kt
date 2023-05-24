package com.herd

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

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

class CryptoModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  private final val TAG = "HerdCryptoModule";

  override fun getName(): String {
      return "CryptoModule"
  }

  override fun getConstants(): Map<String, Any>? {
      // Export any constants to be used in your native module
      // https://facebook.github.io/react-native/docs/native-modules-android.html#the-toast-module
      val constants : Map<String, Any> = mapOf(
          "algorithm" to mapOf(
              "RSA" to "RSA",
              "AES" to "AES",
              "AES_128" to "AES_128",
              "AES_256" to "AES_256",
              "ARC4" to "ARC4",
              "BLOWFISH" to "BLOWFISH",
              "ChaCha20" to "ChaCha20",
              "DES" to "DES",
              "DESede" to "DESede"
          ),
          "blockMode" to mapOf(
              "CBC" to "CBC",
              "CFB" to "CFB",
              "CTR" to "CTR",
              "CTS" to "CTS",
              "ECB" to "ECB",
              "OFB" to "OFB",
              "OFB" to "OFB",
              "GCM" to "GCM",
              "Poly1305" to "Poly1305",
              "NONE" to "NONE"
          ),
          "padding" to mapOf(
              "NO_PADDING" to "NoPadding",
              "ISO10126Padding" to "ISO10126Padding",
              "PKCS5Padding" to "PKCS5Padding",
              "OAEPPadding" to "OAEPPadding",
              "OAEP_SHA1_MGF1Padding" to "OAEPwithSHA-1andMGF1Padding",
              "OAEP_SHA256_MGF1Padding" to "OAEPwithSHA-256andMGF1Padding",
              "OAEP_SHA224_MGF1Padding" to "OAEPwithSHA-224andMGF1Padding",
              "OAEP_SHA384_MGF1Padding" to "OAEPwithSHA-384andMGF1Padding",
              "OAEP_SHA512_MGF1Padding" to "OAEPwithSHA-512andMGF1Padding"
          )
      )

      return constants
  }

  private fun loadKeyStore(storeName : String) : KeyStore {
    val keyStore = KeyStore.getInstance(storeName);
    keyStore.load(null);
    return keyStore;
  }

  private fun loadPublicKey(alias : String, keyStore : String) : PublicKey? {
    try {
      val keyStore = loadKeyStore(keyStore)
      val publicKey = keyStore.getCertificate(alias)?.publicKey;
      return publicKey;
    }
    catch(e : Exception) {
      Log.e(TAG,"error loading public key from keystore",e);
    }
    return null;
  }

  private fun loadPrivateKey(alias : String, keyStore : String) : PrivateKey? {
    try {
      val keyStore = loadKeyStore(keyStore);
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

  private fun initialiseCipher(encryptionType : String, cipherMode : Int, publicKey : PublicKey) : Cipher {
    val cipher : Cipher = Cipher.getInstance(encryptionType);
    val cipherSpec = getCipherSpec();
    cipher.init(Cipher.ENCRYPT_MODE, publicKey, cipherSpec);
    return cipher;
  }

  private fun initialiseCipher(encryptionType : String, cipherMode : Int, privateKey : PrivateKey) : Cipher {
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

    val keyPair : KeyPair = keyPairGenerator.generateKeyPair();
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
  fun encryptString(
  alias : String,
  algorithm : String,
  blockMode : String,
  padding : String,
  stringToEncrypt : String,
  promise : Promise) {
    val encryptionType = algorithm.plus("/").plus(blockMode).plus("/").plus(padding);
    //retrieve key from keystore
    val publicKey : PublicKey? = loadPublicKey(alias,"AndroidKeyStore");
    if(publicKey === null) {
      return promise.resolve("Public Key does not exist")
    }

    //init cipher with RSA/ECB/OAEPWithSHA-256AndMGF1Padding scheme
    val cipher = initialiseCipher(encryptionType, Cipher.ENCRYPT_MODE, publicKey);

    //cast string to bytes
    val stringAsBytes : ByteArray = stringToEncrypt.toByteArray();
    val encryptedBytes : ByteArray
    try {
      //encrypt string
      encryptedBytes = cipher.doFinal(stringAsBytes);
      //encode encrypted string to base64 for javascript and pass upwards
      val encryptedStringBASE64 = Base64.encodeToString(encryptedBytes,Base64.DEFAULT);
      return promise.resolve(encryptedStringBASE64);
    }
    catch(e : GeneralSecurityException) {
      return promise.reject("Encrypt string error",e)
    }
  }

  @ReactMethod
  fun encryptStringWithKey(
  key : String,
  algorithm : String,
  blockMode : String,
  padding : String,
  stringToEncrypt : String,
  promise : Promise) {
    //create encryption type string to pass to cipher init
    val encryptionType = algorithm.plus("/").plus(blockMode).plus("/").plus(padding);

    try {
      //convert passed in public key string to bytes and format it as public key
      val publicBytes = Base64.decode(key,Base64.DEFAULT);
      val publicKey : PublicKey = KeyFactory.getInstance("RSA").generatePublic(X509EncodedKeySpec(publicBytes));
      //init encryption cipher
      val cipher : Cipher = initialiseCipher(encryptionType,Cipher.ENCRYPT_MODE,publicKey);
      //convert message to encrypt to bytes
      val stringAsBytes = stringToEncrypt.toByteArray();
      //encrypt message bytes
      val encryptedBytes = cipher.doFinal(stringAsBytes);
      //convert message bytes to base64 for javascript and resolve promise with string
      val encryptedStringBASE64 = Base64.encodeToString(encryptedBytes,Base64.DEFAULT);
      promise.resolve(encryptedStringBASE64);
    }
    catch(e : Exception) {
      promise.reject("Encrypt string error",e)
    }
  }

  @ReactMethod
  fun decryptString(
  alias : String,
  algorithm : String,
  blockMode : String,
  padding : String,
  stringToDecrypt : String,
  promise : Promise) {
    val encryptionType = algorithm.plus("/").plus(blockMode).plus("/").plus(padding);
    //retrieve key from keystore
    val privateKey = loadPrivateKey(alias,"AndroidKeyStore");

    if(privateKey === null) {
      return promise.resolve("Private key does not exist")
    }

    //init cipher according to RSA/ECB/OAEPWithSHA-256AndMGF1Padding scheme
    val cipher : Cipher = initialiseCipher(encryptionType,Cipher.DECRYPT_MODE,privateKey);

    //decode base64 string passed in from javscript
    val encryptedStringAsBytes = Base64.decode(stringToDecrypt,Base64.DEFAULT);
    //try to decrypt bytes and resolve promise accordingly
    try {
      val decryptedString = cipher.doFinal(encryptedStringAsBytes);
      return promise.resolve(String(decryptedString))
    }
    catch(e : GeneralSecurityException) {
      return promise.reject("Decrypt string error",e)
    }
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
