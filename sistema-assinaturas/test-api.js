/**
 * FILARA · script de teste de integração e extração automática de CPF/CNPJ
 * 
 * Execução:
 * 1. Certifique-se de que o servidor está rodando (npm run dev)
 * 2. Em um novo terminal, rode: node test-api.js
 */

const sampleContractText = `
CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TECNOLOGIA
CONTRATADA: Filara IA Ltda, inscrita no CNPJ/MF sob o nº 12.345.678/0001-99.
CONTRATANTE: Frantiesco de Oliveira, portador do CPF nº 456.789.012-34, residente e domiciliado em São Paulo/SP.

Cláusula 1ª. O objeto deste contrato é o desenvolvimento de soluções cognitivas...
`;

// PDF dummy em Base64
const samplePdfBase64 = "JVBERi0xLjQKJcfsj6y9CjUgMCBvYmoKPDwgL0xlbmd0aCA2MCA+PgpzdHJlYW0KQlQgL0YxIDEyIFRmIDcwIDcwMCBUZCAoRXN0ZSDDqSB1bSBjb250cmF0byBkZSB0ZXN0ZSBkYSBGaWxhcmEpIFRqIEVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDEKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDE5IDAwMDAwIG4gCnRyYWlsZXIKPDwgL1NpemUgNiAvUm9vdCAxIDAgUiA+PgpzdGFydHhyZWYKMTE5CiUlRU9G";

async function testExtractionFlow() {
  console.log("🚀 Iniciando teste de fluxo e extração automática...");

  const payload = {
    nome: "Frantiesco de Oliveira",
    email: "frantiesco@tiesco.com",
    whatsapp: "11988887777",
    pdf_base64: samplePdfBase64,
    texto_contrato: sampleContractText // Sem passar o campo 'documento'!
  };

  try {
    const response = await fetch("http://localhost:3000/api/gerar-contrato", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "teste_local"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Falha na chamada da API:", data.error);
      return;
    }

    console.log("\n=======================================================");
    console.log("✅ CONTRATO GERADO COM SUCESSO!");
    console.log("=======================================================");
    console.log(`Documento Extraído do Texto: ${data.documento_extraido}`);
    console.log(`Token Gerado: ${data.token}`);
    console.log(`\n👉 LINK PARA TESTE VISUAL (Copie e cole no seu navegador):`);
    console.log(`   ${data.link}`);
    console.log("=======================================================");
    console.log(`\n💡 DICA DE TESTE:`);
    console.log(`Ao acessar a página, use os 4 últimos dígitos do seu CPF cadastrado.`);
    console.log(`No texto fornecido, o CPF é 456.789.012-34, então os dígitos de teste são "1234".`);
    console.log("=======================================================\n");

  } catch (error) {
    console.error("❌ Erro ao conectar ao servidor:", error.message);
  }
}

testExtractionFlow();
