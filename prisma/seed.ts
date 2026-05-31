import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  const hotel = await prisma.hotel.create({
    data: {
      name: 'Grand Hotel Riviera',
      address: '123 Boulevard de la Mer',
      phone: '+33 4 93 00 00 00',
    },
  })
  console.log(`Hotel created: ${hotel.name}`)

  const adminPass = await bcrypt.hash('admin123', 10)
  const receptionPass = await bcrypt.hash('reception123', 10)
  const restaurantPass = await bcrypt.hash('restaurant123', 10)

  await prisma.user.createMany({
    data: [
      { email: 'admin@hotel.com', password: adminPass, name: 'Admin', role: 'admin', hotelId: hotel.id },
      { email: 'reception@hotel.com', password: receptionPass, name: 'Reception', role: 'reception', hotelId: hotel.id },
      { email: 'restaurant@hotel.com', password: restaurantPass, name: 'Restaurant', role: 'restaurant', hotelId: hotel.id },
    ],
  })
  console.log('Users created: admin, reception, restaurant')

  const rooms = await Promise.all(
    ['101', '102', '201', '202', '301', '302', '401', '402'].map((num) =>
      prisma.room.create({
        data: { number: num, floor: parseInt(num[0]), hotelId: hotel.id },
      })
    )
  )
  console.log(`Rooms created: ${rooms.length}`)

  await Promise.all(
    rooms.map((room, i) =>
      prisma.card.create({
        data: { cardNumber: `CARD-${String(i + 1).padStart(4, '0')}`, cardType: 'rfid', roomId: room.id },
      })
    )
  )
  console.log(`Cards created: ${rooms.length}`)

  const guests = [
    { firstName: 'Jean-Pierre', lastName: 'Dupont', mealPlan: 'all_inclusive', roomIndex: 0, occupants: 2 },
    { firstName: 'Marie', lastName: 'Laurent', mealPlan: 'full_board', roomIndex: 1, occupants: 1 },
    { firstName: 'Carlos', lastName: 'Garcia', mealPlan: 'half_board', roomIndex: 2, occupants: 3 },
    { firstName: 'Anna', lastName: 'Mueller', mealPlan: 'breakfast_only', roomIndex: 3, occupants: 2 },
    { firstName: 'Yuki', lastName: 'Tanaka', mealPlan: 'all_inclusive', roomIndex: 4, occupants: 1 },
    { firstName: 'Sophie', lastName: 'Martin', mealPlan: 'half_board', roomIndex: 5, occupants: 2 },
  ]

  const creditsByPlan: Record<string, { restaurant: number; drinks: number; extras: number }> = {
    all_inclusive: { restaurant: 100, drinks: 50, extras: 30 },
    full_board: { restaurant: 75, drinks: 25, extras: 15 },
    half_board: { restaurant: 50, drinks: 10, extras: 10 },
    breakfast_only: { restaurant: 20, drinks: 0, extras: 0 },
  }

  for (const g of guests) {
    const guest = await prisma.guest.create({
      data: {
        firstName: g.firstName,
        lastName: g.lastName,
        mealPlan: g.mealPlan,
        occupants: g.occupants,
        roomId: rooms[g.roomIndex].id,
        isActive: true,
      },
    })

    const credits = creditsByPlan[g.mealPlan]
    await prisma.credit.createMany({
      data: [
        { type: 'restaurant', balance: credits.restaurant, guestId: guest.id },
        { type: 'drinks', balance: credits.drinks, guestId: guest.id },
        { type: 'extras', balance: credits.extras, guestId: guest.id },
      ],
    })

    console.log(`Guest created: ${g.firstName} ${g.lastName} (${g.mealPlan})`)
  }

  console.log('\nSeed completed successfully!')
  console.log('\n--- Demo accounts ---')
  console.log('Admin:      admin@hotel.com / admin123')
  console.log('Reception:  reception@hotel.com / reception123')
  console.log('Restaurant: restaurant@hotel.com / restaurant123')
  console.log('\n--- Demo cards ---')
  console.log('CARD-0001 to CARD-0008')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
