/*
  Dokumenty magazynowe – przyjęcia, wydania i powiązania z reklamacjami.
  Uruchomić jednorazowo na Azure SQL przed wdrożeniem nowego backendu.
*/
IF OBJECT_ID(N'dbo.stock_documents', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.stock_documents (
        id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_stock_documents PRIMARY KEY,
        direction NVARCHAR(10) NOT NULL,
        warehouse_id INT NOT NULL,
        reference_report_id INT NULL,
        source_type NVARCHAR(40) NOT NULL CONSTRAINT DF_stock_documents_source_type DEFAULT N'manual',
        notes NVARCHAR(MAX) NULL,
        created_by INT NULL,
        created_at DATETIME2 NOT NULL CONSTRAINT DF_stock_documents_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT CK_stock_documents_direction CHECK (direction IN (N'in', N'out')),
        CONSTRAINT FK_stock_documents_warehouse FOREIGN KEY (warehouse_id) REFERENCES dbo.warehouses(id),
        CONSTRAINT FK_stock_documents_report FOREIGN KEY (reference_report_id) REFERENCES dbo.reports(id),
        CONSTRAINT FK_stock_documents_user FOREIGN KEY (created_by) REFERENCES dbo.users(id)
    );
    CREATE INDEX IX_stock_documents_direction_created_at ON dbo.stock_documents(direction, created_at DESC);
    CREATE INDEX IX_stock_documents_reference_report_id ON dbo.stock_documents(reference_report_id);
END;
GO

IF OBJECT_ID(N'dbo.stock_document_items', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.stock_document_items (
        id INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_stock_document_items PRIMARY KEY,
        document_id INT NOT NULL,
        item_id INT NOT NULL,
        quantity INT NOT NULL,
        serial_number NVARCHAR(100) NULL,
        report_part_id INT NULL,
        CONSTRAINT CK_stock_document_items_quantity CHECK (quantity > 0),
        CONSTRAINT FK_stock_document_items_document FOREIGN KEY (document_id) REFERENCES dbo.stock_documents(id),
        CONSTRAINT FK_stock_document_items_item FOREIGN KEY (item_id) REFERENCES dbo.items(id),
        CONSTRAINT FK_stock_document_items_report_part FOREIGN KEY (report_part_id) REFERENCES dbo.report_parts(id)
    );
    CREATE INDEX IX_stock_document_items_document_id ON dbo.stock_document_items(document_id);
    CREATE INDEX IX_stock_document_items_item_id ON dbo.stock_document_items(item_id);
    CREATE INDEX IX_stock_document_items_serial_number ON dbo.stock_document_items(serial_number) WHERE serial_number IS NOT NULL;
END;
GO
