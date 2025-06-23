// Objeto con consejos y recomendaciones por categoría
const consejosEntrenamiento = {
  // Consejos generales por grupo muscular
  gruposMusculares: {
    Pecho: [
      "Intenta variar el ángulo de inclinación en tus ejercicios de pecho para trabajar todas las fibras musculares.",
      "Asegúrate de realizar el rango completo de movimiento en press de banca para maximizar la activación muscular.",
      "Incorpora ejercicios con mancuernas para corregir desequilibrios entre lados."
    ],
    Espalda: [
      "Enfócate en contraer los omóplatos al final de cada repetición para una mejor activación de la espalda.",
      "Mantén la espalda recta y evita arquear la zona lumbar en ejercicios de remo.",
      "Prueba agarres diferentes (ancho, pronación, supinación) para trabajar distintas áreas de la espalda."
    ],
    Hombros: [
      "No descuides los deltoides posteriores, son clave para una postura equilibrada.",
      "Controla el movimiento durante las elevaciones laterales para evitar lesiones.",
      "Incorpora rotaciones externas para fortalecer el manguito rotador y prevenir lesiones."
    ],
    Piernas: [
      "Asegúrate de que tus rodillas no sobrepasen la punta de los pies en sentadillas profundas.",
      "Varía entre sentadillas con barra alta y baja para trabajar diferentes porciones del cuádriceps.",
      "No descuides los ejercicios de pantorrillas para un desarrollo equilibrado de las piernas."
    ],
    Bíceps: [
      "Controla el movimiento excéntrico (bajada) para maximizar la tensión muscular.",
      "Prueba diferentes agarres (ancho, martillo) para trabajar todas las cabezas del bíceps.",
      "Evita balancear el cuerpo para mantener la tensión en los brazos."
    ],
    Tríceps: [
      "Mantén los codos pegados al cuerpo en extensiones para aislar mejor el tríceps.",
      "Varía entre ejercicios que trabajen las diferentes cabezas del tríceps.",
      "Controla el movimiento en la fase negativa para mayor hipertrofia."
    ]
  },
  
  // Consejos basados en el rendimiento
  rendimiento: {
    bajoVolumen: [
      "Intenta aumentar gradualmente el volumen de entrenamiento en un 10-15% esta semana.",
      "Considera añadir una serie adicional a tus ejercicios principales.",
      "Podrías beneficiarte de incluir un ejercicio más por grupo muscular."
    ],
    altoVolumen: [
      "Tu volumen de entrenamiento es alto, asegúrate de tener días de descanso adecuados.",
      "Considera reducir el volumen si sientes fatiga excesiva o estancamiento.",
      "Podrías beneficiarte de una semana de descarga para permitir una mejor recuperación."
    ],
    bajoPeso: [
      "Intenta aumentar el peso en un 2-5% en tu próximo entrenamiento.",
      "Enfócate en la técnica antes de aumentar el peso.",
      "Considera hacer menos repeticiones con más peso para ganar fuerza."
    ],
    altaFrecuencia: [
      "Estás entrenando este grupo muscular con mucha frecuencia, asegúrate de darle suficiente descanso.",
      "Considera espaciar más tus entrenamientos para este grupo muscular.",
      "La recuperación es clave para el crecimiento muscular, no subestimes su importancia."
    ],
    bajaFrecuencia: [
      "Podrías beneficiarte de entrenar este grupo muscular con más frecuencia.",
      "Considera añadir un día extra de entrenamiento para este grupo muscular.",
      "El aumento de la frecuencia de entrenamiento puede mejorar la síntesis de proteína muscular."
    ]
  },
  
  // Consejos para superar mesetas
  mesetas: {
    fuerza: [
      "Prueba el método de sobrecarga progresiva, aumentando el peso en pequeños incrementos.",
      "Incorpora series de fuerza con mayor peso y menos repeticiones (3-5 repeticiones).",
      "Asegúrate de estar descansando lo suficiente entre series (2-3 minutos)."
    ],
    hipertrofia: [
      "Varía los rangos de repeticiones (6-12 repeticiones) para estimular diferentes fibras musculares.",
      "Incorpora técnicas de intensidad como series descendentes o repeticiones forzadas.",
      "Asegúrate de alcanzar el fallo muscular en al menos algunas series."
    ],
    resistencia: [
      "Aumenta gradualmente el número de repeticiones por serie.",
      "Reduce los tiempos de descanso entre series.",
      "Incorpora circuitos o superseries para mejorar la capacidad de trabajo."
    ]
  },
  
  // Consejos de recuperación
  recuperacion: [
    "Asegúrate de dormir al menos 7-8 horas cada noche para una óptima recuperación.",
    "Incorpora días de descanso activo con actividades de baja intensidad como caminar o nadar.",
    "Considera técnicas de recuperación como estiramientos, masajes o baños de hielo.",
    "La hidratación es clave para la recuperación muscular, asegúrate de beber suficiente agua.",
    "Incluye proteínas de calidad en cada comida para favorecer la síntesis de proteína muscular."
  ],
  
  // Consejos de nutrición
  nutricion: [
    "Asegúrate de consumir suficiente proteína (1.6-2.2g por kg de peso corporal).",
    "Los carbohidratos son tu principal fuente de energía, no los descuides en tus comidas pre-entreno.",
    "Las grasas saludables son importantes para la producción hormonal, inclúyelas en tu dieta.",
    "Mantente hidratado, incluso una ligera deshidratación puede afectar tu rendimiento.",
    "Considera suplementarte con creatina si buscas mejorar tu fuerza y ganar masa muscular."
  ]
};

