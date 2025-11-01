// main.js
import { auth, db, RecaptchaVerifier, signInWithPhoneNumber } from "./firebase-config.js";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

const phoneNumberInput = document.getElementById("phoneNumber");
const sendOtpBtn = document.getElementById("sendOtpBtn");
const otpModal = document.getElementById("otpModal");
const otpInput = document.getElementById("otpInput");
const otpVerifyBtn = document.getElementById("otpVerifyBtn");
const usernameModal = document.getElementById("usernameModal");
const usernameInput = document.getElementById("usernameInput");
const saveUsernameBtn = document.getElementById("saveUsernameBtn");
const skipUsernameBtn = document.getElementById("skipUsernameBtn");
const loginContainer = document.getElementById("loginContainer");
const welcomeContainer = document.getElementById("welcomeContainer");
const userInfo = document.getElementById("userInfo");
const logoutBtn = document.getElementById("logoutBtn");

let confirmationResult;

window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });

// Send OTP
sendOtpBtn.addEventListener("click", async () => {
  const phoneNumber = phoneNumberInput.value.trim();
  if (!phoneNumber) return alert("Please enter a valid phone number.");

  try {
    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
    otpModal.classList.add("active");
  } catch (err) {
    console.error(err);
    alert("Failed to send OTP. Check console for details.");
  }
});

// Verify OTP
otpVerifyBtn.addEventListener("click", async () => {
  const code = otpInput.value.trim();
  if (!code) return alert("Enter your OTP.");

  try {
    const result = await confirmationResult.confirm(code);
    const user = result.user;

    const userRef = doc(db, "racers", user.uid);
    const existing = await getDoc(userRef);

    otpModal.classList.remove("active");

    if (!existing.exists() || !existing.data().displayName) {
      usernameModal.classList.add("active");
    } else {
      await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
      showWelcomeScreen(user);
    }
  } catch (err) {
    console.error("Verification failed:", err);
    alert("Invalid OTP, please try again.");
  }
});

// Save username
saveUsernameBtn.addEventListener("click", async () => {
  const username = usernameInput.value.trim();
  if (!username) return alert("Please enter your name.");

  try {
    const user = auth.currentUser;
    const ref = doc(db, "racers", user.uid);
    await setDoc(
      ref,
      {
        phoneNumber: user.phoneNumber,
        displayName: username,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        fastestLap: null,
        racesCompleted: 0,
      },
      { merge: true }
    );

    usernameModal.classList.remove("active");
    showWelcomeScreen(user);
  } catch (err) {
    console.error("Error saving username:", err);
  }
});

// Skip username
skipUsernameBtn.addEventListener("click", () => {
  usernameModal.classList.remove("active");
  showWelcomeScreen(auth.currentUser);
});

// Logout
logoutBtn.addEventListener("click", async () => {
  await auth.signOut();
  welcomeContainer.classList.add("hidden");
  loginContainer.classList.remove("hidden");
});

// Welcome screen
async function showWelcomeScreen(user) {
  loginContainer.classList.add("hidden");
  welcomeContainer.classList.remove("hidden");

  const ref = doc(db, "racers", user.uid);
  const docSnap = await getDoc(ref);
  const data = docSnap.data();

  userInfo.innerHTML = `
    <p><strong>Name:</strong> ${data?.displayName || "New Racer"}</p>
    <p><strong>Phone:</strong> ${user.phoneNumber}</p>
    <p><strong>Races:</strong> ${data?.racesCompleted || 0}</p>
    <p><strong>Fastest Lap:</strong> ${data?.fastestLap || "N/A"}</p>
  `;
}
