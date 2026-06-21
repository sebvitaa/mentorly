import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';

const PORT = Number(process.env.MENTORLY_MOCK_API_PORT ?? 3000);
const API_PREFIX = '/api';

const timeSlots = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
];

const campuses = [
  { id: 'campus-stgo', name: 'Santiago', slug: 'santiago', active: true },
  { id: 'campus-ccpc', name: 'Concepción', slug: 'concepcion', active: true },
];

const faculties = [
  { id: 'fac-arquitectura-arte-stgo', name: 'Arquitectura y Arte', slug: 'arquitectura-arte', active: true },
  { id: 'fac-ciencias-salud-ccpc', name: 'Ciencias de la Salud', slug: 'ciencias-salud', active: true },
  { id: 'fac-comunicaciones-stgo', name: 'Comunicaciones', slug: 'comunicaciones', active: true },
  { id: 'fac-derecho-stgo', name: 'Derecho', slug: 'derecho', active: true },
  { id: 'fac-diseno-stgo', name: 'Diseño', slug: 'diseno', active: true },
  { id: 'fac-economia-negocios-stgo', name: 'Economía y Negocios', slug: 'economia-negocios', active: true },
  { id: 'fac-educacion-stgo', name: 'Educación', slug: 'educacion', active: true },
  { id: 'fac-gobierno-stgo', name: 'Gobierno', slug: 'gobierno', active: true },
  { id: 'fac-ingenieria-stgo', name: 'Ingeniería', slug: 'ingenieria', active: true },
  { id: 'fac-medicina-stgo', name: 'Medicina Clínica Alemana UDD', slug: 'medicina', active: true },
  { id: 'fac-psicologia-stgo', name: 'Psicología', slug: 'psicologia', active: true },
];

