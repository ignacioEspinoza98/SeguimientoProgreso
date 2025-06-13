// Variables globales para Firebase
let firebaseApp;
let auth;
let db;
let googleProvider;

// Configuración para los correos de verificación
const actionCodeSettings = {
    // URL que se abrirá después de que el usuario haga clic en el enlace de verificación
    url: window.location.origin + '/SeguimientoProgreso/frontend/html/verificacion.html',
    // Esto asegura que el enlace solo funcione en el contexto de la aplicación
    handleCodeInApp: true
};

// Función para inicializar Firebase de forma segura
async function initializeFirebase() {
    try {
        // Obtener configuración desde el endpoint seguro
        const response = await fetch('../../firebase-config.php');
        if (!response.ok) {
            throw new Error('Error al cargar la configuración de Firebase');
        }
        
        const firebaseConfig = await response.json();
        
        // Inicializar Firebase
        firebaseApp = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
        googleProvider = new firebase.auth.GoogleAuthProvider();
        
        console.log('Firebase inicializado correctamente');
        return { firebaseApp, auth, db, googleProvider };
    } catch (error) {
        console.error('Error al inicializar Firebase:', error);
        throw error;
    }
}

// Inicializar Firebase cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeFirebase();
        // Aquí puedes agregar código que dependa de Firebase
    } catch (error) {
        console.error('Error al inicializar la aplicación:', error);
        mostrarError({
            code: 'firebase/initialization-error',
            message: 'No se pudo conectar con el servidor. Por favor, recarga la página.'
        });
    }
});

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
        const usuario = {
            nombre: result.user.displayName || result.user.email.split('@')[0],
            email: result.user.email,
            emailVerificado: result.user.emailVerified,
            uid: result.user.uid,
            fotoURL: result.user.photoURL || ''
        };
        
        sessionStorage.setItem('Logueado', 'true');
        sessionStorage.setItem('usuario', JSON.stringify(usuario));
        
        console.log('Usuario guardado en sessionStorage:', usuario);
        
        // 4. Redirigir al dashboard
        console.log('Redirigiendo a Dashboard.html');
        // Usar ruta absoluta desde la raíz del sitio
        const baseUrl = window.location.origin;
        const dashboardUrl = `${baseUrl}/SeguimientoProgreso/frontend/html/Dashboard.html`;
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
            window.location.href = 'Dashboard.html';
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
            window.location.href = 'Dashboard.html';
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

// Función global para cerrar sesión
window.cerrarSesion = function() {
    return auth.signOut()
        .then(() => {
            console.log('Sesión cerrada correctamente');
            // Limpiar cualquier estado de la aplicación si es necesario
            localStorage.clear();
            sessionStorage.clear();
        })
        .catch((error) => {
            console.error('Error al cerrar sesión:', error);
            throw error;
        });
};

// Verificar y cerrar sesión al cargar las páginas de autenticación
if (window.location.pathname.includes('InicioSesion.html') || 
    window.location.pathname.includes('Registro.html') ||
    window.location.pathname === '/') {
    
    // Cerrar sesión si hay un usuario autenticado
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('Usuario autenticado detectado en página de autenticación, cerrando sesión...');
            cerrarSesion().catch(error => {
                console.error('Error al forzar cierre de sesión:', error);
            });
        }
    });
}
