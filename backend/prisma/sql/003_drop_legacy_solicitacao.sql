SET @db := DATABASE();

SET @has_dataEntrega := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'Solicitacao' AND column_name = 'dataEntrega'
);
SET @has_horarioEntrega := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'Solicitacao' AND column_name = 'horarioEntrega'
);

SET @update_sql := IF(
  @has_dataEntrega > 0,
  'UPDATE `Solicitacao` SET `deliveryAt` = COALESCE(`deliveryAt`, STR_TO_DATE(CONCAT(`dataEntrega`, '' '', COALESCE(NULLIF(`horarioEntrega`, ''''), ''23:59'')), ''%Y-%m-%d %H:%i''), `createdAt`) WHERE `deliveryAt` IS NULL',
  'UPDATE `Solicitacao` SET `deliveryAt` = COALESCE(`deliveryAt`, `createdAt`) WHERE `deliveryAt` IS NULL'
);
PREPARE stmt FROM @update_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE `Solicitacao`
  MODIFY `deliveryAt` DATETIME(3) NOT NULL;

SET @has_status := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = @db AND table_name = 'Solicitacao' AND column_name = 'status'
);

SET @drop_sql := CONCAT(
  'ALTER TABLE `Solicitacao`',
  IF(@has_dataEntrega > 0, ' DROP COLUMN `dataEntrega`,', ''),
  IF(@has_horarioEntrega > 0, ' DROP COLUMN `horarioEntrega`,', ''),
  IF(@has_status > 0, ' DROP COLUMN `status`,', '')
);

SET @drop_sql := TRIM(TRAILING ',' FROM @drop_sql);
SET @drop_sql := IF(@drop_sql = 'ALTER TABLE `Solicitacao`', 'SELECT 1', @drop_sql);

PREPARE stmt2 FROM @drop_sql;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;
