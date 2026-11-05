const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

const { sequelize, User, Report, Comment } = require('./models');
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

// Pobieranie pojedynczej reklamacji
app.get('/report/:reportId', async (req, res) => {
    try {
        const { reportId } = req.params;

        const report = await Report.findByPk(reportId);

        if (!report) {
            return res.status(404).json({
                message: 'Nie znaleziono reklamacji'
            });
        }

        res.json(report);

    } catch (err) {
        console.error('Błąd pobierania reklamacji:', err);

        res.status(500).json({
            message: 'Błąd serwera'
        });
    }
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

// Pobieranie pojedynczej reklamacji po ID
app.get('/reports/detail/:reportId', async (req, res) => {
    try {
        const reportId = Number(req.params.reportId);

        if (!Number.isInteger(reportId) || reportId <= 0) {
            return res.status(400).json({
                message: 'Nieprawidłowy numer reklamacji'
            });
        }

        const report = await Report.findByPk(reportId);

        if (!report) {
            return res.status(404).json({
                message: `Reklamacja o ID ${reportId} nie istnieje w bazie danych`
            });
        }

        return res.status(200).json(report);

    } catch (err) {
        console.error('Błąd pobierania pojedynczej reklamacji:', err);

        return res.status(500).json({
            message: 'Błąd serwera podczas pobierania reklamacji'
        });
    }
});


// Komentarze reklamacji
app.get('/reports/:reportId/comments', async (req, res) => {
    try {
        const reportId = Number(req.params.reportId);

        if (!Number.isInteger(reportId) || reportId <= 0) {
            return res.status(400).json({ message: 'Nieprawidłowy numer reklamacji' });
        }

        const report = await Report.findByPk(reportId);
        if (!report) {
            return res.status(404).json({ message: 'Nie znaleziono reklamacji' });
        }

        const comments = await Comment.findAll({
            where: { report_id: reportId },
            include: [
                { model: User, as: 'author', attributes: ['id', 'login'] },
                {
                    model: Comment,
                    as: 'parent',
                    attributes: ['id', 'content', 'user_id', 'created_at']
                }
            ],
            order: [['created_at', 'ASC'], ['id', 'ASC']]
        });

        return res.json(comments);
    } catch (err) {
        console.error('Błąd pobierania komentarzy:', err);
        return res.status(500).json({ message: 'Błąd serwera podczas pobierania komentarzy' });
    }
});

app.post('/reports/:reportId/comments', async (req, res) => {
    try {
        const reportId = Number(req.params.reportId);
        const userId = Number(req.body.user_id);
        const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
        const parentCommentId = req.body.parent_comment_id == null
            ? null
            : Number(req.body.parent_comment_id);

        if (!Number.isInteger(reportId) || reportId <= 0 ||
            !Number.isInteger(userId) || userId <= 0 ||
            !content || !Number.isSafeInteger(content.length) ||
            (parentCommentId !== null && (!Number.isInteger(parentCommentId) || parentCommentId <= 0))) {
            return res.status(400).json({ message: 'Nieprawidłowe dane komentarza' });
        }

        const report = await Report.findByPk(reportId);
        if (!report) {
            return res.status(404).json({ message: 'Nie znaleziono reklamacji' });
        }

        const author = await User.findByPk(userId);
        if (!author) {
            return res.status(404).json({ message: 'Nie znaleziono użytkownika' });
        }

        if (parentCommentId !== null) {
            const parent = await Comment.findOne({
                where: { id: parentCommentId, report_id: reportId }
            });
            if (!parent) {
                return res.status(400).json({
                    message: 'Komentarz nadrzędny nie istnieje lub należy do innej reklamacji'
                });
            }
        }

        const comment = await Comment.create({
            report_id: reportId,
            user_id: userId,
            parent_comment_id: parentCommentId,
            content
        });

        const result = await Comment.findByPk(comment.id, {
            include: [
                { model: User, as: 'author', attributes: ['id', 'login'] },
                {
                    model: Comment,
                    as: 'parent',
                    attributes: ['id', 'content', 'user_id', 'created_at']
                }
            ]
        });

        return res.status(201).json(result);
    } catch (err) {
        console.error('Błąd dodawania komentarza:', err);
        return res.status(500).json({ message: 'Błąd serwera podczas dodawania komentarza' });
    }
});

app.listen(port, () => {
    console.log(`Backend works at http://localhost:${port}`);
});


