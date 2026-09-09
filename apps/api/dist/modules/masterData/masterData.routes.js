"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const masterData_controller_1 = require("./masterData.controller");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
// Doctors: Accessible for selection by all authenticated users; mutating is Admin only
router.get('/doctors', masterData_controller_1.getDoctors);
router.post('/doctors', (0, auth_1.requireRole)(['ADMIN']), masterData_controller_1.createDoctor);
router.put('/doctors/:id', (0, auth_1.requireRole)(['ADMIN']), masterData_controller_1.updateDoctor);
router.delete('/doctors/:id', (0, auth_1.requireRole)(['ADMIN']), masterData_controller_1.deleteDoctor);
// Products: Accessible for selection by all authenticated users; mutating is Admin only
router.get('/products', masterData_controller_1.getProducts);
router.post('/products', (0, auth_1.requireRole)(['ADMIN']), masterData_controller_1.createProduct);
router.put('/products/:id', (0, auth_1.requireRole)(['ADMIN']), masterData_controller_1.updateProduct);
router.delete('/products/:id', (0, auth_1.requireRole)(['ADMIN']), masterData_controller_1.deleteProduct);
// Users: Admin only
router.get('/users', (0, auth_1.requireRole)(['ADMIN']), masterData_controller_1.getUsers);
router.put('/users/:id', (0, auth_1.requireRole)(['ADMIN']), masterData_controller_1.updateUser);
exports.default = router;
