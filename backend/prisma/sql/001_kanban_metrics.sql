CREATE TABLE IF NOT EXISTS `Stage` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `order` INT NOT NULL,
  `kind` ENUM('TODO','IN_PROGRESS','VALIDATION','DONE') NOT NULL DEFAULT 'TODO',
  `active` BOOLEAN NOT NULL DEFAULT true,
  `boardKey` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `Stage_boardKey_order_idx` (`boardKey`, `order`),
  INDEX `Stage_kind_active_idx` (`kind`, `active`)
) DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Solicitacao`
  ADD COLUMN `deliveryAt` DATETIME(3) NULL,
  ADD COLUMN `stageId` VARCHAR(191) NULL,
  ADD COLUMN `requesterId` VARCHAR(191) NULL,
  ADD COLUMN `assigneeId` VARCHAR(191) NULL,
  ADD COLUMN `priority` ENUM('LOW','MEDIUM','HIGH','URGENT') NOT NULL DEFAULT 'MEDIUM',
  ADD COLUMN `slaMinutes` INT NULL,
  ADD COLUMN `slaTargetAt` DATETIME(3) NULL,
  ADD COLUMN `slaBreachedAt` DATETIME(3) NULL,
  ADD COLUMN `slaResult` ENUM('IN_SLA','BREACHED') NULL,
  ADD COLUMN `firstRespondedAt` DATETIME(3) NULL;

CREATE INDEX `Solicitacao_stageId_createdAt_idx` ON `Solicitacao` (`stageId`, `createdAt`);
CREATE INDEX `Solicitacao_assigneeId_createdAt_idx` ON `Solicitacao` (`assigneeId`, `createdAt`);
CREATE INDEX `Solicitacao_requesterId_createdAt_idx` ON `Solicitacao` (`requesterId`, `createdAt`);
CREATE INDEX `Solicitacao_completedAt_idx` ON `Solicitacao` (`completedAt`);
CREATE INDEX `Solicitacao_priority_idx` ON `Solicitacao` (`priority`);

ALTER TABLE `Solicitacao`
  ADD CONSTRAINT `Solicitacao_stageId_fkey`
    FOREIGN KEY (`stageId`) REFERENCES `Stage`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Solicitacao`
  ADD CONSTRAINT `Solicitacao_requesterId_fkey`
    FOREIGN KEY (`requesterId`) REFERENCES `User`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `Solicitacao`
  ADD CONSTRAINT `Solicitacao_assigneeId_fkey`
    FOREIGN KEY (`assigneeId`) REFERENCES `User`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `User`
  ADD COLUMN `roleEnum` ENUM('ADMIN','MANAGER','AGENT','USER') NOT NULL DEFAULT 'USER';

UPDATE `User`
SET `roleEnum` = CASE LOWER(`role`)
  WHEN 'admin' THEN 'ADMIN'
  WHEN 'manager' THEN 'MANAGER'
  WHEN 'agent' THEN 'AGENT'
  WHEN 'user' THEN 'USER'
  ELSE 'USER'
END
WHERE `roleEnum` IS NULL OR `roleEnum` NOT IN ('ADMIN','MANAGER','AGENT','USER');

CREATE TABLE IF NOT EXISTS `SolicitacaoStageHistory` (
  `id` VARCHAR(191) NOT NULL,
  `solicitacaoId` VARCHAR(191) NOT NULL,
  `fromStageId` VARCHAR(191) NULL,
  `toStageId` VARCHAR(191) NOT NULL,
  `changedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `changedById` VARCHAR(191) NULL,
  PRIMARY KEY (`id`),
  INDEX `SolicitacaoStageHistory_solicitacaoId_changedAt_idx` (`solicitacaoId`, `changedAt`),
  INDEX `SolicitacaoStageHistory_toStageId_changedAt_idx` (`toStageId`, `changedAt`),
  INDEX `SolicitacaoStageHistory_changedById_changedAt_idx` (`changedById`, `changedAt`),
  CONSTRAINT `SolicitacaoStageHistory_solicitacaoId_fkey`
    FOREIGN KEY (`solicitacaoId`) REFERENCES `Solicitacao`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `SolicitacaoStageHistory_fromStageId_fkey`
    FOREIGN KEY (`fromStageId`) REFERENCES `Stage`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `SolicitacaoStageHistory_toStageId_fkey`
    FOREIGN KEY (`toStageId`) REFERENCES `Stage`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `SolicitacaoStageHistory_changedById_fkey`
    FOREIGN KEY (`changedById`) REFERENCES `User`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `SolicitacaoActivity` (
  `id` VARCHAR(191) NOT NULL,
  `solicitacaoId` VARCHAR(191) NOT NULL,
  `type` ENUM('COMMENT','STAGE_CHANGE','ASSIGN','ATTACHMENT','NOTE') NOT NULL,
  `message` VARCHAR(191) NULL,
  `data` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `actorId` VARCHAR(191) NULL,
  PRIMARY KEY (`id`),
  INDEX `SolicitacaoActivity_solicitacaoId_createdAt_idx` (`solicitacaoId`, `createdAt`),
  INDEX `SolicitacaoActivity_actorId_createdAt_idx` (`actorId`, `createdAt`),
  INDEX `SolicitacaoActivity_type_createdAt_idx` (`type`, `createdAt`),
  CONSTRAINT `SolicitacaoActivity_solicitacaoId_fkey`
    FOREIGN KEY (`solicitacaoId`) REFERENCES `Solicitacao`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `SolicitacaoActivity_actorId_fkey`
    FOREIGN KEY (`actorId`) REFERENCES `User`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `SlaPolicy` (
  `id` VARCHAR(191) NOT NULL,
  `active` BOOLEAN NOT NULL DEFAULT true,
  `tipoSolicitacao` VARCHAR(191) NULL,
  `departamento` VARCHAR(191) NULL,
  `priority` ENUM('LOW','MEDIUM','HIGH','URGENT') NULL,
  `minutesTarget` INT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `SlaPolicy_active_idx` (`active`),
  INDEX `SlaPolicy_priority_idx` (`priority`),
  INDEX `SlaPolicy_tipoSolicitacao_idx` (`tipoSolicitacao`),
  INDEX `SlaPolicy_departamento_idx` (`departamento`)
) DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;
