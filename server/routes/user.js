const express = require("express");
const router = express.Router();

//----------------------------------------------------------------------------------

const userApis = require("../apis/user");

//----------------------------------------------------------------------------------

/**
 * GET
 */

router.get("/link", userApis.getLink);

/**
 * POST
 */

router.post("/verify", userApis.verifyBank);
//----------------------------------------------------------------------------------

module.exports = router;
