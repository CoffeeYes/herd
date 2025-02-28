package com.herd

import com.herd.HerdMessage;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;

import android.util.Log;
import android.os.Parcel;
import android.content.Context

class StorageInterface(val context : Context) {
  private final val TAG = "HerdStorageInterface";

  fun convertIntToBytes(int : Int) : ByteArray {
    return byteArrayOf(
      int.toByte(),
      int.shr(8).toByte(),
      int.shr(16).toByte(),
      int.shr(24).toByte(),
    )
  }

  fun convertBytesToInt(bytes : ByteArray) : Int {
    return ((bytes[3].toInt() shl 24) or
    (bytes[2].toInt() and 0xff shl 16) or
    (bytes[1].toInt() and 0xff shl 8) or
    (bytes[0].toInt() and 0xff));
  }

  fun writeToStorage(filename : String, value : ByteArray) {
    try {
      val outputStream : FileOutputStream = context.openFileOutput(filename,Context.MODE_PRIVATE);
      outputStream.write(value);
      outputStream.close();
      Log.i(TAG,"Wrote ${value.size} bytes to file $filename");
    }
    catch(e : Exception) {
      Log.e(TAG,"Error opening fileoutputstream for $filename",e);
    }
  }

  fun readFromStorage(filename : String) : ByteArray {
    var buffer : ByteArray = byteArrayOf();
    val tempFile = File(context.getFilesDir(),filename);
    if(tempFile.exists()) {
      Log.i(TAG,"Found Storage File $filename");
      val inputStream = FileInputStream(tempFile);
      var finishedReading : Boolean = false;
      //read until EOF is reached
      while(!finishedReading) {
        val currentByte : Int = inputStream.read();
        if(currentByte == -1) {
          finishedReading = true;
        }
        else {
          buffer += currentByte.toByte();
        }
      }
      inputStream.close();
    }
    else {
      Log.i(TAG,"Temporary Storage file $filename does not exist, cannot read from it");
    }
    Log.i(TAG,"Read ${buffer.size} bytes from storage file $filename");
    return buffer;
  }

  fun writeMessagesToStorage(queue : ArrayList<HerdMessage>,messagesFilename : String, sizesFilename : String) {
    var buffer : ByteArray = byteArrayOf();
    var messageSizesBytes : ByteArray = byteArrayOf();
    for(message in queue) {
      val messageBytes = message.toByteArray();
      messageSizesBytes += convertIntToBytes(messageBytes.size);
      buffer += messageBytes;
    }
    Log.i(TAG,"Message Sizes being written : ${messageSizesBytes.size}, $messageSizesBytes")
    writeToStorage(sizesFilename,messageSizesBytes);
    writeToStorage(messagesFilename,buffer);
  }

  fun readMessagesFromStorage(messagesFilename : String, sizesFilename : String) : ArrayList<HerdMessage> {
    var queue : ArrayList<HerdMessage> = arrayListOf();
    var buffer : ByteArray = readFromStorage(messagesFilename);
    val messageSizesBytes : ByteArray = readFromStorage(sizesFilename);
    var messageSizes : ArrayList<Int> = arrayListOf();
    //each int is made up of 4 bytes, here we iterate over the raw byteArray in 4 byte steps to convert the bytes to ints
    Log.d(TAG,"[readMessagesFromStorage] messageSizeBytes Length : ${messageSizesBytes.size}, mod 4 ? : ${messageSizesBytes.size % 4 == 0}")
    val maxBufferPos = messageSizesBytes.size - 4;
    for(bufferPos in 0..maxBufferPos step 4) {
      val tempBuffer = messageSizesBytes.copyOfRange(bufferPos,bufferPos + 4)
      messageSizes.add(convertBytesToInt(tempBuffer));
    }
    Log.i(TAG,"Storage Message Bytes : ${messageSizesBytes.size}, Sizes : $messageSizes");
    var bufferPos = 0;
    for(size in messageSizes) {
      val messageBytes = buffer.copyOfRange(bufferPos,bufferPos + size);
      queue.add(HerdMessage(messageBytes));
      bufferPos += size;
    }
    return queue;
  }

  fun deleteFile(filename : String) : Boolean {
    var success : Boolean = false;
    try {
      val file = File(context.getFilesDir(),filename);
      if(file.exists()) {
        success =  file.delete();
      }
      else {
        success = true;
      }
    }
    catch(e : Exception) {
      Log.e(TAG,"Error deleting file $filename",e);
      success = false;
    }
    finally {
      return success;
    }
  }

  fun deleteStoredMessages(messagesFilename : String, sizesFilename : String) : Boolean {
    val deletedSizes = deleteFile(sizesFilename);
    val deletedMessages = deleteFile(messagesFilename);
    return deletedSizes && deletedMessages;
  }
}
