const express = require("express");
const router = express.Router();
const {query} = require("../scripts/hyperledger");

router.get("/", async function(req, res) {
  let companies = await query([
    "getCompanies"
  ]);
  console.log(companies);
  res.send(companies);
});

module.exports = router;
