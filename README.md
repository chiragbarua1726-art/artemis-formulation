# Artemis — Dermatology Field Sales Intelligence & Reporting System

> Exclusively tailored for **Dermatologists, Cosmetologists, Trichologists & Aesthetic Skin Clinics**, built with modern SaaS design inspired by **Keyvo** and **Flexitee**.

---

## 🚀 Quick Start (One Command)

### 1. Install & Seed Database
```bash
# In project root:
npm install
npm run db:seed
```

### 2. Start Both API & Web Concurrently
```bash
npm run dev
```
- **Derma Web App:** [http://localhost:5173](http://localhost:5173)
- **API Server & Health Check:** [http://localhost:5001/api/v1/health](http://localhost:5001/api/v1/health)

---

## 🔑 Demo Login Accounts (1-Click Switchers on Login Page)

All demo accounts use password: `password123`

| Role | Name | Email | Description |
|---|---|---|---|
| **Head of Derma Operations (Admin)** | Dr. Vikram Malhotra | `admin@pharma.com` | Full master derma data control, user management, and executive analytics |
| **RSM North Derma** | Sunil Verma | `manager.north@pharma.com` | Manages North territory derma reps (Delhi-NCR & Punjab), tour plans, expense sign-offs |
| **RSM West Derma** | Ananya Deshmukh | `manager.west@pharma.com` | Manages West territory derma reps (Mumbai-Pune & Gujarat) |
| **Derma Field Rep (Delhi)** | Rahul Sharma | `mr.rahul@pharma.com` | South & Central Delhi skin clinics (Check-in, DCR, tour plans, claims) |
| **Derma Field Rep (Gurgaon/Noida)** | Priya Nair | `mr.priya@pharma.com` | Gurgaon & Noida aesthetic centers |
| **Derma Field Rep (Mumbai)** | Rohan Kulkarni | `mr.rohan@pharma.com` | Bandra & South Mumbai aesthetic clinics |

---

## 🧪 Specialized Dermatology Formulations

The system features 10 real dermatology and derma-cosmetics formulations:
1. **RetiGlow 0.05% Gel-Cream** (`RG-050`): Microsphere-encapsulated Tretinoin for comedonal acne and photoaging.
2. **DermaShield SPF 50+ Matte Gel** (`DS-SPF50`): Ultra-light mineral sunscreen with Zinc Oxide, Titanium Dioxide & Ectoin for post-laser/peel care.
3. **ClindaClear-B Aqueous Gel** (`CCB-001`): Clindamycin 1% + Micronized Benzoyl Peroxide 2.5% for inflammatory acne vulgaris.
4. **HydraBarrier Ceramide Lotion** (`HB-LOT`): Bio-identical Ceramides 1, 3, 6-II + Hyaluronic Acid for atopic eczema and barrier repair.
5. **MelanoFade TX Pigment Serum** (`MFTX-030`): Liposomal Tranexamic Acid 5% + Kojic Acid 2% + Niacinamide 4% for dermal melasma.
6. **ItraDerm 200mg Capsules** (`ITD-200`): SUBA-technology Itraconazole pellets for recalcitrant tinea infections.
7. **ClobetRestore 0.05% Ointment** (`CBR-050`): Clobetasol Propionate in anhydrous occlusive emollient base for plaque psoriasis.
8. **MinoxGlow 5% Trichology Solution** (`MG-005`): Minoxidil 5% + Finasteride 0.1% + Procapil lipid solution for androgenetic alopecia.
9. **SalicylFoam 2% Purifying Wash** (`SF-002`): Salicylic Acid 2% + Tea Tree foaming cleanser for seborrheic dermatitis & acne.
10. **BioPeptide Glow Elixir** (`BPG-ELX`): Hydrolyzed Marine Collagen 5000mg + Reduced L-Glutathione 500mg aesthetic clinic booster.

---

## 🩺 Registered Dermatologists & Aesthetic Clinics

20 specialized dermatologists across:
- **Aesthetic Dermatology & Cosmetology** (e.g. Kaya Skin Clinic GK-1, Oliva Skin Clinic DLF Phase 4, Enhance Aesthetic Noida)
- **Clinical Dermatology & Acne Specialists** (e.g. Max Institute of Dermatology Saket, Paras Phototherapy Institute)
- **Laser & Pigmentation Specialists** (e.g. Kokilaben Skin Institute, Breach Candy Laser Suite)
- **Trichology & Hair Restoration** (e.g. DermLinks Advanced Hair & Scalp Clinic, Khurana Hair Transplant Center)
- **Psoriasis & Atopic Eczema Care** (e.g. Fortis Skin Care Okhla, Ruby Hall Dermatology)
- **Dermatosurgery & Mohs Surgery** (e.g. Artemis Aesthetic Surgery Center, Jehangir Cosmetic Skin Suite)
- **Pediatric Dermatology** (e.g. Rainbow Children's Dermatology, Deenanath Pediatric Skin Clinic)

---

## 📱 MR Field App & Manager Dashboard Features

1. **Today's Plan:** Real-time doctor schedule, quota tracking, sub-specialty filters, and GPS check-in.
2. **GPS Geofence Check-In:** Captures exact clinic coordinates using the browser's Geolocation API.
3. **Daily Call Report (DCR):** Active call live timer, formulation detailing, sample unit counter, clinical feedback chips, and photo proof attachment.
4. **Tour Plan Builder:** Monday–Saturday aesthetic route planner with manager approval tracking.
5. **Expense Claims:** Reimbursement submissions (Travel, Meals, Lodging, Misc) with bill upload.
6. **Executive Overview Dashboard:** Recharts visualizations (Daily Detailing Volume, Top Detailed Formulations) and Keyvo-inspired KPI cards.
7. **Dermatologist Coverage Report:** Comprehensive matrix across all 20 skin specialists with **Export to CSV**.
8. **Live GPS Tracker:** Leaflet / OpenStreetMap map with pins for active clinic check-ins and rep locations.
9. **Master Data Management:** Full CRUD management of Dermatologists, Skincare Formulations, and Sales Reps.

---

## 🧪 Testing

```bash
# Run backend tests
npm test --workspace=apps/api

# Full build verification
npm run build
```
# artemis
