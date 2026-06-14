import { DayAvailability, Teacher } from '../models/teacher.model';

/**
 * Generates two weeks of weekday availability with random open time slots.
 * Used only by the mock dataset; the real backend supplies its own availability.
 */
export function generateAvailability(): DayAvailability[] {
  const availability: DayAvailability[] = [];
  const today = new Date();

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '14:00',
    '15:00', '16:00', '17:00', '18:00', '19:00',
  ];

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    const dayOfWeek = date.getDay();
    const hasAvailability =
      dayOfWeek !== 0 && dayOfWeek !== 6 && Math.random() > 0.3;

    if (hasAvailability) {
      const slots = timeSlots.map((hour) => ({
        hour,
        available: Math.random() > 0.4,
      }));

      availability.push({
        date: date.toISOString().split('T')[0],
        timeSlots: slots,
      });
    }
  }

  return availability;
}

export const MOCK_TEACHERS: Teacher[] = [
  {
    id: '1',
    name: 'Sofía Contreras',
    career: 'Ingeniería Civil Industrial',
    year: '3er año',
    rating: 4.8,
    reviewCount: 12,
    priceRange: '$8.000-$12.000',
    subjects: ['Cálculo I', 'Cálculo II', 'Álgebra Lineal'],
    about:
      'Llevo dos años ayudando a estudiantes con matemáticas. Me especializo en explicar conceptos difíciles de forma simple y práctica. Tengo paciencia infinita y me adapto al ritmo de cada estudiante.',
    contact: { type: 'email', value: 'scontreras@udd.cl' },
    availability: generateAvailability(),
    reviews: [
      {
        studentName: 'Felipe Morales',
        rating: 5,
        date: '2026-05-15',
        comment:
          'Excelente profesora, muy clara en sus explicaciones. Gracias a ella pasé Cálculo II con un 6.2',
      },
      {
        studentName: 'María Paz González',
        rating: 5,
        date: '2026-04-22',
        comment:
          'Súper recomendada. Paciente y didáctica, hace que todo sea más fácil de entender.',
      },
      {
        studentName: 'Joaquín Silva',
        rating: 4,
        date: '2026-03-10',
        comment:
          'Muy buena profesora, me ayudó mucho con álgebra. Solo que a veces se demora en responder.',
      },
    ],
  },
  {
    id: '2',
    name: 'Martín Rojas',
    career: 'Ingeniería en Informática',
    year: '4to año',
    rating: 4.9,
    reviewCount: 18,
    priceRange: '$10.000-$15.000',
    subjects: ['Programación', 'Estructuras de Datos', 'Algoritmos'],
    about:
      'Desarrollador full-stack con experiencia enseñando programación. Me enfoco en que entiendas los conceptos fundamentales, no solo que copies código. Sessions hands-on con proyectos reales.',
    contact: { type: 'phone', value: '+56 9 8765 4321' },
    availability: generateAvailability(),
    reviews: [
      {
        studentName: 'Catalina Bravo',
        rating: 5,
        date: '2026-05-20',
        comment:
          'El mejor profe de programación que he tenido. Explica super bien y es re paciente.',
      },
      {
        studentName: 'Diego Fernández',
        rating: 5,
        date: '2026-05-01',
        comment:
          'Martín me salvó en Estructuras de Datos. 100% recomendado si quieres aprender de verdad.',
      },
      {
        studentName: 'Isidora Muñoz',
        rating: 5,
        date: '2026-04-15',
        comment:
          'Excelente profe, muy claro y didáctico. Me ayudó a entender algoritmos complejos.',
      },
      {
        studentName: 'Tomás Vega',
        rating: 4,
        date: '2026-03-28',
        comment: 'Muy buen profesor, solo que sus horarios son limitados.',
      },
    ],
  },
  {
    id: '3',
    name: 'Valentina Lagos',
    career: 'Derecho',
    year: '5to año',
    rating: 4.7,
    reviewCount: 9,
    priceRange: '$7.000-$10.000',
    subjects: ['Derecho Civil', 'Derecho Constitucional', 'Contratos'],
    about:
      'Ayudante de cátedra con vocación por enseñar. Me especializo en simplificar conceptos legales complejos y preparar para exámenes con técnicas efectivas de estudio.',
    contact: { type: 'email', value: 'vlagos@udd.cl' },
    availability: generateAvailability(),
    reviews: [
      {
        studentName: 'Benjamín Soto',
        rating: 5,
        date: '2026-05-18',
        comment:
          'Valentina es seca. Me ayudó a entender Civil I que estaba super perdido.',
      },
      {
        studentName: 'Amanda Reyes',
        rating: 5,
        date: '2026-04-30',
        comment: 'Excelente profesora particular. Sus resúmenes son oro puro.',
      },
      {
        studentName: 'Lucas Herrera',
        rating: 4,
        date: '2026-04-12',
        comment: 'Muy buena, me ayudó harto con Constitucional. Recomendada.',
      },
    ],
  },
  {
    id: '4',
    name: 'Ignacio Ramírez',
    career: 'Medicina',
    year: '6to año',
    rating: 4.6,
    reviewCount: 7,
    priceRange: '$12.000-$18.000',
    subjects: ['Anatomía', 'Fisiología', 'Bioquímica'],
    about:
      'Interno de medicina con experiencia en tutorías. Uso métodos de estudio probados y material visual para facilitar el aprendizaje de ciencias médicas.',
    contact: { type: 'email', value: 'iramirez@udd.cl' },
    availability: generateAvailability(),
    reviews: [
      {
        studentName: 'Fernanda Castro',
        rating: 5,
        date: '2026-05-12',
        comment:
          'Ignacio es increíble. Sus esquemas de anatomía me salvaron en el examen.',
      },
      {
        studentName: 'Sebastián Pino',
        rating: 4,
        date: '2026-04-25',
        comment:
          'Buen profe, sabe harto. A veces se complica explicando pero al final se entiende.',
      },
    ],
  },
  {
    id: '5',
    name: 'Antonia Vargas',
    career: 'Psicología',
    year: '4to año',
    rating: 4.9,
    reviewCount: 14,
    priceRange: '$6.000-$9.000',
    subjects: ['Estadística', 'Metodología de Investigación', 'Psicometría'],
    about:
      'Amante de los números y la investigación. Te ayudo a perderle el miedo a la estadística con ejemplos prácticos y ejercicios paso a paso.',
    contact: { type: 'phone', value: '+56 9 7654 3210' },
    availability: generateAvailability(),
    reviews: [
      {
        studentName: 'Pablo Jiménez',
        rating: 5,
        date: '2026-05-22',
        comment:
          'Antonia es la mejor! Hace que estadística sea entendible y hasta entretenido.',
      },
      {
        studentName: 'Carolina Medina',
        rating: 5,
        date: '2026-05-08',
        comment:
          'Super recomendada. Paciente y clara, me ayudó un montón con metodología.',
      },
      {
        studentName: 'Matías Orellana',
        rating: 5,
        date: '2026-04-20',
        comment:
          'Excelente profesora. Sus clases de estadística son las mejores.',
      },
    ],
  },
  {
    id: '6',
    name: 'Francisco Núñez',
    career: 'Ingeniería Comercial',
    year: '3er año',
    rating: 4.5,
    reviewCount: 10,
    priceRange: '$8.000-$11.000',
    subjects: ['Economía', 'Microeconomía', 'Macroeconomía'],
    about:
      'Apasionado por la economía y los negocios. Te ayudo a entender los conceptos económicos con ejemplos del mundo real y casos prácticos chilenos.',
    contact: { type: 'email', value: 'fnunez@udd.cl' },
    availability: generateAvailability(),
    reviews: [
      {
        studentName: 'Javiera Campos',
        rating: 5,
        date: '2026-05-16',
        comment: 'Francisco explica super bien micro. Me ayudó a pasar el ramo.',
      },
      {
        studentName: 'Rodrigo Sepúlveda',
        rating: 4,
        date: '2026-04-28',
        comment: 'Buen profe, domina los contenidos. A veces va muy rápido.',
      },
      {
        studentName: 'Camila Torres',
        rating: 5,
        date: '2026-04-10',
        comment: 'Muy bueno enseñando economía, súper recomendado.',
      },
    ],
  },
  {
    id: '7',
    name: 'Javiera Molina',
    career: 'Química y Farmacia',
    year: '5to año',
    rating: 4.8,
    reviewCount: 11,
    priceRange: '$9.000-$13.000',
    subjects: ['Química Orgánica', 'Química General', 'Farmacología'],
    about:
      'Tutora con 3 años de experiencia en química. Mi meta es que entiendas la química, no que la memorices. Uso modelos 3D y ejemplos cotidianos.',
    contact: { type: 'email', value: 'jmolina@udd.cl' },
    availability: generateAvailability(),
    reviews: [
      {
        studentName: 'Cristóbal Arias',
        rating: 5,
        date: '2026-05-19',
        comment:
          'Javiera es seca en química orgánica. Sus explicaciones son super claras.',
      },
      {
        studentName: 'Daniela Flores',
        rating: 5,
        date: '2026-05-02',
        comment:
          'La mejor profesora de química que he tenido. Súper didáctica.',
      },
      {
        studentName: 'Nicolás Gutiérrez',
        rating: 4,
        date: '2026-04-14',
        comment: 'Muy buena profe, me ayudó caleta con orgánica.',
      },
    ],
  },
  {
    id: '8',
    name: 'Emilia Sandoval',
    career: 'Arquitectura',
    year: '4to año',
    rating: 4.7,
    reviewCount: 8,
    priceRange: '$10.000-$14.000',
    subjects: ['Dibujo Técnico', 'Geometría Descriptiva', 'Diseño'],
    about:
      'Arquitecta en formación con pasión por enseñar dibujo y diseño. Te ayudo a desarrollar tu visión espacial y técnicas de representación.',
    contact: { type: 'phone', value: '+56 9 6543 2109' },
    availability: generateAvailability(),
    reviews: [
      {
        studentName: 'Vicente Paredes',
        rating: 5,
        date: '2026-05-14',
        comment:
          'Emilia me enseñó todo de geometría descriptiva. Súper buena.',
      },
      {
        studentName: 'Sofía Ruiz',
        rating: 4,
        date: '2026-04-26',
        comment: 'Buena profesora, muy creativa y paciente.',
      },
    ],
  },
  {
    id: '9',
    name: 'Gabriel Moreno',
    career: 'Ingeniería Civil',
    year: '5to año',
    rating: 4.6,
    reviewCount: 13,
    priceRange: '$9.000-$12.000',
    subjects: ['Cálculo', 'Física', 'Mecánica de Fluidos'],
    about:
      'Ingeniero civil con experiencia en ayudantías. Me enfoco en desarrollar tu razonamiento lógico y habilidades de resolución de problemas.',
    contact: { type: 'email', value: 'gmoreno@udd.cl' },
    availability: generateAvailability(),
    reviews: [
      {
        studentName: 'Martina López',
        rating: 5,
        date: '2026-05-21',
        comment:
          'Gabriel es excelente. Me ayudó un montón con física, super claro.',
      },
      {
        studentName: 'Agustín Pérez',
        rating: 5,
        date: '2026-05-05',
        comment: 'Muy buen profe de cálculo, recomendado 100%.',
      },
      {
        studentName: 'Florencia Díaz',
        rating: 4,
        date: '2026-04-18',
        comment: 'Buen profesor, sabe harto de física y cálculo.',
      },
    ],
  },
];
