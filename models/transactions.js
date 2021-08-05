"use strict";

const mongoose = require("mongoose");
// const autoIncrement = require("mongoose-auto-increment");

const sendTransactionSchema = mongoose.Schema({
  sender: String,
  reciever: String,
  amount: String,
  privateKey: String,
  txId: String,
  currency: String,
  date: {
    type: Date,
    default: Date.now,
  },
});

const sendTransaction = mongoose.model("sendTransaction", sendTransactionSchema);
module.exports = sendTransaction;
