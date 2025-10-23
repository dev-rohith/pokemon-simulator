require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const { connectDatabase } = require('./config/database');
const pokemonRoutes = require('./routes/pokemon.routes');
const authRoutes = require('./routes/auth.routes');
const battleRoutes = require('./routes/battle.routes');

const app = express();
const PORT = process.env.PORT || 3000;

const accessLogPath = path.join(__dirname, '..', 'access.log');

app.use(morgan('combined', { stream: '' }));


app.use(helmet());
app.use(cors());

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Pokemon Battle Simulator API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      pokemon: '/api/pokemon',
      pokemonDetails: '/api/pokemon/:name',
      battle: '/api/battle',
      battles: '/api/battle (GET)',
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/pokemon', pokemonRoutes);
app.use('/api/battle', battleRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});



if (require.main === module) {
  connectDatabase()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      });
    })
    .catch((error) => {
      console.error('Failed to start server:', error);
      process.exit(1);
    });
}

module.exports = app;
