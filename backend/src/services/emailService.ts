import nodemailer from 'nodemailer';

const smtpEnabled = String(process.env.SMTP_ENABLED ?? 'true').toLowerCase() === 'true';
const smtpSecure = String(process.env.SMTP_SECURE ?? '').toLowerCase() === 'true';
const smtpPassRaw = process.env.SMTP_PASS ?? '';
const smtpPass = smtpPassRaw.replaceAll(/\s+/g, '');
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT) || (smtpSecure ? 465 : 587);
const smtpUser = process.env.SMTP_USER || '';
const smtpDebug = String(process.env.SMTP_DEBUG ?? 'false').toLowerCase() === 'true';
const smtpVerifyOnStart = String(process.env.SMTP_VERIFY_ON_START ?? 'false').toLowerCase() === 'true';

const maskEmail = (value: string) => {
  const v = String(value || '').trim();
  const at = v.indexOf('@');
  if (at <= 1) return v ? `${v[0]}***` : '';
  const local = v.slice(0, at);
  const domain = v.slice(at);
  return `${local[0]}***${domain}`;
};

const transporter = smtpEnabled
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  : null;

let smtpWarnedDisabled = false;
let smtpVerified = false;
let smtpVerifying = false;

const verifyTransporterOnce = async () => {
  if (!transporter) return;
  if (smtpVerified || smtpVerifying) return;
  smtpVerifying = true;
  try {
    await transporter.verify();
    smtpVerified = true;
    if (smtpDebug) {
      console.log('[SMTP] verify OK', {
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        user: maskEmail(smtpUser),
        passLength: smtpPass.length,
      });
    }
  } catch (error: any) {
    if (smtpDebug) {
      console.error('[SMTP] verify FAIL', {
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        user: maskEmail(smtpUser),
        passLength: smtpPass.length,
        code: error?.code,
        responseCode: error?.responseCode,
        message: error?.message,
      });
    }
  } finally {
    smtpVerifying = false;
  }
};

if (transporter && smtpDebug) {
  console.log('[SMTP] config', {
    enabled: smtpEnabled,
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    user: maskEmail(smtpUser),
    passLength: smtpPass.length,
    from: process.env.SMTP_FROM || '"Midia Flow" <noreply@sevenboard.com>',
    verifyOnStart: smtpVerifyOnStart,
  });
}

if (transporter && smtpVerifyOnStart) {
  void verifyTransporterOnce();
}

const formatDateTime = (value: any): string => {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('pt-BR');
};

interface TicketEmailOptions {
  title: string;
  subtitle: string;
  statusText: string;
  statusDateLabel: string;
  statusDateValue: string;
  primaryColor: string;
  solicitacao: any;
}

