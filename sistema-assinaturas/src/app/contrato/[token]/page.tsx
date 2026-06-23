'use client';

import { useState, useRef, use } from 'react';
import styles from './page.module.css';

type Step = 'validacao' | 'leitura' | 'assinado' | 'erro';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function ContratoPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [step, setStep] = useState<Step>('validacao');
  const [digitos, setDigitos] = useState('');
  const [clienteNome, setClienteNome] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [hash, setHash] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [leuContrato, setLeuContrato] = useState(false);
  const pdfRef = useRef<HTMLIFrameElement>(null);

  async function handleValidar(e: React.FormEvent) {
    e.preventDefault();
    if (digitos.length !== 4) return;
    setLoading(true);
    setErro('');
    try {
      const res = await fetch('/api/validar-acesso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_acesso: token, ultimos_digitos: digitos }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setClienteNome(data.cliente_nome);
      setPdfUrl(data.pdf_url);
      setStep('leitura');
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  async function handleAssinar() {
    if (!leuContrato) return;
    setLoading(true);
    setErro('');
    try {
      const res = await fetch('/api/assinar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token_acesso: token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setHash(data.hash);
      setTimestamp(data.timestamp);
      setStep('assinado');
    } catch (err: unknown) {
      setErro(err instanceof Error ? err.message : 'Erro ao assinar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>✦</span>
            <span className={styles.logoText}>Filara</span>
          </div>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            Assinatura Eletrônica Segura
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* PASSO 1: Validação de identidade */}
        {step === 'validacao' && (
          <div className={styles.card}>
            <div className={styles.cardIcon}>🔐</div>
            <h1 className={styles.cardTitle}>Verificação de Identidade</h1>
            <p className={styles.cardDesc}>
              Para acessar o seu contrato com segurança, informe os{' '}
              <strong>4 últimos dígitos</strong> do seu CPF, CNPJ ou celular cadastrado.
            </p>

            <form onSubmit={handleValidar} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="digitos" className={styles.label}>
                  Código de verificação
                </label>
                <input
                  id="digitos"
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  pattern="\d{4}"
                  placeholder="••••"
                  value={digitos}
                  onChange={(e) => setDigitos(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className={styles.input}
                  autoFocus
                  required
                />
              </div>

              {erro && (
                <div className={styles.errorBox}>
                  <span>⚠️</span> {erro}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || digitos.length !== 4}
                className={styles.btnPrimary}
              >
                {loading ? (
                  <span className={styles.spinner} />
                ) : (
                  'Acessar Contrato →'
                )}
              </button>
            </form>

            <div className={styles.securityNote}>
              <span>🛡️</span>
              <span>Seus dados são protegidos por criptografia de ponta a ponta.</span>
            </div>
          </div>
        )}

        {/* PASSO 2: Leitura e assinatura */}
        {step === 'leitura' && (
          <div className={styles.readerLayout}>
            <div className={styles.readerHeader}>
              <div>
                <p className={styles.readerGreeting}>Olá, {clienteNome} 👋</p>
                <h1 className={styles.readerTitle}>Leia o contrato abaixo com atenção</h1>
              </div>
              <div className={styles.stepBadge}>Passo 2 de 2</div>
            </div>

            {/* Viewer do PDF */}
            <div className={styles.pdfWrapper}>
              <iframe
                ref={pdfRef}
                src={pdfUrl}
                className={styles.pdfIframe}
                title="Contrato PDF"
                onLoad={() => setLeuContrato(true)}
              />
            </div>

            {/* Confirmação e assinatura */}
            <div className={styles.signCard}>
              <label className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={leuContrato}
                  onChange={(e) => setLeuContrato(e.target.checked)}
                  className={styles.checkbox}
                />
                <span>
                  Li e compreendi <strong>integralmente</strong> o conteúdo deste contrato
                  e concordo com todos os seus termos e condições.
                </span>
              </label>

              {erro && (
                <div className={styles.errorBox}>
                  <span>⚠️</span> {erro}
                </div>
              )}

              <button
                onClick={handleAssinar}
                disabled={loading || !leuContrato}
                className={styles.btnSign}
                id="btn-assinar"
              >
                {loading ? (
                  <>
                    <span className={styles.spinner} /> Registrando assinatura...
                  </>
                ) : (
                  <>
                    <span>✍️</span> Assinar e Concordar
                  </>
                )}
              </button>

              <p className={styles.legalNote}>
                Ao clicar em &quot;Assinar e Concordar&quot;, seu IP, data/hora e identificador
                do dispositivo serão registrados como evidência legal desta assinatura eletrônica,
                conforme a Lei nº 14.063/2020.
              </p>
            </div>
          </div>
        )}

        {/* PASSO 3: Sucesso */}
        {step === 'assinado' && (
          <div className={styles.successCard}>
            <div className={styles.successIcon}>✅</div>
            <h1 className={styles.successTitle}>Contrato Assinado!</h1>
            <p className={styles.successDesc}>
              Sua assinatura foi registrada com sucesso. Você receberá uma cópia por e-mail em breve.
            </p>

            <div className={styles.hashBox}>
              <p className={styles.hashLabel}>🔒 Hash de Autenticidade (SHA-256)</p>
              <code className={styles.hashCode}>{hash}</code>
              <p className={styles.hashDate}>
                Assinado em: {new Date(timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
              </p>
            </div>

            <div className={styles.securityNote}>
              <span>📋</span>
              <span>
                Guarde o hash acima. Ele é a prova criptográfica da sua assinatura e pode ser
                verificado a qualquer momento.
              </span>
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
              <a 
                href={`/contrato/${token}/certificado`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  padding: '0.85rem 1.75rem',
                  borderRadius: '0.75rem',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                📄 Visualizar e Salvar Certificado PDF
              </a>
            </div>
          </div>
        )}
      </main>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} Filara · Plataforma de Assinatura Eletrônica</p>
      </footer>
    </div>
  );
}
