import nodemailer from 'nodemailer';

// Configuração do transporter
// Recomendado: Adicionar estas variáveis ao arquivo .env
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com', // Exemplo: smtp.gmail.com
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true para 465, false para outras portas
  auth: {
    user: process.env.SMTP_USER || 'seu-email@gmail.com',
    pass: process.env.SMTP_PASS || 'sua-senha-de-app',
  },
});

export const sendSolicitacaoEmail = async (to: string, solicitacaoData: any) => {
  if (!to) {
    console.log('Email não fornecido, pulando envio.');
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Seven Board System" <noreply@sevenboard.com>',
      to: to,
      subject: `Bilhete de Solicitação: ${solicitacaoData.protocolo || 'Confirmado'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
            .ticket-container { max-width: 600px; margin: 40px auto; background: transparent; }
            .ticket {
              display: flex;
              background-color: white;
              border-radius: 16px;
              box-shadow: 0 4px 20px rgba(0,0,0,0.1);
              overflow: hidden;
              position: relative;
            }
            .ticket-left {
              flex: 1;
              padding: 24px;
              border-right: 2px dashed #e0e0e0;
              position: relative;
            }
            .ticket-right {
              width: 180px;
              background-color: #f8fafc;
              padding: 24px;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              border-left: 2px dashed #e0e0e0;
              margin-left: -2px;
            }
            .ticket-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 20px;
              border-bottom: 1px solid #f0f0f0;
              padding-bottom: 12px;
            }
            .brand { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
            .ticket-class { font-size: 12px; font-weight: 700; color: #3b82f6; text-transform: uppercase; letter-spacing: 1px; }
            
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
            }
            .info-item { margin-bottom: 16px; }
            .label { font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 4px; display: block; }
            .value { font-size: 16px; font-weight: 600; color: #1e293b; display: block; }
            .value.highlight { color: #3b82f6; }
            .value.large { font-size: 24px; }
            
            .cutout {
              position: absolute;
              width: 24px;
              height: 24px;
              background-color: #f4f4f4;
              border-radius: 50%;
              top: -12px;
              right: -12px;
              z-index: 10;
            }
            .cutout.bottom { top: auto; bottom: -12px; }
            
            /* Fallback for email clients that don't support flexbox/grid well */
            .table-layout { width: 100%; border-collapse: collapse; background-color: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
            .td-left { padding: 30px; border-right: 2px dashed #e0e0e0; width: 65%; vertical-align: top; }
            .td-right { padding: 30px; background-color: #f8fafc; width: 35%; vertical-align: middle; text-align: center; }
            
            .barcode {
              height: 60px;
              width: 100%;
              background: repeating-linear-gradient(
                90deg,
                #333 0,
                #333 2px,
                transparent 2px,
                transparent 4px,
                #333 4px,
                #333 8px,
                transparent 8px,
                transparent 10px
              );
              margin-top: 10px;
              opacity: 0.7;
            }
          </style>
        </head>
        <body>
          <div class="ticket-container">
            <!-- Table Layout for better Email Support -->
            <table class="table-layout" cellpadding="0" cellspacing="0">
              <tr>
                <td class="td-left">
                  <table width="100%">
                    <tr>
                      <td style="padding-bottom: 20px; border-bottom: 1px solid #f0f0f0;">
                        <span style="font-size: 22px; font-weight: 800; color: #0f172a;">SevenBoard</span>
                      </td>
                      <td style="text-align: right; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0;">
                        <span style="font-size: 12px; font-weight: 700; color: #3b82f6; text-transform: uppercase;">SOLICITAÇÃO</span>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="2" style="padding-top: 20px;">
                        <table width="100%">
                          <tr>
                            <td style="padding-bottom: 20px; width: 50%;">
                              <span class="label">PROTOCOLO</span>
                              <span class="value large highlight">${solicitacaoData.protocolo || 'PENDENTE'}</span>
                            </td>
                            <td style="padding-bottom: 20px; width: 50%;">
                              <span class="label">DEPARTAMENTO</span>
                              <span class="value">${solicitacaoData.departamento}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding-bottom: 20px;">
                              <span class="label">DATA DE ENTREGA</span>
                              <span class="value">${solicitacaoData.dataEntrega}</span>
                            </td>
                            <td style="padding-bottom: 20px;">
                              <span class="label">HORÁRIO</span>
                              <span class="value">${solicitacaoData.horarioEntrega || 'Comercial'}</span>
                            </td>
                          </tr>
                          <tr>
                            <td colspan="2">
                              <span class="label">DESCRIÇÃO DA SOLICITAÇÃO</span>
                              <span class="value" style="font-size: 14px; line-height: 1.4;">${solicitacaoData.tipoSolicitacao}</span>
                              <div style="font-size: 13px; color: #64748b; margin-top: 4px;">${solicitacaoData.descricao}</div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
                <td class="td-right">
                  <div style="margin-bottom: 15px;">
                    <span class="label" style="text-align: center;">STATUS</span>
                    <span class="value highlight" style="font-size: 18px; text-align: center;">CONFIRMADO</span>
                  </div>
                  <div style="margin-bottom: 15px;">
                     <span class="label" style="text-align: center;">DATA</span>
                     <span class="value" style="font-size: 14px; text-align: center;">${new Date().toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div class="barcode"></div>
                  <div style="font-size: 10px; color: #94a3b8; margin-top: 5px; letter-spacing: 2px;">BOARDING PASS</div>
                </td>
              </tr>
            </table>
            
            <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 20px;">
              Este é um email eletrônico automático. Acompanhe o status no painel.
            </p>
          </div>
        </body>
        </html>
      `,
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
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Seven Board System" <noreply@sevenboard.com>',
      to: to,
      subject: `Solicitação Concluída: ${solicitacaoData.protocolo || solicitacaoData.tipoSolicitacao}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #10b981;">Solicitação Concluída!</h2>
          <p>Olá,</p>
          <p>Sua solicitação foi marcada como <strong>CONCLUÍDA</strong> em nosso sistema.</p>
          
          <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
            <h3 style="margin-top: 0; color: #15803d;">Detalhes:</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin-bottom: 8px;"><strong>Protocolo:</strong> ${solicitacaoData.protocolo || 'N/A'}</li>
              <li style="margin-bottom: 8px;"><strong>Tipo:</strong> ${solicitacaoData.tipoSolicitacao}</li>
              <li style="margin-bottom: 8px;"><strong>Descrição:</strong> ${solicitacaoData.descricao}</li>
            </ul>
          </div>

          <p>Obrigado por utilizar nossos serviços.</p>
          
          <p style="font-size: 12px; color: #666; margin-top: 30px;">
            Este é um email automático, por favor não responda.
          </p>
        </div>
      `,
    });

    console.log('Email de conclusão enviado com sucesso: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Erro ao enviar email de conclusão:', error);
    return null;
  }
};
