export const LANGUAGES = [
  { code: 'en', name: 'English',    flag: '🇬🇧', nativeName: 'English' },
  { code: 'fr', name: 'French',     flag: '🇫🇷', nativeName: 'Français' },
  { code: 'es', name: 'Spanish',    flag: '🇪🇸', nativeName: 'Español' },
  { code: 'de', name: 'German',     flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian',    flag: '🇮🇹', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹', nativeName: 'Português' },
  { code: 'ja', name: 'Japanese',   flag: '🇯🇵', nativeName: '日本語' },
  { code: 'zh', name: 'Chinese',    flag: '🇨🇳', nativeName: '中文' },
  { code: 'ar', name: 'Arabic',     flag: '🇸🇦', nativeName: 'العربية' },
  { code: 'ru', name: 'Russian',    flag: '🇷🇺', nativeName: 'Русский' },
  { code: 'ko', name: 'Korean',     flag: '🇰🇷', nativeName: '한국어' },
  { code: 'nl', name: 'Dutch',      flag: '🇳🇱', nativeName: 'Nederlands' },
  { code: 'pl', name: 'Polish',     flag: '🇵🇱', nativeName: 'Polski' },
  { code: 'tr', name: 'Turkish',    flag: '🇹🇷', nativeName: 'Türkçe' },
  { code: 'hi', name: 'Hindi',      flag: '🇮🇳', nativeName: 'हिन्दी' },
]

export const LOCATIONS = [
  { id: 'restaurant',       name: 'Restaurant',           emoji: '🍽️',  desc: 'Commander, lire le menu, parler au serveur' },
  { id: 'cafe',             name: 'Café / Brasserie',     emoji: '☕',   desc: 'Commander, passer du temps, rencontres' },
  { id: 'musee',            name: 'Musée',                emoji: '🏛️',  desc: 'Visiter une expo, demander des informations' },
  { id: 'parc',             name: 'Parc',                 emoji: '🌳',  desc: 'Se promener, décrire la nature, les loisirs' },
  { id: 'parc_attractions', name: "Parc d'attractions",   emoji: '🎢',  desc: 'Acheter des billets, vivre les attractions' },
  { id: 'supermarche',      name: 'Supermarché',          emoji: '🛒',  desc: 'Faire les courses, demander un produit, payer' },
  { id: 'marche',           name: 'Marché',               emoji: '🧺',  desc: 'Fruits, légumes, artisanat, négocier les prix' },
  { id: 'gare',             name: 'Gare / Aéroport',      emoji: '🚂',  desc: 'Billets, quais, directions, annonces' },
  { id: 'hotel',            name: 'Hôtel',                emoji: '🏨',  desc: 'Réservation, check-in, demander des services' },
  { id: 'medecin',          name: 'Chez le médecin',      emoji: '🏥',  desc: 'Symptômes, conseils médicaux, ordonnances' },
  { id: 'pharmacie',        name: 'Pharmacie',            emoji: '💊',  desc: 'Demander un médicament, expliquer un problème' },
  { id: 'plage',            name: 'Plage',                emoji: '🏖️',  desc: 'Activités balnéaires, demander son chemin' },
  { id: 'cinema',           name: 'Cinéma / Théâtre',     emoji: '🎭',  desc: 'Réserver des places, parler des films' },
  { id: 'rue',              name: 'Dans la rue',          emoji: '🗺️',  desc: 'Directions, transports, se repérer en ville' },
  { id: 'bureau',           name: 'Bureau / Travail',     emoji: '💼',  desc: 'Réunions, emails, expressions professionnelles' },
  { id: 'universite',       name: 'Université / École',   emoji: '📚',  desc: 'Cours, campus, relations entre étudiants' },
]

export function getLang(code) {
  return LANGUAGES.find((l) => l.code === code)
}
