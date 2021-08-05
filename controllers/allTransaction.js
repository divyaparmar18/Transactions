const Web3 = require("web3");
const web3 = new Web3(
  "https://rinkeby.infura.io/v3/d5b76c1df2234e5e959154412701f663"
);

const Web3bsc = require("web3");
const web3Bsc = new Web3bsc(
  new Web3bsc.providers.HttpProvider(
    "https://bsc-testnet.web3api.com/v1/PYZWGFC14F62GINMGK76QK8Z16ZB6J26MZ"
  )
);

const TronWeb = require("tronweb");
const tronWeb = new TronWeb(
  "https://api.shasta.trongrid.io/",
  "https://api.shasta.trongrid.io/",
  "https://api.shasta.trongrid.io/",
  "ddf27b6a88885d767f41966d76f36ee5863db360b5339dd104b6cb47188f2fd4"
  //   "18e11966d9920b67e9ebd775caca7ec1c24d01bf"
);

const bcrypt = require("bcrypt");

const userTransaction = require("../models/transactions");

const sendTransaction = async (req, res) => {
  const { sender, reciever, amount, currency, privateKey } = req.body;
  try {
    if (
      sender !== "" &&
      privateKey !== "" &&
      reciever !== "" &&
      amount !== "" &&
      currency !== ""
    ) {
      var transact = {
        sender: sender,
        privateKey: privateKey,
        reciever: reciever,
        amount: amount,
        txId: "",
        currency: currency,
      };
      switch (currency) {
        case "ETH":
          web3.eth.getBalance(transact.sender, async (err, result) => {
            if (err) {
              console.log(err);
            }
            let balance = await web3.utils.fromWei(result, "ether");
            if (balance < transact.amount) {
              res.send({
                code: "400",
                status: "FAILED",
                message: " insufficient balance",
              });
              console.log("insufficient balance");
            }
            let object = {
              to: transact.reciever,
              value: web3.utils.toHex(
                web3.utils.toWei(transact.amount.toString(), "ether")
              ),
              gas: 21000,
            };

            const data = await web3.eth.accounts
              .signTransaction(object, transact.privateKey)
              .then()
              .catch((err) =>
                res.send({
                  code: "400",
                  status: "failed",
                  errorMessage: err,
                  message: "not able to sign transaction",
                })
              );
            const createReceipt = await web3.eth
              .sendSignedTransaction(data.rawTransaction)
              .then()
              .catch((err) =>
                res.send({
                  code: "400",
                  status: "failed",
                  errorMessage: err,
                  message: "not able to send signed transaction",
                })
              );
            console.log(createReceipt.transactionHash);
            if (createReceipt.status) {
              transact.txId = createReceipt.transactionHash;
              const newTransaction = new userTransaction(transact);
              bcrypt.genSalt(5, (err, salt) => {
                bcrypt.hash(newTransaction.privateKey, salt, (err, hash) => {
                  if (err) {
                    res.send({
                      err: err,
                      message: "not able to hash privatekey",
                    });
                  }
                  newTransaction.privateKey = hash;
                  newTransaction
                    .save()
                    .then((transaction) => {
                      res.send({
                        code: "200",
                        status: "success",
                        message: "data saved and transaction succesful",
                        data: {
                          sender: transaction.sender,
                          reciever: transaction.reciever,
                          amount: transaction.amount,
                          transactionId: transaction.txId,
                        },
                      });
                    })
                    .catch((err) =>
                res.send({
                  code: "400",
                  status: "failed",
                  errorMessage: err,
                  message: "Not saved... something went wrong",
                })
              );
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
          break;

        case "TRX":
          await tronWeb.trx.getBalance(transact.sender, async (err, result) => {
            if (err) {
              console.log(err);
              res.send({
                code: "400",
                status: "failed",
                errorMessage: err,
                message: "not getting balance",
              });
            }
            let balance = await tronWeb.fromSun(result);
            if (balance < transact.amount) {
              res.send({
                code: "400",
                status: "FAILED",
                message: " insufficient balance",
              });
            }

            const tradeobj = await tronWeb.transactionBuilder
              .sendTrx(transact.reciever, transact.amount, transact.sender)
              .then()
              .catch((err) =>
                res.send({
                  code: "400",
                  status: "failed",
                  errorMessage: err,
                  message: "not able to send transaction",
                })
              );
            const signedtxn = await tronWeb.trx
              .sign(tradeobj, transact.privateKey)
              .then()
              .catch((err) =>
                res.send({
                  code: "400",
                  status: "failed",
                  errorMessage: err,
                  message: "not able to signtransaction",
                })
              );
            const receipt = await tronWeb.trx
              .sendRawTransaction(signedtxn)
              .then()
              .catch((err) =>
                res.send({
                  code: "400",
                  status: "failed",
                  errorMssage: err,
                  message: "not able to send raw trnsaction",
                })
              );
            console.log("- Output:", receipt.result, "\n");
            if (receipt.result) {
              transact.txId = receipt.txid;
              const newTransaction = new userTransaction(transact);
              bcrypt.genSalt(5, (err, salt) => {
                bcrypt.hash(newTransaction.privateKey, salt, (err, hash) => {
                  if (err) throw err;
                  newTransaction.privateKey = hash;

                  newTransaction
                    .save()
                    .then((transaction) => {
                      res.send({
                        code: "200",
                        status: "success",
                        message: "data saved and transaction succesful",
                        data: {
                          sender: transaction.sender,
                          reciever: transaction.reciever,
                          amount: transaction.amount,
                          transactionId: transaction.txId,
                        },
                      });
                    })
                    .then()
                    .catch((err) =>
                      res.send({
                        code: "400",
                        status: "failed",
                        errorMessage: err,
                        message: "NOT SAVED... something went wrong",
                      })
                    );
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
          break;

        case "BSC":
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

            const data = await web3Bsc.eth.accounts
              .signTransaction(object, transact.privateKey)
              .then()
              .catch((err) =>
                res.send({
                  code: "400",
                  status: "failed",
                  errorMessage: err,
                  message: "not able to sign transaction",
                })
              );

            const createReceipt = await web3Bsc.eth
              .sendSignedTransaction(data.rawTransaction)
              .then()
              .catch((err) =>
                res.send({
                  code: "400",
                  status: "failed",
                  errorMessage: err,
                  message: "not able to send sign transaction",
                })
              );

            console.log(createReceipt.transactionHash);
            if (createReceipt.status) {
              transact.txId = createReceipt.transactionHash;

              const newTransaction = new userTransaction(transact);
              bcrypt.genSalt(5, (err, salt) => {
                bcrypt.hash(newTransaction.privateKey, salt, (err, hash) => {
                  newTransaction.privateKey = hash;
                  newTransaction
                    .save()
                    .then((transaction) => {
                      res.send({
                        code: "200",
                        status: "success",
                        message: "data saved and transaction succesful",
                        data: {
                          sender: transaction.sender,
                          reciever: transaction.reciever,
                          amount: transaction.amount,
                          transactionId: transaction.txId,
                        },
                      });
                    })
                    .catch((err) =>
                      res.send({
                        code: "400",
                        status: "failed",
                        errorMessage: err,
                        message: "something went wrong",
                      })
                    );
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
          break;

        default:
          res.status(404);
          res.json({
            code: "404",
            status: "Not Found",
            message: "Coin not listed",
          });
      }
    } else {
      res.send({
        code: "404",
        status: "invalid input",
        message: "all details are requires",
      });
    }
  } catch (error) {
    res.send({
      err: error,
    });
  }
};

module.exports = sendTransaction;
