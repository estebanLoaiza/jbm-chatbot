const mongoose = require('mongoose');

// Configurar eventos de conexión
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB conectado a la base de datos:', mongoose.connection.db.databaseName);
  console.log('📚 Colecciones disponibles:', mongoose.connection.collections);
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Error en la conexión a MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB desconectado');
});

// Conectar a MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  dbName: 'chatbot',
}).then(() => {
  console.log('✅ Conectado a MongoDB Atlas');
  console.log('🔗 URI de conexión:', process.env.MONGO_URI);
}).catch((err) => {
  console.error('❌ Error de conexión a MongoDB:', err);
});
