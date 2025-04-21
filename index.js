require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const twilio = require('twilio');
const { MessagingResponse } = twilio.twiml;

require('./db'); // Conexión Mongoose
const Examen = require('./models/Examen');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// 👉 Wit.ai: detectar intención y nombre del examen si viene
async function getIntent(texto) {
  try {
    const res = await axios.get('https://api.wit.ai/message', {
      headers: { Authorization: process.env.WIT_API_TOKEN },
      params: { q: texto },
    });

    const intent = res.data.intents?.[0]?.name || null;
    const examenEntity = res.data.entities['examen:examen']?.[0]?.value || null;

    return { intent, examenEntity };
  } catch (err) {
    console.error('❌ Error con Wit.ai:', err);
    return { intent: null, examenEntity: null };
  }
}

app.post('/webhook', async (req, res) => {
  const mensaje = req.body.Body.toLowerCase();
  const numero = req.body.From;

  res.set('Content-Type', 'text/xml');
  res.send('<Response></Response>'); // responder al webhook de inmediato

  const { intent, examenEntity } = await getIntent(mensaje);
  let respuesta = 'Disculpa, no entendí tu mensaje. ¿Puedes reformularlo?';

  console.log("🧠 Intent:", intent, "🔬 Examen:", examenEntity);

  switch (intent) {
    case 'greetings':
      respuesta = '👋 ¡Hola! ¿Te gustaría conocer nuestros *horarios*, *precios* o *ubicación*?';
      break;

    case 'get_info':
      respuesta = '👨‍🔬 Somos un laboratorio clínico que ofrece exámenes como antígeno, PCR, orina, sangre y más.';
      break;

    case 'get_location':
      respuesta = '📍 Estamos ubicados en Av. Salud 123, Santiago (cerca de Metro Estación Central).';
      break;

    case 'get_hours':
      respuesta = '⏰ Nuestro horario es:\n- Lunes a Viernes: 08:00 a 18:00\n- Sábado: 08:00 a 13:00\n- Domingo: Cerrado';
      break;

    case 'get_price':
      respuesta = 'Te invitamos a que te pongas en contacto con nosotros para obtener el precio de los exámenes.';
      break;
      // if (examenEntity) {
      //   const examen = await Examen.findOne({ nombre: { $regex: examenEntity, $options: 'i' } });
      //   if (examen) {
      //     respuesta = `💉 *${examen.nombre}*\n💵 Precio: $${examen.precio}\nℹ️ ${examen.descripcion}`;
      //   } else {
      //     respuesta = `No encontré un examen llamado *${examenEntity}*. ¿Quieres que te muestre exámenes parecidos?`;
      //   }
      // } else {
      //   respuesta = '¿De qué examen te gustaría saber el precio? Por ejemplo: *Antígeno*, *PCR*, *Hemograma*...';
      // }
      break;

    case 'get_services':
      respuesta = '🔬 Realizamos los siguientes exámenes:\n- Antígeno\n- PCR\n- Hemograma\n- Orina\n- Perfil Lipídico\n...\n(Responde el nombre para conocer el precio)';
      break;

    case 'farewell':
      respuesta = '👋 ¡Gracias por contactarnos! Que tengas un excelente día.';
      break;

    case 'fallback':
    default:
      respuesta = 'Disculpa, no entendí tu mensaje. ¿Podrías escribirlo de otra manera?';
  }

  await new Promise(resolve => setTimeout(resolve, 1800)); // efecto "escribiendo..."
  
  try {
    await client.messages.create({
      from: 'whatsapp:+14155238886',
      to: numero,
      body: respuesta
    });
  } catch (error) {
    if (error.message.includes('exceeded the 9 daily messages limit')) {
      console.error('⚠️ Se ha alcanzado el límite diario de mensajes de Twilio');
      // No enviamos mensaje al usuario ya que no podemos enviar más mensajes
    } else {
      console.error('❌ Error al enviar mensaje:', error);
      // Intentamos enviar un mensaje de error al usuario
      try {
        await client.messages.create({
          from: 'whatsapp:+14155238886',
          to: numero,
          body: 'Lo siento, estamos experimentando problemas técnicos. Por favor, intenta más tarde.'
        });
      } catch (e) {
        console.error('❌ No se pudo enviar el mensaje de error:', e);
      }
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🤖 Bot activo en puerto ${PORT}`);
});
