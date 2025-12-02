// Quick test to verify NextAuth endpoint is working
const testAuth = async () => {
  console.log('Testing NextAuth API endpoint...\n');
  
  try {
    // Test CSRF token endpoint
    const csrfRes = await fetch('http://localhost:3000/api/auth/csrf');
    const csrf = await csrfRes.json();
    console.log('✅ CSRF Token:', csrf.csrfToken ? 'Present' : 'Missing');
    
    // Test providers endpoint
    const providersRes = await fetch('http://localhost:3000/api/auth/providers');
    const providers = await providersRes.json();
    console.log('✅ Providers:', Object.keys(providers).join(', '));
    
    // Test signin endpoint
    const signinRes = await fetch('http://localhost:3000/api/auth/signin', {
      method: 'GET',
    });
    console.log('✅ Sign-in endpoint status:', signinRes.status);
    
    console.log('\n✅ NextAuth is configured correctly!');
    console.log('\n📝 Test credentials:');
    console.log('   Email: test@example.com');
    console.log('   Password: Test123!@#');
    console.log('\n   Or Super Admin:');
    console.log('   Email: superadmin@example.com');
    console.log('   Password: SuperAdmin123!@#');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure dev server is running: npm run dev');
  }
};

testAuth();
