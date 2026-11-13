-- Uruchom jednokrotnie na bazie Azure SQL / Microsoft SQL Server.
IF COL_LENGTH('dbo.reports', 'pricing_required') IS NULL
    ALTER TABLE dbo.reports ADD pricing_required BIT NOT NULL CONSTRAINT DF_reports_pricing_required DEFAULT 0;
IF COL_LENGTH('dbo.reports', 'price_accepted') IS NULL
    ALTER TABLE dbo.reports ADD price_accepted BIT NULL;
IF COL_LENGTH('dbo.reports', 'pricing_sent_at') IS NULL
    ALTER TABLE dbo.reports ADD pricing_sent_at DATETIME2 NULL;
IF COL_LENGTH('dbo.reports', 'labor_cost') IS NULL
    ALTER TABLE dbo.reports ADD labor_cost DECIMAL(10,2) NOT NULL CONSTRAINT DF_reports_labor_cost DEFAULT 0;
IF COL_LENGTH('dbo.reports', 'total_cost') IS NULL
    ALTER TABLE dbo.reports ADD total_cost DECIMAL(10,2) NOT NULL CONSTRAINT DF_reports_total_cost DEFAULT 0;

IF OBJECT_ID('dbo.report_pricing_parts', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.report_pricing_parts (
        id INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        report_id INT NOT NULL,
        item_id INT NULL,
        item_name NVARCHAR(200) NOT NULL,
        part_number NVARCHAR(100) NULL,
        quantity INT NOT NULL CONSTRAINT DF_report_pricing_parts_quantity DEFAULT 1,
        unit_price DECIMAL(10,2) NOT NULL CONSTRAINT DF_report_pricing_parts_price DEFAULT 0,
        charge_customer BIT NOT NULL CONSTRAINT DF_report_pricing_parts_charge DEFAULT 1,
        CONSTRAINT FK_report_pricing_parts_reports FOREIGN KEY (report_id) REFERENCES dbo.reports(id)
    );
    CREATE INDEX IX_report_pricing_parts_report_id ON dbo.report_pricing_parts(report_id);
END;
