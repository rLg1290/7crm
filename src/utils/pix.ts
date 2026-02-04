
interface PixPayload {
  chave: string;
  nome: string;
  cidade: string;
  txid: string;
  valor: number;
}

function crc16ccitt(payload: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

export function gerarPayloadPix({ chave, nome, cidade, txid, valor }: PixPayload): string {
  const chaveKey = '01' + chave.length.toString().padStart(2, '0') + chave;
  
  const merchantAccountInfo = '0014br.gov.bcb.pix' + chaveKey;
  const merchantAccountInfoBlock = '26' + merchantAccountInfo.length.toString().padStart(2, '0') + merchantAccountInfo;

  const merchantCategoryCode = '52040000'; // 0000 = Não especificado
  const transactionCurrency = '5303986'; // 986 = BRL
  
  const valorStr = valor.toFixed(2);
  const transactionAmount = '54' + valorStr.length.toString().padStart(2, '0') + valorStr;
  
  const countryCode = '5802BR';
  
  const merchantName = '59' + nome.length.toString().padStart(2, '0') + nome;
  const merchantCity = '60' + cidade.length.toString().padStart(2, '0') + cidade;
  
  const additionalDataFieldTemplate = '05' + txid.length.toString().padStart(2, '0') + txid;
  const additionalDataField = '62' + additionalDataFieldTemplate.length.toString().padStart(2, '0') + additionalDataFieldTemplate;

  const payloadSemCRC = 
    '000201' + 
    merchantAccountInfoBlock + 
    merchantCategoryCode + 
    transactionCurrency + 
    transactionAmount + 
    countryCode + 
    merchantName + 
    merchantCity + 
    additionalDataField + 
    '6304';

  const crc = crc16ccitt(payloadSemCRC);
  
  return payloadSemCRC + crc;
}
