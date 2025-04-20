require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { MessagingResponse } = require('twilio').twiml;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/webhook', (req, res) => {
  const incomingMsg = req.body.Body.toLowerCase();
  const twiml = new MessagingResponse();

  let responseMessage = 'Disculpa, no entendí tu mensaje.';

  if (incomingMsg.includes('precio')) {
    responseMessage = 'Nuestros exámenes básicos tienen un precio desde $15.000 CLP. ¿Quieres ver el listado completo?';
  } else if (incomingMsg.includes('horario')) {
    responseMessage = 'Atendemos de lunes a viernes de 08:00 a 18:00 hrs y sábado de 09:00 a 13:00.';
  } else if (incomingMsg.includes('direccion') || incomingMsg.includes('ubicación')) {
    responseMessage = 'Estamos en Av. Las Ciencias 1234, Santiago. Puedes encontrarnos en Google Maps 😉';
  }

  twiml.message(responseMessage);
  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Bot escuchando en http://localhost:${PORT}`);
});
