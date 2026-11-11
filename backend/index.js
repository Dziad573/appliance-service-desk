const express = require('express');
const cors = require('cors');
const app = express();
const port = Number(process.env.PORT || 3001);

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

const { sequelize, User, Report, Comment, ReportStatusHistory, Brand, Item, Warehouse, Resource } = require('./models');
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

app.post('/register', async (req, res) => {
    try {
        const { login, password, role } = req.body;

        const existingUser = await User.findOne({ where: { login } });
        if (existingUser) {
            return res.status(400).json({ message: 'Użytkownik o takim loginie już istnieje.' });
        }

        const newUser = await User.create({
            login,
            password,
            role: role || 'user'
        });

        res.status(201).json({
            id: newUser.id,
            login: newUser.login,
            role: newUser.role
        });
    } catch (err) {
        console.error('Błąd rejestracji:', err);
        res.status(500).json({ message: 'Błąd serwera podczas rejestracji.' });
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
            item_id,
            custom_device = false,
            purchase_date,
            issue_description,
            complaint_type
        } = req.body;

        let selectedItem = null;
        if (!custom_device) {
            if (!item_id) return res.status(400).json({ message: 'Wybierz urządzenie z katalogu lub zaznacz urządzenie spoza katalogu.' });
            selectedItem = await Item.findByPk(Number(item_id), { include: [{ model: Brand, as: 'brand' }] });
            if (!selectedItem || !selectedItem.is_active || selectedItem.item_type !== 'device') return res.status(400).json({ message: 'Wybrane urządzenie nie istnieje lub nie jest dostępne.' });
        }
        const finalManufacturer = custom_device ? manufacturer : selectedItem.brand.brand_name;
        const finalModel = custom_device ? product_model : (selectedItem.model_number || selectedItem.item_name);
        const device_name = finalModel || req.body.device_name;

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
            manufacturer: finalManufacturer,
            product_model: finalModel,
            item_id: custom_device ? null : selectedItem.id,
            custom_device,
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


// ===== KATALOG I MAGAZYN =====
app.get('/inventory/brands', async (req, res) => {
  try { res.json(await Brand.findAll({ order: [['brand_name', 'ASC']] })); }
  catch (e) { console.error(e); res.status(500).json({ message: 'Nie udało się pobrać marek.' }); }
});
app.post('/inventory/brands', async (req, res) => {
  try {
    const brand_name = String(req.body.brand_name || '').trim();
    if (!brand_name) return res.status(400).json({ message: 'Podaj nazwę marki.' });
    res.status(201).json(await Brand.create({ brand_name }));
  } catch (e) { res.status(400).json({ message: 'Marka już istnieje lub dane są nieprawidłowe.' }); }
});
app.delete('/inventory/brands/:id', async (req, res) => {
  try {
    const brand = await Brand.findByPk(Number(req.params.id));
    if (!brand) return res.status(404).json({ message: 'Nie znaleziono marki.' });
    const linkedItems = await Item.count({ where: { brand_id: brand.id } });
    if (linkedItems > 0) return res.status(409).json({ message: 'Nie można usunąć marki, do której przypisano itemy. Najpierw usuń lub przenieś powiązane pozycje.' });
    await brand.destroy();
    res.json({ message: 'Marka została usunięta.' });
  } catch (e) { res.status(500).json({ message: 'Nie udało się usunąć marki.' }); }
});
app.get('/inventory/items', async (req, res) => {
  try {
    const where = req.query.activeOnly === 'true' ? { is_active: true } : {};
    res.json(await Item.findAll({ where, include: [{ model: Brand, as: 'brand', attributes: ['id', 'brand_name'] }], order: [['item_name', 'ASC']] }));
  } catch (e) { console.error(e); res.status(500).json({ message: 'Nie udało się pobrać katalogu.' }); }
});
app.post('/inventory/items', async (req, res) => {
  try {
    const { brand_id, item_type, item_name, model_number, part_number, purchase_price, sale_price, description } = req.body;
    if (!brand_id || !['device', 'component', 'other'].includes(item_type) || !String(item_name || '').trim()) return res.status(400).json({ message: 'Uzupełnij markę, typ i nazwę pozycji.' });
    res.status(201).json(await Item.create({ brand_id: Number(brand_id), item_type, item_name: String(item_name).trim(), model_number: model_number || null, part_number: part_number || null, purchase_price: purchase_price === '' ? null : purchase_price, sale_price: sale_price === '' ? null : sale_price, description: description || null }));
  } catch (e) { console.error(e); res.status(400).json({ message: 'Nie udało się dodać pozycji. Sprawdź dane i wybraną markę.' }); }
});
app.patch('/inventory/items/:id', async (req, res) => {
  try {
    const item = await Item.findByPk(Number(req.params.id));
    if (!item) return res.status(404).json({ message: 'Nie znaleziono pozycji.' });
    await item.update({ is_active: req.body.is_active === false ? false : true });
    res.json(item);
  } catch (e) { res.status(500).json({ message: 'Nie udało się zmienić pozycji.' }); }
});
app.get('/inventory/warehouses', async (req, res) => {
  try { res.json(await Warehouse.findAll({ order: [['warehouse_name', 'ASC']] })); }
  catch (e) { res.status(500).json({ message: 'Nie udało się pobrać magazynów.' }); }
});
app.post('/inventory/warehouses', async (req, res) => {
  try {
    const { warehouse_name, warehouse_type, department } = req.body;
    if (!String(warehouse_name || '').trim() || !['new', 'refurbished', 'broken'].includes(warehouse_type)) return res.status(400).json({ message: 'Podaj nazwę i prawidłowy typ magazynu.' });
    res.status(201).json(await Warehouse.create({ warehouse_name: warehouse_name.trim(), warehouse_type, department: department || null }));
  } catch (e) { res.status(400).json({ message: 'Nie udało się dodać magazynu.' }); }
});
app.get('/inventory/resources', async (req, res) => {
  try {
    res.json(await Resource.findAll({ include: [{ model: Item, as: 'item', include: [{ model: Brand, as: 'brand', attributes: ['brand_name'] }] }, { model: Warehouse, as: 'warehouse' }], order: [['id', 'DESC']] }));
  } catch (e) { console.error(e); res.status(500).json({ message: 'Nie udało się pobrać stanów magazynowych.' }); }
});
// Przyjęcie dostawy: zwiększa stan istniejącej pozycji albo tworzy nowy rekord zasobu.
app.post('/inventory/receipts', async (req, res) => {
  try {
    const item_id = Number(req.body.item_id), warehouse_id = Number(req.body.warehouse_id), quantity = Number(req.body.quantity);
    if (!Number.isInteger(item_id) || !Number.isInteger(warehouse_id) || !Number.isInteger(quantity) || quantity <= 0) return res.status(400).json({ message: 'Podaj pozycję, magazyn i ilość większą od zera.' });
    const [resource] = await Resource.findOrCreate({ where: { item_id, warehouse_id }, defaults: { item_id, warehouse_id, quantity: 0 } });
    await resource.increment('quantity', { by: quantity });
    await resource.reload();
    res.status(201).json(resource);
  } catch (e) { console.error(e); res.status(400).json({ message: 'Nie udało się przyjąć dostawy.' }); }
});

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('[DB] Connection established.');

        // Local SQLite can create its own schema. Production Azure SQL is changed only
        // through the reviewed SQL migration in database/.
        if (sequelize.getDialect() === 'sqlite') {
            await sequelize.sync();
            console.log('[DB] Local SQLite schema is ready.');
        }

        app.listen(port, () => {
            console.log(`Backend works at http://localhost:${port}`);
        });
    } catch (error) {
        console.error('[DB] Could not initialize database:', error.message);
        process.exit(1);
    }
}

startServer();


