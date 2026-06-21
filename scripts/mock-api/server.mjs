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

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host}`);

  if (request.method === 'OPTIONS') {
    return sendNoContent(response);
  }

  try {
    if (url.pathname === `${API_PREFIX}/health` && request.method === 'GET') {
      return sendJson(response, { ok: true, service: 'mentorly-mock-api' });
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

async function createBooking(request, response) {
  const body = await readJson(request);
  const { teacherId, date, hour } = body;

  if (!teacherId || !date || !hour) {
    return sendJson(
      response,
      { message: 'teacherId, date and hour are required' },
      400
    );
  }

  const teacher = findTeacher(teacherId);
  const day = teacher?.availability.find((item) => item.date === date);
  const slot = day?.time_slots.find((item) => item.hour === hour);

  if (!teacher || !day || !slot) {
    return sendJson(response, { message: 'Availability not found' }, 404);
  }

  if (!slot.available) {
    return sendJson(response, { message: 'Time slot is not available' }, 409);
  }

  slot.available = false;

  const booking = {
    id: randomUUID(),
    status: 'confirmed',
    teacher_id: teacherId,
    teacher_name: teacher.name,
    date,
    hour,
    student_name: body.studentName ?? 'Estudiante UDD',
    student_email: body.studentEmail ?? null,
    created_at: new Date().toISOString(),
  };

  bookings.push(booking);
  return sendJson(response, booking, 201);
}

function findTeacher(id) {
  return teachers.find((teacher) => teacher.id === id);
}

function uniqueSubjects() {
  return [...new Set(teachers.flatMap((teacher) => teacher.subjects))].sort();
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

function sendNoContent(response) {
  response.writeHead(204, corsHeaders());
  response.end();
}

function corsHeaders(extraHeaders = {}) {
  return {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
    ...extraHeaders,
  };
}
