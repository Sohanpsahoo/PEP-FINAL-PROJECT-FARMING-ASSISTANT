const Officer = require('../models/Officer');
const Consultation = require('../models/Consultation');

// ─── Officer name banks per state language ──────────────────────────
const STATE_NAMES = {
  'Andhra Pradesh':    { first: ['Venkata','Srinivas','Ramesh','Lakshmi','Padma','Raja','Suresh','Anand','Krishna','Vijay'], last: ['Reddy','Naidu','Rao','Sharma','Kumar','Prasad'] },
  'Arunachal Pradesh': ['Tashi Dorji','Nabam Tuki','Pema Khandu','Kiren Rijiju','Rina Tao','Bamin Yani','Takam Pario','Jarjum Ete','Chowna Mein','Taba Hali'],
  'Assam':             { first: ['Bhupen','Jyoti','Hemen','Pranjal','Dimbeswar','Lakshmi','Ritu','Kamal','Debajit','Parag'], last: ['Bora','Das','Hazarika','Sarma','Kalita','Baruah'] },
  'Bihar':             { first: ['Rajesh','Anil','Sunil','Vinod','Manoj','Priya','Sanjay','Ravi','Deepak','Ashok'], last: ['Kumar','Singh','Prasad','Chaudhary','Yadav','Mishra'] },
  'Chhattisgarh':      { first: ['Ramesh','Bhupesh','Tamradhwaj','Champa','Kavita','Sunil','Anil','Renu','Devendra','Prem'], last: ['Sahu','Verma','Patel','Tiwari','Nag','Dewangan'] },
  'Goa':               { first: ['Pramod','Francis','Antonio','Maria','Savio','Fatima','Rajesh','Deepak','Sunita','Nandini'], last: ['Sawant','D\'Souza','Fernandes','Naik','Gawas','Desai'] },
  'Gujarat':           { first: ['Mukesh','Jagdish','Hasmukh','Bharat','Ramesh','Jyoti','Divya','Komal','Tushar','Nitin'], last: ['Patel','Shah','Desai','Modi','Chauhan','Parmar'] },
  'Haryana':           { first: ['Suresh','Ramesh','Satish','Rajbir','Naresh','Sunita','Anita','Sandeep','Vikas','Anil'], last: ['Kumar','Singh','Yadav','Malik','Hooda','Tanwar'] },
  'Himachal Pradesh':  { first: ['Jai','Prem','Virbhadra','Shanta','Suresh','Anil','Rattan','Mukesh','Kamlesh','Asha'], last: ['Singh','Sharma','Thakur','Verma','Chauhan','Negi'] },
  'Jharkhand':         { first: ['Hemant','Babulal','Champa','Draupadi','Raghubar','Suresh','Anil','Binod','Manoj','Sanjay'], last: ['Soren','Murmu','Singh','Oraon','Mahto','Kumar'] },
  'Karnataka':         { first: ['Basavaraj','Siddaramaiah','Yediyurappa','Kumaraswamy','Reshma','Deepa','Venkatesh','Suresh','Raghav','Mahesh'], last: ['Gowda','Shetty','Naik','Patil','Hegde','Rao'] },
  'Kerala':            { first: ['Pinarayi','Oommen','Shashi','Thomas','Rosamma','Deepa','Rajesh','Suresh','Anil','Kumari'], last: ['Vijayan','Chandy','Tharoor','Isaac','Nair','Menon','Pillai','Kurup'] },
  'Madhya Pradesh':    { first: ['Shivraj','Kamal','Digvijay','Uma','Jyoti','Rajesh','Sandeep','Umesh','Anil','Mohan'], last: ['Chouhan','Nath','Singh','Tiwari','Mishra','Patel'] },
  'Maharashtra':       { first: ['Uddhav','Devendra','Ajit','Sharad','Supriya','Amruta','Rajesh','Sachin','Anil','Vinod'], last: ['Thackeray','Fadnavis','Pawar','Patil','Deshmukh','Jadhav'] },
  'Manipur':           { first: ['Biren','Ibobi','Okram','Tomba','Ibemhal','Chanu','Laishram','Yumnam','Thokchom','Akoijam'], last: ['Singh','Devi','Meitei','Sharma','Luwang'] },
  'Meghalaya':         { first: ['Conrad','Mukul','Donkupar','Pynhun','Balajied','Hambok','Kyrmen','Lasborn','Wanjop','Khraw'], last: ['Sangma','Syiemlieh','Lyngdoh','Marbaniang','Rymbai'] },
  'Mizoram':           { first: ['Zoramthanga','Lalduhoma','Lalthanhawla','Vanlalzawma','Zothanpuii','Lalremsiami','Lalbiakzuala','Malsawma','Lalchhuanawma','R.Tlanghmingthanga'], last: [] },
  'Nagaland':          { first: ['Neiphiu','T.R.','Temjen','Shurhozelie','Hekani','Visasolie','Tokheho','Keneizhakho','Neidonuo','Vitshu'], last: ['Rio','Zeliang','Imna','Liezietsu','Jakhalu','Angami'] },
  'Odisha':            { first: ['Naveen','Bijay','Dharmendra','Pratap','Jyoti','Mamata','Dibya','Sasmita','Sudhansu','Brundaban'], last: ['Patnaik','Mohanty','Pradhan','Nayak','Behera','Das'] },
  'Punjab':            { first: ['Bhagwant','Amarinder','Parkash','Sukhbir','Harsimrat','Navjot','Gurpreet','Manpreet','Jaswinder','Kulwinder'], last: ['Mann','Singh','Badal','Kaur','Sidhu','Brar'] },
  'Rajasthan':         { first: ['Ashok','Vasundhara','Sachin','Hanuman','Diya','Raghu','Govind','Babu','Jyoti','Madan'], last: ['Gehlot','Raje','Pilot','Beniwal','Sharma','Meena','Gurjar'] },
  'Sikkim':            { first: ['Prem','Pawan','Bina','Mingma','Tshering','Karma','Sonam','Dawa','Phurba','Nima'], last: ['Tamang','Gurung','Sherpa','Lepcha','Bhutia','Subba'] },
  'Tamil Nadu':        { first: ['Muthuvel','Edappadi','Jayalalithaa','Karunanidhi','Kanimozhi','Sudha','Senthil','Arun','Karthik','Lakshmi'], last: ['Stalin','Palaniswami','Panneerselvam','Ramachandran','Murugan','Kumar'] },
  'Telangana':         { first: ['Kalvakuntla','Bandi','Revanth','Harish','Kavitha','Padma','Suresh','Venkat','Ravi','Srinivas'], last: ['Rao','Reddy','Sagar','Gupta','Naidu','Sharma'] },
  'Tripura':           { first: ['Biplab','Manik','Jishnu','Pratima','Ratan','Bhanulal','Sudip','Nabakumar','Tinku','Sanjay'], last: ['Deb','Sarkar','Debbarma','Saha','Roy','Das'] },
  'Uttar Pradesh':     { first: ['Yogi','Akhilesh','Mayawati','Priyanka','Rajnath','Dinesh','Anita','Suresh','Ramesh','Brij'], last: ['Adityanath','Yadav','Singh','Sharma','Mishra','Verma'] },
  'Uttarakhand':       { first: ['Pushkar','Trivendra','Harish','Tirath','Harak','Indira','Satpal','Madan','Pritam','Kunwar'], last: ['Dhami','Rawat','Singh','Negi','Chauhan','Bisht'] },
  'West Bengal':       { first: ['Mamata','Subhas','Dilip','Abhishek','Mala','Partha','Sourav','Debashis','Tapas','Ananya'], last: ['Banerjee','Ghosh','Chatterjee','Bose','Roy','Mukherjee','Das'] },
};

