# HOSPITRA: Pharmacy Module Report

## 1. Module Overview
The **Pharmacy Module** is a critical point of care within HOSPITRA. It handles medicine dispensing, real-time inventory management, and automated itemized billing.

---

## 2. Key Technical Features
### A. Inventory-Linked Billing
- **Real-Time Stock Updates**: Every time a medicine is billed, the system automatically decrements the stock count in the MongoDB database using an atomic update operation.
- **Stock Validation**: Prevents "Ghost-billing" by checking the `stock` field before allowing a medicine to be added to the cart. If a medicine is out of stock, it is visually grayed out.

### B. Prescription-to-Bill Workflow
- **Auto-Import**: The pharmacist can search for a patient and "Import Prescription" from a doctor's consultation. This pre-fills the cart with the exact dosage and quantity prescribed, reducing errors.
- **Dynamic Cart Management**: Allows the pharmacist to manually add non-prescribed OTC (Over-the-counter) items or adjust quantities as needed before final billing.

### C. Automated Pharmacy Invoicing
- **Multi-method Payments**: Supports a wide array of payment methods (Cash, Card, UPI, Insurance) for financial tracking.
- **Professional PDF Generation**: Generates a professional invoice using `html2pdf.js` that includes a detailed breakdown of medicines, taxes, and total amounts.

---

## 3. Data Flow & Integration
### The "Dispensing" Workflow
1. **Trigger**: Doctor prescribes a set of medicines during a consultation.
2. **Action**: Pharmacist looks up the patient and sees an "Active Prescription" notification.
3. **Draft**: All prescribed items are imported with one click.
4. **Resolution**: Upon "Download Invoice," the system saves the record to the backend and simultaneously triggers the inventory stock reduction.

---

## 4. Technical Highlights for Interviews
- **Efficient Filtering**: The medicine catalog supports searching by `Name` and `Category` using a high-performance `useMemo` filter on the client-side.
- **Atomic Operations**: Emphasize the use of atomic database updates to ensure that even under high concurrency (multiple pharmacists billing at once), the inventory counts remain accurate.
- **Seamless UX**: Designed with a "Dual-pane" layout (Catalog on left, Cart/Invoice on right) for maximum operational speed.

---

## 5. Pharmacy Module Q&A

**Q: How do you handle a "Prescription" for a medicine that is "Out of Stock"?**
> **A:** The system will flag that item in the import list. The pharmacist can then consult with the doctor for a substitute or manually remove that item from the current bill while processing the rest.

**Q: Why do you reduce stock *after* the invoice is downloaded?**
> **A:** This ensures that the physical action of "Issuing" the medicine matches the digital action of "Reducing" the stock. If the transaction is cancelled before the invoice is generated, the stock remains untouched.

**Q: Can you track medicine expiry dates?**
> **A:** The current schema handles `price` and `stock`. An easy enhancement would be to add an `expiryDate` field to the `Medicine` model and use a backend cron job to alert the pharmacist of upcoming expirations.
