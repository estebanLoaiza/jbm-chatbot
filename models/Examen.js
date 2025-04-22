const mongoose = require('mongoose');

// Definir el esquema de examen
const examenSchema = new mongoose.Schema({
  nombre: String,
  precio: Number,
  descripcion: String
}, { 
  collection: 'examanes',
  timestamps: true // Agregar timestamps para seguimiento
});

// Middleware para logging
examenSchema.pre('save', function(next) {
  console.log('💾 Guardando examen:', this.nombre);
  next();
});

examenSchema.post('save', function(doc) {
  console.log('✅ Examen guardado:', doc.nombre);
});

examenSchema.post('find', function(docs) {
  console.log('🔍 Exámenes encontrados:', docs.length);
});

examenSchema.post('findOne', function(doc) {
  if (doc) {
    console.log('🔍 Examen encontrado:', doc.nombre);
  } else {
    console.log('❌ Examen no encontrado');
  }
});

// Verificar la colección al iniciar
mongoose.connection.on('connected', () => {
  console.log('📚 Colección configurada:', examenSchema.options.collection);
});

module.exports = mongoose.model('Examen', examenSchema);
