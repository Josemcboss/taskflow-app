const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos
app.use(express.static(path.join(__dirname)));

// Rutas principales
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'app.html'));
});

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log('🚀 TaskFlow Server iniciado');
    console.log(`📍 Servidor corriendo en: http://localhost:${PORT}`);
    console.log(`📝 Aplicación: http://localhost:${PORT}`);
    console.log(`✅ Presiona Ctrl+C para detener el servidor\n`);
});
