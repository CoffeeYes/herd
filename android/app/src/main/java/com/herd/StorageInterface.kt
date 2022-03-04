package com.herd

import com.herd.HerdMessage;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;

import android.util.Log;
import android.os.Parcel;
import android.content.Context

class StorageInterface(val context : Context) {
  private final val TAG = "StorageInterface";

  fun writeToCache(filename : String, value : ByteArray) {
    var tempFile : File = File(context.getCacheDir(),filename);
    if(!tempFile.exists()) {
      Log.i(TAG,"Requested cache file $filename did not exist, creating it.")
      tempFile = File.createTempFile(filename,null,context.getCacheDir());
    }
    if(!tempFile.exists()) {
      Log.i(TAG,"Error creating temporary cache file $filename");
    }
    try {
      val outputStream : FileOutputStream = FileOutputStream(tempFile);
      outputStream.write(value);
      outputStream.close();
    }
    catch(e : Exception) {
      Log.e(TAG,"Error opening fileoutputstream for $filename",e);
    }
  }

  fun readFromCache(filename : String) : ByteArray {
    var buffer : ByteArray = byteArrayOf();
    val tempFile = File(context.getCacheDir(),filename);
    if(tempFile.exists()) {
      Log.i(TAG,"Found Cache File $filename");
      val inputStream = FileInputStream(tempFile);
      var finishedReading : Boolean = false;
      //read until EOF is reached
      while(!finishedReading) {
        val currentByte : Int = inputStream.read();
        if(currentByte == -1) {
          finishedReading = true;
          break;
        }
        else {
          buffer += currentByte.toByte();
        }
      }
      inputStream.close();
    }
    else {
      Log.i(TAG,"Temporary Cache file $filename does not exist, cannot read from it");
    }
    Log.i(TAG,"Read ${buffer.size} bytes from cache file $filename");
    return buffer;
  }

  fun writeMessageQueueToCache(queue : ArrayList<HerdMessage>) {
    var buffer : ByteArray = byteArrayOf();
    val messageSizes : ArrayList<Int> = arrayListOf();
    var messageSizesBytes : ByteArray = byteArrayOf();
    for(message in queue) {
      val messageParcel : Parcel = Parcel.obtain();
      message.writeToParcel(messageParcel,0);
      val parcelBytes = messageParcel.marshall();
      messageSizes.add(parcelBytes.size)
      buffer += parcelBytes;
    }
    for(item in messageSizes) {
      messageSizesBytes += item.toByte();
    }
    writeToCache("savedMessageQueueSizes",messageSizesBytes);
    writeToCache("savedMessageQueue",buffer);
  }

  fun readMessageQueueFromCache() : ArrayList<HerdMessage> {
    var queue : ArrayList<HerdMessage> = arrayListOf();
    var buffer : ByteArray = readFromCache("savedMessageQueue");
    val messageSizesBytes : ByteArray = readFromCache("savedMessageQueueSizes");
    var messageSizes : ArrayList<Int> = arrayListOf();
    for(item in messageSizesBytes) {
      messageSizes.add(item.toInt());
    }
    Log.i(TAG,"Cache Message Bytes : ${messageSizesBytes.size}");
    Log.i(TAG,"Cache Message Sizes : $messageSizes");
    for(size in messageSizes) {
      //create Message from bytes and add to array
      val parcelMessage : Parcel = Parcel.obtain();
      parcelMessage.unmarshall(buffer,0,size);
      parcelMessage.setDataPosition(0);
      val message : HerdMessage = HerdMessage.CREATOR.createFromParcel(parcelMessage);
      queue.add(message);
      //remove messageBytes from front of buffer
      buffer = buffer.copyOfRange(size,buffer.lastIndex + 1);
    }
    return queue;
  }
}
