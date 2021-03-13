require("dotenv").config();
const cors = require("cors");
const chalk = require("chalk");
const path = require("path");
const jwt = require("jsonwebtoken");
const fs = require("fs");

//----------------------------------------------------------------------------------

const userRouter = require("./server/routes/user");

const Plaid = require("plaid");
const Stripe = require("stripe");
const clientUserId = 'Stripe test';


const { PLAID_CLIENT_ID: plaidClientId, PLAID_SECRET: plaidSecret, PLAID_MODE: plaidMode } = process.env;

if (!plaidClientId || !plaidMode || !plaidSecret) {
  console.log(chalk.red.inverse("Plaid env not found"));
  process.exit(1);
}

if (!["production", "sandbox", "development"].includes(plaidMode)) {
  console.log(chalk.red.inverse("invalid plaid mode, please select 'sandbox' or 'production'"));
  process.exit(1);
}

var plaidClient = new Plaid.Client({
  clientID: plaidClientId,
  secret: plaidSecret,
  env: Plaid.environments[plaidMode],
});

//----------------------------------------------------------------------------------

/**
 * create a server
 */

const express = require("express");
const app = express();
const port = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "view")));

app.use("/api", userRouter);


app.use("/bank-details/:token", async (req, res) => {

  /**
   * get token
   */


  const { token } = req.params;

  if (!token) {
    return res.send(400).status({
      status: 400,
      message: "token not found"
    })
  }


  // get jwt secret
  const { JWT_SECRET: jwtSecret } = process.env;

  // get userid from userToken
  const { userId, type } = await jwt.verify(token, jwtSecret);

  if (type === "plaid") {

    const tokenRes = await plaidClient.createLinkToken({
      user: {
        client_user_id: clientUserId,
      },
      client_name: "My App",
      products: ["auth"],
      country_codes: ["US"],
      language: "en"
    })

    const token = tokenRes.link_token;

    const htmlPath = path.join(__dirname, "view", "plaid.html");
    let html = fs.readFileSync(htmlPath, "utf-8").toString().replace("<%token%>", token);
    res.setHeader("Content-Type", "text/html");
    res.status(200);
    return res.send(html);

  }
  else {
    return res.sendFile(path.join(__dirname, "view", "bank_details.html"));
  }

});

app.use("/bank-details", (req, res) => {
  return res.status(400).send({ status: 400, message: "token not found" })
})

app.use("/*", (req, res) => {
  return res.sendFile(path.join(__dirname, "view", "index.html"));
});

//----------------------------------------------------------------------------------

// /**
//  * initalize the stripe
//  */

// const Stripe = require("stripe");
// const { STRIPE_SECRET: secret } = process.env;

// if (!secret) {
//   console.log(chalk.red.inverse("stripe keys not found"));
// }

// const stripe = Stripe(secret);

// (async () => {
//   try {
//     /**
//      * create a token
//      */
//     const token = (
//       await stripe.tokens.create({
//         bank_account: {
//           country: "US",
//           currency: "usd",
//           routing_number: "110000000",
//           account_number: "000123456789",
//           account_holder_name: "Nirav Pansuriya",
//           account_holder_type: "individual",
//         },
//       })
//     ).id;

//     /**
//      * attach a bank details with customer
//      */

//     const customer = await stripe.customers.update("cus_J5uK46ilSswL6A", {
//       source: token,
//     });

//     /**
//      * verify source
//      */

//      const bankAccount = await stripe.customers.verifySource(
//         customer.id,
//         customer.default_source,
//         {
//           amounts: [32, 45],
//         }
//       );

//       console.log("bankAccount",bankAccount);
//   } catch (error) {
//     console.log("error", error);
//   }
//   try {
//     const charge = await stripe.charges.create({
//       amount: 2000,
//       currency: "usd",
//       description: "My First Test Charge (created for API docs)",
//       customer: "cus_J5uoITO2MP99DF",
//       source: "ach_credit_transfer",
//     });
//     console.log("charge", charge);
//   } catch (error) {
//     console.log("error", error);
//   }
// })();

//----------------------------------------------------------------------------------

/**
 * start the server
 */

app.listen(port, () => {
  console.log(chalk.green.inverse(`server is running on the port ${port}`));
});
