require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { MessagingResponse } = require('twilio').twiml;

require('./db'); // conecta mongoose
const Examen = require('./models/Examen');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

async function getIntent(texto) {
  try {
    const res = await axios.get('https://api.wit.ai/message', {
      headers: {
        Authorization: process.env.WIT_API_TOKEN,
      },
      params: { q: texto },
    });

    const intent = res.data.intents[0];
    return intent ? intent.name : null;
  } catch (err) {
    console.error('❌ Error con Wit.ai:', err);
    return null;
  }
}

app.post('/webhook', async (req, res) => {
  const mensaje = req.body.Body.toLowerCase();
  const twiml = new MessagingResponse();

  const intent = await getIntent(mensaje);
  let respuesta = 'Disculpa, no entendí tu mensaje. ¿Puedes reformularlo?';

  console.log("intent: ", intent);
  switch (intent) {
    case 'get_price':
      const examen = await Examen.findOne({
        nombre: { $regex: mensaje, $options: 'i' }
      });

      if (examen) {
        respuesta = `💉 *${examen.nombre}*\n💵 Precio: $${examen.precio}\nℹ️ ${examen.descripcion}`;
      } else {
        respuesta = 'No encontré ese examen. ¿Podrías ser más específico?';
      }
      break;

    case 'get_location':
      respuesta = '🏥 Estamos en Av. Salud 123, Santiago.';
      break;

    case 'get_hours':
      respuesta = '📅 Atendemos de lunes a viernes de 8:00 a 18:00 y sábados hasta las 13:00.';
      break;

    case 'get_info':
      respuesta = '👩‍🔬 Somos un laboratorio especializado en exámenes clínicos. ¡Con gusto te ayudamos!';
      break;
  }

  twiml.message(respuesta);
  res.writeHead(200, { 'Content-Type': 'text/xml' });
  res.end(twiml.toString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🤖 Bot activo en puerto ${PORT}`);
});