// Función para analizar el rendimiento del usuario
export function analizarRendimiento(historial) {
  if (!historial || historial.length < 2) {
    return {
      recomendaciones: [
        "Registra más entrenamientos para recibir recomendaciones personalizadas.",
        "Asegúrate de incluir una variedad de ejercicios en tus rutinas.",
        ...consejosEntrenamiento.recuperacion.slice(0, 2),
        ...consejosEntrenamiento.nutricion.slice(0, 2)
      ],
      alertas: []
    };
  }

  const recomendaciones = [];
  const alertas = [];
  
  // Obtener las últimas 4 semanas de entrenamiento
  const ahora = new Date();
  const ultimas4Semanas = new Date();
  ultimas4Semanas.setDate(ahora.getDate() - 28);
  
  const entrenamientosRecientes = historial.filter(sesion => 
    new Date(sesion.fecha) >= ultimas4Semanas
  );
  
  if (entrenamientosRecientes.length === 0) {
    return {
      recomendaciones: [
        "No hay entrenamientos registrados en las últimas 4 semanas.",
        "Intenta ser más consistente con tus entrenamientos para ver mejores resultados.",
        ...consejosEntrenamiento.recuperacion.slice(0, 2)
      ],
      alertas: ["Inactividad prolongada"]
    };
  }
  
  // Analizar frecuencia de entrenamiento por grupo muscular
  const frecuenciaGrupos = {};
  const volumenPorGrupo = {};
  const pesosPorGrupo = {};
  const fechasEntrenamiento = [];
  
  entrenamientosRecientes.forEach(sesion => {
    const fecha = new Date(sesion.fecha);
    fechasEntrenamiento.push(fecha);
    
    sesion.ejercicios.forEach(ejercicio => {
      if (!ejercicio.grupo  || ejercicio.grupo  === "Otro") return;
      
      const grupo = ejercicio.grupo ;
      const series = parseInt(ejercicio.series) || 0;
      const repeticiones = parseInt(ejercicio.repeticiones) || 0;
      const peso = parseFloat(ejercicio.peso) || 0;
      
      // Calcular frecuencia por grupo muscular
      if (!frecuenciaGrupos[grupo]) {
        frecuenciaGrupos[grupo] = 0;
      }
      frecuenciaGrupos[grupo]++;
      
      // Calcular volumen por grupo muscular
      if (!volumenPorGrupo[grupo]) {
        volumenPorGrupo[grupo] = 0;
      }
      volumenPorGrupo[grupo] += series * repeticiones * peso;
      
      // Registrar pesos por grupo
      if (!pesosPorGrupo[grupo]) {
        pesosPorGrupo[grupo] = [];
      }
      if (peso > 0) {
        pesosPorGrupo[grupo].push(peso);
      }
    });
  });
  
  // Analizar frecuencia de entrenamiento
  const frecuenciaPromedio = entrenamientosRecientes.length / 4; // Semanas
  
  if (frecuenciaPromedio < 2) {
    recomendaciones.push(
      "Tu frecuencia de entrenamiento es baja. Intenta entrenar al menos 2-3 veces por semana para ver mejores resultados."
    );
  } else if (frecuenciaPromedio > 5) {
    recomendaciones.push(
      "Tu frecuencia de entrenamiento es muy alta. Asegúrate de incluir días de descanso para permitir la recuperación muscular."
    );
  }
  
  // Analizar volumen por grupo muscular
  Object.entries(volumenPorGrupo).forEach(([grupo, volumen]) => {
    const frecuencia = frecuenciaGrupos[grupo] || 0;
    const volumenPorSesion = volumen / frecuencia;
    
    if (volumenPorSesion < 1000) {
      recomendaciones.push(
        `El volumen de entrenamiento para ${grupo} es bajo. Considera aumentar el número de series o repeticiones.`
      );
      // Añadir consejos específicos del grupo muscular
      if (consejosEntrenamiento.gruposMusculares[grupo]) {
        recomendaciones.push(
          consejosEntrenamiento.gruposMusculares[grupo][0]
        );
      }
    } else if (volumenPorSesion > 5000) {
      recomendaciones.push(
        `El volumen de entrenamiento para ${grupo} es muy alto. Asegúrate de permitir una recuperación adecuada.`
      );
      recomendaciones.push(
        ...consejosEntrenamiento.rendimiento.altoVolumen.slice(0, 1)
      );
    }
    
    // Analizar progresión de pesos
    const pesos = pesosPorGrupo[grupo] || [];
    if (pesos.length >= 4) {
      const primerCuarto = Math.floor(pesos.length / 4);
      const ultimoCuarto = Math.floor(pesos.length * 3 / 4);
      const pesosIniciales = pesos.slice(0, primerCuarto);
      const pesosFinales = pesos.slice(ultimoCuarto);
      
      const promedioInicial = pesosIniciales.reduce((a, b) => a + b, 0) / pesosIniciales.length;
      const promedioFinal = pesosFinales.reduce((a, b) => a + b, 0) / pesosFinales.length;
      
      const progresion = ((promedioFinal - promedioInicial) / promedioInicial) * 100;
      
      if (progresion < 5 && progresion > -5) {
        alertas.push(`Posible meseta en ${grupo}`);
        recomendaciones.push(
          `Parece que estás estancado en ${grupo}. ` +
          consejosEntrenamiento.mesetas.hipertrofia[0]
        );
      }
    }
  });
  
  // Añadir consejos de recuperación y nutrición
  if (recomendaciones.length < 3) {
    recomendaciones.push(
      consejosEntrenamiento.recuperacion[Math.floor(Math.random() * consejosEntrenamiento.recuperacion.length)]
    );
    recomendaciones.push(
      consejosEntrenamiento.nutricion[Math.floor(Math.random() * consejosEntrenamiento.nutricion.length)]
    );
  }
  
  // Limitar el número de recomendaciones
  const recomendacionesUnicas = [...new Set(recomendaciones)];
  
  return {
    recomendaciones: recomendacionesUnicas.slice(0, 5), // Máximo 5 recomendaciones
    alertas: [...new Set(alertas)].slice(0, 3) // Máximo 3 alertas
  };
}

