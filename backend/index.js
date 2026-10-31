const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

const { sequelize, User, Report } = require('./models');
const { Op } = require('sequelize');

app.use(express.json());

sequelize.authenticate()
    .then(() => console.log('Sequelize connected to Azure SQL'))
    .catch(err => console.error('Connect error:', err));

app.post('/login', async (req, res) => {
    const { login, password } = req.body;

    try {
        const user = await User.findOne({
            where: { login, password }
        });

        if (!user) return res.status(401).json({ message: 'Invalid login or password' });

        res.json({
            id: user.id,
            login: user.login,
            role: user.role
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});
app.get('/', (req, res) => {
    res.send('USWB działa');
});

app.get('/reports', async (req, res) => {
    try {
        const reports = await Report.findAll();
        res.json(reports);
    } catch (err) {
        console.error('Błąd pobierania zgłoszeń:', err);
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

app.get('/reports/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const reports = await Report.findAll({
            where: { user_id: userId }
        });
        res.json(reports);
    } catch (err) {
        console.error('Błąd pobierania zgłoszeń:', err);
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

app.listen(port, () => {
    console.log(`Backend works at http://localhost:${port}`);
});