const DESIGNATIONS = [
  'District Agricultural Officer (DAO)',
  'Block Development Officer (BDO)',
  'Assistant Director of Agriculture',
  'Deputy Director of Agriculture',
  'Agricultural Extension Officer',
  'Horticulture Development Officer',
  'Soil Conservation Officer',
  'Plant Protection Officer',
  'District Horticulture Officer',
  'Krishi Vigyan Kendra (KVK) Head',
  'State Agricultural Research Station Head',
  'Agricultural Technology Manager'
];

const SPECIALIZATIONS = [
  'Crop Production & Management',
  'Soil Health & Fertility Management',
  'Plant Protection & Pest Management',
  'Horticulture Development',
  'Organic Farming & Certification',
  'Water Management & Irrigation',
  'Post-Harvest Technology',
  'Agricultural Marketing',
  'Farm Mechanization',
  'Seed Quality & Certification',
  'Rice Cultivation',
  'Spice Cultivation'
];

const DEPARTMENTS = [
  'Department of Agriculture & Farmers Welfare',
  'Directorate of Agriculture',
  'Krishi Vigyan Kendra',
  'Indian Council of Agricultural Research',
  'State Horticulture Mission',
  'National Horticulture Board'
];

// ─── Deterministic hash for consistent officer data ─────────────────
function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function generateOfficerName(state, index) {
  const nameData = STATE_NAMES[state] || STATE_NAMES['Uttar Pradesh'];
  if (Array.isArray(nameData)) {
    return nameData[index % nameData.length];
  }
  const first = nameData.first[index % nameData.first.length];
  const last = nameData.last[(index + 3) % nameData.last.length];
  return `${first} ${last}`;
}

function generateEmail(name, dept) {
  const clean = name.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, '.');
  const domains = ['gov.in', 'nic.in', 'agriculture.gov.in'];
  return `${clean}@${domains[simpleHash(name) % domains.length]}`;
}

function generatePhone(state, index) {
  const prefixes = ['94', '98', '97', '96', '95', '70', '88', '91', '99', '87'];
  const prefix = prefixes[(simpleHash(state) + index) % prefixes.length];
  const num = String(simpleHash(state + index + 'ph') % 100000000).padStart(8, '0');
  return `+91 ${prefix}${num}`;
}

