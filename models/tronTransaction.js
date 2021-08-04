"use strict";

const mongoose = require("mongoose");
// const autoIncrement = require("mongoose-auto-increment");

const tronTransactionSchema = mongoose.Schema({
  sender : String,
  reciever: String,
  amount: String,
  senderPrivate : String,
  date: {
    type: Date,
    default: Date.now,
  },

});



const tronTransaction = mongoose.model("tronTransaction", tronTransactionSchema);
module.exports = tronTransaction;

