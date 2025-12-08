const express = require('express');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: path.resolve(__dirname, './.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database
connectDB();


const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');

const corsOptions = {
    origin: 'https://shiftloopleads.netlify.app',
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);

// --- Error Handling ---
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);





// This middleware should be the last one.
// It catches all other routes and sends the index.html file.
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
