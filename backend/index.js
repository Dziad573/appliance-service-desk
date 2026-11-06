const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

const { sequelize, User, Report, Comment, ReportStatusHistory } = require('./models');
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

app.post('/reports', async (req, res) => {
    try {
        const {
            user_id,
            customer_name,
            customer_email,
            customer_phone,
            customer_country,
            customer_language,
            serial_number,
            serial_number_unavailable = false,
            manufacturer,
            product_model,
            purchase_date,
            issue_description,
            complaint_type
        } = req.body;

        // Formularz przesyła product_model; device_name pozostaje wymaganym
        // polem starszych widoków i kolumną NOT NULL w tabeli reports.
        const device_name = product_model || req.body.device_name;

        const newReport = await Report.create({
            user_id,
            device_name,
            customer_name,
            customer_email,
            customer_phone,
            customer_country,
            customer_language,
            serial_number: serial_number_unavailable ? null : serial_number,
            serial_number_unavailable,
            manufacturer,
            product_model,
            purchase_date,
            issue_description,
            complaint_type,
            status: 'Nowe'
        });

        res.status(201).json(newReport);
    } catch (err) {
        console.error('Błąd tworzenia zgłoszenia:', err);
        res.status(500).json({ message: 'Błąd serwera podczas tworzenia zgłoszenia' });
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




// Statusy procesu reklamacji
const REPORT_STATUSES = [
    'Nowe',
    'Przyjęte do realizacji',
    'Diagnoza',
    'W naprawie',
    'Testy / kontrola jakości',
    'Gotowe do odbioru / wysyłki'
];
const TERMINAL_STATUSES = ['Zakończona', 'Odrzucona', 'Anulowana'];
const PAUSE_REASONS = [
    'Oczekiwanie na klienta',
    'Oczekiwanie na części',
    'Oczekiwanie na dostawcę',
    'Problem techniczny',
    'Inny powód'
];

app.get('/reports/:reportId/status-history', async (req, res) => {
    try {
        const reportId = Number(req.params.reportId);
        if (!Number.isInteger(reportId) || reportId <= 0) return res.status(400).json({ message: 'Nieprawidłowy numer reklamacji' });
        const history = await ReportStatusHistory.findAll({
            where: { report_id: reportId },
            include: [{ model: User, as: 'changedBy', attributes: ['id', 'login'], required: false }],
            order: [['created_at', 'ASC'], ['id', 'ASC']]
        });
        return res.json(history);
    } catch (err) {
        console.error('Błąd pobierania historii statusów:', err);
        return res.status(500).json({ message: 'Błąd pobierania historii statusów' });
    }
});

app.patch('/reports/:reportId/status', async (req, res) => {
    try {
        const reportId = Number(req.params.reportId);
        const { status, changed_by } = req.body;
        const changedBy = changed_by == null ? null : Number(changed_by);
        if (!Number.isInteger(reportId) || reportId <= 0 || (!REPORT_STATUSES.includes(status) && !TERMINAL_STATUSES.includes(status))) {
            return res.status(400).json({ message: 'Nieprawidłowe dane zmiany statusu' });
        }
        if (changedBy !== null && (!Number.isInteger(changedBy) || changedBy <= 0)) return res.status(400).json({ message: 'Nieprawidłowy użytkownik' });
        const report = await Report.findByPk(reportId);
        if (!report) return res.status(404).json({ message: 'Nie znaleziono reklamacji' });
        if (report.is_paused) return res.status(409).json({ message: 'Najpierw wznów reklamację' });
        if (TERMINAL_STATUSES.includes(report.status)) return res.status(409).json({ message: 'Reklamacja jest już zakończona' });
        const currentIndex = REPORT_STATUSES.indexOf(report.status);
        const nextIndex = REPORT_STATUSES.indexOf(status);

        // Dozwolone zakończenia zależą od aktualnego etapu reklamacji.
        const allowedTerminalTransitions = {
            'Nowe': ['Anulowana'],
            'Diagnoza': ['Odrzucona', 'Zakończona'],
            'Gotowe do odbioru / wysyłki': ['Zakończona']
        };
        if (TERMINAL_STATUSES.includes(status)) {
            const allowed = allowedTerminalTransitions[report.status] || [];
            if (!allowed.includes(status)) {
                return res.status(409).json({ message: 'Nie można wykonać tej operacji na obecnym etapie reklamacji' });
            }
        } else if (nextIndex !== currentIndex + 1) {
            return res.status(409).json({ message: 'Można przejść tylko do kolejnego etapu procesu' });
        }
        const oldStatus = report.status;
        report.status = status;
        await report.save();
        await ReportStatusHistory.create({ report_id: reportId, old_status: oldStatus, new_status: status, action: 'status', changed_by: changedBy });
        return res.json(report);
    } catch (err) {
        console.error('Błąd zmiany statusu:', err);
        return res.status(500).json({ message: 'Błąd zmiany statusu' });
    }
});

// Dane serwisowe: edycja wyłącznie przez administratora i na właściwym etapie.
app.patch('/reports/:reportId/service-notes', async (req, res) => {
    try {
        const reportId = Number(req.params.reportId);
        const userId = Number(req.body.user_id);
        const field = req.body.field;
        const value = typeof req.body.value === 'string' ? req.body.value.trim() : '';

        if (!Number.isInteger(reportId) || reportId <= 0 || !Number.isInteger(userId) || userId <= 0 || !['diagnosis_description', 'repair_result'].includes(field)) {
            return res.status(400).json({ message: 'Nieprawidłowe dane zapisu' });
        }

        const editor = await User.findByPk(userId);
        if (!editor || editor.role !== 'admin') {
            return res.status(403).json({ message: 'Tylko administrator może uzupełniać dane serwisowe.' });
        }

        const report = await Report.findByPk(reportId);
        if (!report) return res.status(404).json({ message: 'Nie znaleziono reklamacji' });

        if (field === 'diagnosis_description' && report.status !== 'Diagnoza') {
            return res.status(409).json({ message: 'Opis diagnozy można edytować wyłącznie w statusie Diagnoza.' });
        }
        if (field === 'repair_result' && report.status !== 'Testy / kontrola jakości') {
            return res.status(409).json({ message: 'Rezultat naprawy można edytować wyłącznie w statusie Testy / kontrola jakości.' });
        }

        report[field] = value || null;
        await report.save();
        return res.json(report);
    } catch (err) {
        console.error('Błąd zapisu danych serwisowych:', err);
        return res.status(500).json({ message: 'Nie udało się zapisać danych serwisowych.' });
    }
});

app.post('/reports/:reportId/pause', async (req, res) => {
    try {
        const reportId = Number(req.params.reportId);
        const { reason, note, changed_by } = req.body;
        const changedBy = changed_by == null ? null : Number(changed_by);
        if (!Number.isInteger(reportId) || reportId <= 0 || !PAUSE_REASONS.includes(reason)) return res.status(400).json({ message: 'Wybierz prawidłowy powód wstrzymania' });
        if (changedBy !== null && (!Number.isInteger(changedBy) || changedBy <= 0)) return res.status(400).json({ message: 'Nieprawidłowy użytkownik' });
        const report = await Report.findByPk(reportId);
        if (!report) return res.status(404).json({ message: 'Nie znaleziono reklamacji' });
        if (TERMINAL_STATUSES.includes(report.status)) return res.status(409).json({ message: 'Nie można wstrzymać zamkniętej reklamacji' });
        if (report.is_paused) return res.status(409).json({ message: 'Reklamacja jest już wstrzymana' });
        report.is_paused = true;
        report.paused_at = new Date();
        report.pause_reason = reason;
        report.pause_note = typeof note === 'string' ? note.trim() : null;
        await report.save();
        await ReportStatusHistory.create({ report_id: reportId, old_status: report.status, new_status: report.status, action: 'pause', reason, note: report.pause_note, changed_by: changedBy });
        return res.json(report);
    } catch (err) {
        console.error('Błąd wstrzymywania reklamacji:', err);
        return res.status(500).json({ message: 'Błąd wstrzymywania reklamacji' });
    }
});

app.post('/reports/:reportId/resume', async (req, res) => {
    try {
        const reportId = Number(req.params.reportId);
        const changedBy = req.body.changed_by == null ? null : Number(req.body.changed_by);
        if (!Number.isInteger(reportId) || reportId <= 0) return res.status(400).json({ message: 'Nieprawidłowy numer reklamacji' });
        if (changedBy !== null && (!Number.isInteger(changedBy) || changedBy <= 0)) return res.status(400).json({ message: 'Nieprawidłowy użytkownik' });
        const report = await Report.findByPk(reportId);
        if (!report) return res.status(404).json({ message: 'Nie znaleziono reklamacji' });
        if (!report.is_paused) return res.status(409).json({ message: 'Reklamacja nie jest wstrzymana' });
        const reason = report.pause_reason;
        const note = report.pause_note;
        report.is_paused = false;
        report.paused_at = null;
        report.pause_reason = null;
        report.pause_note = null;
        await report.save();
        await ReportStatusHistory.create({ report_id: reportId, old_status: report.status, new_status: report.status, action: 'resume', reason, note, changed_by: changedBy });
        return res.json(report);
    } catch (err) {
        console.error('Błąd wznawiania reklamacji:', err);
        return res.status(500).json({ message: 'Błąd wznawiania reklamacji' });
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
        if (author.role !== 'admin') {
            return res.status(403).json({ message: 'Komentarze są dostępne wyłącznie dla administratorów.' });
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


