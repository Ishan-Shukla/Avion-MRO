var express = require("express");
var router = express.Router();
const {query, invoke} = require("../scripts/hyperledger");
const {decode} = require("../scripts/token");

router.get("/", async function(req, res) {
  //validate if administrator or not
  let tokenData;
  try {
    tokenData = await decode(req.headers.authorization);
    //if not authorized administrator
    if (tokenData.type !== "administrator") {
      return res.sendStatus(401);
    }
  } catch (e) {
    console.log(e);
    return res.sendStatus(401);
  }

  // console.log(req.body);
  // if (Object.keys(req.body).length !== 1 || !req.body.company) {
  //   return res.sendStatus(400);
  // }

  try {
    const maintainers = await query([
      "getMaintainers",
      tokenData.company //get company from token data
    ]);
    res.send(maintainers);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

router.post("/", async function(req, res) {
  //validate if administrator or not
  try {
    const tokenData = await decode(req.headers.authorization);
    //if not authorized administrator
    if (
      tokenData.type !== "administrator" ||
      req.body.company !== tokenData.company
    ) {
      return res.sendStatus(401);
    }
  } catch (e) {
    console.log(e);
    return res.sendStatus(401);
  }

  if (
    Object.keys(req.body).length !== 3 ||
    !req.body.username ||
    !req.body.tailNumber ||
    !req.body.company
  ) {
    return res.sendStatus(400);
  }

  try {
    await invoke([
      "assignAircraft",
      req.body.username,
      req.body.tailNumber,
      req.body.company
    ]);
    res.sendStatus(200);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

router.patch("/", async function(req, res) {
  //validate if administrator or not
  let tokenData;
  try {
    tokenData = await decode(req.headers.authorization);
    //if not authorized administrator
    if (tokenData.type !== "administrator") {
      return res.sendStatus(401)
    }
  } catch (e) {
    console.log(e);
    return res.sendStatus(401);
  }

  if (
    Object.keys(req.body).length !== 2 ||
    !req.body.company ||
    !req.body.tailNumber ||
    req.body.company == tokenData.company //cannot sell aircraft to self
  ) {
    return res.sendStatus(400);
  }

  try {
    await invoke([
      "sellAircraft",
      req.body.tailNumber,
      req.body.company
    ]);
    res.sendStatus(200);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

module.exports = router;