const careers = [
  // Santiago
  { id: 'career-stgo-arquitectura-arte-arquitectura', faculty_id: 'fac-arquitectura-arte-stgo', campus_id: 'campus-stgo', name: 'Arquitectura', slug: 'arquitectura', active: true },
  { id: 'career-stgo-comunicaciones-cine-comunicacion-audiovisual', faculty_id: 'fac-comunicaciones-stgo', campus_id: 'campus-stgo', name: 'Cine y Comunicación Audiovisual', slug: 'cine-comunicacion-audiovisual', active: true },
  { id: 'career-stgo-comunicaciones-periodismo-comunicacion', faculty_id: 'fac-comunicaciones-stgo', campus_id: 'campus-stgo', name: 'Periodismo y Comunicación', slug: 'periodismo-comunicacion', active: true },
  { id: 'career-stgo-comunicaciones-publicidad-marketing', faculty_id: 'fac-comunicaciones-stgo', campus_id: 'campus-stgo', name: 'Publicidad y Marketing', slug: 'publicidad-marketing', active: true },
  { id: 'career-stgo-derecho-derecho', faculty_id: 'fac-derecho-stgo', campus_id: 'campus-stgo', name: 'Derecho', slug: 'derecho', active: true },
  { id: 'career-stgo-diseno-diseno', faculty_id: 'fac-diseno-stgo', campus_id: 'campus-stgo', name: 'Diseño', slug: 'diseno', active: true },
  { id: 'career-stgo-economia-negocios-ing-comercial', faculty_id: 'fac-economia-negocios-stgo', campus_id: 'campus-stgo', name: 'Ingeniería Comercial', slug: 'ingenieria-comercial', active: true },
  { id: 'career-stgo-economia-negocios-global-business-administration', faculty_id: 'fac-economia-negocios-stgo', campus_id: 'campus-stgo', name: 'Global Business Administration', slug: 'global-business-administration', active: true },
  { id: 'career-stgo-economia-negocios-negocios-ciencia-datos', faculty_id: 'fac-economia-negocios-stgo', campus_id: 'campus-stgo', name: 'Negocios y Ciencia de Datos', slug: 'negocios-ciencia-datos', active: true },
  { id: 'career-stgo-educacion-pedagogia-educacion-basica', faculty_id: 'fac-educacion-stgo', campus_id: 'campus-stgo', name: 'Pedagogía en Educación Básica', slug: 'pedagogia-educacion-basica', active: true },
  { id: 'career-stgo-educacion-pedagogia-educacion-parvulos', faculty_id: 'fac-educacion-stgo', campus_id: 'campus-stgo', name: 'Pedagogía en Educación de Párvulos', slug: 'pedagogia-educacion-parvulos', active: true },
  { id: 'career-stgo-gobierno-ciencia-politica-politicas-publicas', faculty_id: 'fac-gobierno-stgo', campus_id: 'campus-stgo', name: 'Ciencia Política y Políticas Públicas', slug: 'ciencia-politica-politicas-publicas', active: true },
  { id: 'career-stgo-ingenieria-ing-civil-industrial', faculty_id: 'fac-ingenieria-stgo', campus_id: 'campus-stgo', name: 'Ingeniería Civil Industrial', slug: 'ingenieria-civil-industrial', active: true },
  { id: 'career-stgo-ingenieria-ing-civil-informatica-innovacion', faculty_id: 'fac-ingenieria-stgo', campus_id: 'campus-stgo', name: 'Ingeniería Civil en Informática e Innovación Tecnológica', slug: 'ingenieria-civil-informatica-innovacion', active: true },
  { id: 'career-stgo-ingenieria-ing-civil-informatica-ia', faculty_id: 'fac-ingenieria-stgo', campus_id: 'campus-stgo', name: 'Ingeniería Civil en Informática e Inteligencia Artificial', slug: 'ingenieria-civil-informatica-ia', active: true },
  { id: 'career-stgo-ingenieria-ing-civil-biomedicina', faculty_id: 'fac-ingenieria-stgo', campus_id: 'campus-stgo', name: 'Ingeniería Civil en BioMedicina', slug: 'ingenieria-civil-biomedicina', active: true },
  { id: 'career-stgo-ingenieria-ing-civil-mineria', faculty_id: 'fac-ingenieria-stgo', campus_id: 'campus-stgo', name: 'Ingeniería Civil en Minería', slug: 'ingenieria-civil-mineria', active: true },
  { id: 'career-stgo-ingenieria-ing-civil-obras-civiles', faculty_id: 'fac-ingenieria-stgo', campus_id: 'campus-stgo', name: 'Ingeniería Civil en Obras Civiles', slug: 'ingenieria-civil-obras-civiles', active: true },
  { id: 'career-stgo-ingenieria-geologia', faculty_id: 'fac-ingenieria-stgo', campus_id: 'campus-stgo', name: 'Geología', slug: 'geologia', active: true },
  { id: 'career-stgo-medicina-medicina', faculty_id: 'fac-medicina-stgo', campus_id: 'campus-stgo', name: 'Medicina', slug: 'medicina', active: true },
  { id: 'career-stgo-medicina-enfermeria', faculty_id: 'fac-medicina-stgo', campus_id: 'campus-stgo', name: 'Enfermería', slug: 'enfermeria', active: true },
  { id: 'career-stgo-medicina-kinesiologia', faculty_id: 'fac-medicina-stgo', campus_id: 'campus-stgo', name: 'Kinesiología', slug: 'kinesiologia', active: true },
  { id: 'career-stgo-medicina-nutricion-dietetica', faculty_id: 'fac-medicina-stgo', campus_id: 'campus-stgo', name: 'Nutrición y Dietética', slug: 'nutricion-dietetica', active: true },
  { id: 'career-stgo-medicina-obstetricia', faculty_id: 'fac-medicina-stgo', campus_id: 'campus-stgo', name: 'Obstetricia', slug: 'obstetricia', active: true },
  { id: 'career-stgo-medicina-odontologia', faculty_id: 'fac-medicina-stgo', campus_id: 'campus-stgo', name: 'Odontología', slug: 'odontologia', active: true },
  { id: 'career-stgo-medicina-quimica-farmacia', faculty_id: 'fac-medicina-stgo', campus_id: 'campus-stgo', name: 'Química y Farmacia', slug: 'quimica-farmacia', active: true },
  { id: 'career-stgo-medicina-tecnologia-medica', faculty_id: 'fac-medicina-stgo', campus_id: 'campus-stgo', name: 'Tecnología Médica', slug: 'tecnologia-medica', active: true },
  { id: 'career-stgo-medicina-terapia-ocupacional', faculty_id: 'fac-medicina-stgo', campus_id: 'campus-stgo', name: 'Terapia Ocupacional', slug: 'terapia-ocupacional', active: true },
  { id: 'career-stgo-psicologia-psicologia', faculty_id: 'fac-psicologia-stgo', campus_id: 'campus-stgo', name: 'Psicología', slug: 'psicologia', active: true },

  // Concepción
  { id: 'career-ccpc-arquitectura-arte-arquitectura', faculty_id: 'fac-arquitectura-arte-stgo', campus_id: 'campus-ccpc', name: 'Arquitectura', slug: 'arquitectura', active: true },
  { id: 'career-ccpc-derecho-derecho', faculty_id: 'fac-derecho-stgo', campus_id: 'campus-ccpc', name: 'Derecho', slug: 'derecho', active: true },
  { id: 'career-ccpc-diseno-diseno', faculty_id: 'fac-diseno-stgo', campus_id: 'campus-ccpc', name: 'Diseño', slug: 'diseno', active: true },
  { id: 'career-ccpc-economia-negocios-ing-comercial', faculty_id: 'fac-economia-negocios-stgo', campus_id: 'campus-ccpc', name: 'Ingeniería Comercial', slug: 'ingenieria-comercial', active: true },
  { id: 'career-ccpc-ingenieria-ing-civil-industrial', faculty_id: 'fac-ingenieria-stgo', campus_id: 'campus-ccpc', name: 'Ingeniería Civil Industrial', slug: 'ingenieria-civil-industrial', active: true },
  { id: 'career-ccpc-ingenieria-ing-civil-informatica-innovacion', faculty_id: 'fac-ingenieria-stgo', campus_id: 'campus-ccpc', name: 'Ingeniería Civil en Informática e Innovación Tecnológica', slug: 'ingenieria-civil-informatica-innovacion', active: true },
  { id: 'career-ccpc-comunicaciones-periodismo-comunicacion', faculty_id: 'fac-comunicaciones-stgo', campus_id: 'campus-ccpc', name: 'Periodismo y Comunicación', slug: 'periodismo-comunicacion', active: true },
  { id: 'career-ccpc-psicologia-psicologia', faculty_id: 'fac-psicologia-stgo', campus_id: 'campus-ccpc', name: 'Psicología', slug: 'psicologia', active: true },
  { id: 'career-ccpc-ciencias-salud-enfermeria', faculty_id: 'fac-ciencias-salud-ccpc', campus_id: 'campus-ccpc', name: 'Enfermería', slug: 'enfermeria', active: true },
  { id: 'career-ccpc-ciencias-salud-kinesiologia', faculty_id: 'fac-ciencias-salud-ccpc', campus_id: 'campus-ccpc', name: 'Kinesiología', slug: 'kinesiologia', active: true },
  { id: 'career-ccpc-ciencias-salud-odontologia', faculty_id: 'fac-ciencias-salud-ccpc', campus_id: 'campus-ccpc', name: 'Odontología', slug: 'odontologia', active: true },
];