// Función para mostrar las recomendaciones en el DOM
export function mostrarRecomendaciones(contenedorId) {
  try {
    const usuario = JSON.parse(sessionStorage.getItem("usuario")) || { nombre: "default" };
    const claveHistorial = `historial_${usuario.nombre.toLowerCase()}`;
    const historial = JSON.parse(localStorage.getItem(claveHistorial)) || [];
    
    const { recomendaciones, alertas } = analizarRendimiento(historial);
    const contenedor = document.getElementById(contenedorId);
    const contenedorRecomendados = document.getElementById('ejerciciosRecomendados');
    
    if (!contenedor || !contenedorRecomendados) return;
    
    // Actualizar ejercicios recomendados
    if (recomendaciones.length > 0) {
      const ejerciciosRecomendados = [
        recomendaciones[0] || 'Press banca con mancuernas',
        recomendaciones[1] || 'Sentadilla búlgara',
        recomendaciones[2] || 'Rem con barra'
      ];
      
      contenedorRecomendados.innerHTML = ejerciciosRecomendados
        .map(ejercicio => `
          <div class="ejercicio-item">
            <i class="fas fa-dumbbell"></i>
            <span>${ejercicio}</span>
          </div>
        `).join('');
    }
    
    // Actualizar recomendaciones personalizadas
    let html = `
      <div class="recomendaciones-container">
        <h3><i class="fas fa-chart-line"></i> Análisis de tu Progreso</h3>
    `;
    
    if (alertas.length > 0) {
      html += `
        <div class="alertas">
          <h4><i class="fas fa-exclamation-triangle"></i> ¡Atención!</h4>
          <div class="alertas-contenido">
            ${alertas.map(alerta => `
              <div class="alerta-item">
                <i class="fas fa-info-circle"></i>
                <p>${alerta}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    if (recomendaciones.length > 3) {
      html += `
        <div class="consejos">
          <h4><i class="fas fa-lightbulb"></i> Recomendaciones clave</h4>
          <div class="consejos-lista">
            ${recomendaciones.slice(0, 3).map(consejo => `
              <div class="consejo-item">
                <i class="fas fa-check-circle"></i>
                <p>${consejo}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    // Añadir un consejo aleatorio adicional
    const categoriasConsejos = Object.keys(consejosEntrenamiento);
    const categoriaAleatoria = categoriasConsejos[Math.floor(Math.random() * categoriasConsejos.length)];
    
    if (Array.isArray(consejosEntrenamiento[categoriaAleatoria])) {
      const consejoAleatorio = consejosEntrenamiento[categoriaAleatoria][
        Math.floor(Math.random() * consejosEntrenamiento[categoriaAleatoria].length)
      ];
      
      html += `
        <div class="consejo-extra">
          <div class="consejo-extra-icono">
            <i class="fas fa-star"></i>
          </div>
          <div class="consejo-extra-contenido">
            <h4>Consejo del día</h4>
            <p>${consejoAleatorio}</p>
          </div>
        </div>
      `;
    }
    
    html += `</div>`;
    
    contenedor.innerHTML = html;
    
  } catch (error) {
    console.error('Error al cargar las recomendaciones:', error);
  }
}

// Función para inicializar el sistema de recomendaciones
export function inicializarRecomendaciones() {
  // Esta función se puede llamar desde cualquier página que necesite mostrar recomendaciones
  mostrarRecomendaciones('recomendacionesContainer');
}

// Inicializar automáticamente si el contenedor existe
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('recomendacionesContainer')) {
    inicializarRecomendaciones();
  }
});
