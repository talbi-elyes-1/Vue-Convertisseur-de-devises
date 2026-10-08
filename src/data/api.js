
export async function recupererTaux() {
  const reponse = await fetch('https://open.er-api.com/v6/latest/EUR')

  if (!reponse.ok) {
    throw new Error('Erreur API')
  }

  const donnees = await reponse.json()

  return donnees.rates
}