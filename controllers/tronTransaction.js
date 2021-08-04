const TronWeb = require("tronweb");
const tronWeb = new TronWeb(
  "https://api.shasta.trongrid.io/",
  "https://api.shasta.trongrid.io/",
  "https://api.shasta.trongrid.io/",
  "ddf27b6a88885d767f41966d76f36ee5863db360b5339dd104b6cb47188f2fd4"
  //   "18e11966d9920b67e9ebd775caca7ec1c24d01bf"
);
const bcrypt = require("bcrypt");

const userTronTransaction = require("../models/tronTransaction");

const getTronBalance = async (req, res) => {
  await tronWeb.trx
    .getBalance(req.params.address)
    .then((balance) => {
      res.status(200);
      res.json({
        code: "200",
        status: "OK",
        message: "Successful",
        data: {
          balance: tronWeb.fromSun(balance),
        },
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(400);
      res.json({
        code: "400",
        status: "failed",
        message: "not able to get bslance",
      });
    });
};

const creteTronAccount = async (req, res) => {
  try {
    const acc = await tronWeb.createAccount();
    res.send(acc);
  } catch (error) {
    res.send(error);
  }
};

const sendTronTransaction = async (req, res) => {
  try {
    var transact = {
      sender: req.body.sender,
      senderPrivate: req.body.senderPrivate,
      reciever: req.body.reciever,
      amount: req.body.amount,
    };
    await tronWeb.trx.getBalance(transact.sender, async (err, result) => {
      if (err) {
        console.log(err);
        res.send({
          code : '400',
          status : 'failed',
          errorMessage : err,
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
            code : '400',
            status : 'failed',
            errorMessage : err,
          })
        );
      const signedtxn = await tronWeb.trx
        .sign(tradeobj, transact.senderPrivate)
        .then()
        .catch((err) =>
          res.send({
            code : '400',
            status : 'failed',
            errorMessage: err,
          })
        );
      const receipt = await tronWeb.trx
        .sendRawTransaction(signedtxn)
        .then()
        .catch((err) =>
          res.send({
            code : '400',
            status : 'failed',
            errorMssage: err,
          })
        );
      console.log("- Output:", receipt.result, "\n");
      if (receipt.result) {
        const newTransaction = new userTronTransaction(transact);
        bcrypt.genSalt(5, (err, salt) => {
          bcrypt.hash(newTransaction.senderPrivate, salt, (err, hash) => {
            if (err) throw err;
            newTransaction.senderPrivate = hash;

            newTransaction
              .save()
              .then((transaction) => {
                res.send({
                  code: "200",
                  status: "success",
                  message: "data saved and transaction succesful",
                  data: transaction,
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
  } catch (error) {
    res.send({
      code : '400',
      status : 'failed',
      errorMessage : err
    });
    console.log("errrrrr", error);
  }
};

module.exports = { getTronBalance, creteTronAccount, sendTronTransaction };
