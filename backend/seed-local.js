const { sequelize, User, Brand, Item, Warehouse, Resource } = require('./models');

async function seed() {
    await sequelize.authenticate();
    if (sequelize.getDialect() !== 'sqlite') {
        throw new Error('Seed is available only for the local SQLite database.');
    }
    await sequelize.sync();

    const accounts = [
        { login: 'admin', password: 'admin123', role: 'admin' },
        { login: 'customer', password: 'customer123', role: 'user' }
    ];
    for (const account of accounts) {
        await User.findOrCreate({ where: { login: account.login }, defaults: account });
    }

    const brandNames = ['Bosch', 'Samsung', 'Whirlpool'];
    const brands = {};
    for (const brand_name of brandNames) {
        const [brand] = await Brand.findOrCreate({ where: { brand_name } });
        brands[brand_name] = brand;
    }

    const catalog = [
        { brand_id: brands.Bosch.id, item_type: 'device', item_name: 'Pralka Serie 4', model_number: 'WAN2427KPL', purchase_price: 1200, sale_price: 1699 },
        { brand_id: brands.Samsung.id, item_type: 'device', item_name: 'Pralka EcoBubble', model_number: 'WW80T554DAE', purchase_price: 1400, sale_price: 1999 },
        { brand_id: brands.Whirlpool.id, item_type: 'device', item_name: 'Zmywarka WFO', model_number: 'WFO3T1236P', purchase_price: 1100, sale_price: 1599 },
        { brand_id: brands.Bosch.id, item_type: 'component', item_name: 'Pompa odpływowa', part_number: 'PMP-BSH-001', purchase_price: 85, sale_price: 145 },
        { brand_id: brands.Samsung.id, item_type: 'component', item_name: 'Filtr pompy', part_number: 'FLT-SAM-001', purchase_price: 18, sale_price: 35 }
    ];
    for (const item of catalog) {
        await Item.findOrCreate({ where: { brand_id: item.brand_id, item_name: item.item_name }, defaults: item });
    }

    const warehouseDefinitions = [
        { warehouse_name: 'Magazyn główny', warehouse_type: 'new', department: 'Serwis' },
        { warehouse_name: 'Magazyn części regenerowanych', warehouse_type: 'refurbished', department: 'Serwis' },
        { warehouse_name: 'Magazyn uszkodzonych', warehouse_type: 'broken', department: 'Serwis' }
    ];
    const warehouses = {};
    for (const definition of warehouseDefinitions) {
        const [warehouse] = await Warehouse.findOrCreate({ where: { warehouse_name: definition.warehouse_name }, defaults: definition });
        warehouses[definition.warehouse_type] = warehouse;
    }

    const parts = await Item.findAll({ where: { item_type: 'component' } });
    for (const item of parts) {
        await Resource.findOrCreate({
            where: { item_id: item.id, warehouse_id: warehouses.new.id },
            defaults: { item_id: item.id, warehouse_id: warehouses.new.id, quantity: item.item_name === 'Pompa odpływowa' ? 8 : 20 }
        });
    }

    console.log('Local demo data is ready:');
    console.log('  admin / admin123');
    console.log('  customer / customer123');
    console.log('Demo brands, devices, components, warehouses and stock have been created.');
}

seed()
    .catch((error) => {
        console.error('Could not seed local database:', error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await sequelize.close();
    });
