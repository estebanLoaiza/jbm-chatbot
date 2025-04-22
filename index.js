require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const twilio = require('twilio');
const { MessagingResponse } = twilio.twiml;
const mongoose = require('mongoose');

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
    const examenEntity = res.data.entities['examen_nombre:examen_nombre']?.[0]?.value || null;

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
      respuesta = '👋 ¡Hola! ¿Te gustaría conocer nuestros *servicios*, *horarios* o *ubicación*?';
      break;

    case 'get_service':
      respuesta = '🔬 Realizamos los siguientes servicios: \n ✅ Consultas Médicas, \n ✅ Examenes de Laboratorio, \n ✅ Orinentacion en ETS, \n ✅ Examens ETS, \n ✅ Vacunatorio. \n Para más información sobre precios, te invitamos a contactarnos.';
      break;

    case 'get_location':
      respuesta = '📍 Estamos ubicados en Paseo Ahumada 370 (Metro Plaza de Armas), Oficina 728. Santiago.';
      break;

    case 'get_hours':
      respuesta = '⏰ Nuestro horario es:\n- Lunes a Viernes: 08:00 a 18:00\n- Sábado: 08:00 a 13:00\n- Domingo: Cerrado';
      break;

    case 'get_price':
      if (examenEntity) {
        console.log("🔍 Buscando examen:", examenEntity);
        const examen = await Examen.findOne({ 
          nombre: { 
            $regex: examenEntity, 
            $options: 'i' 
          } 
        });

        // Obtener todos los exámenes disponibles
        console.log('🔍 Iniciando búsqueda de exámenes...');
        const examenes = await Examen.find({}, 'nombre precio descripcion');
        console.log('📊 Resultados de la búsqueda:', examenes);
        console.log('📝 Número de exámenes encontrados:', examenes.length);
        
        let listaExamenes = '🔬 *Exámenes disponibles:*\n\n';
        
        if (examenes.length === 0) {
          console.log('⚠️ No se encontraron exámenes en la base de datos');
          listaExamenes = 'No hay exámenes disponibles en este momento.';
        } else {
          examenes.forEach((ex, index) => {
            console.log(`📋 Examen ${index + 1}:`, ex);
            listaExamenes += `💉 *${ex.nombre}*\n💵 $${ex.precio}\n${ex.descripcion || ''}\n\n`;
          });
        }
        
        listaExamenes += 'Para más información, te invitamos a contactarnos.';
        
        if (examen) {
          respuesta = `💉 *${examen.nombre}*\n💵 Precio: $${examen.precio}\nℹ️ ${examen.descripcion || 'Para más información, contáctanos.'}\n\n${listaExamenes}`;
        } else {
          respuesta = `No encontré un examen llamado *${examenEntity}*. Aquí te mostramos todos nuestros exámenes:\n\n${listaExamenes}`;
        }
      } else {
        respuesta = '¿De qué examen te gustaría saber el precio? Preguntame "cuanto cuesta un examen de sangre". De todas maneras te invitamos a contactarnos para más información.';
      }
      break;

    case 'farewell':
      respuesta = '👋 ¡Gracias por contactarnos! Que tengas un excelente día.';
      break;

    case 'fallback':
    default:
      respuesta = 'Disculpa, no entendí tu mensaje. ¿Te gustaría conocer nuestros *horarios*, *servicios* o *ubicación*?';
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

// Endpoint de prueba para verificar MongoDB
app.get('/test-db', async (req, res) => {
  try {
    console.log('🔍 Probando conexión a MongoDB...');
    
    // Verificar estado de la conexión
    const estadoConexion = mongoose.connection.readyState;
    console.log('📊 Estado de la conexión:', estadoConexion);
    
    // Listar todas las colecciones
    const colecciones = await mongoose.connection.db.listCollections().toArray();
    console.log('📚 Colecciones disponibles:', colecciones.map(c => c.name));
    
    // Verificar datos en cada colección similar
    const coleccionesExamenes = ['examenes', 'examanes', 'examens'];
    const resultados = {};
    
    for (const coleccion of coleccionesExamenes) {
      try {
        const datos = await mongoose.connection.db.collection(coleccion).find({}).toArray();
        console.log(`🔬 Datos en ${coleccion}:`, datos);
        resultados[coleccion] = datos;
      } catch (error) {
        console.error(`❌ Error al leer ${coleccion}:`, error);
        resultados[coleccion] = { error: error.message };
      }
    }
    
    res.json({
      estado: 'success',
      conexion: estadoConexion === 1 ? 'conectado' : 'desconectado',
      colecciones: colecciones.map(c => c.name),
      resultados: resultados
    });
  } catch (error) {
    console.error('❌ Error en test-db:', error);
    res.status(500).json({
      estado: 'error',
      mensaje: error.message
    });
  }
});

// Endpoint para limpiar y migrar datos
app.get('/cleanup-db', async (req, res) => {
  try {
    console.log('🧹 Iniciando limpieza de base de datos...');
    
    // 1. Obtener datos de la colección correcta
    const datosCorrectos = await mongoose.connection.db.collection('examanes').find({}).toArray();
    console.log('📊 Datos encontrados:', datosCorrectos.length);
    
    // 2. Crear colección correcta si no existe
    await mongoose.connection.db.createCollection('examenes');
    
    // 3. Insertar datos en la colección correcta
    if (datosCorrectos.length > 0) {
      await mongoose.connection.db.collection('examenes').insertMany(datosCorrectos);
      console.log('✅ Datos migrados a la colección correcta');
    }
    
    // 4. Eliminar colecciones duplicadas
    await mongoose.connection.db.collection('examanes').drop();
    await mongoose.connection.db.collection('examens').drop();
    console.log('🗑️ Colecciones duplicadas eliminadas');
    
    res.json({
      estado: 'success',
      mensaje: 'Base de datos limpiada y migrada correctamente',
      datos_migrados: datosCorrectos.length
    });
  } catch (error) {
    console.error('❌ Error en cleanup-db:', error);
    res.status(500).json({
      estado: 'error',
      mensaje: error.message
    });
  }
});
