"use strict";

const mongoose = require("mongoose");
// const autoIncrement = require("mongoose-auto-increment");

const transactionSchema = mongoose.Schema({
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



const transaction = mongoose.model("transaction", transactionSchema);
module.exports = transaction;

