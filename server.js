import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

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

// In-memory data storage
let studentsData = [];

// Initialize data
function initializeData() {
  studentsData = [];
  for (const [className, levels] of Object.entries(STUDENT_DATA)) {
    for (const [level, groups] of Object.entries(levels)) {
      for (const [groupName, students] of Object.entries(groups)) {
        students.forEach(studentName => {
          studentsData.push({
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
  return studentsData;
}

// Initialize on server start
initializeData();

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Access token required' });
  }

  if (token === 'authenticated') {
    next();
  } else {
    res.status(403).json({ success: false, error: 'Invalid or expired token' });
  }
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Jungle Rewards API is running!',
    timestamp: new Date().toISOString()
  });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  try {
    const { password } = req.body;
    
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
app.get('/api/students', (req, res) => {
  try {
    const classFilter = req.query.class;
    
    const filteredData = classFilter && classFilter !== 'all' 
      ? studentsData.filter(student => student.class === classFilter)
      : studentsData;

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
app.get('/api/groups', (req, res) => {
  try {
    const classFilter = req.query.class;

    const filteredData = classFilter && classFilter !== 'all' 
      ? studentsData.filter(student => student.class === classFilter)
      : studentsData;

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
app.post('/api/students/points', authenticateToken, (req, res) => {
  try {
    const { studentName, change } = req.body;
    
    const studentIndex = studentsData.findIndex(s => s.name === studentName);
    if (studentIndex === -1) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }

    const student = studentsData[studentIndex];
    const previousPoints = student.points;
    student.points = Math.max(0, previousPoints + parseInt(change));
    student.lastUpdated = new Date().toISOString();
    student.remarks = `Points ${change >= 0 ? 'added' : 'deducted'}: ${change}`;

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
app.post('/api/groups/bonus', authenticateToken, (req, res) => {
  try {
    const { groupName, className } = req.body;
    
    const groupStudents = studentsData.filter(s => s.group === groupName && s.class === className);
    
    groupStudents.forEach(student => {
      student.points += 10;
      student.lastUpdated = new Date().toISOString();
      student.remarks = 'Group bonus: +10';
    });

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
app.post('/api/students/reset', authenticateToken, (req, res) => {
  try {
    studentsData.forEach(student => {
      student.points = 0;
      student.lastUpdated = new Date().toISOString();
      student.remarks = 'Points reset';
    });

    res.json({
      success: true,
      message: 'Reset all points to 0',
      studentsReset: studentsData.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Initialize data
app.post('/api/students/initialize', authenticateToken, (req, res) => {
  try {
    const initializedData = initializeData();

    res.json({
      success: true,
      message: `Initialized ${initializedData.length} students across ${Object.keys(STUDENT_DATA).length} classes`,
      totalStudents: initializedData.length,
      classes: Object.keys(STUDENT_DATA)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve frontend for all routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Jungle Rewards System running on port ${PORT}`);
  console.log(`📊 Total students: ${studentsData.length}`);
  console.log(`🏫 Classes: 4 Pearl (36), 4 Crystal (36)`);
});

export default app;
