import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'jungle_rewards_super_secret_2023';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// Student Data (All 72 pupils)
const STUDENT_DATA = {
  "4 Pearl": {
    "Pre-A1": {
      "🐯 The Mighty Tigers": [
        "ADELLA KAISARA BINTI AMDAN",
        "AHMAD JIHAD BIN ABDULLAH", 
        "ANJENNY PAILEE",
        "AZIZAH ALISHA BINTI AZMIZAN AZRIN",
        "AZIB ARYAN BIN A.RAHMAN"
      ],
      "🐼 The Brave Bears": [
        "GIDEON GALE GARRY",
        "FAREL BIN ARSID",
        "INDRA PUTRA BIN JAINI", 
        "MOHAMMAD ABDUL KHALIQ BIN NAISAR",
        "MOHAMAD NUR ZAQIF ZIQRI BIN MOHAMAD TINO"
      ],
      "🐰 The Swift Rabbits": [
        "MUHAMMAD DANISH IFWAT BIN MUHAMMAD IFFAD",
        "MOHAMAD AL HAKIM BIN MOHAMAD RAJAN",
        "MOHAMAD RAID RUZAIMIE BIN MOHD SALIHAN",
        "NUR AIN HAWA SYAKIELA BINTI ILHAM SUKRI", 
        "MUHAMMAD IRMANSYAH BIN ABDUL BASIR"
      ]
    },
    "Low A1": {
      "🦊 The Clever Foxes": [
        "MUHAMMAD YUSUF BIN ANNUAR",
        "NOR ZAMIRAH QALISYAH BINTI MOHD ZAMIRUL",
        "MUHAMMAD RAYYAN BIN ARNER",
        "MUHAMMAD AKIF QAIYYUM BIN RANO", 
        "MUHAMMAD ASNAWI BIN HAMZAH"
      ]
    },
    "Mid A1": {
      "🦅 The Brave Eagles": [
        "NOOR QASEH NADIA BINTI ABDULLAH",
        "MIESYA NUR SYAZIERRA BINTI ISA",
        "MOHAMAD WAN MARZUQI BIN MAZLAN", 
        "NOR FATIYYAH FARAHANIE BINTI ZAINI",
        "MUHAMMAD NAZRIN BIN ZULLASRI"
      ],
      "🐆 The Swift Panthers": [
        "MUHAMMAD AL FATIH BIN MOHAMAD FAIZAL AFINDI",
        "NUBHAN BIN JAMIL",
        "NURUL FARAH KHALISYAH BINTI PABIL", 
        "NURUL ALISA SAPPIKA BINTI ABDULLAH",
        "MUHAMMAD FAIS BIN HENRAL"
      ]
    },
    "High A1": {
      "🦋 The Shining Butterflies": [
        "PUTRI ARIESA ZULAIKHA BINTI JUISAL",
        "PUTERI MYA ARLISSA BINTI MOHD BAKRI", 
        "MUHAMMAD IRFAN BIN UDAYKUMAR CHOCKALINGAM SHANMUGAM",
        "MUHAMMAD IKMAL BIN RIDSMAR",
        "SYARIF ABDUL HALIM BIN ALNASIR",
        "SITI NUR PUTRI BALQISHAH BINTI MOHD ZALANI"
      ]
    }
  },
  "4 Crystal": {
    "Pre-A1": {
      "🐒 The Playful Monkeys": [
        "ASHIRAH BINTI ASIS",
        "AIDIL FAZLI BIN ABDULLAH", 
        "AL SYAMIR BIN ABDUL NASIR",
        "ELYANA BINTI MARTIN",
        "HAFIZAM AKIM BIN ABDUL AZIS",
        "HAIJAL BIN JAINAL", 
        "IMANINA HUSNA BINTI MUHAMMAD SALI",
        "MOHAMMAD HAIKAL HAKIMI BIN ABDULLAH",
        "MOHAMMAD AIREIL DANNISH BIN ASYRAT"
      ],
      "🦉 The Wise Owls": [
        "MOHAMED DANIEL IMAN BIN BOHARI",
        "MOHAMAD RAIDI SAHRIMAL BIN JAMRI", 
        "MUHAMAD AZRUL BIN AZLAN",
        "MUHAMMAD NOOR FAZRIE BIN AMRAN",
        "NUR ARYSA QAISARA BINTI MASRI",
        "NAEL BIN MOHD NIJAR", 
        "NIRWANSA BIN RANO",
        "NORAINA BINTI ABDULLAH"
      ],
      "🐺 The Fearless Wolves": [
        "NUR PATIAH BINTI ABDULLAH",
        "NUR KHATIJA BINTI IBRAHIM", 
        "NURUL HUMAIRA BINTI ASANAL",
        "NAISHA BINTI AZMAN",
        "NUR AFFINA AULIA BINTI RIZAL",
        "MUHAMMAD DANNY ASHRAF BIN ABDULLAH", 
        "MUHAMMAD AADAM KHALIF BIN MUHAMMAD HAIRUL NIZAM",
        "NURAISYAH NATASYA BINTI MOHD HANIF WASNI"
      ],
      "🦁 The Glorious Lions": [
        "NURAZLIYANAH BATRISHA BINTI SABRI",
        "MOHAMAD RIZANI SYAHIZIEY BIN ABDULLAH", 
        "MUHAMMAD HAIZUL BIN OMAR",
        "MUHAMMAD QAWIEM RAFIQ BIN RAZLAN",
        "NUR AZMINA BINTI ABDULLAH",
        "MOHAMMAD SHAZWAN BIN NAZMI", 
        "NURUL ALYA ZULAIKHA BINTI SINAKASONI",
        "NURLUTHFIA AZZAHRA BINTI JUWAWI",
        "SITI UMAIRAH BINTI IBRAHIM",
        "WHIRYAN SHAH BIN MOHD NORHISMAL", 
        "MUHAMMAD HAFIZ UQASYAH BIN ABDULLAH"
      ]
    }
  }
};

