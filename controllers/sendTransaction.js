const Web3 = require("web3");
const web3 = new Web3(
  "https://rinkeby.infura.io/v3/d5b76c1df2234e5e959154412701f663"
);

const axios = require("axios");
const bcrypt = require("bcrypt");

const userTransaction = require("../models/transaction");

const getBalance = (req, res) => {
  web3.eth
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

const AddTransactionDetails = async (req, res) => {
  try {
    var transact = {
      sender: req.body.sender,
      senderPrivate: req.body.senderPrivate,
      reciever: req.body.reciever,
      amount: req.body.amount,
    };
    if (
      transact.sender !== "" &&
      transact.senderPrivate !== "" &&
      transact.reciever !== "" &&
      transact.amount !== ""
    ) {
      var nonce = await web3.eth
        .getTransactionCount(transact.sender)
        .then()
        .catch((err) =>
          res.send({
            code: "400",
            status: "failed",
            errorMessage: err,
          })
        );
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
        let gasPrice = await getCurrentGasPrices()
          .then()
          .catch((err) =>
            res.send({
              code: "400",
              status: "failed",
              errorMessage: err,
            })
          );
        let object = {
          to: transact.reciever,
          value: web3.utils.toHex(
            web3.utils.toWei(transact.amount.toString(), "ether")
          ),
          gas: 21000,
          gasPrice: gasPrice.low * 1000000000,
          nonce: nonce,
          chainId: 4,
        };
        const data = await web3.eth.accounts
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
        const createReceipt = await web3.eth
          .sendSignedTransaction(data.rawTransaction)
          // .then()
          // .catch((err) => {
          //   console.log(err)
          //   res.send({
          //     code: "400",
          //     status: "failed",
          //     errorMessage: err,
          //     message: "not able to send transaction",
          //   });
          // });
        console.log(createReceipt.transactionHash);
        if (createReceipt.status) {
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
                    data: transaction,
                  });
                })
                .catch((err) => {
                  res.send({
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

const deleteAllTransactions = async (req, res) => {
  try {
    await userTransaction.deleteMany();
    res.json("All transactions are deleted");
  } catch (error) {
    res.json({
      message: error.message,
    });
  }
};

const getCurrentGasPrices = async () => {
  let response = await axios.get(
    "https://ethgasstation.info/json/ethgasAPI.json"
  );
  let prices = {
    low: response.data.safeLow / 10,
    medium: response.data.average / 10,
    high: response.data.fast / 10,
  };
  return prices;
};

module.exports = { getBalance, AddTransactionDetails, deleteAllTransactions };
