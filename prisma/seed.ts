import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function main() {
  // Créer l'hôtel
  const hotel = await prisma.hotel.create({
    data: {
      nom: "Club Med Palmiye",
      adresse: "Kemer, Antalya",
      pays: "Turquie",
    },
  })

  // Créer 2 users liés à cet hôtel
  await prisma.user.createMany({
    data: [
      {
        email: "manager@palmiye.com",
        name: "Fanfan",
        role: "MANAGER",
        hotelId: hotel.id,
      },
      {
        email: "staff@palmiye.com",
        name: "Burcu",
        role: "STAFF",
        hotelId: hotel.id,
      },
    ],
  })

  console.log("✅ Hôtel et users créés avec succès !")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
