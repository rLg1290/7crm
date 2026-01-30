export const AIRLINE_LOGOS: Record<string, string> = {
  'GOL': 'https://pics.avs.io/200/200/G3.png',
  'AZUL': 'https://pics.avs.io/200/200/AD.png',
  'LATAM': 'https://pics.avs.io/200/200/LA.png',
  'VOEPASS': 'https://pics.avs.io/200/200/2Z.png',
  'PASSAREDO': 'https://pics.avs.io/200/200/2Z.png',
  'AVIANCA': 'https://pics.avs.io/200/200/AV.png',
  'COPA': 'https://pics.avs.io/200/200/CM.png',
  'TAP': 'https://pics.avs.io/200/200/TP.png',
  'AIR FRANCE': 'https://pics.avs.io/200/200/AF.png',
  'KLM': 'https://pics.avs.io/200/200/KL.png',
  'AMERICAN': 'https://pics.avs.io/200/200/AA.png',
  'UNITED': 'https://pics.avs.io/200/200/UA.png',
  'DELTA': 'https://pics.avs.io/200/200/DL.png',
  'IBERIA': 'https://pics.avs.io/200/200/IB.png',
  'BRITISH': 'https://pics.avs.io/200/200/BA.png',
  'LUFTHANSA': 'https://pics.avs.io/200/200/LH.png',
  'EMIRATES': 'https://pics.avs.io/200/200/EK.png',
  'QATAR': 'https://pics.avs.io/200/200/QR.png',
  'TURKISH': 'https://pics.avs.io/200/200/TK.png',
  'AEROLINEAS': 'https://pics.avs.io/200/200/AR.png',
  'SKY': 'https://pics.avs.io/200/200/H2.png',
  'JETSMART': 'https://pics.avs.io/200/200/JA.png',
  'SWISS': 'https://pics.avs.io/200/200/LX.png',
  'ITA': 'https://pics.avs.io/200/200/AZ.png',
  'AIR CANADA': 'https://pics.avs.io/200/200/AC.png',
  'AIR EUROPA': 'https://pics.avs.io/200/200/UX.png',
  'AEROMEXICO': 'https://pics.avs.io/200/200/AM.png',
  'BOLIVIANA': 'https://pics.avs.io/200/200/OB.png',
  'PARANAIR': 'https://pics.avs.io/200/200/ZP.png',
  'QANTAS': 'https://pics.avs.io/200/200/QF.png',
  'ALITALIA': 'https://pics.avs.io/200/200/AZ.png',
  'ETIHAD': 'https://pics.avs.io/200/200/EY.png',
  'JAPAN AIRLINES': 'https://pics.avs.io/200/200/JL.png',
  'ANA': 'https://pics.avs.io/200/200/NH.png',
  'KOREAN AIR': 'https://pics.avs.io/200/200/KE.png',
  'CATHAY': 'https://pics.avs.io/200/200/CX.png',
  'SINGAPORE': 'https://pics.avs.io/200/200/SQ.png'
}

export const getAirlineLogoUrl = (airlineName: string): string | null => {
  if (!airlineName) return null
  
  const upperName = airlineName.trim().toUpperCase()
  
  // Direct match or contains match
  for (const [key, url] of Object.entries(AIRLINE_LOGOS)) {
    if (upperName.includes(key)) {
      return url
    }
  }
  
  return null
}
