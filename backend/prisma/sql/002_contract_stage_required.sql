UPDATE `Solicitacao`
SET `stageId` = (
  SELECT `id`
  FROM `Stage`
  WHERE `boardKey` = 'default' AND `name` = 'Novas solicitações' AND `active` = true
  ORDER BY `order` ASC
  LIMIT 1
)
WHERE `stageId` IS NULL;

ALTER TABLE `Solicitacao`
  MODIFY `stageId` VARCHAR(191) NOT NULL;

