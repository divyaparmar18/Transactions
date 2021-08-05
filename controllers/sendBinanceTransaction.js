const Web3bsc = require("web3");
const web3Bsc = new Web3bsc(
  new Web3bsc.providers.HttpProvider(
    "https://bsc-testnet.web3api.com/v1/PYZWGFC14F62GINMGK76QK8Z16ZB6J26MZ"
  )
);

const userTransaction = require("../models/binanceTransaction");

const axios = require("axios");
const bcrypt = require("bcrypt");



const getBinanceBalance = async (req, res) => {
  await web3Bsc.eth
    .getBalance(req.params.address)
    .then((bal) => {
      res.status(200).send({
        balance: bal,
        success: true,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send({
        success: false,
        message: "not able to get the balance ",
        err: err,
      });
    });
};

const sendBinanceTransaction = async (req, res) => {
  try {
    var transact = {
      sender: req.body.sender,
      senderPrivate: req.body.senderPrivate,
      reciever: req.body.reciever,
      amount: req.body.amount,
      txId : ""
    };
    if (
      transact.sender !== "" &&
      transact.senderPrivate !== "" &&
      transact.reciever !== "" &&
      transact.amount !== ""
    ) {
      web3Bsc.eth.getBalance(transact.sender, async (err, result) => {
        if (err) {
          console.log(err);
        }
        let balance = await web3Bsc.utils.fromWei(result, "ether");
        if (balance < transact.amount) {
          res.send({
            code: "400",
            status: "FAILED",
            message: " insufficient balance",
          });
          console.log("insufficient balance");
        }
        let object = {
          from: transact.sender,
          to: transact.reciever,
          value: web3Bsc.utils.toWei(transact.amount, "ether"),
          gas: "22100",
        };
        console.log(object);
        const data = await web3Bsc.eth.accounts
          .signTransaction(object, transact.senderPrivate)
          .then()
          .catch((err) =>
            res.send({
              code: "400",
              status: "failed",
              errorMessage: err,
              message: "not able to sign",
            })
          );
        const createReceipt = await web3Bsc.eth
          .sendSignedTransaction(data.rawTransaction)
          .then()
          .catch((err) => {
            console.log(err);
            res.send({
              code: "400",
              status: "failed",
              errorMessage: err,
              message: "not able to send transaction",
            });
          });
        console.log(createReceipt.transactionHash);
        if (createReceipt.status) {
          transact.txId = createReceipt.transactionHash;

          const newTransaction = new userTransaction(transact);
          bcrypt.genSalt(5, (err, salt) => {
            bcrypt.hash(newTransaction.senderPrivate, salt, (err, hash) => {
              newTransaction.senderPrivate = hash;
              newTransaction
                .save()
                .then((transaction) => {
                  res.send({
                    code: "200",
                    status: "success",
                    message: "data saved and transaction succesful",
                    data: {
                      sender : transaction.sender,
                    reciever : transaction.reciever,
                    amount : transaction.amount,
                    transactionId : transaction.txId
                    }
                  });
                })
                .catch((err) => {
                  res.status(400).send({
                    code: "400",
                    status: "FAILED",
                    message: " NOT SAVED... something went wrong",
                    err: err,
                  });
                });
            });
          });
        } else {
          res.status(400).send({
            code: "400",
            status: "failed",
            message: "unable to do the transaction",
          });
        }
      });
    } else {
      res.status(400).send({
        code: "404",
        status: "invalid input",
        message: "all details are requires",
      });
    }
  } catch (error) {
    res.status(404).send({
      code: "400",
      status: "failed",
      message: "something went wrong",
      err: error,
    });
    console.log({
      message: "something went wrong",
      err: error,
    });
  }
};

module.exports = { getBinanceBalance, sendBinanceTransaction };
