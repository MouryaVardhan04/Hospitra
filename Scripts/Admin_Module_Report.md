# HOSPITRA: Admin Module Report

## 1. Module Overview
The **Admin Module** is the highest-level control center of the HOSPITRA ecosystem. It is designed for hospital administrators who oversee staff onboarding, clinical quality, and overall operational efficiency.

---

## 2. Key Technical Features
### A. Staff Management (CRUD)
- **Role-Based Access Control (RBAC)**: Admins can create and manage profiles for Doctors, Receptionists, Lab Technicians, and Pharmacists.
- **Credential Security**: Passwords are hashed on the backend using `bcrypt` before storage, ensuring that even administrators cannot view sensitive user credentials.

### B. Global Analytics & Oversight
- **Real-Time Dashboards**: Provides a birds-eye view of all appointments, billing totals, and departmental workloads.
- **Audit Logging**: Every critical system action (like adding a new doctor or deleting a patient) is logged with a timestamp and the administrator's ID for accountability.

### C. System Configuration
- **Catalog Management**: Admins define the global catalogs for `Medicines`, `Lab Tests`, and `Hospital Fees`. These catalogs serve as the single source of truth for the entire system, ensuring consistent pricing and itemization across all portals.

---

## 3. Data Flow & Integration
### The "Administrative" Journey
1. **Onboarding**: Admin creates a new "Endocrinologist" profile in the system.
2. **Propagation**: The new doctor instantly appears in the Patient's "Specialist Search."
3. **Audit**: The "Add Doctor" action is recorded in the `ActivityLog` model.
4. **Maintenance**: Admin can update the price of a "Thyroid Panel" in the `lab-catalog`, which instantly reflects in the Reception and Lab portals.

---

## 4. Technical Highlights for Interviews
- **Global Context Providers**: The Admin portal uses a robust `AdminContext` to manage cross-component data like staff lists and global settings.
- **Cloudinary Integration**: Handles profile picture uploads for all staff members, optimizing image sizes for the UI.
- **JWT Middleware**: Protected routes on both the frontend (React Router guards) and backend (Express middleware) ensure only authenticated admins can access this data.

---

## 5. Admin Module Q&A

**Q: How do you handle a "Data Breach" scenario in the Admin portal?**
> **A:** We employ strict RBAC. JWT tokens for admins have a shorter TTL (Time-to-Live) and can be revoked. All administrative actions are logged, enabling us to trace any unauthorized changes back to the source.

**Q: Why separate "Admin" and "Doctor" logic if they are in the same `admin` folder?**
> **A:** While they share some UI components, their business logic is distinct. Separating them into different modules/routes ensures that a doctor cannot access administrative staff-management features, maintaining a strict "Principle of Least Privilege."

**Q: How do you manage the "Fees Catalog" for multiple departments?**
> **A:** We use a hierarchical MongoDB document. Each category (OPD, Surgery, etc.) contains an array of items. This allows the frontend to dynamically render the correct fee list based on the department selected by the receptionist.
