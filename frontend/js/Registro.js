document.addEventListener('DOMContentLoaded', async () => {
    const auth = window.firebaseServices.auth;
    const db = window.firebaseServices.db;

    const formRegistro = document.getElementById('RegistroForm');
    const btnRegistrar = document.getElementById('RegistroBtn');
    const inputContraseña = document.getElementById('Contraseña');
    const inputConfirmarContraseña = document.getElementById('ConfirmarContraseña');
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    const passwordMatch = document.getElementById('passwordMatch');

    // Mostrar/ocultar contraseña
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const input = this.previousElementSibling;
            const icon = this.querySelector('i');
            input.type = input.type === 'password' ? 'text' : 'password';
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    });

    // Validar coincidencia de contraseñas
    inputConfirmarContraseña.addEventListener('input', function () {
        if (inputContraseña.value !== this.value) {
            this.classList.add('is-invalid');
            passwordMatch.style.display = 'block';
        } else {
            this.classList.remove('is-invalid');
            passwordMatch.style.display = 'none';
        }
    });

    // Enviar correo de verificación
    async function enviarCorreoVerificacion(user) {
        const actionCodeSettings = {
            url: window.location.origin + '/SeguimientoProgreso/frontend/html/verificacion.html',
            handleCodeInApp: true
        };
        await user.sendEmailVerification(actionCodeSettings);
    }

    // Validar correo y usuario
    function validarCorreo(correo) {
        const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return correoRegex.test(correo);
    }

    function validarUsuario(usuario) {
        const usuarioRegex = /^[a-zA-Z0-9_]{4,20}$/;
        return usuarioRegex.test(usuario);
    }

    // Manejar el formulario
    formRegistro.addEventListener('submit', async function (event) {
        event.preventDefault();

        const usuario = document.getElementById('Usuario').value.trim();
        const correo = document.getElementById('Correo').value.trim();
        const contraseña = inputContraseña.value;
        const confirmarContraseña = inputConfirmarContraseña.value;
        const terminos = document.getElementById('terminos').checked;

        // Validaciones
        if (!usuario || !correo || !contraseña || !confirmarContraseña || !terminos) {
            return Swal.fire({ icon: 'warning', text: 'Completa todos los campos y acepta los términos.' });
        }

        if (!validarCorreo(correo)) {
            return Swal.fire({ icon: 'warning', text: 'Correo electrónico inválido.' });
        }

        if (!validarUsuario(usuario)) {
            return Swal.fire({ icon: 'warning', text: 'El usuario debe tener entre 4 y 20 caracteres (letras, números, guiones bajos).' });
        }

        if (contraseña.length < 6) {
            return Swal.fire({ icon: 'warning', text: 'La contraseña debe tener al menos 6 caracteres.' });
        }

        if (contraseña !== confirmarContraseña) {
            return Swal.fire({ icon: 'error', text: 'Las contraseñas no coinciden.' });
        }

        const spinner = btnRegistrar.querySelector('.spinner-border');
        btnRegistrar.disabled = true;
        if (spinner) spinner.classList.remove('d-none');

        try {
            const credencial = await auth.createUserWithEmailAndPassword(correo, contraseña);
            const user = credencial.user;

            await user.updateProfile({ displayName: usuario });
            await enviarCorreoVerificacion(user);

            await db.collection('usuarios').doc(user.uid).set({
                uid: user.uid,
                correo,
                usuario,
                fechaRegistro: firebase.firestore.FieldValue.serverTimestamp(),
                ultimaConexion: new Date().toISOString(),
                rol: 'usuario',
                activo: true,
                emailVerificado: false
            });

            await Swal.fire({
                icon: 'success',
                title: '¡Registro exitoso!',
                html: `<p>Se ha enviado un correo de verificación a <strong>${user.email}</strong>.</p><p>Verifica tu correo antes de iniciar sesión.</p>`
            });

            await auth.signOut();
            window.location.href = `/SeguimientoProgreso/frontend/html/verificacion.html?email=${encodeURIComponent(user.email)}`;
        } catch (error) {
            console.error('Error en registro:', error);
            window.mostrarError?.(error);
            if (auth.currentUser) {
                auth.currentUser.delete().catch(() => {});
            }
        } finally {
            btnRegistrar.disabled = false;
            if (spinner) spinner.classList.add('d-none');
        }
    });
});
