'use client';

import { useState, useEffect } from 'react';
import styles from './home.module.css';

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

type Tab = 'criar' | 'lista';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('lista');
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Form State
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [documento, setDocumento] = useState('');
  const [textoContrato, setTextoContrato] = useState(
    `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TECNOLOGIA\n\nCONTRATANTE: [Nome do Cliente], portador do CPF sob o nº [Digite o CPF aqui], residente em [Endereço].\n\nCONTRATADA: Filara Inteligência Artificial Ltda, inscrita no CNPJ sob o nº 12.345.678/0001-99.\n\nCláusula 1ª. O objeto deste contrato é o fornecimento de agentes virtuais autônomos...`
  );

  async function fetchContratos() {
    try {
      const res = await fetch('/api/contratos');
      const data = await res.json();
      if (data.success) {
        setContratos(data.contratos);
      }
    } catch (err) {
      console.error('Erro ao buscar contratos:', err);
    }
  }

  useEffect(() => {
    fetchContratos();
    // Atualiza a lista a cada 4 segundos para capturar as assinaturas do cliente em tempo real!
    const interval = setInterval(fetchContratos, 4000);
    return () => clearInterval(interval);
  }, []);

  async function handleCriarContrato(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErro('');
    setSucesso('');

    // PDF fictício em Base64 para teste local
    const samplePdfBase64 = "JVBERi0xLjQKJcfsj6y9CjUgMCBvYmoKPDwgL0xlbmd0aCA2MCA+PgpzdHJlYW0KQlQgL0YxIDEyIFRmIDcwIDcwMCBUZCAoRXN0ZSDDqSB1bSBjb250cmF0byBkZSB0ZXN0ZSBkYSBGaWxhcmEpIFRqIEVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDEKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE5IDAwMDAwIG4gCnRyYWlsZXIKPDwgL1NpemUgNiAvUm9vdCAxIDAgUiA+PgpzdGFydHhyZWYKMTE5CiUlRU9G";

    try {
      const res = await fetch('/api/gerar-contrato', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-api-key': 'teste_local'
        },
        body: JSON.stringify({
          nome,
          documento, // se em branco, extrai do texto automaticamente!
          email,
          whatsapp,
          pdf_base64: samplePdfBase64,
          texto_contrato: textoContrato
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSucesso(`Contrato gerado com sucesso! Link: ${data.link}`);
      setNome('');
      setEmail('');
      setWhatsapp('');
      setDocumento('');
      fetchContratos();
      setActiveTab('lista');
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao gerar contrato');
    } finally {
      setLoading(false);
    }
  }

  async function handleAssinarAdmin(token: string) {
    setLoading(true);
    setErro('');
    try {
      const res = await fetch('/api/assinar-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_acesso: token })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setSucesso('Você assinou o contrato com sucesso! Documento totalmente assinado e criptografado.');
      fetchContratos();
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao assinar como empresa');
    } finally {
      setLoading(false);
    }
  }

  function getStatusLabel(status: Contrato['status']) {
    switch (status) {
      case 'pendente': return <span className={`${styles.status} ${styles.statusPendente}`}>Pendente</span>;
      case 'visualizado': return <span className={`${styles.status} ${styles.statusVisualizado}`}>Visualizado</span>;
      case 'assinado_cliente': return <span className={`${styles.status} ${styles.statusCliente}`}>Assinado p/ Cliente</span>;
      case 'assinado_total': return <span className={`${styles.status} ${styles.statusTotal}`}>Totalmente Assinado</span>;
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>✦</span>
            <span className={styles.logoText}>Painel Filara Contratos</span>
          </div>
          <div className={styles.nav}>
            <button 
              onClick={() => setActiveTab('lista')} 
              className={`${styles.navBtn} ${activeTab === 'lista' ? styles.navBtnActive : ''}`}
            >
              📋 Contratos Ativos
            </button>
            <button 
              onClick={() => setActiveTab('criar')} 
              className={`${styles.navBtn} ${activeTab === 'criar' ? styles.navBtnActive : ''}`}
            >
              ✍️ Novo Contrato
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {sucesso && <div className={styles.successBox} onClick={() => setSucesso('')}>✅ {sucesso}</div>}
        {erro && <div className={styles.errorBox} onClick={() => setErro('')}>⚠️ {erro}</div>}

        {/* TAB 1: CRIAR CONTRATO */}
        {activeTab === 'criar' && (
          <div className={styles.card}>
            <h1 className={styles.title}>Criar Novo Contrato</h1>
            <p className={styles.subtitle}>
              Preencha os dados do cliente. Opcionalmente, deixe o CPF em branco para que o sistema o extraia automaticamente do texto do contrato!
            </p>

            <form onSubmit={handleCriarContrato} className={styles.form}>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Nome do Cliente</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Frantiesco de Oliveira" 
                    value={nome}
                    onChange={e => setNome(e.target.value)}
                    className={styles.input}
                    required 
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>CPF/CNPJ do Cliente (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 123.456.789-00" 
                    value={documento}
                    onChange={e => setDocumento(e.target.value)}
                    className={styles.input}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>E-mail do Cliente</label>
                  <input 
                    type="email" 
                    placeholder="Ex: cliente@email.com" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={styles.input}
                    required 
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label className={styles.label}>WhatsApp do Cliente</label>
                  <input 
                    type="text" 
                    placeholder="Ex: 11988887777" 
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    className={styles.input}
                    required 
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Texto Completo do Contrato</label>
                <textarea 
                  rows={8}
                  placeholder="Escreva ou cole o contrato aqui..."
                  value={textoContrato}
                  onChange={e => setTextoContrato(e.target.value)}
                  className={styles.textarea}
                  required
                />
              </div>

              <button type="submit" disabled={loading} className={styles.btnPrimary}>
                {loading ? 'Processando e Gerando...' : 'Criar e Enviar Contrato ⚡'}
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: LISTA DE CONTRATOS */}
        {activeTab === 'lista' && (
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <h2 className={styles.tableTitle}>Contratos em Processamento</h2>
              <p className={styles.tableSubtitle}>Acompanhe o status e assine os documentos finalizados pelos clientes em tempo real.</p>
            </div>

            {contratos.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📂</div>
                <p>Nenhum contrato gerado ainda.</p>
                <button onClick={() => setActiveTab('criar')} className={styles.btnEmpty}>
                  Criar Primeiro Contrato
                </button>
              </div>
            ) : (
              <div className={styles.listWrapper}>
                {contratos.map(contrato => {
                  // Pega os últimos 4 dígitos do documento para mostrar como dica
                  const docLimpo = contrato.cliente_documento.replace(/\D/g, '');
                  const digitosDica = docLimpo.slice(-4);

                  return (
                    <div key={contrato.id} className={styles.contractItem}>
                      <div className={styles.contractMeta}>
                        <div>
                          <h3 className={styles.contractClient}>{contrato.cliente_nome}</h3>
                          <p className={styles.contractContacts}>
                            📧 {contrato.cliente_email} | 📱 {contrato.cliente_whatsapp}
                          </p>
                          <p className={styles.contractDoc}>
                            🪪 CPF/CNPJ: <strong>{contrato.cliente_documento}</strong> (Senha de acesso: {digitosDica})
                          </p>
                        </div>
                        <div className={styles.rightMeta}>
                          {getStatusLabel(contrato.status)}
                          <span className={styles.dateText}>
                            {new Date(contrato.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>

                      {/* Ações e Links */}
                      <div className={styles.contractActions}>
                        <div className={styles.linksGroup}>
                          <a 
                            href={`/contrato/${contrato.token_acesso}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={styles.linkUrl}
                          >
                            🔗 Link do Cliente (Simular Assinatura)
                          </a>

                          {contrato.status === 'assinado_total' && (
                            <a 
                              href={`/contrato/${contrato.token_acesso}/certificado`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className={styles.linkUrl}
                              style={{ color: '#10b981', fontWeight: 700 }}
                            >
                              📄 Visualizar Certificado PDF
                            </a>
                          )}
                        </div>

                        {/* Botão de Assinar como Administrador / Empresa */}
                        {contrato.status === 'assinado_cliente' && (
                          <button 
                            onClick={() => handleAssinarAdmin(contrato.token_acesso)}
                            className={styles.btnActionSign}
                          >
                            ✍️ Assinar como Testemunha/Empresa
                          </button>
                        )}
                      </div>

                      {/* Seção de evidências legais se já estiver assinado por alguém */}
                      {(contrato.evidencias_cliente || contrato.evidencias_admin) && (
                        <div className={styles.evidenciasPanel}>
                          <h4>🔒 Recibo de Evidências Criptográficas</h4>
                          
                          {contrato.evidencias_cliente && (
                            <div className={styles.evidenciaBlock}>
                              <p><strong>Assinatura do Cliente:</strong> Registrada em {new Date(contrato.evidencias_cliente.timestamp).toLocaleString('pt-BR')} via IP {contrato.evidencias_cliente.ip}</p>
                              <code className={styles.hashText}>Hash Cliente: {contrato.evidencias_cliente.hash}</code>
                            </div>
                          )}

                          {contrato.evidencias_admin && (
                            <div className={styles.evidenciaBlock}>
                              <p><strong>Assinatura da Empresa:</strong> Registrada em {new Date(contrato.evidencias_admin.timestamp).toLocaleString('pt-BR')} via IP {contrato.evidencias_admin.ip}</p>
                              <code className={styles.hashText}>Hash Empresa: {contrato.evidencias_admin.hash}</code>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
