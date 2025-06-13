// Función para inicializar Firebase de forma segura
async function initializeFirebase() {
    try {
        // Obtener la configuración desde nuestro endpoint seguro
        const response = await fetch('firebase-config.php', {
            method: 'GET',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Error al cargar la configuración de Firebase');
        }

        const firebaseConfig = await response.json();

        // Inicializar Firebase
        if (typeof firebase !== 'undefined') {
            firebase.initializeApp(firebaseConfig);
            console.log('Firebase inicializado correctamente');
            return firebase;
        } else {
            console.error('Firebase SDK no está cargado');
            return null;
        }
    } catch (error) {
        console.error('Error al inicializar Firebase:', error);
        return null;
    }
}

// Uso:
// initializeFirebase().then(firebaseApp => {
//     // Tu código que usa Firebase aquí
// });
