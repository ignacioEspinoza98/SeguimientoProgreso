document.addEventListener('DOMContentLoaded', async () => {
  console.log('Iniciando carga de Historial...');

  const usuarioString = sessionStorage.getItem('usuario');
  if (!usuarioString) return (window.location.href = '../html/InicioSesion.html');

  let usuario;
  try {
    usuario = JSON.parse(usuarioString);
  } catch {
    return (window.location.href = 'InicioSesion.html');
  }

  const obtenerHistorial = window.firebaseServices?.obtenerHistorial;
  let historial = [];

  if (typeof obtenerHistorial === 'function') {
    try {
      historial = await obtenerHistorial(usuario.uid);
    } catch (e) {
      console.error("Error al obtener historial desde Firebase:", e);
    }
  }

  const listaEntrenamientos = document.getElementById('listaEntrenamientos');
  const filtroGrupo = document.getElementById('filtroGrupo');
  const filtroFecha = document.getElementById('filtroFecha');
  const ordenarPor = document.getElementById('ordenarPor');
  const btnExportarCSV = document.getElementById('exportarCSV');
  const btnExportarJSON = document.getElementById('exportarJSON');

  function formatearFecha(fecha) {
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(fecha).toLocaleDateString('es-ES', opciones);
  }

  function calcularVolumenTotal(ejercicios) {
    return ejercicios.reduce((total, e) => {
      return total + e.series.reduce((suma, serie) => suma + (serie.peso * serie.repeticiones), 0);
    }, 0);
  }

  function calcularSeriesTotales(ejercicios) {
    return ejercicios.reduce((total, e) => total + e.series.length, 0);
  }

  function actualizarEstadisticas(entrenamientos) {
    const totalSesiones = entrenamientos.length;
    const volumenTotal = entrenamientos.reduce((total, sesion) =>
      total + calcularVolumenTotal(sesion.ejercicios), 0);
    const seriesTotales = entrenamientos.reduce((total, sesion) =>
      total + calcularSeriesTotales(sesion.ejercicios), 0);
    const promedioSesion = totalSesiones > 0 ?
      Math.round(volumenTotal / totalSesiones) : 0;

    document.getElementById('totalSesiones').textContent = totalSesiones;
    document.getElementById('volumenTotal').textContent = volumenTotal;
    document.getElementById('seriesTotales').textContent = seriesTotales;
    document.getElementById('promedioSesion').textContent = promedioSesion;
  }

  function filtrarEntrenamientos() {
    const grupoSeleccionado = filtroGrupo.value;
    const fechaSeleccionada = filtroFecha.value;
    const ordenSeleccionado = ordenarPor.value;

    let filtrados = [...historial];

    if (grupoSeleccionado !== 'todos') {
      filtrados = filtrados.filter(sesion =>
        sesion.ejercicios.some(e => e.grupo === grupoSeleccionado)
      );
    }

    if (fechaSeleccionada !== 'todos') {
      const dias = {
        'semana': 7,
        'mes': 30,
        'trimestre': 90
      }[fechaSeleccionada];

      const fechaLimite = new Date(new Date() - dias * 24 * 60 * 60 * 1000);
      filtrados = filtrados.filter(sesion =>
        new Date(sesion.fecha) >= fechaLimite
      );
    }

    filtrados.sort((a, b) => {
      const fa = new Date(a.fecha);
      const fb = new Date(b.fecha);
      if (ordenSeleccionado === 'fecha-desc') return fb - fa;
      if (ordenSeleccionado === 'fecha-asc') return fa - fb;
      if (ordenSeleccionado === 'volumen-desc') return calcularVolumenTotal(b.ejercicios) - calcularVolumenTotal(a.ejercicios);
      if (ordenSeleccionado === 'volumen-asc') return calcularVolumenTotal(a.ejercicios) - calcularVolumenTotal(b.ejercicios);
      return 0;
    });

    return filtrados;
  }

  function renderizarEntrenamientos(entrenamientos) {
    listaEntrenamientos.innerHTML = '';

    if (entrenamientos.length === 0) {
      listaEntrenamientos.innerHTML = `
        <div class="entrenamiento-card">
          <p>No hay entrenamientos registrados con los filtros seleccionados.</p>
        </div>`;
      return;
    }

    entrenamientos.forEach(sesion => {
      const volumen = calcularVolumenTotal(sesion.ejercicios);
      const card = document.createElement('div');
      card.className = 'entrenamiento-card';
      card.innerHTML = `
        <div class="entrenamiento-header">
          <span class="entrenamiento-fecha">${formatearFecha(sesion.fecha)}</span>
          <span class="entrenamiento-volumen">Volumen: ${volumen.toLocaleString()} kg</span>
        </div>
        <ul class="ejercicios-lista">
          ${sesion.ejercicios.map(e => `
            <li class="ejercicio-item">
              <strong>${e.nombre}</strong> (${e.grupo})<br>
              ${e.series.map((s, i) => `Serie ${i + 1}: ${s.repeticiones} reps × ${s.peso} kg`).join('<br>')}
            </li>`).join('')}
        </ul>
      `;
      listaEntrenamientos.appendChild(card);
    });
  }

  function actualizarVista() {
    const filtrados = filtrarEntrenamientos();
    actualizarEstadisticas(filtrados);
    renderizarEntrenamientos(filtrados);
  }

  filtroGrupo.addEventListener('change', actualizarVista);
  filtroFecha.addEventListener('change', actualizarVista);
  ordenarPor.addEventListener('change', actualizarVista);

  btnExportarCSV.addEventListener('click', () => {
    const filtrados = filtrarEntrenamientos();
    const filas = [['Fecha', 'Ejercicio', 'Grupo', 'Peso', 'Reps']];
    filtrados.forEach(sesion => {
      sesion.ejercicios.forEach(e => {
        e.series.forEach(s => {
          filas.push([
            formatearFecha(sesion.fecha),
            e.nombre,
            e.grupo,
            s.peso,
            s.repeticiones
          ]);
        });
      });
    });
    const csv = filas.map(fila => fila.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historial_${usuario.nombre.toLowerCase()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  btnExportarJSON.addEventListener('click', () => {
    const filtrados = filtrarEntrenamientos();
    const json = JSON.stringify(filtrados, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historial_${usuario.nombre.toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  actualizarVista();
});
