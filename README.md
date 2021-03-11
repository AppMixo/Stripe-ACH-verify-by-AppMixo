# Stripe ACH verify by AppMixo

### Environment Variables

- STRIPE_SECRET -> Secret key of Stripe
- JWT_SECRET -> Random generated string 
- HOST -> Host Url (Ex. https://abc.com)
- PORT -> Port on which one want to run the server

### Steps to follow

- Take a clone of the repository
- Set the environment variables as mentiond above
- Fire the command "npm install"
- After that fire the command "npm start"
- And server will be started

### Work Flow

- Go to the HOST Url
- Enter the customer id and click the submit, it will copy one url in a clipboard
- Send the url to the user of whom one want to verify ACH
- This will open one form, once user will fill up the details there, small random amounts will be deposit in user's account
- Ask those amounts to the user and fill these amounts by visiting Stripe dashboard customer's payment method.
- Work Done!!!


## Author

* **[AppMixo®	](https://appmixo.com)** 

