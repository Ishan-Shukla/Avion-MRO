const crypto = require("crypto");

module.exports.hash = payload => {
    let SHA_SUM = crypto.createHash("sha1");
    SHA_SUM.update(payload, "utf8");
    return SHA_SUM.digest("hex");
}