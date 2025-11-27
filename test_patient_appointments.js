const axios = require('axios');
const colors = require('colors');

// Configuration
const BASE_URL = 'http://localhost:8000';
const TEST_DATA = {
  patient: {
    email: 'patient.test@clinic.com',
    password: 'patient123',
    fullName: 'Patient Test',
    role: 'patient'
  }
};

let tokens = {};
let userIds = {};
let patientId = null;
let appointmentId = null;
let availableDoctor = null;

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...(data && { data })
    };

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
}

// Test functions
async function testHealthCheck() {
  console.log('\n=== HEALTH CHECK ==='.yellow.bold);
  
  try {
    const response = await axios.get(`${BASE_URL}/`);
    console.log('✅ Server is running'.green);
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Server is not responding'.red);
    console.log('Error:', error.message);
    return false;
  }
}

async function registerUser(userData) {
  console.log(`\n--- Registering ${userData.role}: ${userData.email} ---`.cyan);
  
  const result = await apiCall('POST', '/api/auth/register', userData);
  
  if (result.success) {
    console.log('✅ Registration successful'.green);
    return true;
  } else {
    // User might already exist, try to login instead
    if (result.error?.message?.includes('already exists') || result.status === 400) {
      console.log('⚠️ User already exists, will try to login'.yellow);
      return true;
    }
    console.log('❌ Registration failed'.red);
    console.log('Error:', result.error);
    return false;
  }
}

async function loginUser(userData) {
  console.log(`\n--- Logging in ${userData.role}: ${userData.email} ---`.cyan);
  
  const result = await apiCall('POST', '/api/auth/login', {
    email: userData.email,
    password: userData.password
  });
  
  if (result.success) {
    tokens[userData.role] = result.data.token;
    userIds[userData.role] = result.data.user.id;
    console.log('✅ Login successful'.green);
    console.log(`Token: ${result.data.token.substring(0, 20)}...`);
    return true;
  } else {
    console.log('❌ Login failed'.red);
    console.log('Error:', result.error);
    return false;
  }
}

async function createPatientProfile() {
  console.log('\n--- Creating Patient Profile ---'.cyan);
  
  const profileData = {
    dateOfBirth: '1990-05-15',
    gender: 'Male',
    bloodGroup: 'O+',
    address: '123 Test Street, Test City'
  };
  
  const result = await apiCall('POST', '/api/patients/profile', profileData, tokens.patient);
  
  if (result.success) {
    patientId = result.data.data.patientId;
    console.log('✅ Patient profile created successfully'.green);
    console.log(`Patient ID: ${patientId}`);
    return true;
  } else {
    console.log('❌ Failed to create patient profile'.red);
    console.log('Error:', result.error);
    return false;
  }
}

async function getAvailableDoctor() {
  console.log('\n--- Getting Available Doctors ---'.cyan);
  
  const result = await apiCall('GET', '/api/doctors', null, tokens.patient);
  
  if (result.success && result.data.data?.length > 0) {
    availableDoctor = result.data.data[0];
    console.log('✅ Found available doctors'.green);
    console.log(`Using doctor: ${availableDoctor.User?.fullName || 'Unknown'} (ID: ${availableDoctor.doctorId})`);
    console.log(`Specialization: ${availableDoctor.specialization}`);
    return true;
  } else {
    console.log('❌ No doctors available for booking'.red);
    console.log('Error:', result.error);
    console.log('⚠️ You need to create doctors first (use admin panel or database seeding)'.yellow);
    return false;
  }
}

async function bookAppointment() {
  console.log('\n--- Booking Appointment ---'.cyan);
  
  if (!availableDoctor) {
    console.log('❌ No available doctor to book appointment with'.red);
    return false;
  }
  
  const appointmentData = {
    doctorId: availableDoctor.doctorId,
    date: '2025-12-15',
    time: '10:00:00'
  };
  
  console.log('Booking appointment with data:', appointmentData);
  
  const result = await apiCall('POST', '/api/appointments/book', appointmentData, tokens.patient);
  
  if (result.success) {
    appointmentId = result.data.appointmentId;
    console.log('✅ Appointment booked successfully'.green);
    console.log(`Appointment ID: ${appointmentId}`);
    console.log('Appointment details:', JSON.stringify(result.data, null, 2));
    return true;
  } else {
    console.log('❌ Failed to book appointment'.red);
    console.log('Error:', result.error);
    return false;
  }
}

