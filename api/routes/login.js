const express = require("express");
const router = express.Router();
const crypto = require("../scripts/hash");
const {query, invoke} = require("../scripts/hyperledger");
const {encode} = require("../scripts/token");

router.post("/", async function(req, res) {
  const postType = req.body.postType;
  delete req.body.postType;

  //validate user object
  console.log(
    typeof req.body,
    req.body,
    Object.keys(req.body).length !== 4,
    !req.body.username,
    !req.body.password,
    !req.body.type,
    !req.body.company
  );
  if (
    Object.keys(req.body).length !== 4 ||
    !req.body.username ||
    !req.body.password ||
    !req.body.type ||
    !req.body.company
  ) {
    return res.sendStatus(400);
  }

  // pre-processing
  req.body.password = crypto.hash(req.body.password); //hash password for storage
  req.body.type = req.body.type.toLowerCase();
  req.body.company = req.body.company.toLowerCase();

  try {
    if (postType === "login") {
      const jwtToken = await encode(req.body);

      const user = await query([
        "checkUser",
        JSON.stringify(req.body)
      ]);

      //return user object if passwords match
      if (user.password == req.body.password) {
        res.send({ user, jwtToken });
      } else {
        res.send(false);
      }
    } else {
      await invoke([
        "registerUser",
        JSON.stringify(req.body)
      ]);
      res.sendStatus(200);
    }
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

module.exports = router;
