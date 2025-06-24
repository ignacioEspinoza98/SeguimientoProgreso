auth = window.firebaseServices?.auth;
db = window.firebaseServices?.db;

document.addEventListener("DOMContentLoaded", () => {
  const UID_ADMIN = "aQUdj3oJR5VceRFAOKv89naAJaA3";

  auth.onAuthStateChanged(async (user) => {
    if (!user || user.uid !== UID_ADMIN) {
      alert("Acceso denegado. Solo administradores.");
      window.location.href = "InicioSesion.html";
      return;
    }

    try {
      const tablaUsuarios = document.getElementById("tablaUsuarios");
      const tbody = tablaUsuarios.querySelector("tbody");

      const totalUsuariosElem = document.getElementById("totalUsuarios");
      const totalSesionesElem = document.getElementById("totalSesiones");
      const promedioSesionesElem = document.getElementById("promedioSesiones");

      const usuariosSnapshot = await db.collection("usuarios").get();

      if (usuariosSnapshot.empty) {
        tbody.innerHTML = `<tr><td colspan="5">No hay usuarios registrados</td></tr>`;
        totalUsuariosElem.textContent = "0";
        totalSesionesElem.textContent = "0";
        promedioSesionesElem.textContent = "0";
        return;
      }

      totalUsuariosElem.textContent = usuariosSnapshot.size;
      let totalSesiones = 0;
      const usuariosMap = {};
      const sesionesPorUsuario = {};
      const actividadUsuarios = [];

      for (const doc of usuariosSnapshot.docs) {
        const data = doc.data();
        const uid = doc.id;
        const nombre = data.usuario || "(Sin nombre)";
        const email = data.correo || "undefined";
        const fechaCreacion = data.fechaRegistro?.toDate().toLocaleDateString() || "-";

        usuariosMap[uid] = { nombre, email, fechaRegistro: data.fechaRegistro?.toDate() || new Date(0) };

        const sesionesSnapshot = await db
          .collection("SesionesEntrenamiento")
          .where("usuarioId", "==", uid)
          .get();

        const numSesiones = sesionesSnapshot.size;
        sesionesPorUsuario[uid] = numSesiones;
        totalSesiones += numSesiones;

        let ultimaFecha = new Date(0);
        sesionesSnapshot.forEach(s => {
          const fecha = s.data().timestamp?.toDate();
          if (fecha && fecha > ultimaFecha) ultimaFecha = fecha;
        });

        actividadUsuarios.push({ uid, nombre, email, ultimaFecha });

        const fila = document.createElement("tr");
        fila.innerHTML = `
          <td>${nombre}</td>
          <td>${email}</td>
          <td>${fechaCreacion}</td>
          <td>${numSesiones}</td>
          <td><button class="ver-detalles" data-uid="${uid}">Ver</button></td>
        `;
        tbody.appendChild(fila);
      }

      totalSesionesElem.textContent = totalSesiones;
      promedioSesionesElem.textContent = (totalSesiones / usuariosSnapshot.size).toFixed(1);

      mostrarTopUsuariosMasActivos(usuariosMap, sesionesPorUsuario);
      mostrarActividadReciente(usuariosMap);
      mostrarUsuariosInactivos(actividadUsuarios);

      const sesionesTotalesSnapshot = await db.collection("SesionesEntrenamiento").get();
      const sesionesTotales = [];
      sesionesTotalesSnapshot.forEach(doc => {
        sesionesTotales.push(doc.data());
      });

      calcularCrecimientoSemanal(sesionesTotales);

    } catch (error) {
      console.error("Error al obtener usuarios o sesiones:", error);
      const tablaUsuarios = document.getElementById("tablaUsuarios");
      const tbody = tablaUsuarios.querySelector("tbody");
      tbody.innerHTML = `<tr><td colspan="5">Error al cargar los datos</td></tr>`;
      document.getElementById("totalUsuarios").textContent = "-";
      document.getElementById("totalSesiones").textContent = "-";
      document.getElementById("promedioSesiones").textContent = "-";
    }
  });

  function mostrarTopUsuariosMasActivos(usuariosMap, sesionesPorUsuario) {
    const listaTop = document.getElementById("listaTopUsuarios");
    const top = Object.entries(sesionesPorUsuario)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    listaTop.innerHTML = "";
    top.forEach(([uid, total]) => {
      const usuario = usuariosMap[uid] || { nombre: "(Desconocido)" };
      const li = document.createElement("li");
      li.textContent = `${usuario.nombre} — ${total} sesiones`;
      listaTop.appendChild(li);
    });
  }

  function mostrarActividadReciente(usuariosMap) {
    const ulUsuarios = document.getElementById("ultimosUsuariosRegistrados");
    const top = Object.values(usuariosMap)
      .sort((a, b) => b.fechaRegistro - a.fechaRegistro)
      .slice(0, 5);
    ulUsuarios.innerHTML = "";
    top.forEach(u => {
      const li = document.createElement("li");
      li.textContent = `${u.nombre} (${u.email}) - ${u.fechaRegistro.toLocaleDateString()}`;
      ulUsuarios.appendChild(li);
    });
  }

  function mostrarUsuariosInactivos(actividadUsuarios, dias = 14) {
    const ahora = new Date();
    const inactivos = actividadUsuarios.filter(u => {
      const diff = (ahora - u.ultimaFecha) / (1000 * 60 * 60 * 24);
      return isNaN(diff) || diff >= dias;
    });

    const lista = document.getElementById("listaUsuariosInactivos");
    lista.innerHTML = "";
    inactivos.forEach(u => {
      const li = document.createElement("li");
      const fecha = u.ultimaFecha.getTime() > 0 ? u.ultimaFecha.toLocaleDateString() : "Sin actividad";
      li.textContent = `${u.nombre} (${u.email}) — Última sesión: ${fecha}`;
      lista.appendChild(li);
    });
  }

function calcularCrecimientoSemanal(sesionesTotales) {
  const ahora = new Date();
  const inicioSemanaActual = new Date(ahora);
  inicioSemanaActual.setDate(ahora.getDate() - ahora.getDay());

  const inicioSemanaAnterior = new Date(inicioSemanaActual);
  inicioSemanaAnterior.setDate(inicioSemanaAnterior.getDate() - 7);

  let totalActual = 0;
  let totalAnterior = 0;

  sesionesTotales.forEach(s => {
    const fecha = s.timestamp?.toDate?.() || new Date(0);
    if (fecha >= inicioSemanaActual) {
      totalActual++;
    } else if (fecha >= inicioSemanaAnterior) {
      totalAnterior++;
    }
  });

  const porcentaje = totalAnterior === 0
    ? (totalActual > 0 ? 100 : 0)
    : ((totalActual - totalAnterior) / totalAnterior) * 100;

  const resultado = Math.round(porcentaje);
  const el = document.getElementById("porcentajeCrecimiento");

  if (totalAnterior === 0 && totalActual === 0) {
    el.textContent = "No hay actividad en las últimas 2 semanas.";
  } else {
    const signo = resultado > 0 ? "📈" : resultado < 0 ? "📉" : "➖";
    el.textContent = `${signo} ${resultado}% respecto a la semana anterior`;
  }
}

});
