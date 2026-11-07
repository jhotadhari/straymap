-- Custom SQL migration file: expression index over the import dedupe
-- key.  The import feature's skip/overwrite modes query
--     json_extract(data, '$.import.sourceFilePath') = ?
-- per source file; without this index every lookup is a full table
-- scan over `lines`.  The column itself must stay JSON (the `lines`
-- table's SpatiaLite geometry column makes schema changes dangerous),
-- so an expression index is used instead.
CREATE INDEX IF NOT EXISTS `idx_lines_import_source_path`
	ON `lines` (json_extract(`data`, '$.import.sourceFilePath'));
