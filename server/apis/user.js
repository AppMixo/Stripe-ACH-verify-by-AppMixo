const jwt = require("jsonwebtoken");
const Plaid = require("plaid");
const Stripe = require("stripe");


//----------------------------------------------------------------------------------

const getLink = async (req, res) => {
  try {
    // get userId
    const { userId, type } = req.query;

    if (!userId || !type) {
      return res.status(400).send({
        status: 400,
        message: "user id not found",
      });
    }

    // check if customer does exist
    /**
     * initalize the stripe
     */

    const Stripe = require("stripe");
    const { STRIPE_SECRET: stripeSecret } = process.env;

    if (!stripeSecret) {
      console.log(chalk.red.inverse("stripe keys not found"));
    }

    const stripe = Stripe(stripeSecret);

    const customer = await stripe.customers.retrieve(userId);

    if (!customer) {
      return res.status(400).send({
        status: 400,
        message: "customer not found",
      });
    }

    // get jwt secret
    const { JWT_SECRET: secret, HOST: host } = process.env;

    if (!host || !secret) {
      return res.status(500).send({
        message: "internal server error",
        status: 500,
      });
    }

    // get jwt
    const token = jwt.sign({ userId, type }, secret);

    return res.status(200).send({
      status: 200,
      url: `${host}/bank-details/${token}`,
    });
  } catch (error) {
    console.log("error in getLink api", error);
    return res.status(500).send({
      status: 500,
      message: error.raw.message,
    });
  }
};

const verifyBank = async (req, res) => {
  try {
    const {
      token: userToken,
      holderName,
      accountNumber,
      routingNumber,
      accountType,
    } = req.body;

    if (
      !userToken ||
      !holderName ||
      !accountNumber ||
      !routingNumber ||
      !accountType
    ) {
      return res.status(500).send({
        status: 400,
        message: "invalid parameters",
      });
    }

    // get jwt secret
    const { JWT_SECRET: jwtSecret } = process.env;

    // get userid from userToken
    const { userId } = await jwt.verify(userToken, jwtSecret);

    /**
     * initalize the stripe
     */

    const Stripe = require("stripe");
    const { STRIPE_SECRET: stripeSecret } = process.env;

    if (!stripeSecret) {
      console.log(chalk.red.inverse("stripe keys not found"));
    }

    const stripe = Stripe(stripeSecret);

    var customer = await stripe.customers.retrieve(userId);

    if (!customer) {
      return res.status(400).send({
        status: 400,
        message: "customer not found",
      });
    }

    /**
     * create a token
     */
    const token = (
      await stripe.tokens.create({
        bank_account: {
          country: "US",
          currency: "usd",
          routing_number: routingNumber,
          account_number: accountNumber,
          account_holder_name: holderName,
          account_holder_type: accountType,
        },
      })
    ).id;

    /**
     * attach a bank details with customer
     */

    customer = await stripe.customers.update(userId, {
      source: token,
    });

    return res.status(200).send({
      status: 200,
    });
  } catch (error) {
    console.log("error in verify bank api", error);
    return res.status(500).send({
      status: 500,
      message: error.raw.message,
    });
  }
};

const plaidVerify = async (req, res) => {

  try {

    const { publicToken, accountId, token } = req.body;

    if (!publicToken || !accountId || !token) {
      return res.status(400).send({
        status: 400,
        message: "parameters not found"
      })
    }


    const { PLAID_CLIENT_ID: plaidClientId, PLAID_SECRET: plaidSecret, PLAID_MODE: plaidMode } = process.env;

    if (!plaidClientId || !plaidMode || !plaidSecret) console.log(chalk.red.inverse("Plaid env not found"));

    if (!["production", "sandbox"].includes(plaidMode)) console.log(chalk.red.inverse("invalid plaid mode, please select 'sandbox' or 'production'"));

    var plaidClient = new Plaid.Client({
      clientID: plaidClientId,
      secret: plaidSecret,
      env: Plaid.environments[plaidMode],
    });

    const accessToken = (await plaidClient.exchangePublicToken(publicToken)).access_token;

    if (!accessToken) {
      return res.status(400).send({
        status: 400,
        message: "error in getting exchange public token"
      })
    }

    const bankAccountToken = (await plaidClient.createStripeToken(accessToken, accountId)).stripe_bank_account_token;

    if (!bankAccountToken) {
      return res.status(400).send({
        status: 400,
        message: "error in getting bank account token"
      })
    }

    const { STRIPE_SECRET: stripeSecret } = process.env;

    if (!stripeSecret) {
      console.log(chalk.red.inverse("stripe keys not found"));
    }

    // get jwt secret
    const { JWT_SECRET: jwtSecret } = process.env;

    // get userid from userToken
    const { userId } = await jwt.verify(token, jwtSecret);

    if (!userId) {
      return res.status(400).send({
        status: 400,
        message: "There is some error in fetching userId"
      })
    }

    const stripe = Stripe(stripeSecret);

    await stripe.customers.update(userId, {
      source: bankAccountToken,
    });

    return res.status(200).send({
      status: 200
    })
  } catch (error) {
    console.log("error in plaid verify api", error);
    return res.status(500).send({
      status: 500,
      message: error.raw.message,
    });
  }
}

//----------------------------------------------------------------------------------

module.exports = { getLink, verifyBank, plaidVerify };
