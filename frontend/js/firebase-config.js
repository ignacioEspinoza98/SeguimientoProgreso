// Variables globales para Firebase
let firebaseApp;
let auth;
let db;
let googleProvider;
let firebaseInitialized = false;

// Configuración para los correos de verificación
const actionCodeSettings = {
    // URL que se abrirá después de que el usuario haga clic en el enlace de verificación
    url: window.location.origin + '/frontend/html/verificacion.html',
    // Esto asegura que el enlace solo funcione en el contexto de la aplicación
    handleCodeInApp: true
};

// Configuración directa de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBTN3BZblwUYqqejsSMIArMs-SNxnkaIL4",
    authDomain: "seguimientoprogreso.firebaseapp.com",
    projectId: "seguimientoprogreso",
    storageBucket: "seguimientoprogreso.appspot.com",
    messagingSenderId: "563354960322",
    appId: "1:563354960322:web:b9b196460d811cdaf4965b",
    measurementId: "G-E0ZXJQ6P66"
};

// Inicialización inmediata
try {
  if (typeof firebase === 'undefined') {
    throw new Error('Firebase SDK no está cargado');
  }
  
  firebaseApp = firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  db = firebase.firestore();
  googleProvider = new firebase.auth.GoogleAuthProvider();
  
  console.log('Firebase inicializado correctamente');
  
  // Exportar servicios
  window.firebaseServices = {
    auth,
    db,
    googleProvider,
    obtenerHistorial 
  };
  
  firebaseInitialized = true;
  
} catch (error) {
  console.error('Error al inicializar Firebase:', error);
  throw error;
}

// Función global para mostrar errores
window.mostrarError = function(error) {
    let mensaje = 'Ocurrió un error. Por favor, inténtalo de nuevo.';
    
    switch (error.code) {
        case 'auth/email-already-in-use':
            mensaje = 'Este correo ya está registrado.';
            break;
        case 'auth/invalid-email':
            mensaje = 'El correo electrónico no es válido.';
            break;
        case 'auth/weak-password':
            mensaje = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
            break;
        case 'auth/user-not-found':
            mensaje = 'No existe una cuenta con este correo electrónico.';
            break;
        case 'auth/wrong-password':
            mensaje = 'Contraseña incorrecta.';
            break;
        case 'auth/too-many-requests':
            mensaje = 'Demasiados intentos fallidos. Por favor, inténtalo más tarde.';
            break;
        case 'auth/network-request-failed':
            mensaje = 'Error de conexión. Verifica tu conexión a internet.';
            break;
        case 'auth/popup-closed-by-user':
            // No mostrar error si el usuario cierra el popup de Google
            return;
        default:
            console.error('Error de Firebase:', error);
            mensaje = `Error: ${error.message || 'Error desconocido'}`;
    }
    
    // Usar SweetAlert2 para mostrar el error
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: mensaje,
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#0d6efd'
        });
    } else {
        alert(mensaje);
    }
}

// Función global para iniciar sesión con Google
window.loginWithGoogle = async function() {
    console.log('Iniciando sesión con Google...');
    
    try {
        // 1. Iniciar sesión con Google
        const result = await auth.signInWithPopup(googleProvider);
        console.log('Inicio de sesión con Google exitoso:', result.user);
        
        // 2. Intentar guardar en Firestore (pero no bloquear si falla)
        try {
            const user = result.user;
            const userRef = firebase.firestore().collection('usuarios').doc(user.uid);
            
            // Usar get() con getOptions para manejar offline
            const doc = await userRef.get({ source: 'server' }).catch(() => userRef.get({ source: 'cache' }));
            
            if (!doc.exists) {
                // Crear documento de usuario si no existe
                await userRef.set({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || 'Usuario',
                    photoURL: user.photoURL || '',
                    fechaRegistro: firebase.firestore.FieldValue.serverTimestamp(),
                    rol: 'usuario',
                    activo: true,
                    ultimaConexion: new Date().toISOString()
                }).catch(error => {
                    console.warn('No se pudo guardar en Firestore (continuando de todos modos):', error);
                    // Continuar incluso si falla la escritura en Firestore
                });
            } else {
                // Actualizar última conexión
                await userRef.update({
                    ultimaConexion: new Date().toISOString()
                }).catch(console.warn);
            }
        } catch (firestoreError) {
            console.warn('Error al acceder a Firestore (continuando de todos modos):', firestoreError);
            // Continuar con el flujo aunque falle Firestore
        }
        
        // 3. Guardar información del usuario en sessionStorage
        const user = result.user;

        const usuario = {
        nombre: user.displayName || user.email.split('@')[0],
        usuario: user.displayName || user.email.split('@')[0],
        email: user.email,
        emailVerificado: user.emailVerified,
        uid: user.uid,
        fotoURL: user.photoURL || ''
        };
        
        sessionStorage.setItem('Logueado', 'true');
        sessionStorage.setItem('usuario', JSON.stringify(usuario));
        
        console.log('Usuario guardado en sessionStorage:', usuario);
        
        // 4. Redirigir al dashboard
        console.log('Redirigiendo a Dashboard.html');
        // Usar ruta absoluta desde la raíz del sitio
        const baseUrl = window.location.origin;
        const dashboardUrl = `${baseUrl}/frontend/html/Dashboard.html`;
        console.log('Redirigiendo a:', dashboardUrl);
        window.location.replace(dashboardUrl);
        
    } catch (error) {
        console.error('Error en login con Google:', error);
        
        // Manejar errores específicos
        if (error.code === 'auth/popup-closed-by-user') {
            // El usuario cerró la ventana emergente, no mostrar error
            return;
        }
        
        // Mostrar error al usuario
        mostrarError(error);
        
        // Si hay un error de red, intentar redirigir de todos modos
        if (error.code === 'unavailable' || error.code === 'unauthenticated') {
            console.log('Error de red detectado, redirigiendo de todos modos...');
            window.location.href = '/frontend/html/Dashboard.html';
        }
    }
};