const teacherSeeds = [
  {
    id: '1',
    name: 'Sofia Contreras',
    career: 'Ingenieria Civil Industrial',
    year: '3er ano',
    rating: 4.8,
    review_count: 12,
    price_range: '$8.000-$12.000',
    subjects: ['Calculo I', 'Calculo II', 'Algebra Lineal'],
    about:
      'Llevo dos anos ayudando a estudiantes con matematicas. Me especializo en explicar conceptos dificiles de forma simple y practica.',
    contact: { type: 'email', value: 'scontreras@udd.cl' },
    reviews: [
      {
        student_name: 'Felipe Morales',
        rating: 5,
        date: '2026-05-15',
        comment:
          'Excelente profesora, muy clara en sus explicaciones. Gracias a ella pase Calculo II.',
      },
      {
        student_name: 'Maria Paz Gonzalez',
        rating: 5,
        date: '2026-04-22',
        comment: 'Super recomendada. Paciente y didactica.',
      },
    ],
  },
  {
    id: '2',
    name: 'Martin Rojas',
    career: 'Ingenieria en Informatica',
    year: '4to ano',
    rating: 4.9,
    review_count: 18,
    price_range: '$10.000-$15.000',
    subjects: ['Programacion', 'Estructuras de Datos', 'Algoritmos'],
    about:
      'Desarrollador full-stack con experiencia ensenando programacion. Sesiones practicas con proyectos reales.',
    contact: { type: 'phone', value: '+56 9 8765 4321' },
    reviews: [
      {
        student_name: 'Catalina Bravo',
        rating: 5,
        date: '2026-05-20',
        comment: 'El mejor profe de programacion que he tenido.',
      },
      {
        student_name: 'Diego Fernandez',
        rating: 5,
        date: '2026-05-01',
        comment: 'Martin me salvo en Estructuras de Datos.',
      },
    ],
  },
  {
    id: '3',
    name: 'Valentina Lagos',
    career: 'Derecho',
    year: '5to ano',
    rating: 4.7,
    review_count: 9,
    price_range: '$7.000-$10.000',
    subjects: ['Derecho Civil', 'Derecho Constitucional', 'Contratos'],
    about:
      'Ayudante de catedra con vocacion por ensenar. Simplifico conceptos legales complejos y preparo examenes.',
    contact: { type: 'email', value: 'vlagos@udd.cl' },
    reviews: [
      {
        student_name: 'Benjamin Soto',
        rating: 5,
        date: '2026-05-18',
        comment: 'Valentina es seca. Me ayudo a entender Civil I.',
      },
    ],
  },
  {
    id: '4',
    name: 'Antonia Vargas',
    career: 'Psicologia',
    year: '4to ano',
    rating: 4.9,
    review_count: 14,
    price_range: '$6.000-$9.000',
    subjects: ['Estadistica', 'Metodologia de Investigacion', 'Psicometria'],
    about:
      'Te ayudo a perderle el miedo a la estadistica con ejemplos practicos y ejercicios paso a paso.',
    contact: { type: 'phone', value: '+56 9 7654 3210' },
    reviews: [
      {
        student_name: 'Pablo Jimenez',
        rating: 5,
        date: '2026-05-22',
        comment: 'Hace que estadistica sea entendible y entretenida.',
      },
    ],
  },
];