// Data storage
const dataFile = join(__dirname, 'data', 'students.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(join(__dirname, 'data'), { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

// Load student data
async function loadStudentData() {
  try {
    await ensureDataDir();
    const data = await fs.readFile(dataFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Initialize with default data
    const initialData = [];
    
    for (const [className, levels] of Object.entries(STUDENT_DATA)) {
      for (const [level, groups] of Object.entries(levels)) {
        for (const [groupName, students] of Object.entries(groups)) {
          students.forEach(studentName => {
            initialData.push({
              id: `${className}-${level}-${groupName}-${studentName}`.replace(/\s+/g, '-'),
              class: className,
              level: level,
              group: groupName,
              name: studentName,
              points: 0,
              lastUpdated: new Date().toISOString(),
              remarks: 'Initialized'
            });
          });
        }
      }
    }
    
    await saveStudentData(initialData);
    return initialData;
  }
}

// Save student data
async function saveStudentData(data) {
  await ensureDataDir();
  await fs.writeFile(dataFile, JSON.stringify(data, null, 2));
}

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  // Simple token validation (in production, use JWT)
  if (token === 'authenticated') {
    next();
  } else {
    res.status(403).json({ success: false, error: 'Invalid or expired token' });
  }
}

// Routes

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { password } = req.body;
    
    // Simple password check (in production, use proper hashing)
    if (password === 'jungle123') {
      res.json({
        success: true,
        token: 'authenticated',
        expiresIn: 3600
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all students data
app.get('/api/students', async (req, res) => {
  try {
    const data = await loadStudentData();
    const classFilter = req.query.class;
    
    const filteredData = classFilter && classFilter !== 'all' 
      ? data.filter(student => student.class === classFilter)
      : data;

    res.json({
      success: true,
      data: filteredData,
      total: filteredData.length,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get groups data
app.get('/api/groups', async (req, res) => {
  try {
    const data = await loadStudentData();
    const classFilter = req.query.class;

    const filteredData = classFilter && classFilter !== 'all' 
      ? data.filter(student => student.class === classFilter)
      : data;

    // Group by class → level → group
    const grouped = {};

    filteredData.forEach(student => {
      if (!student.class || !student.level || !student.group) return;

      if (!grouped[student.class]) grouped[student.class] = {};
      if (!grouped[student.class][student.level]) grouped[student.class][student.level] = {};
      if (!grouped[student.class][student.level][student.group]) {
        grouped[student.class][student.level][student.group] = {
          totalPoints: 0,
          members: []
        };
      }

      grouped[student.class][student.level][student.group].totalPoints += student.points;
      grouped[student.class][student.level][student.group].members.push({
        name: student.name,
        points: student.points
      });
    });

    res.json({
      success: true,
      data: grouped,
      class: classFilter || 'all',
      totalGroups: Object.keys(grouped).reduce((acc, className) => {
        return acc + Object.keys(grouped[className]).reduce((levelAcc, level) => {
          return levelAcc + Object.keys(grouped[className][level]).length;
        }, 0);
      }, 0)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update student points
app.post('/api/students/points', authenticateToken, async (req, res) => {
  try {
    const { studentName, change } = req.body;
    const data = await loadStudentData();
    
    const studentIndex = data.findIndex(s => s.name === studentName);
    if (studentIndex === -1) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const student = data[studentIndex];
    const previousPoints = student.points;
    student.points = Math.max(0, previousPoints + parseInt(change));
    student.lastUpdated = new Date().toISOString();
    student.remarks = `Points ${change >= 0 ? 'added' : 'deducted'}: ${change}`;

    await saveStudentData(data);

    res.json({
      success: true,
      student: studentName,
      previousPoints,
      newPoints: student.points,
      change: parseInt(change)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Apply group bonus
app.post('/api/groups/bonus', authenticateToken, async (req, res) => {
  try {
    const { groupName, className } = req.body;
    const data = await loadStudentData();
    
    const groupStudents = data.filter(s => s.group === groupName && s.class === className);
    
    groupStudents.forEach(student => {
      student.points += 10;
      student.lastUpdated = new Date().toISOString();
      student.remarks = 'Group bonus: +10';
    });

    await saveStudentData(data);

    res.json({
      success: true,
      group: groupName,
      class: className,
      studentsUpdated: groupStudents.length,
      pointsAdded: groupStudents.length * 10
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reset all points
app.post('/api/students/reset', authenticateToken, async (req, res) => {
  try {
    const data = await loadStudentData();
    
    data.forEach(student => {
      student.points = 0;
      student.lastUpdated = new Date().toISOString();
      student.remarks = 'Points reset';
    });

    await saveStudentData(data);

    res.json({
      success: true,
      message: 'Reset all points to 0',
      studentsReset: data.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Initialize data
app.post('/api/students/initialize', authenticateToken, async (req, res) => {
  try {
    const initialData = [];
    
    for (const [className, levels] of Object.entries(STUDENT_DATA)) {
      for (const [level, groups] of Object.entries(levels)) {
        for (const [groupName, students] of Object.entries(groups)) {
          students.forEach(studentName => {
            initialData.push({
              id: `${className}-${level}-${groupName}-${studentName}`.replace(/\s+/g, '-'),
              class: className,
              level: level,
              group: groupName,
              name: studentName,
              points: 0,
              lastUpdated: new Date().toISOString(),
              remarks: 'Initialized'
            });
          });
        }
      }
    }
    
    await saveStudentData(initialData);

    res.json({
      success: true,
      message: `Initialized ${initialData.length} students across ${Object.keys(STUDENT_DATA).length} classes`,
      totalStudents: initialData.length,
      classes: Object.keys(STUDENT_DATA)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Jungle Rewards System running on port ${PORT}`);
  console.log(`📊 Total students: 72`);
  console.log(`🏫 Classes: 4 Pearl (36), 4 Crystal (36)`);
});
