import { bookingSchema } from "./booking"; // Adjust path if needed

// 🧪 Test 1: Bad Input (Should fail)
const invalidData = {
  fullName: "A",
  email: "not-an-email",
  phone: "abc1234",
  serviceType: "Invalid Service Name",
  bookingDate: "2020-01-01", // Past date!
};

const result1 = bookingSchema.safeParse(invalidData);

if (!result1.success) {
  console.log("❌ Test 1 Failed as expected! Validation Errors:");
  console.log(result1.error.flatten().fieldErrors);
}

console.log("\n-----------------------------------\n");

// 🧪 Test 2: Good Input (Should pass)
const validData = {
  fullName: "Juan Dela Cruz",
  email: "juan@example.com",
  phone: "09171234567",
  serviceType: "Wall-Mounted Aircon",
  bookingDate: "2026-08-01", // Future date
  notes: "Please call before arriving.",
};

const result2 = bookingSchema.safeParse(validData);

if (result2.success) {
  console.log("✅ Test 2 Passed! Validated Data:");
  console.log(result2.data);
}