const teachers = teacherSeeds.map((teacher, index) => ({
  ...teacher,
  avatar_url: null,
  availability: generateAvailability(index),
}));

const bookings = [];
const notifications = [];

// In-memory auth storage. Passwords are NOT securely hashed (mock only).
const users = [];
const tokens = new Map();

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host}`);

  if (request.method === 'OPTIONS') {
    return sendNoContent(response);
  }

  try {
    if (url.pathname === `${API_PREFIX}/health` && request.method === 'GET') {
      return sendJson(response, { ok: true, service: 'mentorly-mock-api' });
    }

    if (url.pathname === `${API_PREFIX}/auth/register` && request.method === 'POST') {
      return handleRegister(request, response);
    }

    if (url.pathname === `${API_PREFIX}/auth/login` && request.method === 'POST') {
      return handleLogin(request, response);
    }

    if (url.pathname === `${API_PREFIX}/auth/logout` && request.method === 'POST') {
      return handleLogout(request, response);
    }

    if (url.pathname === `${API_PREFIX}/auth/me` && request.method === 'GET') {
      return handleMe(request, response);
    }

    if (url.pathname === `${API_PREFIX}/campuses` && request.method === 'GET') {
      return sendJson(response, campuses);
    }

    if (url.pathname === `${API_PREFIX}/faculties` && request.method === 'GET') {
      return sendJson(response, filterFaculties(url));
    }

    if (url.pathname === `${API_PREFIX}/careers` && request.method === 'GET') {
      return sendJson(response, filterCareers(url));
    }

    if (url.pathname === `${API_PREFIX}/teachers` && request.method === 'GET') {
      return sendJson(response, filterTeachers(url));
    }

    if (url.pathname === `${API_PREFIX}/subjects` && request.method === 'GET') {
      return sendJson(response, uniqueSubjects());
    }

    const teacherMatch = url.pathname.match(/^\/api\/teachers\/([^/]+)$/);
    if (teacherMatch && request.method === 'GET') {
      const teacher = findTeacher(teacherMatch[1]);
      return teacher
        ? sendJson(response, teacher)
        : sendJson(response, { message: 'Teacher not found' }, 404);
    }

    const availabilityMatch = url.pathname.match(
      /^\/api\/teachers\/([^/]+)\/availability$/
    );
    if (availabilityMatch && request.method === 'GET') {
      const teacher = findTeacher(availabilityMatch[1]);
      return teacher
        ? sendJson(response, teacher.availability)
        : sendJson(response, { message: 'Teacher not found' }, 404);
    }

    if (url.pathname === `${API_PREFIX}/bookings` && request.method === 'GET') {
      return sendJson(response, bookings);
    }

    if (url.pathname === `${API_PREFIX}/bookings` && request.method === 'POST') {
      return createBooking(request, response);
    }

    const bookingTransitionMatch = url.pathname.match(
      /^\/api\/bookings\/([^/]+)\/(accept|reject|cancel|complete)$/
    );
    if (bookingTransitionMatch && request.method === 'PATCH') {
      return transitionBooking(
        request,
        response,
        bookingTransitionMatch[1],
        bookingTransitionMatch[2]
      );
    }

    if (url.pathname === `${API_PREFIX}/notifications` && request.method === 'GET') {
      return sendJson(response, notifications);
    }

    const notificationReadMatch = url.pathname.match(
      /^\/api\/notifications\/([^/]+)\/read$/
    );
    if (notificationReadMatch && request.method === 'PATCH') {
      return markNotificationAsRead(response, notificationReadMatch[1]);
    }

    return sendJson(response, { message: 'Route not found' }, 404);
  } catch (error) {
    console.error('[mock-api] Unexpected error', error);
    return sendJson(response, { message: 'Internal mock API error' }, 500);
  }
});

server.listen(PORT, () => {
  console.log(`Mentorly mock API listening on http://localhost:${PORT}${API_PREFIX}`);
});

