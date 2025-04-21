require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { MessagingResponse } = require('twilio').twiml;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

async function getWitIntent(message) {
  try {
    const res = await axios.get('https://api.wit.ai/message', {
      headers: {
        Authorization: process.env.WIT_API_TOKEN,
      },
      params: {
        q: message,
      },
    });

    console.log("res.data: ", res.data);
    const intent = res.data.intents[0];
    return intent ? intent.name : null;

  } catch (err) {
    console.error('Error llamando a Wit.ai:', err);
    return null;
  }
}

app.post('/webhook', async (req, res) => {
  const incomingMsg = req.body.Body;
  const twiml = new MessagingResponse();

  console.log("incomingMsg: ", incomingMsg);
  const intent = await getWitIntent(incomingMsg);

  let responseMessage = 'Disculpa, no entendí tu mensaje. ¿Puedes reformularlo?';

  switch (intent) {
    case 'get_price':
      responseMessage = 'Nuestros exámenes básicos parten desde $15.000. ¿Quieres el valor de alguno específico?';
      break;
    case 'get_location':
      responseMessage = 'Estamos en Av. Las Ciencias 1234, Santiago 🏥';
      break;
    case 'get_hours':
      responseMessage = 'Nuestro horario es de lunes a viernes de 8:00 a 18:00 y sábados hasta las 13:00 ⏰';
      break;
  }

  twiml.message(responseMessage);
  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🤖 Bot corriendo en http://localhost:${PORT}`);
});