const buildTicketEmail = (opts: TicketEmailOptions): string => {
  const s = opts.solicitacao || {};
  const protocolo = s.protocolo || 'N/A';
  const departamento = s.departamento || '-';
  const tipo = s.tipoSolicitacao || '-';
  const descricao = s.descricao || '-';
  const deliveryAt = s.deliveryAt ? formatDateTime(s.deliveryAt) : '-';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #f4f4f8;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .wrapper {
          width: 100%;
          padding: 32px 16px;
          box-sizing: border-box;
        }
        .card {
          max-width: 480px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
          padding: 32px 28px 28px 28px;
          text-align: center;
        }
        .icon-circle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          margin: 0 auto 20px auto;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(129, 140, 248, 0.06);
          border: 2px solid ${opts.primaryColor};
        }
        .icon-circle span {
          font-size: 32px;
          color: ${opts.primaryColor};
        }
        h1 {
          margin: 0 0 8px 0;
          font-size: 22px;
          line-height: 1.3;
          color: #111827;
          font-weight: 700;
        }
        .subtitle {
          margin: 0 0 24px 0;
          font-size: 14px;
          color: #6b7280;
          line-height: 1.5;
        }
        .details-card {
          margin-top: 8px;
          border-radius: 14px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          padding: 16px 18px;
          text-align: left;
        }
        .details-table {
          width: 100%;
          border-collapse: collapse;
        }
        .details-table tr + tr td {
          padding-top: 8px;
        }
        .label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #9ca3af;
          width: 40%;
          white-space: nowrap;
        }
        .value {
          font-size: 14px;
          color: #111827;
          text-align: right;
        }
        .value strong {
          font-weight: 600;
        }
        .description {
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid #e5e7eb;
          text-align: left;
        }
        .description-title {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #9ca3af;
          margin-bottom: 4px;
        }
        .description-body {
          font-size: 13px;
          color: #4b5563;
          line-height: 1.5;
        }
        .footer {
          margin-top: 20px;
          font-size: 11px;
          color: #9ca3af;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="card">
          <div class="icon-circle">
            <span>✓</span>
          </div>
          <h1>${opts.title}</h1>
          <p class="subtitle">${opts.subtitle}</p>
          <div class="details-card">
            <table class="details-table">
              <tr>
                <td class="label">Protocolo</td>
                <td class="value"><strong>${protocolo}</strong></td>
              </tr>
              <tr>
                <td class="label">Departamento</td>
                <td class="value">${departamento}</td>
              </tr>
              <tr>
                <td class="label">Tipo</td>
                <td class="value">${tipo}</td>
              </tr>
              <tr>
                <td class="label">Data de entrega</td>
                <td class="value">${deliveryAt}</td>
              </tr>
              <tr>
                <td class="label">Status</td>
                <td class="value">${opts.statusText}</td>
              </tr>
              <tr>
                <td class="label">${opts.statusDateLabel}</td>
                <td class="value">${opts.statusDateValue}</td>
              </tr>
            </table>
            <div class="description">
              <div class="description-title">Descrição</div>
              <div class="description-body">${descricao}</div>
            </div>
          </div>
          <p class="footer">Este é um email automático. Não responda a esta mensagem.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const sendSolicitacaoEmail = async (to: string, solicitacaoData: any) => {
  if (!to) {
    console.log('Email não fornecido, pulando envio.');
    return;
  }
  if (!transporter) {
    if (!smtpWarnedDisabled) {
      smtpWarnedDisabled = true;
      console.log('[SMTP] envio desabilitado (SMTP_ENABLED=false)');
    }
    return null;
  }

  try {
    await verifyTransporterOnce();
    const html = buildTicketEmail({
      title: 'Sucesso! Sua solicitação foi registrada.',
      subtitle: 'Use o protocolo para acompanhar sua solicitação.',
      statusText: 'Nova solicitação registrada',
      statusDateLabel: 'Data de registro',
      statusDateValue: formatDateTime(solicitacaoData.createdAt || new Date()),
      primaryColor: '#3b82f6',
      solicitacao: solicitacaoData,
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Midia Flow" <noreply@sevenboard.com>',
      to: to,
      subject: `Protocolo de Solicitação: ${solicitacaoData.protocolo || 'Confirmado'}`,
      html,
    });

    console.log('Email enviado com sucesso: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Erro ao enviar email:', {
      to: maskEmail(to),
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      user: maskEmail(smtpUser),
      passLength: smtpPass.length,
      code: (error as any)?.code,
      responseCode: (error as any)?.responseCode,
      message: (error as any)?.message,
    });
    // Retornamos null mas não lançamos erro para não impedir a criação do card
    return null;
  }
};

export const sendConclusaoEmail = async (to: string, solicitacaoData: any) => {
  if (!to) {
    console.log('Email não fornecido, pulando envio de conclusão.');
    return;
  }
  if (!transporter) {
    return null;
  }

  try {
    await verifyTransporterOnce();
    const html = buildTicketEmail({
      title: 'Sua solicitação foi concluída.',
      subtitle: 'Confira abaixo os detalhes da entrega.',
      statusText: 'Concluída',
      statusDateLabel: 'Data de conclusão',
      statusDateValue: formatDateTime(solicitacaoData.completedAt || new Date()),
      primaryColor: '#10b981',
      solicitacao: solicitacaoData,
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Midia Flow" <noreply@sevenboard.com>',
      to: to,
      subject: `Solicitação Concluída: ${solicitacaoData.protocolo || solicitacaoData.tipoSolicitacao}`,
      html,
    });

    console.log('Email de conclusão enviado com sucesso: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Erro ao enviar email de conclusão:', error);
    return null;
  }
};

export const sendReaberturaEmail = async (to: string, solicitacaoData: any) => {
  if (!to) {
    console.log('Email não fornecido, pulando envio de reabertura.');
    return;
  }
  if (!transporter) {
    return null;
  }

  try {
    await verifyTransporterOnce();
    const html = buildTicketEmail({
      title: 'Sua solicitação foi reaberta.',
      subtitle: 'Ela voltou para a fila de atendimento.',
      statusText: 'Reaberta',
      statusDateLabel: 'Data de reabertura',
      statusDateValue: formatDateTime(new Date()),
      primaryColor: '#f59e0b',
      solicitacao: solicitacaoData,
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Midia Flow" <noreply@sevenboard.com>',
      to: to,
      subject: `Solicitação Reaberta: ${solicitacaoData.protocolo || solicitacaoData.tipoSolicitacao}`,
      html,
    });

    console.log('Email de reabertura enviado com sucesso: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Erro ao enviar email de reabertura:', error);
    return null;
  }
};

export const sendProducaoEmail = async (to: string, solicitacaoData: any) => {
  if (!to) {
    console.log('Email não fornecido, pulando envio de produção.');
    return;
  }
  if (!transporter) {
    return null;
  }

  try {
    await verifyTransporterOnce();
    const html = buildTicketEmail({
      title: 'Sua solicitação entrou em produção.',
      subtitle: 'Nossa equipe já iniciou o atendimento.',
      statusText: 'Em produção',
      statusDateLabel: 'Início da produção',
      statusDateValue: formatDateTime(solicitacaoData.startedAt || new Date()),
      primaryColor: '#0ea5e9',
      solicitacao: solicitacaoData,
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Midia Flow" <noreply@sevenboard.com>',
      to: to,
      subject: `Em Produção: ${solicitacaoData.protocolo || solicitacaoData.tipoSolicitacao}`,
      html,
    });

    console.log('Email de produção enviado com sucesso: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Erro ao enviar email de produção:', {
      to: maskEmail(to),
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      user: maskEmail(smtpUser),
      passLength: smtpPass.length,
      code: (error as any)?.code,
      responseCode: (error as any)?.responseCode,
      message: (error as any)?.message,
    });
    return null;
  }
};

const buildApprovalEmail = (opts: { solicitacao: any; links: string[]; message?: string; approvalUrl?: string }) => {
  const s = opts.solicitacao || {};
  const protocolo = s.protocolo || 'N/A';
  const tipo = s.tipoSolicitacao || '-';
  const departamento = s.departamento || '-';
  const deliveryAt = s.deliveryAt ? formatDateTime(s.deliveryAt) : '-';
  const message = String(opts.message || '').trim();
  const approvalUrl = String(opts.approvalUrl || '').trim();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { margin: 0; padding: 0; background-color: #f4f4f8; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        .wrapper { width: 100%; padding: 32px 16px; box-sizing: border-box; }
        .card { max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); padding: 28px; }
        h1 { margin: 0 0 8px 0; font-size: 20px; color: #0f172a; }
        p { margin: 0; color: #334155; line-height: 1.55; }
        .meta { margin-top: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; }
        .meta-row { display: flex; justify-content: space-between; gap: 12px; margin-top: 8px; font-size: 13px; color: #475569; }
        .meta-row strong { color: #0f172a; }
        .btn { display: inline-block; margin-top: 18px; background: #10b981; color: #ffffff !important; text-decoration: none; padding: 12px 14px; border-radius: 12px; font-weight: 800; }
        .message { margin-top: 18px; padding: 14px; border-radius: 12px; background: #eff6ff; border: 1px solid #bfdbfe; color: #0f172a; white-space: pre-wrap; }
        .footer { margin-top: 18px; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="card">
          <h1>Sua solicitação está aguardando aprovação</h1>
          <p>Clique no botão abaixo para abrir a página de aprovação.</p>

          <div class="meta">
            <div class="meta-row"><strong>Protocolo: </strong><span>${protocolo}</span></div>
            <div class="meta-row"><strong>Departamento: </strong><span>${departamento}</span></div>
            <div class="meta-row"><strong>Tipo: </strong><span>${tipo}</span></div>
            <div class="meta-row"><strong>Entrega: </strong><span>${deliveryAt}</span></div>
          </div>

          ${message ? `<div class="message">${message}</div>` : ''}

          <a class="btn" href="${approvalUrl}" target="_blank" rel="noopener noreferrer">Abrir página de aprovação</a>

          <div class="footer">Este é um email automático. Não responda a esta mensagem.</div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const sendAprovacaoEmail = async (
  to: string,
  solicitacaoData: any,
  opts: { links: string[]; message?: string; approvalUrl?: string }
) => {
  if (!to) {
    console.log('Email não fornecido, pulando envio de aprovação.');
    return;
  }
  if (!transporter) {
    return null;
  }

  const links = Array.isArray(opts.links) ? opts.links.map((v) => String(v).trim()).filter(Boolean) : [];
  if (links.length === 0) {
    return null;
  }
  const approvalUrl = String(opts.approvalUrl || '').trim();
  if (!approvalUrl) {
    return null;
  }

  try {
    await verifyTransporterOnce();
    const html = buildApprovalEmail({ solicitacao: solicitacaoData, links, message: opts.message, approvalUrl });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Midia Flow" <noreply@sevenboard.com>',
      to,
      subject: `Aprovação: ${solicitacaoData.protocolo || solicitacaoData.tipoSolicitacao}`,
      html,
    });

    console.log('Email de aprovação enviado com sucesso: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Erro ao enviar email de aprovação:', {
      to: maskEmail(to),
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      user: maskEmail(smtpUser),
      passLength: smtpPass.length,
      code: (error as any)?.code,
      responseCode: (error as any)?.responseCode,
      message: (error as any)?.message,
    });
    return null;
  }
};