function generateAvailability(seed) {
  const availability = [];
  const today = new Date();

  for (let i = 0; i < 15; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue;
    }

    const isoDate = toIsoDate(date);
    const slots = timeSlots.map((hour, slotIndex) => ({
      hour,
      available: (i + slotIndex + seed) % 3 !== 0,
    }));

    availability.push({ date: isoDate, time_slots: slots });
  }

  return availability;
}

function filterFaculties(url) {
  const campusId = url.searchParams.get('campus_id');
  if (!campusId) {
    return faculties;
  }

  const facultyIdsWithCareers = new Set(
    careers
      .filter((career) => career.campus_id === campusId && career.active)
      .map((career) => career.faculty_id)
  );

  return faculties.filter(
    (faculty) => faculty.active && facultyIdsWithCareers.has(faculty.id)
  );
}

function filterCareers(url) {
  const campusId = url.searchParams.get('campus_id');
  const facultyId = url.searchParams.get('faculty_id');

  return careers.filter((career) => {
    if (!career.active) {
      return false;
    }
    if (campusId && career.campus_id !== campusId) {
      return false;
    }
    if (facultyId && career.faculty_id !== facultyId) {
      return false;
    }
    return true;
  });
}

function filterTeachers(url) {
  const query = normalize(url.searchParams.get('q') ?? '');
  const subject = normalize(url.searchParams.get('subject') ?? '');

  return teachers.filter((teacher) => {
    const matchesQuery =
      !query ||
      normalize(teacher.name).includes(query) ||
      normalize(teacher.career).includes(query) ||
      teacher.subjects.some((item) => normalize(item).includes(query));

    const matchesSubject =
      !subject || teacher.subjects.some((item) => normalize(item).includes(subject));

    return matchesQuery && matchesSubject;
  });
}