// ─── 1) List officers by state/district ─────────────────────────────
exports.listOfficers = async (req, res) => {
  try {
    const { state, district, specialization } = req.query;

    // Check DB first
    const query = {};
    if (state) query.state = state;
    if (district) query.district = district;
    if (specialization && specialization !== 'All Specializations') query.specialization = specialization;

    let officers = await Officer.find(query).sort({ rating: -1 }).limit(30);

    if (officers.length === 0 && state) {
      // Generate officers for this state/district
      officers = await seedOfficersForLocation(state, district);
      if (specialization && specialization !== 'All Specializations') {
        officers = officers.filter(o => o.specialization === specialization);
      }
    }

    res.json({ success: true, data: officers });
  } catch (error) {
    console.error('listOfficers error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Seed officers for a state/district ─────────────────────────────
async function seedOfficersForLocation(state, district) {
  const count = district ? 6 : 10;
  const officers = [];

  for (let i = 0; i < count; i++) {
    const seed = simpleHash(`${state}${district || ''}${i}`);
    const name = generateOfficerName(state, i);
    const designation = DESIGNATIONS[i % DESIGNATIONS.length];
    const specialization = SPECIALIZATIONS[i % SPECIALIZATIONS.length];
    const department = DEPARTMENTS[i % DEPARTMENTS.length];

    const districtName = district || state;
    const address = `${designation.split('(')[0].trim()} Office, ${districtName}, ${state} - ${String(500000 + (seed % 50000)).padStart(6, '0')}`;

    const officer = await Officer.create({
      name,
      designation,
      department,
      specialization,
      state,
      district: district || 'State Level',
      office_address: address,
      phone: generatePhone(state, i),
      email: generateEmail(name, department),
      available_hours: i % 3 === 0 ? '9:00 AM - 5:00 PM' : i % 3 === 1 ? '10:00 AM - 4:00 PM' : '10:00 AM - 6:00 PM',
      experience_years: 5 + (seed % 25),
      languages: getLanguages(state),
      rating: parseFloat((3.5 + (seed % 15) / 10).toFixed(1)),
      is_available: i % 5 !== 4,
      consultation_fee: i % 4 === 0 ? '₹100' : 'Free'
    });
    officers.push(officer);
  }
  return officers;
}

function getLanguages(state) {
  const langMap = {
    'Andhra Pradesh': 'Telugu, Hindi, English',
    'Assam': 'Assamese, Hindi, English',
    'Bihar': 'Hindi, Bhojpuri, English',
    'Gujarat': 'Gujarati, Hindi, English',
    'Haryana': 'Hindi, English',
    'Karnataka': 'Kannada, Hindi, English',
    'Kerala': 'Malayalam, Hindi, English',
    'Madhya Pradesh': 'Hindi, English',
    'Maharashtra': 'Marathi, Hindi, English',
    'Punjab': 'Punjabi, Hindi, English',
    'Rajasthan': 'Hindi, Rajasthani, English',
    'Tamil Nadu': 'Tamil, Hindi, English',
    'Telangana': 'Telugu, Hindi, English',
    'Uttar Pradesh': 'Hindi, English',
    'West Bengal': 'Bengali, Hindi, English',
  };
  return langMap[state] || 'Hindi, English';
}

// ─── 2) Get single officer ──────────────────────────────────────────
exports.getOfficer = async (req, res) => {
  try {
    const officer = await Officer.findById(req.params.id);
    if (!officer) return res.status(404).json({ success: false, message: 'Officer not found' });
    res.json({ success: true, data: officer });
  } catch (error) {
    console.error('getOfficer error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── 3) Book consultation ───────────────────────────────────────────
exports.bookConsultation = async (req, res) => {
  try {
    const { farmer, officer, subject, description, consultation_type, preferred_date, preferred_time, farmer_phone, farmer_location, notes } = req.body;

    if (!farmer || !officer || !subject || !preferred_date) {
      return res.status(400).json({ success: false, message: 'Missing required fields: farmer, officer, subject, preferred_date' });
    }

    const consultation = await Consultation.create({
      farmer, officer, subject, description,
      consultation_type: consultation_type || 'phone',
      preferred_date: new Date(preferred_date),
      preferred_time: preferred_time || '10:00 AM',
      farmer_phone, farmer_location, notes,
      status: 'pending'
    });

    const populated = await Consultation.findById(consultation._id)
      .populate('officer', 'name designation phone')
      .populate('farmer', 'name phone');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    console.error('bookConsultation error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── 4) List consultations for a farmer ─────────────────────────────
exports.listConsultations = async (req, res) => {
  try {
    const { farmer_id, status } = req.query;
    if (!farmer_id) return res.status(400).json({ success: false, message: 'farmer_id is required' });

    const query = { farmer: farmer_id };
    if (status) query.status = status;

    const consultations = await Consultation.find(query)
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('officer', 'name designation phone specialization')
      .populate('farmer', 'name phone');

    res.json({ success: true, data: consultations });
  } catch (error) {
    console.error('listConsultations error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── 5) Cancel a consultation ───────────────────────────────────────
exports.cancelConsultation = async (req, res) => {
  try {
    const consultation = await Consultation.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    if (!consultation) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: consultation });
  } catch (error) {
    console.error('cancelConsultation error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
