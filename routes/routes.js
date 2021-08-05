var express = require("express");
const sendTransaction = require("../controllers/allTransaction");
const { getBinanceBalance, sendBinanceTransaction } = require("../controllers/sendBinanceTransaction");
const { AddTransactionDetails, getBalance, deleteAllTransactions } = require("../controllers/sendTransaction");
const { getTronBalance, creteTronAccount, sendTronTransaction } = require("../controllers/tronTransaction");
var router = express.Router();

router.get("/", (req, res) => {
  res.send("welcome to the get api");
});

router.post("/sendEtherTransaction", AddTransactionDetails);
router.get('/getEtherBalance/:address',getBalance);
router.delete('/',deleteAllTransactions);
router.get('/getTronBalance/:address',getTronBalance);
router.get('/newTronAccount',creteTronAccount);
router.post('/sendTronTransaction',sendTronTransaction);
router.get('/getBinanceBalance/:address', getBinanceBalance);
router.post('/sendBinanceTransaction', sendBinanceTransaction);
router.post('/sendTransaction',sendTransaction)

module.exports = router;
