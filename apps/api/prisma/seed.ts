import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Dermatology-exclusive database seeding...');

  // Clean existing records in reverse dependency order
  await prisma.productDiscussion.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.tourPlan.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.product.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.user.deleteMany();

  const commonPassword = await bcrypt.hash('password123', 10);

  // 1. Create Super Admin (Head of Derma Operations)
  const admin = await prisma.user.create({
    data: {
      name: 'Dr. Vikram Malhotra',
      email: 'admin@pharma.com',
      passwordHash: commonPassword,
      role: 'ADMIN',
      phone: '+91 98100 12345',
      region: 'Derma National Headquarters',
      active: true,
    },
  });

  // 2. Create 2 Regional Managers (RSM North Derma & RSM West Derma)
  const managerNorth = await prisma.user.create({
    data: {
      name: 'Sunil Verma (RSM North Derma)',
      email: 'manager.north@pharma.com',
      passwordHash: commonPassword,
      role: 'MANAGER',
      phone: '+91 98111 23456',
      region: 'North Derma (Delhi-NCR & Punjab)',
      active: true,
    },
  });

  const managerWest = await prisma.user.create({
    data: {
      name: 'Ananya Deshmukh (RSM West Derma)',
      email: 'manager.west@pharma.com',
      passwordHash: commonPassword,
      role: 'MANAGER',
      phone: '+91 98222 34567',
      region: 'West Derma (Mumbai-Pune & Gujarat)',
      active: true,
    },
  });

  // 3. Create 6 Dermatology Medical Representatives
  const mrRahul = await prisma.user.create({
    data: {
      name: 'Rahul Sharma',
      email: 'mr.rahul@pharma.com',
      passwordHash: commonPassword,
      role: 'MR',
      phone: '+91 99101 44551',
      region: 'South & Central Delhi Derma Clinics',
      managerId: managerNorth.id,
      active: true,
    },
  });

  const mrPriya = await prisma.user.create({
    data: {
      name: 'Priya Nair',
      email: 'mr.priya@pharma.com',
      passwordHash: commonPassword,
      role: 'MR',
      phone: '+91 99102 44552',
      region: 'Gurgaon & Noida Aesthetic Hubs',
      managerId: managerNorth.id,
      active: true,
    },
  });

  const mrAmit = await prisma.user.create({
    data: {
      name: 'Amit Patel',
      email: 'mr.amit@pharma.com',
      passwordHash: commonPassword,
      role: 'MR',
      phone: '+91 99103 44553',
      region: 'Chandigarh Tri-City Derma',
      managerId: managerNorth.id,
      active: true,
    },
  });

  const mrRohan = await prisma.user.create({
    data: {
      name: 'Rohan Kulkarni',
      email: 'mr.rohan@pharma.com',
      passwordHash: commonPassword,
      role: 'MR',
      phone: '+91 98201 66771',
      region: 'Bandra & South Mumbai Skin Clinics',
      managerId: managerWest.id,
      active: true,
    },
  });

  const mrSneha = await prisma.user.create({
    data: {
      name: 'Sneha Joshi',
      email: 'mr.sneha@pharma.com',
      passwordHash: commonPassword,
      role: 'MR',
      phone: '+91 98202 66772',
      region: 'Pune Central & Kothrud Derma',
      managerId: managerWest.id,
      active: true,
    },
  });

  const mrVikram = await prisma.user.create({
    data: {
      name: 'Vikram Chawla',
      email: 'mr.vikram@pharma.com',
      passwordHash: commonPassword,
      role: 'MR',
      phone: '+91 98203 66773',
      region: 'Ahmedabad Aesthetic Centers',
      managerId: managerWest.id,
      active: true,
    },
  });

  console.log('✅ Dermatology Users seeded: 1 Admin, 2 Managers, 6 Derma MRs');

  // 4. Create 10 Specialized Dermatology & Cosmetology Formulations
  const dermaProductsData = [
    {
      name: 'RetiGlow 0.05% Gel-Cream',
      sku: 'RG-050',
      category: 'Acne & Photoaging',
      description: 'Microsphere-encapsulated Tretinoin 0.05% with minimal irritation for comedonal acne and photoaging',
      unitPrice: 380.00,
    },
    {
      name: 'DermaShield SPF 50+ Matte Gel',
      sku: 'DS-SPF50',
      category: 'Photoprotection & Post-Procedure',
      description: 'Ultra-light mineral sunscreen with Zinc Oxide, Titanium Dioxide, and Ectoin for post-peel/post-laser skin',
      unitPrice: 650.00,
    },
    {
      name: 'ClindaClear-B Aqueous Gel',
      sku: 'CCB-001',
      category: 'Acne Therapeutics',
      description: 'Clindamycin Phosphate 1% + Micronized Benzoyl Peroxide 2.5% synergy for moderate to severe inflammatory acne',
      unitPrice: 295.00,
    },
    {
      name: 'HydraBarrier Ceramide Lotion',
      sku: 'HB-LOT',
      category: 'Eczema & Barrier Repair',
      description: 'Multi-vesicular emulsion with bio-identical Ceramides 1, 3, 6-II, Cholesterol & Hyaluronic Acid for atopic dermatitis',
      unitPrice: 420.00,
    },
    {
      name: 'MelanoFade TX Pigment Serum',
      sku: 'MFTX-030',
      category: 'Pigmentation & Melasma',
      description: 'Liposomal Tranexamic Acid 5% + Kojic Acid 2% + Niacinamide 4% targeting stubborn dermal melasma and PIH',
      unitPrice: 890.00,
    },
    {
      name: 'ItraDerm 200mg Capsules',
      sku: 'ITD-200',
      category: 'Antifungal Therapy',
      description: 'SUBA-technology Itraconazole pellets offering enhanced bioavailability for chronic, recalcitrant tinea infections',
      unitPrice: 240.00,
    },
    {
      name: 'ClobetRestore 0.05% Ointment',
      sku: 'CBR-050',
      category: 'Psoriasis & Dermatoses',
      description: 'Ultra-potent Clobetasol Propionate in anhydrous occlusive emollient base for thick plaque psoriasis & lichen planus',
      unitPrice: 165.00,
    },
    {
      name: 'MinoxGlow 5% Trichology Solution',
      sku: 'MG-005',
      category: 'Trichology & Hair Disorders',
      description: 'Minoxidil 5% + Finasteride 0.1% + Procapil in alcohol-free non-sticky vehicle for male and female pattern androgenetic alopecia',
      unitPrice: 780.00,
    },
    {
      name: 'SalicylFoam 2% Purifying Wash',
      sku: 'SF-002',
      category: 'Seborrheic & Exfoliation',
      description: 'Salicylic Acid 2% + Tea Tree Extract foaming facial wash for seborrheic dermatitis, blackheads, and oily folliculitis',
      unitPrice: 310.00,
    },
    {
      name: 'BioPeptide Glow Elixir (Clinic Pack)',
      sku: 'BPG-ELX',
      category: 'Aesthetic Clinic Dispensing',
      description: 'Hydrolyzed Marine Collagen 5000mg + Reduced L-Glutathione 500mg skin brightening and anti-aging oral clinic booster',
      unitPrice: 1450.00,
    },
  ];

  const products = [];
  for (const p of dermaProductsData) {
    const created = await prisma.product.create({ data: p });
    products.push(created);
  }
  console.log('✅ Dermatology Products seeded: 10 specialized formulations');

  // 5. Create 20 Certified Dermatologists & Aesthetic Skin Specialists
  const dermatologistsData = [
    {
      name: 'Dr. Arvind Mehra, MD (Derma)',
      specialty: 'Aesthetic Dermatology & Cosmetology',
      hospitalName: 'Kaya Skin Clinic & Laser Institute',
      address: 'M-41, Greater Kailash Part 1, New Delhi',
      latitude: 28.5528,
      longitude: 77.2415,
      phone: '+91 98180 11223',
      category: 'Tier A',
    },
    {
      name: 'Dr. Radhika Sen, DVD',
      specialty: 'Clinical Dermatology & Acne Specialist',
      hospitalName: 'Max Institute of Dermatology & Skin Health',
      address: '1, Press Enclave Road, Saket, New Delhi',
      latitude: 28.5284,
      longitude: 77.2185,
      phone: '+91 98180 22334',
      category: 'Tier A',
    },
    {
      name: 'Dr. Pradeep Bansal, MD (Skin & VD)',
      specialty: 'Psoriasis & Atopic Eczema Care',
      hospitalName: 'Fortis Escorts Skin & Laser Clinic',
      address: 'Okhla Road, Sukhdev Vihar, New Delhi',
      latitude: 28.5601,
      longitude: 77.2798,
      phone: '+91 98180 33445',
      category: 'Tier B',
    },
    {
      name: 'Dr. Shalini Gupta, DNB (Derma)',
      specialty: 'Laser & Pigmentation Specialist',
      hospitalName: 'Oliva Skin & Hair Clinic',
      address: 'DLF Phase 4, Galleria Market Road, Gurugram',
      latitude: 28.4682,
      longitude: 77.0827,
      phone: '+91 98180 44556',
      category: 'Tier A',
    },
    {
      name: 'Dr. Rajesh Khurana, MD (Dermatology)',
      specialty: 'Trichology & Hair Restoration',
      hospitalName: 'Khurana Skin & Hair Transplant Center',
      address: 'D-42 Hauz Khas Enclave, New Delhi',
      latitude: 28.5494,
      longitude: 77.2001,
      phone: '+91 98180 55667',
      category: 'Tier B',
    },
    {
      name: 'Dr. Manisha Sethi, MD (Derma)',
      specialty: 'Pediatric Dermatology',
      hospitalName: 'Rainbow Children’s Dermatology Unit',
      address: 'Geetanjali Enclave, Malviya Nagar, New Delhi',
      latitude: 28.5362,
      longitude: 77.2064,
      phone: '+91 98180 66778',
      category: 'Tier B',
    },
    {
      name: 'Dr. Tushar Aggarwal, DNB (Derma)',
      specialty: 'Dermatosurgery & Mohs Surgery',
      hospitalName: 'Artemis Aesthetics & Skin Surgery Institute',
      address: 'Sector 51, Gurugram, Haryana',
      latitude: 28.4363,
      longitude: 77.0782,
      phone: '+91 98180 77889',
      category: 'Tier A',
    },
    {
      name: 'Dr. Nidhi Kapoor, MD (Derma)',
      specialty: 'Aesthetic Dermatology & Cosmetology',
      hospitalName: 'Enhance Aesthetic Skin Center',
      address: 'Sector 18, Wave Silver Tower, Noida',
      latitude: 28.5707,
      longitude: 77.3212,
      phone: '+91 98180 88990',
      category: 'Tier B',
    },
    {
      name: 'Dr. Harsh Vardhan Rao, MD (Skin)',
      specialty: 'Clinical Dermatology & Acne Specialist',
      hospitalName: 'Paras Skin & Phototherapy Institute',
      address: 'C-1, Sushant Lok Phase-I, Sector 43, Gurugram',
      latitude: 28.4619,
      longitude: 77.0865,
      phone: '+91 98180 99001',
      category: 'Tier A',
    },
    {
      name: 'Dr. Sunita Batra, DVD',
      specialty: 'Clinical Dermatology',
      hospitalName: 'Batra Derma & Wellness Clinic',
      address: 'Green Park Extension, New Delhi',
      latitude: 28.5588,
      longitude: 77.2028,
      phone: '+91 98180 10102',
      category: 'Tier C',
    },
    // Mumbai & Pune Dermatologists
    {
      name: 'Dr. Farhan Merchant, MD (Derma)',
      specialty: 'Aesthetic Dermatology & Cosmetology',
      hospitalName: 'Lilavati Aesthetic Dermatology Centre',
      address: 'A-791, Bandra Reclamation, Bandra West, Mumbai',
      latitude: 19.0514,
      longitude: 72.8295,
      phone: '+91 98200 11445',
      category: 'Tier A',
    },
    {
      name: 'Dr. Gayatri Sardesai, MD (Skin & VD)',
      specialty: 'Laser & Pigmentation Specialist',
      hospitalName: 'Kokilaben Dhirubhai Ambani Skin Institute',
      address: 'Rao Saheb Achutrao Patwardhan Marg, Andheri West, Mumbai',
      latitude: 19.1312,
      longitude: 72.8252,
      phone: '+91 98200 22556',
      category: 'Tier A',
    },
    {
      name: 'Dr. Nilesh Kothari, MD (Derma)',
      specialty: 'Trichology & Hair Restoration',
      hospitalName: 'DermLinks Advanced Hair & Scalp Clinic',
      address: 'Veer Savarkar Marg, Mahim, Mumbai',
      latitude: 19.0330,
      longitude: 72.8384,
      phone: '+91 98200 33667',
      category: 'Tier A',
    },
    {
      name: 'Dr. Alok Shinde, DVD',
      specialty: 'Psoriasis & Atopic Eczema Care',
      hospitalName: 'Ruby Hall Department of Dermatology',
      address: '40, Sassoon Road, Sangamvadi, Pune',
      latitude: 18.5314,
      longitude: 73.8743,
      phone: '+91 98200 44778',
      category: 'Tier B',
    },
    {
      name: 'Dr. Meera Gokhale, DNB (Derma)',
      specialty: 'Pediatric Dermatology',
      hospitalName: 'Deenanath Pediatric Skin Care Clinic',
      address: 'Erandwane, Karve Road, Pune',
      latitude: 18.5039,
      longitude: 73.8315,
      phone: '+91 98200 55889',
      category: 'Tier B',
    },
    {
      name: 'Dr. Vinay Deshpande, MD (Derma)',
      specialty: 'Dermatosurgery & Mohs Surgery',
      hospitalName: 'Jehangir Cosmetic Skin & Dermatosurgery',
      address: '32, Sassoon Road, Pune',
      latitude: 18.5298,
      longitude: 73.8765,
      phone: '+91 98200 66990',
      category: 'Tier A',
    },
    {
      name: 'Dr. Tanvi Parekh, MD (Derma)',
      specialty: 'Aesthetic Dermatology & Cosmetology',
      hospitalName: 'H. N. Reliance Centre for Dermatology',
      address: 'Raja Rammohan Roy Road, Prarthana Samaj, Girgaon, Mumbai',
      latitude: 18.9565,
      longitude: 72.8188,
      phone: '+91 98200 77112',
      category: 'Tier A',
    },
    {
      name: 'Dr. Sandeep Kadam, DVD',
      specialty: 'Clinical Dermatology & Acne Specialist',
      hospitalName: 'Sahyadri Specialty Skin Clinic',
      address: 'Plot No. 30 C, Erandwane, Karve Road, Pune',
      latitude: 18.5085,
      longitude: 73.8340,
      phone: '+91 98200 88223',
      category: 'Tier B',
    },
    {
      name: 'Dr. Kavita Singhania, MD (Skin)',
      specialty: 'Laser & Pigmentation Specialist',
      hospitalName: 'Breach Candy Laser Dermatology Suite',
      address: '60 A, Bhulabhai Desai Marg, Cumballa Hill, Mumbai',
      latitude: 18.9712,
      longitude: 72.8055,
      phone: '+91 98200 99334',
      category: 'Tier B',
    },
    {
      name: 'Dr. Mohan Joshi, MD (Derma)',
      specialty: 'Clinical Dermatology',
      hospitalName: 'Apollo Spectra Skin & Hair Clinic',
      address: 'Saraswati Mahal, Chembur, Mumbai',
      latitude: 19.0620,
      longitude: 72.9015,
      phone: '+91 98200 00445',
      category: 'Tier C',
    },
  ];

  const doctors = [];
  for (const doc of dermatologistsData) {
    const created = await prisma.doctor.create({ data: doc });
    doctors.push(created);
  }
  console.log('✅ Dermatologists seeded: 20 certified skin specialists and clinics');

  // 6. Create Completed & Today's Dermatology Visits
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
  const todayMorning = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 15);
  const todayAfternoon = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 14, 30);

  // Rahul completed visit 1 (Kaya Skin Clinic - Aesthetic Cosmetology)
  const visit1 = await prisma.visit.create({
    data: {
      mrId: mrRahul.id,
      doctorId: doctors[0].id, // Dr. Arvind Mehra
      checkInTime: new Date(twoDaysAgo.setHours(10, 30)),
      checkOutTime: new Date(twoDaysAgo.setHours(11, 15)),
      checkInLat: 28.5528,
      checkInLng: 77.2415,
      samplesGiven: JSON.stringify([
        { productId: products[0].id, productName: products[0].name, quantity: 5 },
        { productId: products[1].id, productName: products[1].name, quantity: 10 },
      ]),
      feedback: 'Dr. Mehra praised DermaShield SPF 50+ matte finish. Agreed to switch 15 post-chemical peel patients from competitor sunscreen to DermaShield.',
      photoUrl: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&auto=format&fit=crop&q=60',
    },
  });

  await prisma.productDiscussion.createMany({
    data: [
      { visitId: visit1.id, productId: products[0].id, notes: 'Detailed on microsphere slow-release avoiding retinoid dermatitis' },
      { visitId: visit1.id, productId: products[1].id, notes: 'Presented UV-A/UV-B critical wavelength absorption test results' },
    ],
  });

  // Rahul completed visit 2 (Max Dermatology - Acne & Barrier Repair)
  const visit2 = await prisma.visit.create({
    data: {
      mrId: mrRahul.id,
      doctorId: doctors[1].id, // Dr. Radhika Sen
      checkInTime: new Date(yesterday.setHours(11, 0)),
      checkOutTime: new Date(yesterday.setHours(11, 45)),
      checkInLat: 28.5284,
      checkInLng: 77.2185,
      samplesGiven: JSON.stringify([
        { productId: products[2].id, productName: products[2].name, quantity: 6 },
        { productId: products[3].id, productName: products[3].name, quantity: 4 },
      ]),
      feedback: 'Dr. Sen requested 10 more sample tubes of HydraBarrier Ceramide Lotion for pediatric atopic dermatitis clinic.',
      photoUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=60',
    },
  });

  await prisma.productDiscussion.createMany({
    data: [
      { visitId: visit2.id, productId: products[2].id, notes: 'Emphasized aqueous base avoiding peeling irritation of BPO' },
      { visitId: visit2.id, productId: products[3].id, notes: 'Discussed TEWL (Transepidermal Water Loss) reduction by 48%' },
    ],
  });

  // Rahul visit 3 (Fortis Dermatology - Psoriasis care)
  const visit3 = await prisma.visit.create({
    data: {
      mrId: mrRahul.id,
      doctorId: doctors[2].id, // Dr. Pradeep Bansal
      checkInTime: todayMorning,
      checkOutTime: new Date(todayMorning.getTime() + 35 * 60 * 1000),
      checkInLat: 28.5601,
      checkInLng: 77.2798,
      samplesGiven: JSON.stringify([
        { productId: products[6].id, productName: products[6].name, quantity: 4 },
      ]),
      feedback: 'Doctor confirmed high efficacy of ClobetRestore in stubborn palmar-plantar psoriasis plaques.',
    },
  });

  // Priya completed visit (Oliva Skin & Hair - Melasma & Pigmentation)
  const visit4 = await prisma.visit.create({
    data: {
      mrId: mrPriya.id,
      doctorId: doctors[3].id, // Dr. Shalini Gupta
      checkInTime: new Date(yesterday.setHours(14, 0)),
      checkOutTime: new Date(yesterday.setHours(14, 40)),
      checkInLat: 28.4682,
      checkInLng: 77.0827,
      samplesGiven: JSON.stringify([
        { productId: products[4].id, productName: products[4].name, quantity: 5 },
      ]),
      feedback: 'Very positive feedback on MelanoFade TX tolerability compared to hydroquinone combinations.',
    },
  });

  // Rohan completed visit in Mumbai (Lilavati Aesthetic Derma)
  const visit5 = await prisma.visit.create({
    data: {
      mrId: mrRohan.id,
      doctorId: doctors[10].id, // Dr. Farhan Merchant
      checkInTime: new Date(yesterday.setHours(15, 30)),
      checkOutTime: new Date(yesterday.setHours(16, 20)),
      checkInLat: 19.0514,
      checkInLng: 72.8295,
      samplesGiven: JSON.stringify([
        { productId: products[1].id, productName: products[1].name, quantity: 8 },
        { productId: products[9].id, productName: products[9].name, quantity: 2 },
      ]),
      feedback: 'Clinic formulary committee approved BioPeptide Glow Elixir for aesthetic bridal skin glow packages.',
    },
  });

  // Active check-in for Rohan today in Kokilaben Laser Derma
  const visit6 = await prisma.visit.create({
    data: {
      mrId: mrRohan.id,
      doctorId: doctors[11].id, // Dr. Gayatri Sardesai
      checkInTime: todayAfternoon,
      checkOutTime: null,
      checkInLat: 19.1312,
      checkInLng: 72.8252,
    },
  });

  console.log('✅ Dermatology Visits seeded: 5 completed detailing calls, 1 active clinic check-in');

  // 7. Create Tour Plans for Dermatology Routes
  const startOfCurrentWeek = new Date();
  startOfCurrentWeek.setDate(startOfCurrentWeek.getDate() - startOfCurrentWeek.getDay() + 1);
  startOfCurrentWeek.setHours(0, 0, 0, 0);

  const endOfCurrentWeek = new Date(startOfCurrentWeek);
  endOfCurrentWeek.setDate(endOfCurrentWeek.getDate() + 6);
  endOfCurrentWeek.setHours(23, 59, 59, 999);

  await prisma.tourPlan.create({
    data: {
      mrId: mrRahul.id,
      weekStart: startOfCurrentWeek,
      weekEnd: endOfCurrentWeek,
      status: 'APPROVED',
      reviewedBy: managerNorth.name,
      reviewNote: 'Priority coverage on Tier A Aesthetic & Acne clinics approved. Focus on DermaShield SPF and RetiGlow.',
      reviewedAt: new Date(startOfCurrentWeek.getTime() + 12 * 60 * 60 * 1000),
      planDetails: JSON.stringify([
        { date: 'Monday', area: 'GK-1 & South Extension Skin Clinics', doctorIds: [doctors[0].id], targetCalls: 5 },
        { date: 'Tuesday', area: 'Saket & Malviya Nagar Derma Centers', doctorIds: [doctors[1].id, doctors[5].id], targetCalls: 5 },
        { date: 'Wednesday', area: 'Okhla & Sukhdev Vihar Laser Units', doctorIds: [doctors[2].id], targetCalls: 4 },
        { date: 'Thursday', area: 'Hauz Khas Enclave Trichology Hub', doctorIds: [doctors[4].id, doctors[9].id], targetCalls: 6 },
        { date: 'Friday', area: 'Gurgaon Galleria & Sector 51 Aesthetics', doctorIds: [doctors[3].id, doctors[6].id], targetCalls: 5 },
        { date: 'Saturday', area: 'Cosmetic Pharmacies & Derma Stockists', doctorIds: [], targetCalls: 3 },
      ]),
    },
  });

  await prisma.tourPlan.create({
    data: {
      mrId: mrPriya.id,
      weekStart: startOfCurrentWeek,
      weekEnd: endOfCurrentWeek,
      status: 'PENDING',
      planDetails: JSON.stringify([
        { date: 'Monday', area: 'Noida Sector 18 Wave Silver Tower Aesthetics', doctorIds: [doctors[7].id], targetCalls: 5 },
        { date: 'Tuesday', area: 'Greater Noida West Derma Hub', doctorIds: [], targetCalls: 4 },
        { date: 'Wednesday', area: 'Gurgaon DLF Phase 4 Laser Clinics', doctorIds: [doctors[8].id], targetCalls: 5 },
        { date: 'Thursday', area: 'Golf Course Road Cosmetology Suites', doctorIds: [doctors[8].id], targetCalls: 5 },
        { date: 'Friday', area: 'Faridabad Multispeciality Skin Care', doctorIds: [], targetCalls: 4 },
      ]),
    },
  });

  console.log('✅ Dermatology Tour Plans seeded');

  // 8. Create Expense Claims
  await prisma.expense.create({
    data: {
      mrId: mrRahul.id,
      category: 'travel',
      amount: 1450.0,
      description: 'Fuel allowance for doctor visits across South Delhi & Gurgaon Derma Clinics (115 km)',
      receiptUrl: 'https://images.unsplash.com/photo-1554415707-9e49017aed81?w=800&auto=format&fit=crop&q=60',
      status: 'APPROVED',
      reviewedBy: managerNorth.name,
      reviewNote: 'Approved as per standard intra-city travel allowance policy.',
      reviewedAt: yesterday,
    },
  });

  await prisma.expense.create({
    data: {
      mrId: mrRahul.id,
      category: 'food',
      amount: 480.0,
      description: 'Lunch during full-day territory field coverage in Gurgaon Sector 51 Aesthetic Centre',
      receiptUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&auto=format&fit=crop&q=60',
      status: 'PENDING',
    },
  });

  await prisma.expense.create({
    data: {
      mrId: mrPriya.id,
      category: 'travel',
      amount: 850.0,
      description: 'Cab fare between Enhance Aesthetic Noida and Oliva Skin Clinic Gurgaon',
      receiptUrl: 'https://images.unsplash.com/photo-1554415707-9e49017aed81?w=800&auto=format&fit=crop&q=60',
      status: 'PENDING',
    },
  });

  console.log('✅ Expense claims seeded');
  console.log('🎉 Dermatology-exclusive database seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
