import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com', // Exemplo: smtp.gmail.com
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true para 465, false para outras portas
  auth: {
    user: process.env.SMTP_USER || 'seu-email@gmail.com',
    pass: process.env.SMTP_PASS || 'sua-senha-de-app',
  },
});

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
  const dataEntrega = s.dataEntrega || '-';
  const horarioEntrega = s.horarioEntrega || 'Comercial';

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
                <td class="value">${dataEntrega} ${horarioEntrega ? `- ${horarioEntrega}` : ''}</td>
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

  try {
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
      from: process.env.SMTP_FROM || '"Seven Board System" <noreply@sevenboard.com>',
      to: to,
      subject: `Bilhete de Solicitação: ${solicitacaoData.protocolo || 'Confirmado'}`,
      html,
    });

    console.log('Email enviado com sucesso: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    // Retornamos null mas não lançamos erro para não impedir a criação do card
    return null;
  }
};

export const sendConclusaoEmail = async (to: string, solicitacaoData: any) => {
  if (!to) {
    console.log('Email não fornecido, pulando envio de conclusão.');
    return;
  }

  try {
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
      from: process.env.SMTP_FROM || '"Seven Board System" <noreply@sevenboard.com>',
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

  try {
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
      from: process.env.SMTP_FROM || '"Seven Board System" <noreply@sevenboard.com>',
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
