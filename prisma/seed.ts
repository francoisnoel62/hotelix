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

  await Promise.all([
    // Intervention urgent en cours
    prisma.intervention.create({
      data: {
        titre: "Fuite robinet chambre 101",
        description: "Le robinet de la salle de bain fuit abondamment, intervention urgente requise",
        statut: StatutIntervention.EN_COURS,
        type: TypeIntervention.PLOMBERIE,
        priorite: PrioriteIntervention.URGENTE,
        origine: OrigineIntervention.CLIENT,
        dateDebut: new Date(),
        hotelId: clubMed.id,
        demandeurId: users[1].id, // Staff
        assigneId: users[2].id, // Plombier
        zoneId: zoneChambres.id,
        sousZoneId: chambre101?.id,
      },
    }),
    // Intervention en attente
    prisma.intervention.create({
      data: {
        titre: "Panne four cuisine",
        description: "Le four principal ne chauffe plus correctement, température insuffisante",
        statut: StatutIntervention.EN_ATTENTE,
        type: TypeIntervention.ELECTRICITE,
        priorite: PrioriteIntervention.HAUTE,
        origine: OrigineIntervention.STAFF,
        hotelId: clubMed.id,
        demandeurId: users[0].id, // Manager
        assigneId: users[3].id, // Électricienne
        zoneId: zoneRestaurant.id,
        sousZoneId: cuisine?.id,
      },
    }),
    // Intervention terminée
    prisma.intervention.create({
      data: {
        titre: "Nettoyage système filtration piscine",
        description: "Nettoyage hebdomadaire du système de filtration",
        statut: StatutIntervention.TERMINEE,
        type: TypeIntervention.NETTOYAGE,
        priorite: PrioriteIntervention.NORMALE,
        origine: OrigineIntervention.STAFF,
        dateDebut: new Date(Date.now() - 2 * 60 * 60 * 1000), // Il y a 2h
        dateFin: new Date(Date.now() - 1 * 60 * 60 * 1000), // Il y a 1h
        hotelId: clubMed.id,
        demandeurId: users[1].id, // Staff
        assigneId: users[2].id, // Plombier (peut faire maintenance piscine)
        zoneId: zonePiscine.id,
        sousZoneId: localTechnique?.id,
      },
    }),
    // Intervention sans technicien assigné
    prisma.intervention.create({
      data: {
        titre: "Ampoule grillée couloir étage 2",
        description: "Plusieurs ampoules à remplacer dans le couloir",
        statut: StatutIntervention.EN_ATTENTE,
        type: TypeIntervention.ELECTRICITE,
        priorite: PrioriteIntervention.BASSE,
        origine: OrigineIntervention.STAFF,
        hotelId: clubMed.id,
        demandeurId: users[1].id, // Staff
        zoneId: zoneChambres.id, // Utilise zone chambres par défaut
      },
    }),
  ])

  console.log("✅ Données créées avec succès !")
  console.log("\n🏨 Hôtel de test: Club Med Palmiye")
  console.log("\n👥 Utilisateurs de test:")
  console.log("📧 Manager: manager@clubmed.com / password123")
  console.log("📧 Staff: staff@clubmed.com / password123")
  console.log("📧 Plombier: plombier@clubmed.com / password123")
  console.log("📧 Électricienne: electricien@clubmed.com / password123")
  console.log("\n🛠️ Interventions d'exemple créées")
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
