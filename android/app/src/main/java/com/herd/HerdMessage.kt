package com.herd

import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.Arguments;

import android.os.Parcelable
import android.os.Parcel

import android.util.Log

/* @Parcelize */
class HerdMessage(
  val _id : String,
  val to : String,
  val from : String,
  val text : String,
  val timestamp : Long
) : Parcelable {
  companion object {
    @JvmField
    val CREATOR = object : Parcelable.Creator<HerdMessage> {
      override fun createFromParcel(parcel : Parcel) : HerdMessage {
        return HerdMessage(parcel);
      }

      override fun newArray(size: Int) = arrayOfNulls<HerdMessage>(size)

    }

    private final val TAG = "HerdMessage";

    private fun parcelFromByteArray(bytes : ByteArray) : Parcel {
      val parcelMessage : Parcel = Parcel.obtain();
      parcelMessage.unmarshall(bytes,0,bytes.size);
      parcelMessage.setDataPosition(0);
      return parcelMessage;
    }

    public fun toWritableArray(herdMessages : ArrayList<HerdMessage>) : WritableArray {
      var messages : WritableArray = Arguments.createArray();
      try {
        for(message in herdMessages) {
          val newMessage : WritableMap = message.toWritableMap();
          messages.pushMap(newMessage)
        }
      }
      catch(e : Exception) {
        Log.e(TAG,"Error parsing herd messages",e);
      }
      return messages;
    }

    public fun toArrayList(messageArray: ReadableArray) : ArrayList<HerdMessage> {
      val messages : ArrayList<HerdMessage> = ArrayList();
      for(i in 0 until messageArray.size()) {
        val currentMessageObject = HerdMessage(messageArray.getMap(i));
        messages.add(currentMessageObject);
      }
      return messages;
    }
  }

  constructor(parcel: Parcel) : this(
    _id = parcel.readString() as String,
    to = parcel.readString() as String,
    from = parcel.readString() as String,
    text = parcel.readString() as String,
    timestamp = parcel.readLong()
  )

  constructor(messageObject : ReadableMap) : this (
    _id = messageObject.getString("_id") as String,
    to = messageObject.getString("to") as String,
    from = messageObject.getString("from") as String,
    text = messageObject.getString("text") as String,
    //getDouble is the only way to get a long from JS as it is not natively supported in JS
    timestamp = messageObject.getDouble("timestamp").toLong()
  )

  constructor(bytes: ByteArray) : this(parcelFromByteArray(bytes));

  override fun writeToParcel(parcel: Parcel, flags: Int) {
    for(entry in listOf(_id,to,from,text)) {
      parcel.writeString(entry)
    }
    parcel.writeLong(timestamp)
  }

  override fun describeContents() = 0

  public fun toWritableMap() : WritableMap {
    val messageObject : WritableMap = Arguments.createMap();
    messageObject.putString("_id",_id);
    messageObject.putString("to",to);
    messageObject.putString("from",from);
    messageObject.putString("text",text);
    //cast int to double to get 64 bit "long" in JS as JS doesnt support longs
    messageObject.putDouble("timestamp",timestamp.toDouble());
    return messageObject;
  }

  public fun toByteArray() : ByteArray {
    val messageParcel : Parcel = Parcel.obtain();
    this.writeToParcel(messageParcel,0);
    val parcelBytes = messageParcel.marshall();
    return parcelBytes;
  }
}
