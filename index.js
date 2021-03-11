require("dotenv").config();
const cors = require("cors");
const chalk = require("chalk");
const path = require("path");

//----------------------------------------------------------------------------------

const userRouter = require("./server/routes/user");

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

app.use("/bank-details", (req, res) => {
  res.sendFile(path.join(__dirname, "view", "bank_details.html"));
});

app.use("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "view", "index.html"));
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
