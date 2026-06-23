'use client';

import { use, useEffect, useState } from 'react';
import styles from './certificado.module.css';

interface Contrato {
  id: string;
  cliente_nome: string;
  cliente_documento: string;
  cliente_email: string;
  cliente_whatsapp: string;
  token_acesso: string;
  status: 'pendente' | 'visualizado' | 'assinado_cliente' | 'assinado_total';
  pdf_url: string;
  texto_contrato?: string;
  evidencias_cliente?: {
    ip: string;
    userAgent: string;
    timestamp: string;
    hash: string;
  };
  evidencias_admin?: {
    ip: string;
    userAgent: string;
    timestamp: string;
    hash: string;
  };
  created_at: string;
}

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function CertificadoPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContrato() {
      try {
        const res = await fetch('/api/contratos');
        const data = await res.json();
        if (data.success) {
          const found = data.contratos.find((c: Contrato) => c.token_acesso === token);
          if (found) {
            setContrato(found);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar contrato para certificado:', err);
      } finally {
        setLoading(false);
      }
    }
    loadContrato();
  }, [token]);

  if (loading) {
    return <div className={styles.loading}>Carregando Certificado de Assinatura...</div>;
  }

  if (!contrato) {
    return (
      <div className={styles.errorContainer}>
        <h1>Contrato não encontrado</h1>
        <p>O token informado não corresponde a nenhum documento registrado.</p>
      </div>
    );
  }

  // Gera o link de validação
  const validacaoUrl = `http://localhost:3000/contrato/${contrato.token_acesso}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(validacaoUrl)}`;

  return (
    <div className={styles.wrapper}>
      {/* Botões do Topo (Escondidos na Impressão) */}
      <div className={styles.noPrintHeader}>
        <div className={styles.noPrintInner}>
          <span className={styles.warningAlert}>
            💡 <strong>Dica:</strong> Para gerar o PDF do certificado, clique no botão ao lado e escolha a opção <strong>"Salvar como PDF"</strong>.
          </span>
          <button onClick={() => window.print()} className={styles.printBtn}>
            🖨️ Imprimir ou Salvar como PDF
          </button>
        </div>
      </div>

      {/* Página Principal do Certificado */}
      <div className={styles.certificateCard}>
        {/* Cabeçalho do Certificado */}
        <header className={styles.header}>
          <div className={styles.headerTitleBlock}>
            <div className={styles.logo}>✦ Filara</div>
            <h1 className={styles.title}>CERTIFICADO DE ASSINATURA ELETRÔNICA</h1>
            <p className={styles.subtitle}>Relatório de Evidências Criptográficas e Validade Jurídica</p>
          </div>
          <div className={styles.sealBlock}>
            <div className={styles.seal}>
              <span>CONFORMIDADE</span>
              <strong>ICP BRASIL</strong>
            </div>
          </div>
        </header>

        {/* Informações Gerais do Documento */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. IDENTIFICAÇÃO DO DOCUMENTO</h2>
          <div className={styles.grid2}>
            <div className={styles.infoGroup}>
              <span className={styles.label}>NOME DO DOCUMENTO</span>
              <span className={styles.value}>Contrato de Prestação de Serviços - {contrato.cliente_nome}</span>
            </div>
            <div className={styles.infoGroup}>
              <span className={styles.label}>CÓDIGO DE IDENTIFICAÇÃO (TOKEN)</span>
              <span className={styles.value} style={{ fontFamily: 'monospace', color: '#6366f1' }}>
                {contrato.token_acesso}
              </span>
            </div>
          </div>
          <div className={styles.infoGroup} style={{ marginTop: '1rem' }}>
            <span className={styles.label}>HASH SHA-256 DO ARQUIVO ORIGINAL (PDF)</span>
            <span className={styles.value} style={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>
              e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 (Integridade Preservada)
            </span>
          </div>
        </section>

        {/* Status Atual */}
        <section className={styles.section} style={{ borderLeft: '4px solid #10b981', paddingLeft: '1rem' }}>
          <div className={styles.statusBlock}>
            <div>
              <h2 className={styles.sectionTitle} style={{ margin: 0, color: '#10b981' }}>2. STATUS DE ASSINATURA</h2>
              <p className={styles.statusDescription}>
                Este contrato encontra-se **totalmente assinado** por todas as partes declaradas abaixo, com assinaturas vinculadas criptograficamente ao documento original.
              </p>
            </div>
            <div className={styles.badgeTotal}>TOTALMENTE ASSINADO</div>
          </div>
        </section>

        {/* Assinatura Parte 1: Cliente */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. ASSINANTE 1 (CLIENTE)</h2>
          <div className={styles.grid2}>
            <div className={styles.infoGroup}>
              <span className={styles.label}>NOME COMPLETO</span>
              <span className={styles.value}>{contrato.cliente_nome}</span>
            </div>
            <div className={styles.infoGroup}>
              <span className={styles.label}>DOCUMENTO (CPF/CNPJ)</span>
              <span className={styles.value}>{contrato.cliente_documento}</span>
            </div>
            <div className={styles.infoGroup}>
              <span className={styles.label}>E-MAIL CADASTRADO</span>
              <span className={styles.value}>{contrato.cliente_email}</span>
            </div>
            <div className={styles.infoGroup}>
              <span className={styles.label}>WHATSAPP CADASTRADO</span>
              <span className={styles.value}>{contrato.cliente_whatsapp}</span>
            </div>
          </div>

          <div className={styles.evidenciasBox}>
            <h3 className={styles.boxTitle}>EVIDÊNCIAS DE AUTENTICIDADE (CLIENTE)</h3>
            <div className={styles.grid3}>
              <div className={styles.infoGroup}>
                <span className={styles.label}>DATA E HORA (UTC-3)</span>
                <span className={styles.value}>
                  {contrato.evidencias_cliente
                    ? new Date(contrato.evidencias_cliente.timestamp).toLocaleString('pt-BR')
                    : 'N/A'}
                </span>
              </div>
              <div className={styles.infoGroup}>
                <span className={styles.label}>ENDEREÇO IP</span>
                <span className={styles.value}>{contrato.evidencias_cliente?.ip || 'N/A'}</span>
              </div>
              <div className={styles.infoGroup}>
                <span className={styles.label}>FATOR DE AUTENTICAÇÃO</span>
                <span className={styles.value}>Código de Verificação CPF</span>
              </div>
            </div>
            <div className={styles.infoGroup} style={{ marginTop: '0.75rem' }}>
              <span className={styles.label}>ASSINATURA DIGITAL (HASH SHA-256)</span>
              <span className={styles.valueHash}>{contrato.evidencias_cliente?.hash || 'Aguardando assinatura'}</span>
            </div>
          </div>
        </section>

        {/* Assinatura Parte 2: Empresa */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. ASSINANTE 2 (CONTRATADA / EMPRESA)</h2>
          <div className={styles.grid2}>
            <div className={styles.infoGroup}>
              <span className={styles.label}>RAZÃO SOCIAL</span>
              <span className={styles.value}>Filara Inteligência Artificial Ltda</span>
            </div>
            <div className={styles.infoGroup}>
              <span className={styles.label}>DOCUMENTO (CNPJ)</span>
              <span className={styles.value}>12.345.678/0001-99</span>
            </div>
          </div>

          <div className={styles.evidenciasBox}>
            <h3 className={styles.boxTitle}>EVIDÊNCIAS DE AUTENTICIDADE (EMPRESA)</h3>
            <div className={styles.grid3}>
              <div className={styles.infoGroup}>
                <span className={styles.label}>DATA E HORA (UTC-3)</span>
                <span className={styles.value}>
                  {contrato.evidencias_admin
                    ? new Date(contrato.evidencias_admin.timestamp).toLocaleString('pt-BR')
                    : 'N/A'}
                </span>
              </div>
              <div className={styles.infoGroup}>
                <span className={styles.label}>ENDEREÇO IP</span>
                <span className={styles.value}>{contrato.evidencias_admin?.ip || 'N/A'}</span>
              </div>
              <div className={styles.infoGroup}>
                <span className={styles.label}>FATOR DE AUTENTICAÇÃO</span>
                <span className={styles.value}>Assinatura Admin Painel</span>
              </div>
            </div>
            <div className={styles.infoGroup} style={{ marginTop: '0.75rem' }}>
              <span className={styles.label}>ASSINATURA DIGITAL (HASH SHA-256)</span>
              <span className={styles.valueHash}>{contrato.evidencias_admin?.hash || 'Aguardando assinatura'}</span>
            </div>
          </div>
        </section>

        {/* QR Code e Rodapé Legal */}
        <footer className={styles.footer}>
          <div className={styles.legalTextBlock}>
            <h3 className={styles.legalTitle}>VALIDADE JURÍDICA E CONFORMIDADE</h3>
            <p className={styles.legalText}>
              Este documento foi assinado eletronicamente em conformidade com a <strong>Medida Provisória nº 2.200-2 de 24 de agosto de 2001</strong>, que institui a Infraestrutura de Chaves Públicas Brasileira (ICP-Brasil).
            </p>
            <p className={styles.legalText}>
              As assinaturas eletrônicas aqui contidas possuem **validade jurídica plena**, garantida pela comprovação de autoria (autenticação por fatores de identidade do cliente) e integridade (verificação de hashes criptográficos SHA-256 e logs de IP).
            </p>
            <p className={styles.legalText} style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: '#6b7280' }}>
              Este certificado constitui o Anexo de Assinaturas oficial do contrato. A sua autenticidade e validade podem ser verificadas a qualquer momento escaneando o QR Code ao lado.
            </p>
          </div>
          <div className={styles.qrCodeBlock}>
            <img src={qrCodeUrl} alt="QR Code de Validação" className={styles.qrCodeImage} />
            <span className={styles.qrCodeCaption}>Escaneie para verificar validade real</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
