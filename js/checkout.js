import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// ✅ Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBaDy2PoG_-KZVYoraD3tpU_C8CUvKQYQk",
  authDomain: "print420-bbf5b.firebaseapp.com",
  projectId: "print420-bbf5b",
  storageBucket: "print420-bbf5b.firebasestorage.app",
  messagingSenderId: "240976479161",
  appId: "1:240976479161:web:930be6bdf355e041df2c68",
  measurementId: "G-M0LMNP8EYK"
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ Check login status BEFORE loading checkout data
onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("⚠ Please login to continue checkout.");
    sessionStorage.setItem("redirectAfterLogin", window.location.href);
    window.location.href = "login.html";
  } else {
    document.getElementById("userEmail").textContent = user.email;
    document.getElementById("userEmail").style.display = "inline-block";
    loadCheckoutData(user.email);
  }
});

// ✅ Load Checkout Data
function loadCheckoutData(userEmail) {
  const params = new URLSearchParams(window.location.search);
  
  document.getElementById("orderName").textContent = decodeURIComponent(params.get("name") || "N/A");
  document.getElementById("orderPrice").textContent = decodeURIComponent(params.get("price") || "N/A");
  document.getElementById("orderType").textContent = "Product Type: " + decodeURIComponent(params.get("type") || "N/A");
  
  const image1 = params.get("image1");
  const image2 = params.get("image2");
  
  document.getElementById("orderImage1").src = image1 ? decodeURIComponent(image1) : "default.jpg";
  
  if (image2 && image2 !== "undefined") {
    document.getElementById("orderImage2").src = decodeURIComponent(image2);
    document.getElementById("orderImage2").style.display = "block";
  } else {
    document.getElementById("orderImage2").style.display = "none";
  }
  
  document.getElementById("fullName").textContent = decodeURIComponent(params.get("fullName") || "N/A");
  document.getElementById("address").textContent = decodeURIComponent(params.get("address") || "N/A");
  document.getElementById("city").textContent = decodeURIComponent(params.get("city") || "N/A");
  document.getElementById("state").textContent = decodeURIComponent(params.get("state") || "N/A");
  document.getElementById("pincode").textContent = decodeURIComponent(params.get("pincode") || "N/A");
  document.getElementById("mobile").textContent = decodeURIComponent(params.get("mobile") || "N/A");
  
  console.log("🔍 Query Params Fetched:", Object.fromEntries(params.entries()));
  
  // ✅ Store email for payment prefill
  sessionStorage.setItem("userEmail", userEmail);
}

// ✅ Razorpay Payment Integration with Failure Handling
document.getElementById("placeOrderBtn").addEventListener("click", function() {
  const params = new URLSearchParams(window.location.search);
  const productName = params.get("name");
  const productPrice = params.get("price")?.replace("₹", "").trim();
  const customerName = params.get("fullName");
  const customerAddress = `${params.get("address")}, ${params.get("city")}, ${params.get("state")} - ${params.get("pincode")}`;
  const customerMobile = params.get("mobile");
  const userEmail = sessionStorage.getItem("userEmail") || "customer@example.com";
  
  if (!productName || !productPrice || isNaN(productPrice)) {
    alert("❌ Error: Invalid product details.");
    return;
  }
  
  const options = {
    key: "rzp_test_NfDhAFYplEhZEf", // Razorpay Test Key
    amount: productPrice * 100, // Convert ₹ to Paisa
    currency: "INR",
    name: "Print 420",
    description: productName,
    image: "https://codesparshofficial.github.io/Print420/img12.png",
    handler: function(response) {
      saveOrderToFirebase({
        productName,
        price: `₹${productPrice}`,
        customerName,
        customerAddress,
        customerMobile,
        email: userEmail,
        paymentId: response.razorpay_payment_id,
        paymentStatus: "Paid"
      });
    },
    prefill: {
      name: customerName || "Guest",
      email: userEmail,
      contact: customerMobile || "0000000000"
    },
    theme: {
      color: "#d40000"
    },
    modal: {
      ondismiss: function() {
        alert("⚠ Payment was cancelled. Please try again.");
      }
    }
  };
  
  const rzp1 = new Razorpay(options);
  rzp1.open();
});

// ✅ Firebase Order Save with Error Handling
async function saveOrderToFirebase(order) {
  try {
    await addDoc(collection(db, "orders"), order);
    alert("✅ Payment Successful & Order Placed!");
    window.location.href = "order-success.html";
  } catch (error) {
    alert("❌ Error Saving Order: " + error.message);
  }
}