async function handleRegister(request, response) {
  const body = await readJson(request);
  const {
    first_name: firstName,
    last_name: lastName,
    email,
    password,
    campus_id: campusId,
    faculty_id: facultyId,
    career_id: careerId,
    admission_year: admissionYear,
    wants_to_teach: wantsToTeach,
  } = body;

  if (
    !firstName?.trim() ||
    !lastName?.trim() ||
    !email?.trim() ||
    !password ||
    !campusId ||
    !facultyId ||
    !careerId ||
    !admissionYear?.trim()
  ) {
    return sendError(
      response,
      422,
      'VALIDATION_ERROR',
      'first_name, last_name, email, password, campus_id, faculty_id, career_id and admission_year are required'
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!isUddEmail(normalizedEmail)) {
    return sendError(
      response,
      422,
      'INVALID_UDD_EMAIL',
      'Email must belong to the UDD institutional domain.'
    );
  }

  if (!isValidPassword(password)) {
    return sendError(
      response,
      422,
      'INVALID_PASSWORD',
      'Password must be at least 8 characters long.'
    );
  }

  if (users.some((user) => user.email === normalizedEmail)) {
    return sendError(response, 409, 'EMAIL_ALREADY_REGISTERED', 'This email is already registered.');
  }

  const career = careers.find(
    (item) =>
      item.id === careerId &&
      item.campus_id === campusId &&
      item.faculty_id === facultyId &&
      item.active
  );

  if (!career) {
    return sendError(
      response,
      422,
      'INVALID_ACADEMIC_SELECTION',
      'The selected campus, faculty and career combination is not valid.'
    );
  }

  const now = new Date().toISOString();
  const roles = ['student'];
  if (wantsToTeach === true) {
    roles.push('tutor');
  }

  const user = {
    email: normalizedEmail,
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    campus_id: campusId,
    faculty_id: facultyId,
    career_id: careerId,
    admission_year: admissionYear.trim(),
    roles,
    password_hash: hashPassword(password),
    created_at: now,
    updated_at: now,
  };

  users.push(user);

  const accessToken = randomUUID();
  tokens.set(accessToken, user.email);

  return sendJson(response, buildAuthResponse(user, accessToken), 201);
}

async function handleLogin(request, response) {
  const body = await readJson(request);
  const { email, password } = body;

  if (!email?.trim() || !password) {
    return sendError(response, 422, 'VALIDATION_ERROR', 'email and password are required');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = users.find((item) => item.email === normalizedEmail);

  if (!user || user.password_hash !== hashPassword(password)) {
    return sendError(response, 401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  const accessToken = randomUUID();
  tokens.set(accessToken, user.email);

  return sendJson(response, buildAuthResponse(user, accessToken));
}

async function handleLogout(request, response) {
  const token = extractBearerToken(request);
  if (token) {
    tokens.delete(token);
  }
  return sendNoContent(response);
}

async function handleMe(request, response) {
  const user = getAuthenticatedUser(request);
  if (!user) {
    return sendError(response, 401, 'UNAUTHENTICATED', 'Valid access token required.');
  }
  return sendJson(response, buildUserResponse(user));
}

function getAuthenticatedUser(request) {
  const token = extractBearerToken(request);
  if (!token) {
    return null;
  }
  const email = tokens.get(token);
  if (!email) {
    return null;
  }
  return users.find((user) => user.email === email) ?? null;
}

function extractBearerToken(request) {
  const authHeader = request.headers.authorization ?? '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

function buildUserResponse(user) {
  return {
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    campus_id: user.campus_id,
    faculty_id: user.faculty_id,
    career_id: user.career_id,
    admission_year: user.admission_year,
    roles: user.roles,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

function buildAuthResponse(user, accessToken) {
  return {
    access_token: accessToken,
    user: buildUserResponse(user),
  };
}

function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

function hashPassword(password) {
  // Mock-only: NOT secure. Real backend must use bcrypt/argon2.
  return Buffer.from(password).toString('base64');
}

async function createBooking(request, response) {
  const body = await readJson(request);
  const teacherId = body.teacher_id ?? body.teacherId;
  const {
    date,
    hour,
    student_first_name: studentFirstName,
    student_last_name: studentLastName,
    student_admission_year: studentAdmissionYear,
    student_email: studentEmail,
    student_campus_id: studentCampusId,
    student_faculty_id: studentFacultyId,
    student_career_id: studentCareerId,
    message,
  } = body;

  if (
    !teacherId ||
    !date ||
    !hour ||
    !studentFirstName ||
    !studentLastName ||
    !studentAdmissionYear ||
    !studentEmail ||
    !studentCampusId ||
    !studentFacultyId ||
    !studentCareerId
  ) {
    return sendError(
      response,
      422,
      'VALIDATION_ERROR',
      'teacher_id, date, hour, student data and academic catalog selections are required'
    );
  }

  if (!isUddEmail(studentEmail)) {
    return sendError(
      response,
      422,
      'INVALID_UDD_EMAIL',
      'Student email must belong to the UDD institutional domain.'
    );
  }

  if (isPastDate(date)) {
    return sendError(
      response,
      422,
      'BOOKING_PAST_DATE',
      'Past dates cannot be booked.'
    );
  }

  const career = careers.find(
    (item) =>
      item.id === studentCareerId &&
      item.campus_id === studentCampusId &&
      item.faculty_id === studentFacultyId &&
      item.active
  );

  if (!career) {
    return sendError(
      response,
      422,
      'INVALID_ACADEMIC_SELECTION',
      'The selected campus, faculty and career combination is not valid.'
    );
  }

  const teacher = findTeacher(teacherId);
  const day = teacher?.availability.find((item) => item.date === date);
  const slot = day?.time_slots.find((item) => item.hour === hour);

  if (!teacher || !day || !slot) {
    return sendError(response, 404, 'TEACHER_NOT_FOUND', 'Availability not found.');
  }

  if (!slot.available) {
    return sendError(
      response,
      409,
      'BOOKING_SLOT_TAKEN',
      'The selected time slot is no longer available.'
    );
  }

  // Pending requests block the slot until accepted, rejected or cancelled.
  slot.available = false;

  const now = new Date().toISOString();
  const booking = {
    id: randomUUID(),
    status: 'pending',
    student_id: 'mock-student',
    teacher_id: teacherId,
    teacher_name: teacher.name,
    subject_id: body.subject_id ?? null,
    date,
    hour,
    student_first_name: studentFirstName,
    student_last_name: studentLastName,
    student_admission_year: studentAdmissionYear,
    student_email: studentEmail,
    student_campus_id: studentCampusId,
    student_faculty_id: studentFacultyId,
    student_career_id: studentCareerId,
    student_career: career.name,
    message: message ?? null,
    tutor_response_message: null,
    created_at: now,
    updated_at: now,
    confirmed_at: null,
    cancelled_at: null,
  };

  bookings.push(booking);
  notifications.push(
    createNotification({
      type: 'booking_requested',
      title: 'Nueva solicitud de tutoria',
      message: `${studentFirstName} ${studentLastName} solicito una clase para el ${date} a las ${hour}.`,
    })
  );
  return sendJson(response, booking, 201);
}

async function transitionBooking(request, response, bookingId, action) {
  const body = await readJson(request);
  const booking = bookings.find((item) => item.id === bookingId);

  if (!booking) {
    return sendError(response, 404, 'BOOKING_NOT_FOUND', 'Booking not found.');
  }

  if (action === 'accept') {
    if (booking.status !== 'pending') {
      return sendInvalidTransition(response);
    }
    booking.status = 'confirmed';
    booking.tutor_response_message = body.message ?? null;
    booking.confirmed_at = new Date().toISOString();
    booking.updated_at = booking.confirmed_at;
    notifications.push(
      createNotification({
        type: 'booking_confirmed',
        title: 'Tutoria confirmada',
        message: `Tu solicitud para el ${booking.date} a las ${booking.hour} fue confirmada.`,
      })
    );
    return sendJson(response, booking);
  }

  if (action === 'reject') {
    if (booking.status !== 'pending') {
      return sendInvalidTransition(response);
    }
    booking.status = 'rejected';
    booking.tutor_response_message = body.message ?? null;
    booking.updated_at = new Date().toISOString();
    releaseSlot(booking.teacher_id, booking.date, booking.hour);
    notifications.push(
      createNotification({
        type: 'booking_rejected',
        title: 'Tutoria rechazada',
        message: `Tu solicitud para el ${booking.date} a las ${booking.hour} fue rechazada.`,
      })
    );
    return sendJson(response, booking);
  }

  if (action === 'cancel') {
    if (!['pending', 'confirmed'].includes(booking.status)) {
      return sendInvalidTransition(response);
    }
    booking.status = 'cancelled';
    booking.tutor_response_message = body.reason ?? body.message ?? null;
    booking.cancelled_at = new Date().toISOString();
    booking.updated_at = booking.cancelled_at;
    releaseSlot(booking.teacher_id, booking.date, booking.hour);
    notifications.push(
      createNotification({
        type: 'booking_cancelled',
        title: 'Tutoria cancelada',
        message: `La tutoria del ${booking.date} a las ${booking.hour} fue cancelada.`,
      })
    );
    return sendJson(response, booking);
  }

  if (action === 'complete') {
    if (booking.status !== 'confirmed') {
      return sendInvalidTransition(response);
    }
    booking.status = 'completed';
    booking.updated_at = new Date().toISOString();
    return sendJson(response, booking);
  }

  return sendError(response, 404, 'NOT_FOUND', 'Route not found.');
}

function findTeacher(id) {
  return teachers.find((teacher) => teacher.id === id);
}

function uniqueSubjects() {
  return [...new Set(teachers.flatMap((teacher) => teacher.subjects))].sort();
}

function releaseSlot(teacherId, date, hour) {
  const teacher = findTeacher(teacherId);
  const slot = teacher?.availability
    .find((item) => item.date === date)
    ?.time_slots.find((item) => item.hour === hour);

  if (slot) {
    slot.available = true;
  }
}

function sendInvalidTransition(response) {
  return sendError(
    response,
    409,
    'BOOKING_INVALID_STATUS_TRANSITION',
    'Booking cannot transition to the requested status.'
  );
}

function createNotification({ type, title, message }) {
  return {
    id: randomUUID(),
    user_id: 'mock-user',
    type,
    title,
    message,
    read_at: null,
    created_at: new Date().toISOString(),
  };
}

function markNotificationAsRead(response, notificationId) {
  const notification = notifications.find((item) => item.id === notificationId);
  if (!notification) {
    return sendError(response, 404, 'NOTIFICATION_NOT_FOUND', 'Notification not found.');
  }

  notification.read_at = new Date().toISOString();
  return sendJson(response, notification);
}

function isUddEmail(email) {
  return /^[^\s@]+@udd\.cl$/i.test(email);
}

function isPastDate(dateString) {
  return dateString < toIsoDate(new Date());
}

function normalize(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function toIsoDate(date) {
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().split('T')[0];
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let rawBody = '';
    request.on('data', (chunk) => {
      rawBody += chunk;
    });
    request.on('end', () => {
      try {
        resolve(rawBody ? JSON.parse(rawBody) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

function sendJson(response, data, statusCode = 200) {
  const payload = JSON.stringify(data);
  response.writeHead(statusCode, corsHeaders({ 'content-type': 'application/json' }));
  response.end(payload);
}

function sendError(response, statusCode, code, message, details = {}) {
  return sendJson(response, { code, message, details }, statusCode);
}

function sendNoContent(response) {
  response.writeHead(204, corsHeaders());
  response.end();
}

function corsHeaders(extraHeaders = {}) {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,PATCH,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
    ...extraHeaders,
  };
}
