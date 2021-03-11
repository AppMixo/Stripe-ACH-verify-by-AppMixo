const jwt = require("jsonwebtoken");

const getLink = async (req, res) => {
  try {
    // get userId
    const { userId } = req.query;

    if (!userId) {
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
    const token = jwt.sign({ userId }, secret);

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

//----------------------------------------------------------------------------------

module.exports = { getLink, verifyBank };
