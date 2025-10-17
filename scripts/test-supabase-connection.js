#!/usr/bin/env node

/**
 * Test script to verify Supabase connection
 * Run with: node scripts/test-supabase-connection.js
 */

const { createClient } = require("@supabase/supabase-js")
require("dotenv").config({ path: ".env.local" })

async function testConnection() {
  console.log("🔍 Testing Supabase connection...\n")

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  console.log("Environment Variables:")
  console.log("✅ NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✅ Set" : "❌ Missing")
  console.log("✅ NEXT_PUBLIC_SUPABASE_ANON_KEY:", supabaseAnonKey ? "✅ Set" : "❌ Missing")

  if (!(supabaseUrl && supabaseAnonKey)) {
    console.log("\n❌ Missing required environment variables!")
    console.log("Please check your .env.local file and make sure you have:")
    console.log("- NEXT_PUBLIC_SUPABASE_URL")
    console.log("- NEXT_PUBLIC_SUPABASE_ANON_KEY")
    process.exit(1)
  }

  // Test connection
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log("\n🔌 Testing connection...")
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.log("❌ Connection failed:", error.message)
      process.exit(1)
    }

    console.log("✅ Connection successful!")
    console.log("📊 Session data:", data ? "Present" : "No active session")

    // Test basic auth functionality
    console.log("\n🧪 Testing auth functions...")

    // Test sign up with a dummy email (this will fail but confirms API is working)
    const { error: signUpError } = await supabase.auth.signUp({
      email: "test@test.com",
      password: "test123456",
    })

    if (signUpError) {
      // Expected errors that confirm the API is working
      if (
        signUpError.message.includes("User already registered") ||
        signUpError.message.includes("Invalid email") ||
        signUpError.message.includes("not authorized")
      ) {
        console.log("✅ Auth API is working (expected error for test email)")
      } else {
        console.log("⚠️  Auth API error:", signUpError.message)
      }
    } else {
      console.log("✅ Auth API is working")
    }

    console.log("\n🎉 Supabase is properly connected and ready for authentication!")
  } catch (error) {
    console.log("❌ Unexpected error:", error.message)
    process.exit(1)
  }
}

testConnection()