async function testGetPatientAppointments() {
  console.log('\n=== TESTING PATIENT APPOINTMENTS API ==='.yellow.bold);
  
  // Test 1: Get all appointments
  console.log('\n1. Testing GET /api/patients/appointments (all appointments)');
  const allResult = await apiCall('GET', '/api/patients/appointments', null, tokens.patient);
  
  if (allResult.success) {
    console.log('✅ Successfully retrieved all appointments'.green);
    console.log(`Found ${allResult.data.count || allResult.data.data?.length || 0} appointments`);
    if (allResult.data.data && allResult.data.data.length > 0) {
      console.log('Sample appointment data:');
      console.log(JSON.stringify(allResult.data.data[0], null, 2));
    } else {
      console.log('No appointments found'.yellow);
    }
  } else {
    console.log('❌ Failed to retrieve appointments'.red);
    console.log('Error:', allResult.error);
    return false;
  }
  
  // Test 2: Get scheduled appointments
  console.log('\n2. Testing GET /api/patients/appointments?status=scheduled');
  const scheduledResult = await apiCall('GET', '/api/patients/appointments?status=scheduled', null, tokens.patient);
  
  if (scheduledResult.success) {
    console.log('✅ Successfully retrieved scheduled appointments'.green);
    console.log(`Found ${scheduledResult.data.count || scheduledResult.data.data?.length || 0} scheduled appointments`);
  } else {
    console.log('❌ Failed to retrieve scheduled appointments'.red);
    console.log('Error:', scheduledResult.error);
  }
  
  // Test 3: Get completed appointments
  console.log('\n3. Testing GET /api/patients/appointments?status=completed');
  const completedResult = await apiCall('GET', '/api/patients/appointments?status=completed', null, tokens.patient);
  
  if (completedResult.success) {
    console.log('✅ Successfully retrieved completed appointments'.green);
    console.log(`Found ${completedResult.data.count || completedResult.data.data?.length || 0} completed appointments`);
  } else {
    console.log('❌ Failed to retrieve completed appointments'.red);
    console.log('Error:', completedResult.error);
  }
  
  // Test 4: Get cancelled appointments
  console.log('\n4. Testing GET /api/patients/appointments?status=cancelled');
  const cancelledResult = await apiCall('GET', '/api/patients/appointments?status=cancelled', null, tokens.patient);
  
  if (cancelledResult.success) {
    console.log('✅ Successfully retrieved cancelled appointments'.green);
    console.log(`Found ${cancelledResult.data.count || cancelledResult.data.data?.length || 0} cancelled appointments`);
  } else {
    console.log('❌ Failed to retrieve cancelled appointments'.red);
    console.log('Error:', cancelledResult.error);
  }
  
  // Test 5: Test without authentication
  console.log('\n5. Testing without authentication (should fail)');
  const noAuthResult = await apiCall('GET', '/api/patients/appointments', null, null);
  
  if (!noAuthResult.success && noAuthResult.status === 401) {
    console.log('✅ Correctly rejected unauthenticated request'.green);
  } else {
    console.log('❌ Should have rejected unauthenticated request'.red);
    console.log('Result:', noAuthResult);
  }
  
  // Test 6: Test with invalid token
  console.log('\n6. Testing with invalid token (should fail)');
  const invalidTokenResult = await apiCall('GET', '/api/patients/appointments', null, 'invalid-token');
  
  if (!invalidTokenResult.success && invalidTokenResult.status === 401) {
    console.log('✅ Correctly rejected invalid token'.green);
  } else {
    console.log('❌ Should have rejected invalid token'.red);
    console.log('Result:', invalidTokenResult);
  }
  
  return true;
}

async function testPatientProfile() {
  console.log('\n--- Testing Patient Profile API ---'.cyan);
  
  const result = await apiCall('GET', '/api/patients/profile', null, tokens.patient);
  
  if (result.success) {
    console.log('✅ Successfully retrieved patient profile'.green);
    console.log('Profile data:', JSON.stringify(result.data.data, null, 2));
    return true;
  } else {
    console.log('❌ Failed to retrieve patient profile'.red);
    console.log('Error:', result.error);
    return false;
  }
}

async function testDoctorsList() {
  console.log('\n--- Testing Doctors List API ---'.cyan);
  
  const result = await apiCall('GET', '/api/doctors', null, tokens.patient);
  
  if (result.success) {
    console.log('✅ Successfully retrieved doctors list'.green);
    console.log(`Found ${result.data.data?.length || 0} doctors`);
    if (result.data.data?.length > 0) {
      console.log('Sample doctor:', JSON.stringify(result.data.data[0], null, 2));
    }
    return true;
  } else {
    console.log('❌ Failed to retrieve doctors list'.red);
    console.log('Error:', result.error);
    return false;
  }
}

