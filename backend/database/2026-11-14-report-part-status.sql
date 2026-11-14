-- Status pobrania części w reklamacji. Bezpieczna migracja idempotentna dla Azure SQL.
IF COL_LENGTH('dbo.report_parts', 'status') IS NULL
BEGIN
    ALTER TABLE dbo.report_parts
    ADD status NVARCHAR(20) NOT NULL
        CONSTRAINT DF_report_parts_status DEFAULT ('issued') WITH VALUES;
END;

UPDATE dbo.report_parts
SET status = CASE WHEN returned_at IS NOT NULL THEN 'returned' ELSE 'issued' END
WHERE status IS NULL
   OR (returned_at IS NOT NULL AND status <> 'returned')
   OR (returned_at IS NULL AND status <> 'issued');
