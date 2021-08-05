"use strict";

const mongoose = require("mongoose");
// const autoIncrement = require("mongoose-auto-increment");

const binanceTransactionSchema = mongoose.Schema({
  sender : String,
  reciever: String,
  amount: String,
  senderPrivate : String,
  txId : String,
  date: {
    type: Date,
    default: Date.now,
  },

});



const binanceTransaction = mongoose.model("binanceTransaction", binanceTransactionSchema);
module.exports = binanceTransaction;

