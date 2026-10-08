```vue
<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { devises, taux } from '../data/taux.js'
import { recupererTaux } from '../data/api.js'

// Montant saisi par l'utilisateur
const montant = ref('0')

// Devise de départ
const deviseSource = ref('USD')

// Devise d'arrivée
const deviseCible = ref('EUR')

// Résultat de la conversion
const resultat = ref('')

// Message d'erreur
const erreur = ref('')

// Taux utilisés pour la conversion
// Au début, on utilise les taux fixes
const tauxActuels = ref({ ...taux })

// Touches du clavier numérique
const touches = computed(() => [
  '7', '8', '9',
  '4', '5', '6',
  '1', '2', '3',
  'C', '0', '.'
])

// Charger les taux depuis l'API
async function chargerTaux() {
  try {
    const nouveauxTaux = await recupererTaux()

    // Garder uniquement les devises de notre application
    tauxActuels.value = {
      EUR: nouveauxTaux.EUR,
      USD: nouveauxTaux.USD,
      TND: nouveauxTaux.TND,
      GBP: nouveauxTaux.GBP,
      JPY: nouveauxTaux.JPY,
      CAD: nouveauxTaux.CAD
    }

    // Refaire la conversion avec les nouveaux taux
    if (parseFloat(montant.value) > 0) {
      convertir()
    }
  } catch (error) {
    // Si l'API ne fonctionne pas,
    // les taux fixes restent utilisés
    tauxActuels.value = { ...taux }

    console.log('API indisponible : utilisation des taux fixes')
  }
}

// Ajouter une touche au montant
function appuyer(touche) {
  // Effacer le montant
  if (touche === 'C') {
    montant.value = '0'
    resultat.value = ''
    erreur.value = ''
    return
  }

  // Effacer le message d'erreur
  erreur.value = ''

  // Empêcher plusieurs points décimaux
  if (touche === '.' && montant.value.includes('.')) {
    return
  }

  // Le montant ne doit pas dépasser 10 caractères
  if (montant.value.length >= 10) {
    return
  }

  // Si le montant est 0, le premier chiffre remplace le 0
  if (montant.value === '0' && touche !== '.') {
    montant.value = touche
  } else {
    montant.value += touche
  }
}

// Effectuer la conversion
function convertir() {
  const valeur = parseFloat(montant.value)

  // Vérifier que le montant est valide
  if (isNaN(valeur) || valeur === 0) {
    resultat.value = ''
    erreur.value = 'Veuillez saisir un montant'
    return
  }

  // Convertir le montant vers EUR
  const montantEnEuro = valeur / tauxActuels.value[deviseSource.value]

  // Convertir EUR vers la devise cible
  const montantConverti =
    montantEnEuro * tauxActuels.value[deviseCible.value]

  // Afficher le résultat avec 2 chiffres après la virgule
  resultat.value = montantConverti.toFixed(2)

  // Supprimer l'erreur
  erreur.value = ''
}

// Inverser les deux devises
function inverser() {
  const ancienneSource = deviseSource.value

  deviseSource.value = deviseCible.value
  deviseCible.value = ancienneSource

  // Refaire la conversion si un résultat existe déjà
  if (resultat.value !== '') {
    convertir()
  }
}

// Conversion automatique
watch([montant, deviseSource, deviseCible], () => {
  if (parseFloat(montant.value) > 0) {
    convertir()
  }
})

// Gestion du clavier physique
function gererClavier(event) {
  // Les chiffres du clavier
  if (event.key >= '0' && event.key <= '9') {
    appuyer(event.key)
  }

  // Le point décimal
  else if (event.key === '.') {
    appuyer('.')
  }

  // Effacer le dernier caractère
  else if (event.key === 'Backspace') {
    if (montant.value.length > 1) {
      montant.value = montant.value.slice(0, -1)
    } else {
      montant.value = '0'
    }

    erreur.value = ''
  }

  // Entrée = convertir
  else if (event.key === 'Enter') {
    convertir()
  }

  // Escape = effacer
  else if (event.key === 'Escape') {
    appuyer('C')
  }
}

// Charger l'API et activer le clavier physique
onMounted(() => {
  chargerTaux()

  // Écouter les touches du clavier
  window.addEventListener('keydown', gererClavier)
})

// Supprimer l'écoute du clavier quand le composant est détruit
onBeforeUnmount(() => {
  window.removeEventListener('keydown', gererClavier)
})
</script>

<template>
  <div class="convertisseur">

    <!-- Zone supérieure -->
    <div class="ecran">

      <h1>Currency Converter</h1>

      <!-- Devise source -->
      <select v-model="deviseSource">
        <option
          v-for="devise in devises"
          :key="devise"
          :value="devise"
        >
          {{ devise }}
        </option>
      </select>

      <!-- Montant -->
      <div class="montant">
        {{ montant }}
      </div>

      <!-- Bouton inverser -->
      <button class="bouton-inverser" @click="inverser">
        ⇅
      </button>

      <!-- Devise cible -->
      <select v-model="deviseCible">
        <option
          v-for="devise in devises"
          :key="devise"
          :value="devise"
        >
          {{ devise }}
        </option>
      </select>

      <!-- Résultat -->
      <div class="resultat">
        {{ resultat }}
      </div>

      <!-- Bouton convertir -->
      <button class="bouton-convertir" @click="convertir">
        Convertir
      </button>

      <!-- Message d'erreur -->
      <p v-if="erreur" class="erreur">
        {{ erreur }}
      </p>

    </div>

    <!-- Clavier numérique -->
    <div class="clavier">

      <button
        v-for="touche in touches"
        :key="touche"
        :class="{ 'touche-effacer': touche === 'C' }"
        @click="appuyer(touche)"
      >
        {{ touche }}
      </button>

    </div>

  </div>
</template>

<style scoped>
/* Carte principale */
.convertisseur {
  width: 100%;
  max-width: 360px;
  margin: 30px auto;
  background: #f5f5f5;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

/* Zone de l'écran */
.ecran {
  background: #2BB8E8;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Titre */
h1 {
  color: white;
  font-size: 24px;
  margin: 0 0 20px;
  text-align: center;
}

/* Listes des devises */
select {
  width: 100%;
  max-width: 250px;
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-size: 18px;
  background: white;
  cursor: pointer;
}

/* Montant et résultat */
.montant,
.resultat {
  width: 100%;
  text-align: right;
  font-size: 48px;
  color: white;
  margin: 15px 0;
  border-bottom: 2px solid white;
  min-height: 60px;
}

/* Bouton inverser */
.bouton-inverser {
  width: 50px;
  height: 40px;
  border: none;
  border-radius: 20px;
  background: white;
  color: #1BA6C9;
  font-size: 24px;
  cursor: pointer;
  margin: 5px 0 15px;
}

/* Bouton convertir */
.bouton-convertir {
  margin-top: 15px;
  padding: 12px 30px;
  border: none;
  border-radius: 8px;
  background: white;
  color: #1BA6C9;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
}

/* Message d'erreur */
.erreur {
  color: #b00020;
  background: #ffd9dc;
  padding: 8px 12px;
  border-radius: 6px;
  margin: 10px 0 0;
  text-align: center;
}

/* Clavier numérique */
.clavier {
  padding: 15px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  background: #f5f5f5;
}

/* Touches */
.clavier button {
  height: 65px;
  border: none;
  background: transparent;
  color: #1BA6C9;
  font-size: 32px;
  font-weight: bold;
  cursor: pointer;
  border-radius: 8px;
}

/* Touche C */
.clavier button.touche-effacer {
  color: #F0727A;
}

/* Effet au clic */
.clavier button:active {
  background: rgba(27, 166, 201, 0.1);
}

/* Adaptation téléphone */
@media (max-width: 360px) {
  .convertisseur {
    margin: 0 auto;
    border-radius: 0;
  }

  .ecran {
    padding: 15px;
  }

  .montant,
  .resultat {
    font-size: 42px;
  }
}
</style>
```
