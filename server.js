require('dotenv').config();
console.log('TONCONNECT_SECRET:', process.env.TONCONNECT_SECRET); // Отладочный вывод

const express = require('express');
const { TonConnectServer, AuthRequestTypes } = require('@tonapps/tonconnect-server');

const app = express();
const port = 3000;

const tonconnect = new TonConnectServer({ 
    staticSecret: process.env.TONCONNECT_SECRET 
});

// Endpoint для генерации authRequest
app.get('/authRequest', (req, res) => {
    const request = tonconnect.createRequest({
        image_url: 'https://ddejfvww7sqtk.cloudfront.net/images/landing/ton-nft-tegro-dog/avatar/image_d0315e1461.jpg',
        callback_url: `http://193.203.162.185:${port}/tonconnect`,
        items: [{
            type: AuthRequestTypes.ADDRESS,
            required: true
        }, {
            type: AuthRequestTypes.OWNERSHIP,
            required: true
        }],
    });

    res.json(request);
});

// Callback endpoint
app.get('/tonconnect', async (req, res) => {
    try {
        const response = tonconnect.decodeResponse(req.query.tonlogin);

        console.log('response', response);

        for (let payload of response.payload) {
            switch (payload.type) {
                case AuthRequestTypes.OWNERSHIP: 
                    const isVerified = await tonconnect.verifyTonOwnership(payload, response.client_id);

                    if (isVerified) {
                        console.log(`ton-ownership is verified for ${payload.address}`);
                    } else {
                        console.log(`ton-ownership is NOT verified`);
                    }

                    break;
                case AuthRequestTypes.ADDRESS: 
                    console.log(`ton-address ${payload.address}`);
                    break;
            }
        }
        res.send('Authorization successful!');
    } catch (err) {
        console.log(err);
        res.status(500).send('Error decoding response');
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://193.203.162.185:${port}`);
});
