import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create sample parks
  const lekki = await prisma.park.upsert({
    where: { id: "lekki-phase-1-motor-park" },
    update: {},
    create: {
      id: "lekki-phase-1-motor-park",
      name: "Lekki Phase 1 Motor Park",
      address: "Lekki Phase 1, Lagos State",
      lat: 6.4474,
      lon: 3.4548,
      contactInfo: {
        phone: "+234-801-234-5678",
        email: "admin@lekkipark.com",
        address: "Lekki Phase 1, Lagos State",
      },
      isActive: true,
    },
  });

  const ikeja = await prisma.park.upsert({
    where: { id: "ikeja-motor-park" },
    update: {},
    create: {
      id: "ikeja-motor-park",
      name: "Ikeja Motor Park",
      address: "Ikeja, Lagos State",
      lat: 6.6018,
      lon: 3.3515,
      contactInfo: {
        phone: "+234-802-345-6789",
        email: "admin@ikejapark.com",
        address: "Ikeja, Lagos State",
      },
      isActive: true,
    },
  });

  // Create sample users
  const parkAdmin1 = await prisma.user.upsert({
    where: { email: "admin@lekkipark.com" },
    update: {},
    create: {
      email: "admin@lekkipark.com",
      name: "Lekki Park Admin",
      role: "PARK_ADMIN",
      parkId: lekki.id,
      isActive: true,
    },
  });

  const parkAdmin2 = await prisma.user.upsert({
    where: { email: "admin@ikejapark.com" },
    update: {},
    create: {
      email: "admin@ikejapark.com",
      name: "Ikeja Park Admin",
      role: "PARK_ADMIN",
      parkId: ikeja.id,
      isActive: true,
    },
  });

  const superAdmin = await prisma.user.upsert({
    where: { email: "super@movaa.com" },
    update: {},
    create: {
      email: "super@movaa.com",
      name: "Super Admin",
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  // Create sample route configurations
  const routes = [
    { destination: "Ibadan", basePrice: 4000 },
    { destination: "Abuja", basePrice: 6000 },
    { destination: "Port Harcourt", basePrice: 5500 },
    { destination: "Kano", basePrice: 7000 },
    { destination: "Enugu", basePrice: 5000 },
  ];

  for (const route of routes) {
    await prisma.routeConfig.upsert({
      where: {
        parkId_destination: {
          parkId: lekki.id,
          destination: route.destination,
        },
      },
      update: {},
      create: {
        parkId: lekki.id,
        destination: route.destination,
        basePrice: route.basePrice,
        vehicleCapacity: 18,
        isActive: true,
      },
    });

    await prisma.routeConfig.upsert({
      where: {
        parkId_destination: {
          parkId: ikeja.id,
          destination: route.destination,
        },
      },
      update: {},
      create: {
        parkId: ikeja.id,
        destination: route.destination,
        basePrice: route.basePrice - 200, // Slightly cheaper for Ikeja
        vehicleCapacity: 18,
        isActive: true,
      },
    });
  }

  // Create sample drivers
  const drivers = [
    {
      name: "Emeka Okafor",
      phone: "+234-803-111-2222",
      license: "LG123456789",
    },
    {
      name: "Adebayo Williams",
      phone: "+234-804-222-3333",
      license: "LG987654321",
    },
    { name: "Chidi Okoro", phone: "+234-805-333-4444", license: "LG456789123" },
    {
      name: "Folake Adeyemi",
      phone: "+234-806-444-5555",
      license: "LG789123456",
    },
  ];

  for (const driver of drivers) {
    await prisma.driver.upsert({
      where: {
        parkId_licenseNumber: {
          parkId: lekki.id,
          licenseNumber: driver.license,
        },
      },
      update: {},
      create: {
        parkId: lekki.id,
        name: driver.name,
        phone: driver.phone,
        licenseNumber: driver.license,
        qualifiedRoutes: ["Ibadan", "Abuja", "Port Harcourt"],
        isActive: true,
        rating: 4.5,
      },
    });
  }

  // Create revenue sharing configurations
  const routeConfigs = await prisma.routeConfig.findMany({
    where: { parkId: lekki.id },
  });

  for (const routeConfig of routeConfigs) {
    await prisma.revenueSharing.upsert({
      where: {
        parkId_routeId: {
          parkId: lekki.id,
          routeId: routeConfig.id,
        },
      },
      update: {},
      create: {
        parkId: lekki.id,
        routeId: routeConfig.id,
        driverPercentage: 70,
        parkPercentage: 30,
      },
    });
  }

  console.log("Database seeded successfully!");
  console.log("Login credentials:");
  console.log("Lekki Park Admin: admin@lekkipark.com / password");
  console.log("Ikeja Park Admin: admin@ikejapark.com / password");
  console.log("Super Admin: super@movaa.com / password");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });



