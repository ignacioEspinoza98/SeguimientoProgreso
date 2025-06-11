// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Elementos del formulario
    const formRegistro = document.getElementById('RegistroForm');
    const btnRegistrar = document.getElementById('RegistroBtn');
    const inputContraseña = document.getElementById('Contraseña');
    const inputConfirmarContraseña = document.getElementById('ConfirmarContraseña');
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    
    // Inicializar Firebase
    const auth = firebase.auth();
    const db = firebase.firestore();
    
    // Función para mostrar/ocultar contraseña
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });
    
    // Validar coincidencia de contraseñas en tiempo real
    inputConfirmarContraseña.addEventListener('input', function() {
        if (inputContraseña.value !== this.value) {
            this.classList.add('is-invalid');
            document.getElementById('passwordMatch').style.display = 'block';
        } else {
            this.classList.remove('is-invalid');
            document.getElementById('passwordMatch').style.display = 'none';
        }
    });
    
    // Manejar el envío del formulario
    formRegistro.addEventListener('submit', function(event) {
        event.preventDefault();
        
        // Obtener valores del formulario
        const usuario = document.getElementById('Usuario').value.trim();
        const correo = document.getElementById('Correo').value.trim();
        const contraseña = inputContraseña.value;
        const confirmarContraseña = inputConfirmarContraseña.value;
        const terminos = document.getElementById('terminos').checked;
        
        // Expresiones regulares para validación
        const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const usuarioRegex = /^[a-zA-Z0-9_]{4,20}$/;
        
        // Validaciones
        if (!usuario || !correo || !contraseña || !confirmarContraseña) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos vacíos',
                text: 'Por favor, completa todos los campos.',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#0d6efd'
            });
            return;
        }
        
        if (!usuarioRegex.test(usuario)) {
            Swal.fire({
                icon: 'warning',
                title: 'Usuario inválido',
                text: 'El nombre de usuario debe tener entre 4 y 20 caracteres y solo puede contener letras, números, guiones y guiones bajos.',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#0d6efd'
            });
            return;
        }
        
        if (!correoRegex.test(correo)) {
            Swal.fire({
                icon: 'warning',
                title: 'Correo inválido',
                text: 'Por favor, ingresa un correo electrónico válido.',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#0d6efd'
            });
            return;
        }
        
        if (contraseña.length < 6) {
            Swal.fire({
                icon: 'warning',
                title: 'Contraseña débil',
                text: 'La contraseña debe tener al menos 6 caracteres.',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#0d6efd'
            });
            return;
        }
        
        if (contraseña !== confirmarContraseña) {
            Swal.fire({
                icon: 'error',
                title: 'Las contraseñas no coinciden',
                text: 'Por favor, asegúrate de que las contraseñas sean iguales.',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#0d6efd'
            });
            return;
        }
        
        if (!terminos) {
            Swal.fire({
                icon: 'warning',
                title: 'Términos y condiciones',
                text: 'Debes aceptar los términos y condiciones para continuar.',
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#0d6efd'
            });
            return;
        }
        
        // Mostrar spinner de carga
        const spinner = btnRegistrar.querySelector('.spinner-border');
        btnRegistrar.disabled = true;
        spinner.classList.remove('d-none');
        
        // 1. Crear usuario en Firebase Authentication
        auth.createUserWithEmailAndPassword(correo, contraseña)
            .then((userCredential) => {
                const user = userCredential.user;
                console.log('Usuario creado exitosamente:', user.uid);
                
                // 2. Actualizar el perfil del usuario con el nombre de usuario
                return user.updateProfile({
                    displayName: usuario
                }).then(() => {
                    console.log('Perfil de usuario actualizado');
                    // 3. Intentar guardar información adicional en Firestore
                    const userData = {
                        uid: user.uid,
                        usuario: usuario,
                        correo: correo,
                        fechaRegistro: new Date().toISOString(),
                        ultimaConexion: new Date().toISOString(),
                        rol: 'usuario',
                        activo: true
                    };
                    
                    // Intentar guardar en Firestore, pero continuar aunque falle
                    return firebase.firestore().collection('usuarios').doc(user.uid).set(userData)
                        .then(() => console.log('Datos guardados en Firestore'))
                        .catch(error => {
                            console.warn('No se pudo guardar en Firestore (continuando de todos modos):', error);
                            // Continuar con el flujo aunque falle Firestore
                        });
                });
            })
            .then(() => {
                // Mostrar mensaje de éxito
                return Swal.fire({
                    icon: 'success',
                    title: '¡Registro exitoso!',
                    text: 'Tu cuenta ha sido creada correctamente.',
                    confirmButtonText: 'Continuar',
                    confirmButtonColor: '#198754'
                });
            })
            .then(() => {
                // Redirigir al dashboard
                console.log('Redirigiendo a Dashboard.html');
                // Usar ruta relativa al archivo Dashboard.html
                const dashboardUrl = '../../html/Dashboard.html';
                console.log('Redirigiendo a:', dashboardUrl);
                window.location.replace(dashboardUrl);
            })
            .catch((error) => {
                console.error('Error al registrar usuario:', error);
                mostrarError(error);
            })
            .finally(() => {
                // Ocultar spinner de carga
                btnRegistrar.disabled = false;
                spinner.classList.add('d-none');
            });
    });
});