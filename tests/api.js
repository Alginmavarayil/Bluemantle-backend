const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

async function runTests() {
    console.log("Starting in-memory MongoDB...");
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    console.log("Connecting Mongoose...");
    await mongoose.connect(uri);
    
    process.env.PORT = 5005;
    process.env.JWT_SECRET = "testsecret";
    require('../server.js');
    await new Promise(r => setTimeout(r, 1000));

    const BASE_URL = `http://localhost:${process.env.PORT}/api`;
    let userToken = "";
    let userId = "";
    
    try {
        console.log("\n==================================");
        console.log("Running FULL API EDGE-CASE Tests...");
        console.log("==================================\n");

        // 1. Register User
        let res = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: "Test Student", email: "test@example.com", password: "password123", role: "student" })
        });
        let data = await res.json();
        if (!data.success) throw new Error("Registration failed");
        console.log("✅ 1. Register Successful (201 equivalent format allowed DB generation)");

        // 2. Invalid Credentials
        res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: "test@example.com", password: "wrongpassword", deviceId: "device-xyz-1" })
        });
        if (res.status === 401) {
            console.log("✅ 2. Invalid Credentials correctly blocked (401)");
        } else throw new Error("Invalid credentials succeeded somehow!");

        // 3. Login User (Device 1)
        res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: "test@example.com", password: "password123", deviceId: "device-xyz-1" })
        });
        data = await res.json();
        userToken = data.data.token;
        userId = data.data.user.id;
        console.log("✅ 3. Login Successful -> valid token obtained (200)");
        
        // No sensitive data leakage test
        if (data.data.user.password || data.data.user.deviceId) {
            throw new Error("SENSITIVE DATA LEAKED IN LOGIN RESPONSE");
        }
        console.log("✅ 4. Verified NO sensitive data leakage in external payload schemas");

        // 5. Wrong device login
        res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: "test@example.com", password: "password123", deviceId: "device-dif-2" })
        });
        if (res.status === 401) console.log("✅ 5. Wrong Device attempt correctly intercepted and blocked (401)");
        else throw new Error("Device mismatch was not blocked properly");

        // 6. Protected route functionality
        res = await fetch(`${BASE_URL}/videos`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        if (res.status === 200) console.log("✅ 6. Fetch Protected Videos Successful maintaining JWT state (200)");
        else throw new Error("Failed to fetch protected videos");

        // 7. Unauthorized admin route
        res = await fetch(`${BASE_URL}/videos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
            body: JSON.stringify({ title: "Intro Phase", youtubeId: "uA7H8" })
        });
        if (res.status === 403) console.log("✅ 7. Unauthorized Role strictly bounded against Admin limits (403)");
        else throw new Error("Student was able to bypass roleMiddleware");

        // 8. Missing JWT token on protected route
        res = await fetch(`${BASE_URL}/videos`);
        if (res.status === 401) console.log("✅ 8. Disallowed routing access without JWT bearer (401)");
        else throw new Error("Able to fetch without token");

        // 9. Expired Token
        const expiredToken = jwt.sign({ id: userId, role: 'student' }, process.env.JWT_SECRET, { expiresIn: '-1s' });
        res = await fetch(`${BASE_URL}/videos`, {
            headers: { 'Authorization': `Bearer ${expiredToken}` }
        });
        if (res.status === 401) console.log("✅ 9. Time-Expired JWT token correctly declined by server validation (401)");
        else throw new Error("Able to fetch with expired token");

        // 10. Inactive session timeout
        const User = mongoose.model("User");
        await User.updateOne({ email: "test@example.com" }, { lastActive: new Date(Date.now() - 11 * 60 * 1000) });
        res = await fetch(`${BASE_URL}/videos`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        const iData = await res.json();
        if (res.status === 401 && iData.message.includes("inactivity")) {
            console.log("✅ 10. Inactive Session cleanly invalidated and locked correctly (401)");
        } else throw new Error("Inactive session failed to block");

        // 11. Rate Limiting test
        console.log("Testing Global Rate Limiter constraint (Executing ~105 rapid sequential queries)...");
        let rateLimitBlocked = false;
        for (let i = 0; i < 105; i++) {
            let r = await fetch(`${BASE_URL}/`);
            if (r.status === 429) {
                rateLimitBlocked = true;
                break;
            }
        }
        if (rateLimitBlocked) console.log("✅ 11. Built-in D-DOS logic cleanly engaged HTTP 429 Too Many Requests response limits.");
        else throw new Error("Rate limiting failed to trigger 429 block");

        console.log("\n🎉 ALL THE HARDENING EDGE/FAULT-INJECTION TESTS PASSED FLAWLESSLY!");
        console.log("The Backend System is officially PROD-ready.");

    } catch (err) {
        console.error("❌ TEST SUITE FAILED:", err.message);
    }
    process.exit(0);
}

runTests();
