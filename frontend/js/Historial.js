document.addEventListener('DOMContentLoaded', () => {
    const usuario = JSON.parse(sessionStorage.getItem("usuario")) || { usuario: "default" };
    const claveHistorial = "historial_" + usuario.usuario.toLowerCase();
    let historial = JSON.parse(localStorage.getItem(claveHistorial)) || [];

    // Elementos del DOM
    const listaEntrenamientos = document.getElementById('listaEntrenamientos');
    const filtroGrupo = document.getElementById('filtroGrupo');
    const filtroFecha = document.getElementById('filtroFecha');
    const ordenarPor = document.getElementById('ordenarPor');

    // Funciones de utilidad
    function formatearFecha(fecha) {
        const opciones = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(fecha).toLocaleDateString('es-ES', opciones);
    }

    function calcularVolumenTotal(ejercicios) {
        return ejercicios.reduce((total, ejercicio) => {
            return total + ejercicio.series.reduce((sum, serie) => {
                return sum + (serie.peso * serie.repeticiones);
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
            (volumenTotal / totalSesiones).toFixed(2) : 0;

        document.getElementById('totalSesiones').textContent = totalSesiones;
        document.getElementById('volumenTotal').textContent = `${volumenTotal.toLocaleString()} kg`;
        document.getElementById('seriesTotales').textContent = seriesTotales;
        document.getElementById('promedioSesion').textContent = `${promedioSesion} kg`;
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
    document.getElementById('exportarCSV').addEventListener('click', () => {
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
    document.getElementById('exportarJSON').addEventListener('click', () => {
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

    // Inicializar vista
    actualizarVista();
}); 