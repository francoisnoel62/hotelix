import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Créer les hôtels
  await prisma.hotel.createMany({
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

  console.log("✅ Hôtels créés avec succès !")
  console.log("📧 Vous pouvez maintenant tester les workflows d'authentification")
  console.log("🌐 Accédez à http://localhost:3000 pour commencer")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
