import { PrismaClient, Role, StatutIntervention, TypeIntervention, PrioriteIntervention, OrigineIntervention, TypeZone } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Nettoyer les données existantes
  await prisma.intervention.deleteMany()
  await prisma.sousZone.deleteMany()
  await prisma.zone.deleteMany()
  await prisma.user.deleteMany()
  await prisma.hotel.deleteMany()

  // Créer les hôtels
  const hotels = await prisma.hotel.createMany({
    data: [
      {
        nom: "Club Med Palmiye",
        adresse: "Kemer, Antalya",
        pays: "Turquie",
      },
      {
        nom: "Grand Hotel Paris",
        adresse: "Avenue des Champs-Élysées",
        pays: "France",
      },
      {
        nom: "Hotel Barcelona Plaza",
        adresse: "Plaça Catalunya",
        pays: "Espagne",
      },
    ],
  })

  const hotelsCreated = await prisma.hotel.findMany()
  const clubMed = hotelsCreated[0]

  // Créer les utilisateurs
  const hashedPassword = await bcrypt.hash("password123", 12)

  const users = await Promise.all([
    // Manager
    prisma.user.create({
      data: {
        email: "manager@clubmed.com",
        password: hashedPassword,
        name: "Sophie Martin",
        role: Role.MANAGER,
        hotelId: clubMed.id,
      },
    }),
    // Staff
    prisma.user.create({
      data: {
        email: "staff@clubmed.com",
        password: hashedPassword,
        name: "Pierre Dubois",
        role: Role.STAFF,
        hotelId: clubMed.id,
      },
    }),
    // Techniciens
    prisma.user.create({
      data: {
        email: "plombier@clubmed.com",
        password: hashedPassword,
        name: "Jean Plombier",
        role: Role.TECHNICIEN,
        specialite: "Plomberie",
        hotelId: clubMed.id,
      },
    }),
    prisma.user.create({
      data: {
        email: "electricien@clubmed.com",
        password: hashedPassword,
        name: "Marie Électricienne",
        role: Role.TECHNICIEN,
        specialite: "Électricité",
        hotelId: clubMed.id,
      },
    }),
  ])

  // Créer les zones
  const zones = await Promise.all([
    prisma.zone.create({
      data: {
        nom: "Chambres",
        type: TypeZone.CHAMBRE,
        hotelId: clubMed.id,
        sousZones: {
          create: [
            { nom: "Chambre 101" },
            { nom: "Chambre 102" },
            { nom: "Chambre 201" },
            { nom: "Chambre 202" },
          ]
        }
      },
    }),
    prisma.zone.create({
      data: {
        nom: "Restaurant principal",
        type: TypeZone.RESTAURANT,
        hotelId: clubMed.id,
        sousZones: {
          create: [
            { nom: "Salle principale" },
            { nom: "Terrasse" },
            { nom: "Cuisine" },
          ]
        }
      },
    }),
    prisma.zone.create({
      data: {
        nom: "Réception",
        type: TypeZone.RECEPTION,
        hotelId: clubMed.id,
        sousZones: {
          create: [
            { nom: "Hall d'accueil" },
            { nom: "Bureau manager" },
          ]
        }
      },
    }),
    prisma.zone.create({
      data: {
        nom: "Piscine",
        type: TypeZone.PISCINE,
        hotelId: clubMed.id,
        sousZones: {
          create: [
            { nom: "Bassin principal" },
            { nom: "Bassin enfants" },
            { nom: "Local technique" },
          ]
        }
      },
    }),
  ])

  // Créer des interventions d'exemple
  const zoneChambres = zones[0]
  const zoneRestaurant = zones[1]
  const zonePiscine = zones[3]

  const sousZones = await prisma.sousZone.findMany()
  const chambre101 = sousZones.find(sz => sz.nom === "Chambre 101")
  const cuisine = sousZones.find(sz => sz.nom === "Cuisine")
  const localTechnique = sousZones.find(sz => sz.nom === "Local technique")

  // Créer les interventions - 50 données supplémentaires pour les statistiques
  const interventionsData = []

  // Interventions d'exemple originales
  interventionsData.push(
    {
      titre: "Fuite robinet chambre 101",
      description: "Le robinet de la salle de bain fuit abondamment, intervention urgente requise",
      statut: StatutIntervention.EN_COURS,
      type: TypeIntervention.PLOMBERIE,
      priorite: PrioriteIntervention.URGENTE,
      origine: OrigineIntervention.CLIENT,
      dateCreation: new Date(Date.now() - 2 * 60 * 60 * 1000), // Il y a 2h
      dateDebut: new Date(Date.now() - 1 * 60 * 60 * 1000), // Il y a 1h
      hotelId: clubMed.id,
      demandeurId: users[1].id,
      assigneId: users[2].id,
      zoneId: zoneChambres.id,
      sousZoneId: chambre101?.id,
    },
    {
      titre: "Panne four cuisine",
      description: "Le four principal ne chauffe plus correctement, température insuffisante",
      statut: StatutIntervention.EN_ATTENTE,
      type: TypeIntervention.ELECTRICITE,
      priorite: PrioriteIntervention.HAUTE,
      origine: OrigineIntervention.STAFF,
      dateCreation: new Date(Date.now() - 3 * 60 * 60 * 1000), // Il y a 3h
      hotelId: clubMed.id,
      demandeurId: users[0].id,
      assigneId: users[3].id,
      zoneId: zoneRestaurant.id,
      sousZoneId: cuisine?.id,
    },
    {
      titre: "Nettoyage système filtration piscine",
      description: "Nettoyage hebdomadaire du système de filtration",
      statut: StatutIntervention.TERMINEE,
      type: TypeIntervention.NETTOYAGE,
      priorite: PrioriteIntervention.NORMALE,
      origine: OrigineIntervention.STAFF,
      dateCreation: new Date(Date.now() - 4 * 60 * 60 * 1000), // Il y a 4h
      dateDebut: new Date(Date.now() - 3 * 60 * 60 * 1000), // Il y a 3h
      dateFin: new Date(Date.now() - 1 * 60 * 60 * 1000), // Il y a 1h
      hotelId: clubMed.id,
      demandeurId: users[1].id,
      assigneId: users[2].id,
      zoneId: zonePiscine.id,
      sousZoneId: localTechnique?.id,
    },
    {
      titre: "Ampoule grillée couloir étage 2",
      description: "Plusieurs ampoules à remplacer dans le couloir",
      statut: StatutIntervention.EN_ATTENTE,
      type: TypeIntervention.ELECTRICITE,
      priorite: PrioriteIntervention.BASSE,
      origine: OrigineIntervention.STAFF,
      dateCreation: new Date(Date.now() - 5 * 60 * 60 * 1000), // Il y a 5h
      hotelId: clubMed.id,
      demandeurId: users[1].id,
      zoneId: zoneChambres.id,
    }
  )

  // 50 interventions supplémentaires avec données variées
  const typesList = Object.values(TypeIntervention)
  const statutsList = Object.values(StatutIntervention)
  const prioritesList = Object.values(PrioriteIntervention)
  const originesList = Object.values(OrigineIntervention)

  const titresInterventions = [
    "Réparation climatisation", "Changement serrure", "Peinture rafraîchissement", "Débouchage canalisation",
    "Installation éclairage", "Réparation télévision", "Nettoyage vitres", "Réparation ascenseur",
    "Maintenance chauffage", "Réparation volets", "Installation prises", "Réparation douche",
    "Peinture murs", "Réparation porte", "Installation miroir", "Nettoyage moquette",
    "Réparation fenêtre", "Installation rideau", "Réparation lavabo", "Maintenance ventilation",
    "Réparation sol", "Installation étagères", "Réparation robinetterie", "Peinture plafond",
    "Réparation carrelage", "Installation luminaire", "Réparation interrupteur", "Nettoyage tapis",
    "Réparation parquet", "Installation meuble", "Réparation store", "Maintenance filtration",
    "Réparation balcon", "Installation tableau", "Réparation terrasse", "Nettoyage façade",
    "Réparation toiture", "Installation antenne", "Réparation gouttière", "Maintenance jardin",
    "Réparation clôture", "Installation éclairage extérieur", "Réparation portail", "Nettoyage parking",
    "Réparation escalier", "Installation rampe", "Réparation sol extérieur", "Maintenance piscine"
  ]

  for (let i = 0; i < 50; i++) {
    const randomDaysAgo = Math.floor(Math.random() * 30) // 0-30 jours
    const randomHoursAgo = Math.floor(Math.random() * 24) // 0-24 heures
    const dateCreation = new Date(Date.now() - randomDaysAgo * 24 * 60 * 60 * 1000 - randomHoursAgo * 60 * 60 * 1000)

    const statut = statutsList[Math.floor(Math.random() * statutsList.length)]
    const type = typesList[Math.floor(Math.random() * typesList.length)]
    const priorite = prioritesList[Math.floor(Math.random() * prioritesList.length)]
    const origine = originesList[Math.floor(Math.random() * originesList.length)]

    const randomZone = zones[Math.floor(Math.random() * zones.length)]
    const zonesSousZones = await prisma.sousZone.findMany({
      where: { zoneId: randomZone.id }
    })
    const randomSousZone = zonesSousZones[Math.floor(Math.random() * zonesSousZones.length)]

    const demandeur = users[Math.floor(Math.random() * 2)] // Staff ou Manager
    const assigneTechnicien = Math.random() > 0.3 ? users[2 + Math.floor(Math.random() * 2)] : null // 70% chance d'avoir un technicien

    let dateDebut = null
    let dateFin = null

    // Logique des dates selon le statut
    if (statut === StatutIntervention.EN_COURS) {
      // Commence entre la création et maintenant
      dateDebut = new Date(dateCreation.getTime() + Math.random() * (Date.now() - dateCreation.getTime()))
    } else if (statut === StatutIntervention.TERMINEE) {
      // Commence après création, finit après début
      dateDebut = new Date(dateCreation.getTime() + Math.random() * (Date.now() - dateCreation.getTime()) * 0.5)
      dateFin = new Date(dateDebut.getTime() + Math.random() * (Date.now() - dateDebut.getTime()))
    }

    const titre = `${titresInterventions[i % titresInterventions.length]} ${randomZone.nom.toLowerCase()}`

    interventionsData.push({
      titre,
      description: `Intervention de ${type.toLowerCase()} nécessaire dans ${randomZone.nom}`,
      statut,
      type,
      priorite,
      origine,
      dateCreation,
      dateDebut,
      dateFin,
      hotelId: clubMed.id,
      demandeurId: demandeur.id,
      assigneId: assigneTechnicien?.id,
      zoneId: randomZone.id,
      sousZoneId: randomSousZone?.id,
    })
  }

  // Créer toutes les interventions
  await Promise.all(
    interventionsData.map(data => prisma.intervention.create({ data }))
  )

  console.log("✅ Données créées avec succès !")
  console.log("\n🏨 Hôtel de test: Club Med Palmiye")
  console.log("\n👥 Utilisateurs de test:")
  console.log("📧 Manager: manager@clubmed.com / password123")
  console.log("📧 Staff: staff@clubmed.com / password123")
  console.log("📧 Plombier: plombier@clubmed.com / password123")
  console.log("📧 Électricienne: electricien@clubmed.com / password123")
  console.log(`\n🛠️ ${interventionsData.length} interventions créées pour les statistiques`)
  console.log("🌐 Accédez à http://localhost:3000 pour tester")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
