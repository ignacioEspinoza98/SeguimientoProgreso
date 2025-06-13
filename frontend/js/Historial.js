// Verificar autenticación
document.addEventListener('DOMContentLoaded', () => {
    console.log('Iniciando carga de Historial...');
    // Verificar si el usuario está autenticado
    const usuarioString = sessionStorage.getItem('usuario');
    console.log('Datos de usuario en sessionStorage:', usuarioString);
    
    if (!usuarioString) {
        console.error('No se encontró usuario en sessionStorage');
        window.location.href = 'InicioSesion.html';
        return;
    }
    
    let usuario;
    try {
        usuario = JSON.parse(usuarioString);
        console.log('Usuario parseado:', usuario);
    } catch (error) {
        console.error('Error al parsear usuario:', error);
        window.location.href = 'InicioSesion.html';
        return;
    }

    // Usar usuario.nombre en lugar de usuario.usuario
    const claveHistorial = `historial_${usuario.nombre.toLowerCase()}`;
    let historial = JSON.parse(localStorage.getItem(claveHistorial)) || [];

    // Elementos del DOM
    const listaEntrenamientos = document.getElementById('listaEntrenamientos');
    const filtroGrupo = document.getElementById('filtroGrupo');
    const filtroFecha = document.getElementById('filtroFecha');
    const ordenarPor = document.getElementById('ordenarPor');
    const btnExportarCSV = document.getElementById('exportarCSV');
    const btnExportarJSON = document.getElementById('exportarJSON');

    // Funciones de utilidad
    function formatearFecha(fecha) {
        const opciones = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };
        const fechaFormateada = new Date(fecha).toLocaleDateString('es-ES', opciones);
        // Convertir a mayúscula la primera letra de la hora (AM/PM)
        return fechaFormateada.replace(/\b(am|pm)\b/gi, match => match.toUpperCase());
    }

    function calcularVolumenTotal(ejercicios) {
        return ejercicios.reduce((total, ejercicio) => {
            return total + ejercicio.series.reduce((sum, serie) => {
                const peso = parseFloat(serie.peso) || 0;
                const repeticiones = parseInt(serie.repeticiones) || 0;
                return sum + (peso * repeticiones);
            }, 0);
        }, 0);
    }

    function calcularSeriesTotales(ejercicios) {
        return ejercicios.reduce((total, ejercicio) => total + ejercicio.series.length, 0);
    }

    function actualizarEstadisticas(entrenamientos) {
        const totalSesiones = entrenamientos.length;
        const volumenTotal = entrenamientos.reduce((total, sesion) => 
            total + calcularVolumenTotal(sesion.ejercicios), 0);
        const seriesTotales = entrenamientos.reduce((total, sesion) => 
            total + calcularSeriesTotales(sesion.ejercicios), 0);
        const promedioSesion = totalSesiones > 0 ? 
            Math.round(volumenTotal / totalSesiones) : 0;

        // Actualizar las tarjetas de estadísticas
        document.getElementById('totalSesiones').textContent = totalSesiones.toLocaleString();
        document.getElementById('volumenTotal').textContent = volumenTotal.toLocaleString();
        document.getElementById('seriesTotales').textContent = seriesTotales.toLocaleString();
        document.getElementById('promedioSesion').textContent = promedioSesion.toLocaleString();
        
        // Mostrar u ocultar mensaje de sin resultados
        const sinResultados = document.querySelector('.sin-resultados');
        if (sinResultados) {
            if (totalSesiones > 0) {
                sinResultados.style.display = 'none';
            } else {
                sinResultados.style.display = 'block';
            }
        }
    }

    function filtrarEntrenamientos() {
        const grupoSeleccionado = filtroGrupo.value;
        const fechaSeleccionada = filtroFecha.value;
        const ordenSeleccionado = ordenarPor.value;

        let entrenamientosFiltrados = [...historial];

        // Filtrar por grupo muscular
        if (grupoSeleccionado !== 'todos') {
            entrenamientosFiltrados = entrenamientosFiltrados.filter(sesion => 
                sesion.ejercicios.some(e => e.grupoMuscular === grupoSeleccionado)
            );
        }

        // Filtrar por fecha
        const ahora = new Date();
        if (fechaSeleccionada !== 'todos') {
            const dias = {
                'semana': 7,
                'mes': 30,
                'trimestre': 90
            }[fechaSeleccionada];

            const fechaLimite = new Date(ahora - dias * 24 * 60 * 60 * 1000);
            entrenamientosFiltrados = entrenamientosFiltrados.filter(sesion => 
                new Date(sesion.fecha) >= fechaLimite
            );
        }

        // Ordenar
        entrenamientosFiltrados.sort((a, b) => {
            switch (ordenSeleccionado) {
                case 'fecha-desc':
                    return new Date(b.fecha) - new Date(a.fecha);
                case 'fecha-asc':
                    return new Date(a.fecha) - new Date(b.fecha);
                case 'volumen-desc':
                    return calcularVolumenTotal(b.ejercicios) - calcularVolumenTotal(a.ejercicios);
                case 'volumen-asc':
                    return calcularVolumenTotal(a.ejercicios) - calcularVolumenTotal(b.ejercicios);
                default:
                    return 0;
            }
        });

        return entrenamientosFiltrados;
    }

    function renderizarEntrenamientos(entrenamientos) {
        listaEntrenamientos.innerHTML = '';

        if (entrenamientos.length === 0) {
            listaEntrenamientos.innerHTML = `
                <div class="entrenamiento-card">
                    <p>No hay entrenamientos registrados con los filtros seleccionados.</p>
                </div>
            `;
            return;
        }

        entrenamientos.forEach(sesion => {
            const volumenTotal = calcularVolumenTotal(sesion.ejercicios);
            const seriesTotales = calcularSeriesTotales(sesion.ejercicios);

            const card = document.createElement('div');
            card.className = 'entrenamiento-card';
            card.innerHTML = `
                <div class="entrenamiento-header">
                    <span class="entrenamiento-fecha">${formatearFecha(sesion.fecha)}</span>
                    <span class="entrenamiento-volumen">Volumen: ${volumenTotal.toLocaleString()} kg</span>
                </div>
                <ul class="ejercicios-lista">
                    ${sesion.ejercicios.map(ejercicio => `
                        <li class="ejercicio-item">
                            <strong>${ejercicio.ejercicio}</strong> (${ejercicio.grupoMuscular})
                            <br>
                            ${ejercicio.series.map(serie => 
                                `${serie.peso}kg × ${serie.repeticiones} reps`
                            ).join(' | ')}
                        </li>
                    `).join('')}
                </ul>
            `;
            listaEntrenamientos.appendChild(card);
        });
    }

    function actualizarVista() {
        const entrenamientosFiltrados = filtrarEntrenamientos();
        actualizarEstadisticas(entrenamientosFiltrados);
        renderizarEntrenamientos(entrenamientosFiltrados);
    }

    // Event Listeners
    filtroGrupo.addEventListener('change', actualizarVista);
    filtroFecha.addEventListener('change', actualizarVista);
    ordenarPor.addEventListener('change', actualizarVista);

    // Exportar a CSV
    btnExportarCSV.addEventListener('click', () => {
        const entrenamientosFiltrados = filtrarEntrenamientos();
        const filas = [['Fecha', 'Ejercicio', 'Grupo Muscular', 'Peso', 'Reps', 'Series']];
        
        entrenamientosFiltrados.forEach(sesion => {
            sesion.ejercicios.forEach(e => {
                e.series.forEach(serie => {
                    filas.push([
                        formatearFecha(sesion.fecha),
                        e.ejercicio,
                        e.grupoMuscular,
                        serie.peso,
                        serie.repeticiones,
                        e.series.length
                    ]);
                });
            });
        });

        const csv = filas.map(fila => fila.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `historial_${usuario.usuario.toLowerCase()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Exportar a JSON
    btnExportarJSON.addEventListener('click', () => {
        const entrenamientosFiltrados = filtrarEntrenamientos();
        const json = JSON.stringify(entrenamientosFiltrados, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `historial_${usuario.usuario.toLowerCase()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Inicializar la vista
    actualizarVista();
    
    // Mostrar notificación de bienvenida
    setTimeout(() => {
        mostrarNotificacion('Bienvenido a tu historial de entrenamientos', 'exito');
    }, 1000);
});