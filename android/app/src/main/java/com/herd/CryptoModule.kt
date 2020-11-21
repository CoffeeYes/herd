package com.reactnativecrypto


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
import android.security.keystore.KeyProperties
import java.security.KeyFactory
import java.security.spec.X509EncodedKeySpec
import java.security.GeneralSecurityException

import android.security.keystore.KeyGenParameterSpec
import javax.crypto.spec.OAEPParameterSpec
import java.security.spec.MGF1ParameterSpec
import javax.crypto.spec.PSource

class CryptoModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "Crypto"
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
      val keyStore = KeyStore.getInstance("AndroidKeyStore")
      keyStore.load(null)
      try {
        keyStore.deleteEntry(alias)
      }
      catch(e : GeneralSecurityException) {
        return promise.resolve(e);
      }
      promise.resolve(null);
    }

    @ReactMethod
    fun loadKeyFromKeystore(alias : String, promise : Promise) {
      val keyStore : KeyStore = KeyStore.getInstance("AndroidKeyStore");
      keyStore.load(null);
      //val privateKey : PrivateKey = keyStore.getKey(alias, null) as PrivateKey;
      val publicKey = keyStore.getCertificate(alias)?.publicKey;
      if(publicKey === null) {
        return promise.resolve("Public Key Not Found")
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
        val keyStore : KeyStore = KeyStore.getInstance("AndroidKeyStore");
        keyStore.load(null);
        val publicKey : PublicKey? = keyStore.getCertificate(alias)?.getPublicKey();
        if(publicKey === null) {
          return promise.resolve("Public Key does not exist")
        }

        //init cipher with RSA/ECB/OAEPWithSHA-256AndMGF1Padding scheme
        val cipher : Cipher = Cipher.getInstance(encryptionType);
        val cipherSpec = OAEPParameterSpec(
          "SHA-256",
          "MGF1",
          MGF1ParameterSpec.SHA1,
          PSource.PSpecified.DEFAULT
        )
        cipher.init(Cipher.ENCRYPT_MODE, publicKey, cipherSpec);

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
          return promise.resolve(e)
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
        val keyStore : KeyStore = KeyStore.getInstance("AndroidKeyStore");
        keyStore.load(null);
        val privateKey = keyStore.getKey(alias, null) as PrivateKey?;

        if(privateKey === null) {
          return promise.resolve("Private key does not exist")
        }

        //init cipher according to RSA/ECB/OAEPWithSHA-256AndMGF1Padding scheme
        val cipher : Cipher = Cipher.getInstance(encryptionType);
        val cipherSpec = OAEPParameterSpec(
          "SHA-256",
          "MGF1",
          MGF1ParameterSpec.SHA1,
          PSource.PSpecified.DEFAULT
        )

        if(encryptionType === "RSA/ECB/OAEPWithSHA-256AndMGF1Padding") {
          cipher.init(Cipher.DECRYPT_MODE, privateKey,cipherSpec);
        }
        else {
          cipher.init(Cipher.DECRYPT_MODE,privateKey)
        }

        //decode base64 string passed in from javscript
        val encryptedStringAsBytes = Base64.decode(stringToDecrypt,Base64.DEFAULT);
        //try to decrypt bytes and resolve promise accordingly
        try {
          val decryptedString = cipher.doFinal(encryptedStringAsBytes);
          return promise.resolve(String(decryptedString))
        }
        catch(e : GeneralSecurityException) {
          return promise.resolve(e)
        }
      }
}