// Función para iniciar sesión con correo y contraseña
function loginWithEmail(email, password) {
    return auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Actualizar última conexión en Firestore
            const userRef = firebase.firestore().collection('usuarios').doc(userCredential.user.uid);
            userRef.update({
                ultimaConexion: new Date().toISOString()
            }).catch(console.warn);
            
            // Redirigir al dashboard después del login exitoso
            window.location.href = '/frontend/html/Dashboard.html';

        })
        .catch((error) => {
            console.error('Error en login con correo/contraseña:', error);
            
            // Manejar error específico de proveedor deshabilitado
            if (error.code === 'auth/operation-not-allowed') {
                mostrarError({
                    code: 'auth/operation-not-allowed',
                    message: 'El inicio de sesión con correo/contraseña no está habilitado. Por favor, contacta al administrador.'
                });
            } else {
                mostrarError(error);
            }
            
            throw error; // Re-lanzar el error para manejarlo en el formulario
        });
}

// Función para guardar una sesión de entrenamiento
async function guardarSesion(usuarioId, sesion) {
    try {
        console.log('Iniciando guardado de sesión...');

        const usuarioLogueado = sessionStorage.getItem('usuario');
        let idUsuario = usuarioId;

        if (!idUsuario && usuarioLogueado) {
            try {
                const usuarioInfo = JSON.parse(usuarioLogueado);
                idUsuario = usuarioInfo.uid || 'usuario_desconocido'; // usa el UID
                console.log('Usuario logueado (sessionStorage):', idUsuario);
            } catch (e) {
                console.error('Error al parsear usuario del sessionStorage:', e);
                idUsuario = 'usuario_desconocido';
            }
        } else if (!idUsuario) {
            console.warn('No se encontró usuario en sessionStorage');
            console.log('Contenido de sessionStorage:', JSON.stringify(sessionStorage, null, 2));
            idUsuario = 'usuario_desconocido';
        }

        console.log('Usuario ID a usar (UID):', idUsuario);

        // Preparar datos de la sesión
        const datosSesion = {
            ejercicios: sesion.ejercicios || [],
            fecha: sesion.fecha || new Date().toISOString().split('T')[0],
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            usuarioId: idUsuario,
            email: sesion.email || null  // solo si lo necesitas
        };

        console.log('Datos de la sesión a guardar:', JSON.stringify(datosSesion, null, 2));

        if (!firebaseInitialized) {
            const error = new Error('Firebase no está inicializado');
            console.error('Error en guardarSesion:', error);
            throw error;
        }

        if (!db) {
            const error = new Error('La instancia de Firestore no está disponible');
            console.error('Error en guardarSesion:', error);
            throw error;
        }

        // ✅ Verificar autenticación activa y coincidencia de UID
        if (!auth.currentUser) {
            const error = new Error("No hay usuario autenticado en auth.currentUser");
            console.error(error);
            throw error;
        }

        if (auth.currentUser.uid !== idUsuario) {
            const error = new Error("El UID del usuario no coincide con el usuarioId que se quiere guardar");
            console.error(error);
            throw error;
        }

        console.log('Intentando guardar en Firestore...');
        const docRef = await db.collection('SesionesEntrenamiento').add(datosSesion);

        console.log('Sesión guardada con ID:', docRef.id);
        return docRef.id;

    } catch (error) {
        console.error('Error al guardar la sesión:', error);
        throw error;
    }
}

// Función para obtener el historial de sesiones
async function obtenerHistorial(usuarioId, limite = 30) {
    try {
        if (!firebaseInitialized) {
            throw new Error('Firebase no está inicializado');
        }

        let idUsuario = usuarioId;
        if (!idUsuario) {
            const usuarioLogueado = sessionStorage.getItem('usuario');
            if (usuarioLogueado) {
                try {
                    const usuarioInfo = JSON.parse(usuarioLogueado);
                    idUsuario = usuarioInfo.uid || 'usuario_desconocido'; // usa el UID
                    console.log('Usuario logueado (sessionStorage):', idUsuario);
                } catch (e) {
                    console.error('Error al parsear usuario del sessionStorage:', e);
                    idUsuario = 'usuario_desconocido';
                }
            } else {
                console.warn('No se encontró usuario en sessionStorage');
                idUsuario = 'usuario_desconocido';
            }
        }

        console.log('Obteniendo historial para usuario (UID):', idUsuario);

        const querySnapshot = await db.collection('SesionesEntrenamiento')
            .where('usuarioId', '==', idUsuario)
            .orderBy('timestamp', 'desc')
            .limit(limite)
            .get();

        const sesiones = [];
        querySnapshot.forEach(doc => {
            sesiones.push({
                id: doc.id,
                ...doc.data()
            });
        });

        console.log(`Se encontraron ${sesiones.length} sesiones para el usuario ${idUsuario}`);
        return sesiones;

    } catch (error) {
        console.error('Error al obtener el historial:', error);
        throw error;
    }
}