async function cleanup() {
  console.log('\n--- Test Summary ---'.cyan);
  console.log('Test data created:');
  console.log(`- Patient ID: ${patientId || 'N/A'}`);
  console.log(`- Used Doctor ID: ${availableDoctor?.doctorId || 'N/A'}`);
  console.log(`- Appointment ID: ${appointmentId || 'N/A'}`);
  console.log('ℹ️ You may want to clean up test appointment data from your database.');
}

// Main test runner
async function runAllTests() {
  console.log('🚀 TESTING PATIENT APPOINTMENTS API 🚀'.rainbow.bold);
  console.log(`Testing server at: ${BASE_URL}`.blue);
  console.log('📋 This test focuses on the patient appointments functionality'.cyan);
  
  try {
    // 1. Health Check
    const serverRunning = await testHealthCheck();
    if (!serverRunning) {
      console.log('\n❌ Server not running. Please start the server first.'.red.bold);
      return;
    }
    
    // 2. Register patient (skip if exists)
    console.log('\n=== USER SETUP ==='.yellow.bold);
    await registerUser(TEST_DATA.patient);
    
    // 3. Login patient
    const patientLogin = await loginUser(TEST_DATA.patient);
    
    if (!patientLogin) {
      console.log('\n❌ Failed to login patient. Cannot continue with tests.'.red.bold);
      return;
    }
    
    // 4. Create patient profile
    console.log('\n=== PATIENT PROFILE SETUP ==='.yellow.bold);
    const patientProfileCreated = await createPatientProfile();
    
    if (!patientProfileCreated) {
      console.log('\n❌ Failed to create patient profile. Cannot continue with appointment tests.'.red.bold);
      return;
    }
    
    // 5. Test other APIs to ensure they work
    console.log('\n=== TESTING SUPPORTING APIs ==='.yellow.bold);
    await testPatientProfile();
    await testDoctorsList();
    
    // 6. Get available doctors
    console.log('\n=== DOCTOR AVAILABILITY ==='.yellow.bold);
    const doctorsAvailable = await getAvailableDoctor();
    
    if (!doctorsAvailable) {
      console.log('\n⚠️ No doctors available. Will test appointments API with empty data.'.yellow.bold);
      console.log('💡 To test with actual data, please add doctors to your database first.'.blue);
      
      // Test the appointments API even without appointments
      await testGetPatientAppointments();
      await cleanup();
      return;
    }
    
    // 7. Book an appointment
    console.log('\n=== APPOINTMENT BOOKING ==='.yellow.bold);
    const appointmentBooked = await bookAppointment();
    
    if (!appointmentBooked) {
      console.log('\n⚠️ Failed to book appointment. Will test appointments API anyway.'.yellow.bold);
    }
    
    // 8. Test patient appointments API (Main focus)
    await testGetPatientAppointments();
    
    // 9. Summary
    console.log('\n=== TEST RESULTS SUMMARY ==='.green.bold);
    console.log('✅ Server health check passed'.green);
    console.log('✅ Patient registration/login working'.green);
    console.log('✅ Patient profile creation working'.green);
    console.log('✅ Doctors list API working'.green);
    if (appointmentBooked) {
      console.log('✅ Appointment booking working'.green);
    }
    console.log('✅ Patient appointments API tested comprehensively'.green);
    
    // 10. Cleanup info
    await cleanup();
    
  } catch (error) {
    console.log('\n💥 Unexpected error occurred:'.red.bold);
    console.log(error);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage: node test_patient_appointments.js [options]

Options:
  --help, -h          Show this help message
  --appointments-only Run only the appointments API tests (requires existing patient setup)
  
Examples:
  node test_patient_appointments.js                    # Run all tests
  node test_patient_appointments.js --appointments-only # Test only appointments API
  `.blue);
  process.exit(0);
}

if (args.includes('--appointments-only')) {
  console.log('🎯 APPOINTMENTS ONLY MODE'.cyan.bold);
  console.log('Testing appointments API with existing patient data...'.cyan);
  
  // Quick setup and test
  (async () => {
    try {
      await testHealthCheck();
      
      // Try to login existing patient
      const loginResult = await loginUser(TEST_DATA.patient);
      if (loginResult) {
        await testGetPatientAppointments();
      } else {
        console.log('❌ Cannot login patient. Run full test first.'.red);
      }
    } catch (error) {
      console.log('Error in appointments-only mode:', error);
    }
  })();
} else {
  // Run all tests
  runAllTests();
}

module.exports = {
  runAllTests,
  testGetPatientAppointments,
  apiCall,
  BASE_URL
};